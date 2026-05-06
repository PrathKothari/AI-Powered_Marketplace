from __future__ import annotations

import logging
import json
import uuid
from pathlib import Path
from typing import Any

from app.core.config import settings
from app.services.storytelling.audio_engine import generate_audio_from_text
from app.services.storytelling.storage_service import upload_file_to_gcs
from app.services.storytelling.storyboard import ProductStoryInput, generate_storyboard, normalize_storyboard
from app.services.storytelling.storyboard_video_renderer import ffprobe_duration, render_storyboard_video

logger = logging.getLogger(__name__)


def _storyboard_debug_dir() -> Path:
    output_dir = Path(settings.STORYBOARD_OUTPUT_DIR) / "storyboards" / uuid.uuid4().hex
    output_dir.mkdir(parents=True, exist_ok=True)
    return output_dir


def _script_from_storyboard(storyboard: dict[str, Any]) -> str:
    lines = []
    for scene in storyboard.get("scenes", []):
        narration = str(scene.get("narrationText") or "").strip()
        if narration:
            lines.append(narration)
    return " ".join(lines).strip()


def generate_story_video(
    image_paths,
    description,
    *,
    product_name=None,
    price=None,
    product_type=None,
    artisan_name=None,
    location=None,
    brand_name=None,
    tone="warm",
    audience="online shoppers",
    style_preset="artisan_story",
    duration_per_image=None,
    generated_narration_audio_path=None,
):
    if not image_paths:
        raise ValueError("At least one product image is required")

    default_duration = int(settings.STORYBOARD_DEFAULT_DURATION_SECONDS)
    if duration_per_image:
        default_duration = max(int(duration_per_image) * max(len(image_paths), 5), 5)

    product = ProductStoryInput(
        product_name=product_name or "Handmade product",
        price=str(price) if price not in (None, "") else None,
        product_type=product_type or style_preset or "handmade product",
        description=description or "",
        image_paths=list(image_paths),
        artisan_name=artisan_name,
        location=location,
        brand_name=brand_name,
        tone=tone or "warm",
        duration_seconds=default_duration,
        aspect_ratio=settings.STORYBOARD_ASPECT_RATIO,
    )

    audio_path = None
    if generated_narration_audio_path and Path(str(generated_narration_audio_path)).exists():
        audio_path = str(Path(str(generated_narration_audio_path)).resolve())
        logger.info("Using provided narration audio: %s", audio_path)

    audio_duration = ffprobe_duration(audio_path) if audio_path else None
    debug_dir = _storyboard_debug_dir()

    storyboard = generate_storyboard(
        product,
        audio_duration_seconds=audio_duration,
        debug_output_dir=debug_dir,
    )

    narration = _script_from_storyboard(storyboard)

    if audio_path is None and narration:
        try:
            audio_path = generate_audio_from_text(narration, mix_with_music=False)
            audio_duration = ffprobe_duration(audio_path) if audio_path else None
            if audio_duration:
                provider = storyboard.get("provider", "local")
                debug_path = storyboard.get("debugStoryboardPath")
                storyboard = normalize_storyboard(storyboard, product, audio_duration_seconds=audio_duration)
                storyboard["provider"] = provider
                if debug_path:
                    storyboard["debugStoryboardPath"] = debug_path
                    Path(str(debug_path)).write_text(json.dumps(storyboard, indent=2, ensure_ascii=False), encoding="utf-8")
        except Exception as error:
            logger.warning("TTS audio generation failed, rendering silent video: %s", error)
            audio_path = None

    local_video = render_storyboard_video(
        storyboard,
        list(image_paths),
        audio_path=audio_path,
        output_dir=settings.STORYBOARD_OUTPUT_DIR,
        temp_dir=settings.STORYBOARD_TEMP_DIR,
        width=settings.STORYBOARD_VIDEO_WIDTH,
        height=settings.STORYBOARD_VIDEO_HEIGHT,
        fps=settings.STORY_VIDEO_FPS,
        font_path=settings.STORY_FONT_PATH,
        background_music_path=settings.STORYBOARD_BACKGROUND_MUSIC_PATH,
        background_music_volume=settings.STORYBOARD_BACKGROUND_MUSIC_VOLUME,
    )

    try:
        public_url = upload_file_to_gcs(local_video)
    except Exception as error:
        logger.warning("Video upload failed, serving local path only: %s", error)
        public_url = f"/media/videos/{Path(local_video).name}"

    return {
        "video_url": public_url,
        "local_path": local_video,
        "narration": narration,
        "storyboard": storyboard,
        "storyboard_path": storyboard.get("debugStoryboardPath"),
    }
