from __future__ import annotations

from app.services.storytelling.ai_copy import generate_ad_copy
from app.services.storytelling.audio_engine import generate_audio_from_text
from app.services.storytelling.storage_service import upload_file_to_gcs
from app.services.storytelling.video_engine import render_video


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
    creative = generate_ad_copy(
        description,
        image_count=len(image_paths),
        product_name=product_name,
        tone=tone,
        audience=audience,
        style_preset=style_preset,
    )

    # Generate script for TTS
    script = ". ".join(
        [
            creative.get("hook", ""),
            creative.get("main", ""),
        ]
        + (creative.get("scene_captions", []))
        + [creative.get("cta", "")]
    )
    
    audio_path = generate_audio_from_text(script)

    local_video = render_video(
        image_paths=image_paths,
        creative=creative,
        audio_path=audio_path,
        duration_per_image=duration_per_image,
    )

    public_url = upload_file_to_gcs(local_video)

    return {
        "video_url": public_url,
        "local_path": local_video,
        "creative": creative,
    }