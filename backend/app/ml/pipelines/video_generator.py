from __future__ import annotations

import logging

from app.services.storytelling.ai_copy import generate_ad_copy
from app.services.storytelling.audio_engine import generate_audio_from_text
from app.services.storytelling.storage_service import upload_file_to_gcs
from app.services.storytelling.video_engine import render_video

logger = logging.getLogger(__name__)


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

    # Step 2: Generate TTS audio — gracefully skip if Google TTS credentials are missing
    audio_path = None
    try:
        script = ". ".join(
            [
                creative.get("hook", ""),
                creative.get("main", ""),
            ]
            + (creative.get("scene_captions", []))
            + [creative.get("cta", "")]
        )
        audio_path = generate_audio_from_text(script)
    except Exception as e:
        logger.warning("TTS audio generation failed, rendering silent video: %s", e)
        audio_path = None

    # Step 3: Render the video with FFmpeg (required — no fallback)
    local_video = render_video(
        image_paths=image_paths,
        creative=creative,
        audio_path=audio_path,
        duration_per_image=duration_per_image,
    )

    # Step 4: Upload to GCS (falls back to local /media serving)
    try:
        public_url = upload_file_to_gcs(local_video)
    except Exception as e:
        logger.warning("GCS upload failed, serving locally: %s", e)
        from pathlib import Path
        public_url = f"/media/videos/{Path(local_video).name}"

    return {
        "video_url": public_url,
        "local_path": local_video,
        "creative": creative,
    }