from __future__ import annotations

import logging
import os
import tempfile
from pathlib import Path

import httpx

from app.services.storytelling.ai_copy import generate_ad_copy
from app.services.storytelling.ai_copy import generate_narration
from app.services.storytelling.audio_engine import fit_audio_to_duration
from app.services.storytelling.audio_engine import generate_audio_from_text
from app.services.storytelling.storage_service import upload_file_to_gcs
from app.services.storytelling.video_engine import _ffprobe_duration
from app.services.storytelling.video_engine import render_video_via_kling
from app.core.config import settings

logger = logging.getLogger(__name__)


def _download_remote_file(url: str, suffix: str = ".mp4") -> str:
    temp_dir = Path(settings.TEMP_DIR)
    temp_dir.mkdir(parents=True, exist_ok=True)
    file_handle, temp_path = tempfile.mkstemp(suffix=suffix, dir=str(temp_dir))
    os.close(file_handle)
    output_path = Path(temp_path)
    try:
        with httpx.stream("GET", url, follow_redirects=True, timeout=120.0) as response:
            response.raise_for_status()
            with open(output_path, "wb") as handle:
                for chunk in response.iter_bytes():
                    if chunk:
                        handle.write(chunk)
        return str(output_path)
    except Exception:
        if output_path.exists():
            output_path.unlink(missing_ok=True)
        raise


def _render_kling_video_only(
    narration: str,
    image_paths,
    *,
    voice=None,
):
    kling_result = render_video_via_kling(narration, image_paths, voice=voice)
    if not kling_result:
        raise RuntimeError("Kling did not return a video result")

    if isinstance(kling_result, str) and kling_result.startswith("http"):
        local_video = _download_remote_file(kling_result)
    else:
        local_video = str(kling_result)

    video_duration = _ffprobe_duration(local_video)
    if not video_duration:
        raise RuntimeError("Unable to determine Kling video duration")

    return local_video, float(video_duration)


def generate_story_video(
    image_paths,
    description,
    *,
    product_name=None,
    tone="premium",
    audience="online shoppers",
    style_preset="museum_cinematic",
    duration_per_image=None,
):
    # Step 1: Generate creative copy (has its own fallback if Vertex AI unavailable)
    creative = generate_ad_copy(
        description,
        image_count=len(image_paths),
        product_name=product_name,
        tone=tone,
        audience=audience,
        style_preset=style_preset,
    )

    # Step 2: Determine Kling duration and generate narration to match it.
    kling_duration_seconds = 5
    narration = None
    try:
        narration = generate_narration(
            description,
            product_name=product_name,
            tone=tone,
            style_preset=style_preset,
            target_seconds=kling_duration_seconds,
        )
    except Exception:
        narration = None

    audio_path = None
    try:
        # Prefer the full narration for audio; fall back to a compact script if narration missing
        script = narration or ". ".join([
            creative.get("hook", ""),
            creative.get("main", ""),
        ] + (creative.get("scene_captions", [])) + [creative.get("cta", "")])

        audio_path = generate_audio_from_text(script)
    except Exception as e:
        logger.warning("TTS audio generation failed, rendering silent video: %s", e)
        audio_path = None

    # Step 3: Render the visuals via Kling only. Do not fall back to FFmpeg slideshow rendering.
    local_video = None
    public_url = None
    try:
        if getattr(settings, "KLING_ACCESS_KEY", None) and getattr(settings, "KLING_SECRET_KEY", None):
            script = narration or ". ".join([
                creative.get("hook", ""),
                creative.get("main", ""),
            ] + (creative.get("scene_captions", [])) + [creative.get("cta", "")])

            local_video, video_duration = _render_kling_video_only(
                script,
                image_paths,
                voice=getattr(settings, "STORY_TTS_VOICE", None),
            )
            if audio_path:
                fitted_audio = fit_audio_to_duration(audio_path, video_duration)
                if fitted_audio:
                    audio_path = fitted_audio
            logger.info("Kling video obtained locally with duration %.2fs", video_duration)
        else:
            raise RuntimeError("Kling credentials are required for video generation")
    except Exception:
        raise

    # Step 4: Upload the Kling video result to GCS after muxing the matching narration audio.
    try:
        if local_video:
            if audio_path:
                from app.services.storytelling.video_engine import _attach_audio

                local_video = str(_attach_audio(Path(local_video), audio_path))
            public_url = upload_file_to_gcs(local_video)
    except Exception as e:
        logger.warning("GCS upload failed, serving locally: %s", e)
        if local_video:
            public_url = f"/media/videos/{Path(local_video).name}"

    result = {
        "video_url": public_url,
        "local_path": local_video,
        "narration": narration,
    }

    return result