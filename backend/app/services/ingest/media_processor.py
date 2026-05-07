"""
media_processor.py — Image and audio preprocessing for the IngestAgent.

Images:  Resize / crop with Pillow, generate thumbnail.
Audio:   Resample to 16 kHz mono, trim leading/trailing silence with pydub.
"""

import io
import logging
from typing import Tuple, Dict, Any

from PIL import Image

logger = logging.getLogger(__name__)

# --------------- constants ---------------
MAX_IMAGE_SIZE = (1920, 1920)       # max width/height after resize
THUMBNAIL_SIZE = (300, 300)
AUDIO_SAMPLE_RATE = 16_000          # Hz
AUDIO_CHANNELS = 1                  # mono
SILENCE_THRESH_DB = -40             # dBFS
SILENCE_MIN_LEN_MS = 500           # ms


# ==================== IMAGE ====================

def process_image(data: bytes, filename: str) -> Tuple[bytes, bytes, Dict[str, Any]]:
    """
    Resize image to fit MAX_IMAGE_SIZE, produce a thumbnail,
    and return (processed_bytes, thumbnail_bytes, metadata).
    """
    img = Image.open(io.BytesIO(data))

    # Convert to RGB if necessary (handles RGBA, P, etc.)
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")

    original_w, original_h = img.size
    img.thumbnail(MAX_IMAGE_SIZE, Image.LANCZOS)
    final_w, final_h = img.size

    # Save processed image
    buf = io.BytesIO()
    fmt = "JPEG" if filename.lower().endswith((".jpg", ".jpeg")) else "PNG"
    img.save(buf, format=fmt, quality=85)
    processed_bytes = buf.getvalue()

    # Generate thumbnail
    thumb = img.copy()
    thumb.thumbnail(THUMBNAIL_SIZE, Image.LANCZOS)
    thumb_buf = io.BytesIO()
    thumb.save(thumb_buf, format=fmt, quality=75)
    thumb_bytes = thumb_buf.getvalue()

    metadata: Dict[str, Any] = {
        "mediaType": "image",
        "width": final_w,
        "height": final_h,
        "sizeBytes": len(processed_bytes),
    }
    logger.info(
        "Image processed: %s  %dx%d → %dx%d  (%d bytes)",
        filename, original_w, original_h, final_w, final_h, len(processed_bytes),
    )
    return processed_bytes, thumb_bytes, metadata


# ==================== AUDIO ====================

def process_audio(data: bytes, filename: str) -> Tuple[bytes, Dict[str, Any]]:
    """
    Resample audio to 16 kHz mono and trim silence.
    Returns (processed_bytes, metadata).
    Requires ffmpeg to be installed on the system.
    """
    from pydub import AudioSegment
    from pydub.silence import detect_leading_silence

    # Detect format from extension
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "wav"
    format_map = {"mp3": "mp3", "wav": "wav", "ogg": "ogg", "flac": "flac", "m4a": "mp4"}
    fmt = format_map.get(ext, "wav")

    audio = AudioSegment.from_file(io.BytesIO(data), format=fmt)

    # Resample & convert to mono
    audio = audio.set_frame_rate(AUDIO_SAMPLE_RATE).set_channels(AUDIO_CHANNELS)

    # Trim leading & trailing silence
    leading = detect_leading_silence(audio, silence_threshold=SILENCE_THRESH_DB, chunk_size=10)
    trailing = detect_leading_silence(audio.reverse(), silence_threshold=SILENCE_THRESH_DB, chunk_size=10)
    if leading + trailing < len(audio):
        audio = audio[leading : len(audio) - trailing]

    # Export as wav
    buf = io.BytesIO()
    audio.export(buf, format="wav")
    processed_bytes = buf.getvalue()

    metadata: Dict[str, Any] = {
        "mediaType": "audio",
        "durationSeconds": round(len(audio) / 1000.0, 2),
        "sizeBytes": len(processed_bytes),
    }
    logger.info(
        "Audio processed: %s  duration=%.2fs  (%d bytes)",
        filename, metadata["durationSeconds"], len(processed_bytes),
    )
    return processed_bytes, metadata
