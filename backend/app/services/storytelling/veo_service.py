from __future__ import annotations

import asyncio
import logging
import uuid
from pathlib import Path
from typing import List

from app.core.config import settings

logger = logging.getLogger(__name__)


class VeoFallbackRequired(Exception):
    """Raised when Veo video generation fails so the caller can switch to FFmpeg."""


async def veo_generate_clip(
    image_bytes: bytes,
    scene_caption: str,
    clip_duration: int,
    output_dir: str,
) -> str:
    """Generate a short video clip from a product image using Veo 3.1 Fast on Vertex AI.

    Args:
        image_bytes: Raw JPEG bytes of the product image.
        scene_caption: Text prompt describing the desired scene motion.
        clip_duration: Desired clip length in seconds (5–10).
        output_dir: Local directory where the mp4 will be saved.

    Returns:
        Absolute path of the downloaded mp4 file.

    Raises:
        VeoFallbackRequired: When Veo is disabled, times out, or any API error occurs.
    """
    if not settings.VEO_ENABLED:
        raise VeoFallbackRequired("Veo is disabled (VEO_ENABLED=False)")

    try:
        from google import genai
        from google.genai import types
    except ImportError as exc:
        logger.error("google-genai package not available: %s", exc)
        raise VeoFallbackRequired("google-genai package not installed") from exc

    try:
        client = genai.Client(
            vertexai=True,
            project=settings.GOOGLE_CLOUD_PROJECT,
            location=settings.GOOGLE_CLOUD_LOCATION,
        )

        operation = await client.aio.models.generate_videos(
            model=settings.VEO_MODEL_ID,
            prompt=scene_caption,
            image=types.Image(image_bytes=image_bytes, mime_type="image/jpeg"),
            config=types.GenerateVideosConfig(
                aspect_ratio="9:16",
                duration_seconds=max(5, min(8, int(clip_duration))),
                resolution="720p",
                number_of_videos=1,
            ),
        )
    except Exception as exc:
        logger.error("Veo generate_videos call failed: %s", exc)
        raise VeoFallbackRequired(f"Veo API error: {exc}") from exc

    # Poll until done, timeout after 10 minutes (40 × 15 s = 600 s)
    max_polls = 40
    for _ in range(max_polls):
        await asyncio.sleep(15)
        try:
            operation = await client.aio.operations.get(operation)
        except Exception as exc:
            logger.warning("Veo poll error: %s", exc)
            continue
        if operation.done:
            break
    else:
        raise VeoFallbackRequired("Veo operation timed out after 10 minutes")

    # Extract the GCS URI from the completed operation
    if operation.error is not None:
        logger.error("Veo operation returned error: %s", operation.error)
        raise VeoFallbackRequired(f"Veo error: {operation.error}")
    if operation.result is None:
        logger.error("Veo operation completed but result is None — likely safety filter rejection or model not enabled. Full operation: %s", operation)
        raise VeoFallbackRequired("Veo returned no result (safety filter rejected images, or Veo model not enabled on project)")
    generated = getattr(operation.result, "generated_videos", None) or []
    if not generated:
        rai = getattr(operation.result, "rai_media_filtered_count", None)
        rai_reasons = getattr(operation.result, "rai_media_filtered_reasons", None)
        logger.error("Veo produced 0 videos. RAI filtered count=%s reasons=%s", rai, rai_reasons)
        raise VeoFallbackRequired(f"Veo produced no videos (RAI filtered: {rai_reasons or 'unknown'})")
    video_obj = generated[0].video
    gcs_uri = getattr(video_obj, "uri", None)
    inline_bytes = getattr(video_obj, "video_bytes", None)

    if inline_bytes:
        # Veo returned the clip inline (no output_gcs_uri specified)
        video_bytes = inline_bytes
    elif gcs_uri:
        # Veo wrote the clip to GCS — download it
        try:
            from google.cloud import storage as gcs

            parts = gcs_uri.replace("gs://", "").split("/", 1)
            bucket_name, blob_path = parts[0], parts[1]

            gcs_client = gcs.Client(project=settings.GOOGLE_CLOUD_PROJECT)
            loop = asyncio.get_running_loop()
            video_bytes = await loop.run_in_executor(
                None,
                gcs_client.bucket(bucket_name).blob(blob_path).download_as_bytes,
            )
        except Exception as exc:
            logger.error("Failed to download Veo clip from GCS (%s): %s", gcs_uri, exc)
            raise VeoFallbackRequired(f"GCS download failed: {exc}") from exc
    else:
        logger.error("Veo result has neither uri nor video_bytes. Video object: %s", video_obj)
        raise VeoFallbackRequired("Veo returned an empty video object")

    # Save to local output directory
    try:
        out_path = Path(output_dir) / f"{uuid.uuid4()}.mp4"
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_bytes(video_bytes)
        logger.info("Veo clip saved: %s", out_path)
        return str(out_path)
    except Exception as exc:
        logger.error("Failed to write Veo clip to disk: %s", exc)
        raise VeoFallbackRequired(f"Disk write failed: {exc}") from exc


async def veo_generate_clip_single_image_variations(
    image_bytes: bytes,
    creative: dict,
    clip_duration: int,
    output_dir: str,
) -> List[str]:
    """Generate two motion-variation clips from the same product image concurrently.

    Variation 1 uses a slow push-in / intimate close-up motion derived from the
    creative hook.  Variation 2 uses a gentle pan-reveal / warm-lighting motion
    derived from the creative main copy.

    Args:
        image_bytes: Raw JPEG bytes shared by both clips.
        creative: Dict containing at least ``hook`` and ``main`` keys
                  (as returned by :func:`~app.services.storytelling.ai_copy.generate_ad_copy`).
        clip_duration: Desired length in seconds for each clip.
        output_dir: Local directory where the mp4 files will be saved.

    Returns:
        List of two local mp4 paths — [variation_1_path, variation_2_path].

    Raises:
        VeoFallbackRequired: If either clip generation fails.
    """
    prompt_1 = f"{creative['hook']} — slow push-in, intimate close-up"
    prompt_2 = f"{creative['main']} — gentle pan reveal, warm lighting"

    try:
        results = await asyncio.gather(
            veo_generate_clip(image_bytes, prompt_1, clip_duration, output_dir),
            veo_generate_clip(image_bytes, prompt_2, clip_duration, output_dir),
        )
    except VeoFallbackRequired:
        raise
    except Exception as exc:
        logger.error("Unexpected error generating Veo variations: %s", exc)
        raise VeoFallbackRequired(f"Variation generation failed: {exc}") from exc

    return list(results)
