from __future__ import annotations

import asyncio
import hashlib
import logging
import shutil
import subprocess
import tempfile
import uuid
from datetime import datetime
from io import BytesIO
from pathlib import Path
from typing import List, Optional, Tuple

import httpx
from PIL import Image

from app.core.config import settings
from app.services.storytelling import (
    ai_copy,
    audio_engine,
    job_service,
    storage_service,
    veo_service,
    video_engine,
)
from app.services.storytelling.veo_service import VeoFallbackRequired

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Legacy sync pipeline — kept intact for the Telegram bot
# ---------------------------------------------------------------------------

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
    creative = ai_copy.generate_ad_copy(
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
        audio_path = audio_engine.generate_audio_from_text(script)
    except Exception as e:
        logger.warning("TTS audio generation failed, rendering silent video: %s", e)
        audio_path = None

    # Step 3: Render the video with FFmpeg (required — no fallback)
    local_video = video_engine.render_video(
        image_paths=image_paths,
        creative=creative,
        audio_path=audio_path,
        duration_per_image=duration_per_image,
    )

    # Step 4: Upload to GCS (falls back to local /media serving)
    try:
        public_url = storage_service.upload_file_to_gcs(local_video)
    except Exception as e:
        logger.warning("GCS upload failed, serving locally: %s", e)
        public_url = f"/media/videos/{Path(local_video).name}"

    return {
        "video_url": public_url,
        "local_path": local_video,
        "creative": creative,
    }


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))


async def _download_image(client: httpx.AsyncClient, url: str) -> Optional[bytes]:
    """Download an image URL; return raw bytes or None on any failure."""
    try:
        resp = await client.get(url, timeout=15, follow_redirects=True)
        resp.raise_for_status()
        content_type = resp.headers.get("content-type", "")
        if not content_type.startswith("image/"):
            logger.debug("Skipping %s — content-type=%s", url, content_type)
            return None
        return resp.content
    except Exception as exc:
        logger.warning("Failed to download image %s: %s", url, exc)
        return None


def _validate_and_normalize(raw: bytes) -> Optional[bytes]:
    """
    Validate dimensions (>= 512 px on each side) and normalise to 1080x1920 (9:16).
    Returns JPEG bytes or None if the image is too small.
    """
    try:
        img = Image.open(BytesIO(raw))
        if img.width < 512 or img.height < 512:
            logger.debug("Skipping image — dimensions %dx%d < 512", img.width, img.height)
            return None

        img = img.convert("RGB")
        target_w, target_h = 1080, 1920
        scale = max(target_w / img.width, target_h / img.height)
        new_w = int(img.width * scale)
        new_h = int(img.height * scale)
        img = img.resize((new_w, new_h), Image.LANCZOS)

        # Centre-crop to exact 1080x1920
        left = (new_w - target_w) // 2
        top = (new_h - target_h) // 2
        img = img.crop((left, top, left + target_w, top + target_h))

        buf = BytesIO()
        img.save(buf, format="JPEG", quality=92)
        return buf.getvalue()
    except Exception as exc:
        logger.warning("Image validation/normalisation failed: %s", exc)
        return None


async def _fetch_valid_images(image_urls: List[str]) -> List[bytes]:
    """
    Download, validate, deduplicate, and cap images.
    Returns up to 4 normalised JPEG byte blobs.
    """
    seen_hashes: set = set()
    valid: List[bytes] = []

    async with httpx.AsyncClient() as client:
        for url in image_urls:
            if len(valid) >= 4:
                break
            raw = await _download_image(client, url)
            if raw is None:
                continue
            normalised = _validate_and_normalize(raw)
            if normalised is None:
                continue
            digest = hashlib.md5(normalised).hexdigest()
            if digest in seen_hashes:
                logger.debug("Skipping duplicate image (md5=%s)", digest)
                continue
            seen_hashes.add(digest)
            valid.append(normalised)

    return valid


def _save_images_to_temp(image_blobs: List[bytes], tmp_dir: str) -> List[str]:
    """Write normalised JPEG blobs to disk; return list of absolute paths."""
    paths: List[str] = []
    for blob in image_blobs:
        p = Path(tmp_dir) / f"{uuid.uuid4()}.jpg"
        p.write_bytes(blob)
        paths.append(str(p))
    return paths


def _ffmpeg_concat_clips(clip_paths: List[str], output_path: str) -> None:
    """Concatenate mp4 clips via FFmpeg concat demuxer."""
    list_file = Path(output_path).parent / f"{uuid.uuid4()}_concat.txt"
    list_file.write_text(
        "\n".join(f"file '{p}'" for p in clip_paths),
        encoding="utf-8",
    )
    try:
        subprocess.run(
            [
                "ffmpeg", "-y",
                "-f", "concat", "-safe", "0",
                "-i", str(list_file),
                "-c:v", "libx264", "-preset", "fast", "-crf", "18",
                "-c:a", "aac",
                "-pix_fmt", "yuv420p",
                output_path,
            ],
            check=True,
            capture_output=True,
        )
    finally:
        try:
            list_file.unlink()
        except OSError:
            pass


def _ffmpeg_mix_audio(
    video_path: str,
    tts_path: Optional[str],
    output_path: str,
) -> None:
    """
    Mix video with TTS audio.
    If the video already contains an audio stream, blend it at 0.2 volume + TTS at 1.0.
    If the video has no audio stream, attach TTS directly.
    """
    # Probe whether video has an audio stream
    probe = subprocess.run(
        [
            "ffprobe", "-v", "error",
            "-select_streams", "a",
            "-show_entries", "stream=codec_type",
            "-of", "default=noprint_wrappers=1:nokey=1",
            video_path,
        ],
        capture_output=True, text=True,
    )
    has_native_audio = bool(probe.stdout.strip())

    if not tts_path or not Path(tts_path).exists():
        # No TTS — just copy the video as-is
        shutil.copy2(video_path, output_path)
        return

    if has_native_audio:
        # amix: native Veo audio @ 0.2 + TTS @ 1.0
        subprocess.run(
            [
                "ffmpeg", "-y",
                "-i", video_path,
                "-i", tts_path,
                "-filter_complex",
                "[0:a]volume=0.2[a0];[1:a]volume=1.0[a1];[a0][a1]amix=inputs=2:duration=first[aout]",
                "-map", "0:v:0",
                "-map", "[aout]",
                "-shortest",
                "-c:v", "copy", "-c:a", "aac",
                output_path,
            ],
            check=True,
            capture_output=True,
        )
    else:
        # Attach TTS directly
        subprocess.run(
            [
                "ffmpeg", "-y",
                "-i", video_path,
                "-i", tts_path,
                "-map", "0:v:0", "-map", "1:a:0",
                "-shortest", "-c:v", "copy", "-c:a", "aac",
                output_path,
            ],
            check=True,
            capture_output=True,
        )


def _get_product_info(product_id: str) -> Tuple[str, str]:
    """Return (title, description) from Firestore products/{productId}."""
    try:
        from firebase_admin import firestore as fa_firestore
        db = fa_firestore.client()
        doc = db.collection("products").document(product_id).get()
        if doc.exists:
            data = doc.to_dict() or {}
            return str(data.get("title", "")), str(data.get("description", ""))
    except Exception as exc:
        logger.warning("Could not fetch product %s: %s", product_id, exc)
    return "", ""


def _update_product_reel(product_id: str, reel_url: str, reel_mode: str) -> None:
    """Update products/{productId} with reelUrl and reelMode."""
    try:
        from firebase_admin import firestore as fa_firestore
        db = fa_firestore.client()
        db.collection("products").document(product_id).update(
            {"reelUrl": reel_url, "reelMode": reel_mode}
        )
    except Exception as exc:
        logger.warning("Failed to update product %s reel fields: %s", product_id, exc)


async def _send_reel_notification(seller_id: str, job_id: str, video_url: str) -> None:
    """Send a Telegram notification to the seller; fail silently."""
    try:
        from app.bot.notifications.dispatcher import (
            _get_telegram_id,
            send_telegram_message,
        )
        loop = asyncio.get_running_loop()
        telegram_id = await loop.run_in_executor(None, _get_telegram_id, seller_id)
        if not telegram_id:
            return
        text = (
            f"Your product reel is ready!\n"
            f"Job: `{job_id}`\n"
            f"[Watch now]({video_url})"
        )
        await send_telegram_message(telegram_id, text)
    except Exception as exc:
        logger.debug("Telegram reel notification failed (silent): %s", exc)


# ---------------------------------------------------------------------------
# Main async pipeline
# ---------------------------------------------------------------------------

async def run_reel_pipeline(job_id: str) -> None:
    """
    Orchestrate the full reel generation pipeline for *job_id*.

    Stages:
      1  Load job + pre-process images
      2  Generate script via Gemini (ai_copy)
      3  TTS voiceover
      4  Video clips (Veo → FFmpeg fallback)
      5  Stitch + mix audio  [Veo path only]
      6  Upload to GCS
      7  Mark complete + notify seller
    """
    loop = asyncio.get_running_loop()
    tmp_dir = tempfile.mkdtemp(prefix="reel_", dir=settings.STORY_OUTPUT_DIR)
    final_video_path: Optional[str] = None
    tts_path: Optional[str] = None
    mode = "ffmpeg"

    try:
        # ── Stage 1: Load job + pre-process images ────────────────────────
        job = job_service.get_job(job_id)
        if job is None:
            logger.error("run_reel_pipeline: job %s not found", job_id)
            return

        product_id: str = job.get("productId", "")
        seller_id: str = job.get("sellerId", "")
        image_urls: List[str] = job.get("imageUrls", [])
        style_preset: str = job.get("stylePreset", "artisan_story")

        job_service.update_job(job_id, status="scripting")

        valid_images: List[bytes] = await _fetch_valid_images(image_urls)
        job_service.update_job(job_id, validImageCount=len(valid_images))

        if not valid_images:
            job_service.update_job(job_id, status="failed", error="No valid images")
            return

        # ── Stage 2: Generate script (Gemini) ─────────────────────────────
        title, description = await loop.run_in_executor(None, _get_product_info, product_id)
        creative: dict = ai_copy.generate_ad_copy(
            description,
            image_count=len(valid_images),
            product_name=title or None,
            style_preset=style_preset,
        )

        # ── Stage 3: TTS voiceover ─────────────────────────────────────────
        job_service.update_job(job_id, status="voiceover")

        tts_script = (
            f"{creative['hook']}. "
            + " ".join(creative.get("scene_captions", []))
            + f". {creative['cta']}"
        )
        tts_path = await loop.run_in_executor(None, audio_engine.generate_audio_from_text, tts_script)

        if tts_path:
            raw_duration = await loop.run_in_executor(None, audio_engine.get_audio_duration, tts_path)
            clip_duration = int(_clamp(raw_duration / len(valid_images), 5, 10))
        else:
            clip_duration = 7

        job_service.update_job(job_id, clipDuration=clip_duration)

        # ── Stage 4: Video clips ───────────────────────────────────────────
        job_service.update_job(job_id, status="video")

        clip_paths: List[str] = []
        use_veo = True

        try:
            if len(valid_images) == 1:
                clip_paths = await veo_service.veo_generate_clip_single_image_variations(
                    valid_images[0],
                    creative,
                    clip_duration,
                    tmp_dir,
                )
            else:
                for idx, img_bytes in enumerate(valid_images):
                    caption = creative.get("scene_captions", [""])[idx] if idx < len(creative.get("scene_captions", [])) else ""
                    clip_path = await veo_service.veo_generate_clip(
                        img_bytes,
                        caption,
                        clip_duration,
                        tmp_dir,
                    )
                    clip_paths.append(clip_path)
            mode = "veo"
        except VeoFallbackRequired as vfr:
            logger.warning("Veo unavailable (%s), falling back to FFmpeg for all clips", vfr)
            use_veo = False

        if not use_veo:
            # FFmpeg fallback — save images to disk first
            img_paths = _save_images_to_temp(valid_images, tmp_dir)

            if len(img_paths) == 1:
                ffmpeg_out = str(Path(tmp_dir) / f"{uuid.uuid4()}_ffmpeg.mp4")
                final_video_path = video_engine.render_single_image_three_pass(
                    image_path=img_paths[0],
                    creative=creative,
                    tts_path=tts_path,
                    output_path=ffmpeg_out,
                )
            else:
                # render_video handles stitching + audio for multi-image
                final_video_path = video_engine.render_video(
                    image_paths=img_paths,
                    creative=creative,
                    audio_path=tts_path,
                    style_preset=style_preset,
                )
            mode = "ffmpeg"
            job_service.update_job(job_id, mode=mode)

        # ── Stage 5: Stitch + mix audio (Veo path only) ───────────────────
        if use_veo and clip_paths:
            job_service.update_job(job_id, status="stitching")
            mode = "veo"
            job_service.update_job(job_id, mode=mode)

            stitched_path = str(Path(tmp_dir) / f"{uuid.uuid4()}_stitched.mp4")
            await loop.run_in_executor(None, _ffmpeg_concat_clips, clip_paths, stitched_path)

            mixed_path = str(Path(tmp_dir) / f"{uuid.uuid4()}_mixed.mp4")
            await loop.run_in_executor(None, _ffmpeg_mix_audio, stitched_path, tts_path, mixed_path)
            final_video_path = mixed_path

        if not final_video_path or not Path(final_video_path).exists():
            raise RuntimeError("No final video produced after pipeline stages 4–5")

        # ── Stage 6: Upload ────────────────────────────────────────────────
        job_service.update_job(job_id, status="uploading")

        gcs_destination = f"reels/{job_id}.mp4"
        video_url = await loop.run_in_executor(None, storage_service.upload_file_to_gcs, final_video_path, gcs_destination)

        # Verify the URL is reachable
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                head_resp = await client.head(video_url, follow_redirects=True)
            if head_resp.status_code != 200:
                raise ValueError(f"HEAD returned {head_resp.status_code}")
        except Exception as exc:
            logger.warning("Uploaded URL not accessible (%s); using local path fallback", exc)
            video_url = f"/media/videos/{Path(final_video_path).name}"

        # ── Stage 7: Complete ──────────────────────────────────────────────
        await loop.run_in_executor(None, _update_product_reel, product_id, video_url, mode)

        job_service.update_job(
            job_id,
            status="complete",
            videoUrl=video_url,
            completedAt=datetime.utcnow(),
        )

        logger.info("Reel pipeline complete for job %s — mode=%s url=%s", job_id, mode, video_url)

        # Telegram notification (fail silently)
        await _send_reel_notification(seller_id, job_id, video_url)

    except Exception as exc:
        logger.exception("Reel pipeline failed for job %s: %s", job_id, exc)
        try:
            job_service.update_job(job_id, status="failed", error=str(exc)[:500])
        except Exception as update_exc:
            logger.error("Could not mark job %s as failed: %s", job_id, update_exc)

    finally:
        # Clean up temp directory
        try:
            shutil.rmtree(tmp_dir, ignore_errors=True)
        except Exception as cleanup_exc:
            logger.debug("Temp dir cleanup failed for %s: %s", tmp_dir, cleanup_exc)
