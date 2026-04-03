"""
agent.py — IngestAgent orchestrator.

Detects media type, delegates to the appropriate processor,
uploads results to Firebase Storage, and writes metadata to Firestore.
"""

import logging
import uuid
from datetime import datetime
from typing import Optional, Dict, Any

from app.services.ingest.media_processor import process_image, process_audio
from app.services.ingest.storage import upload_to_firebase, save_media_metadata

logger = logging.getLogger(__name__)

# Content-type prefixes used for detection
IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp"}
AUDIO_TYPES = {"audio/mpeg", "audio/wav", "audio/ogg", "audio/flac", "audio/mp4", "audio/x-wav", "audio/x-m4a"}


class IngestAgent:
    """
    Manages normalisation and preprocessing of raw media uploads.
    Supports images (Pillow) and audio (pydub / FFmpeg).
    """

    @staticmethod
    def _detect_media_type(content_type: str, filename: str) -> str:
        ct = content_type.lower()
        if ct in IMAGE_TYPES or ct.startswith("image/"):
            return "image"
        if ct in AUDIO_TYPES or ct.startswith("audio/"):
            return "audio"
        # Fallback: guess from extension
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if ext in ("jpg", "jpeg", "png", "gif", "webp", "bmp"):
            return "image"
        if ext in ("mp3", "wav", "ogg", "flac", "m4a"):
            return "audio"
        raise ValueError(f"Unsupported media type: {content_type} / {filename}")

    @staticmethod
    def _content_type_for(media_type: str, filename: str) -> str:
        if media_type == "image":
            ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpeg"
            mapping = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "gif": "image/gif", "webp": "image/webp"}
            return mapping.get(ext, "image/jpeg")
        return "audio/wav"  # processed audio is always wav

    async def ingest(
        self,
        file_data: bytes,
        filename: str,
        content_type: str,
        artisan_id: str,
        product_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        asset_id = str(uuid.uuid4())
        media_type = self._detect_media_type(content_type, filename)

        logger.info("IngestAgent: processing %s (%s) for artisan %s", filename, media_type, artisan_id)

        if media_type == "image":
            processed_bytes, thumb_bytes, meta = process_image(file_data, filename)
            # Upload processed image
            ct = self._content_type_for("image", filename)
            storage_url = upload_to_firebase(
                processed_bytes,
                f"media/{artisan_id}/{asset_id}/{filename}",
                content_type=ct,
            )
            # Upload thumbnail
            thumb_url = upload_to_firebase(
                thumb_bytes,
                f"media/{artisan_id}/{asset_id}/thumb_{filename}",
                content_type=ct,
            )
            meta["thumbnailUrl"] = thumb_url

        elif media_type == "audio":
            processed_bytes, meta = process_audio(file_data, filename)
            wav_name = filename.rsplit(".", 1)[0] + ".wav" if "." in filename else filename + ".wav"
            storage_url = upload_to_firebase(
                processed_bytes,
                f"media/{artisan_id}/{asset_id}/{wav_name}",
                content_type="audio/wav",
            )
        else:
            raise ValueError(f"Unsupported media type: {media_type}")

        # Build full metadata document
        doc = {
            "assetId": asset_id,
            "artisanId": artisan_id,
            "productId": product_id,
            "originalFilename": filename,
            "storageUrl": storage_url,
            "createdAt": datetime.utcnow().isoformat(),
            **meta,
        }

        save_media_metadata(doc)
        logger.info("IngestAgent: asset %s stored successfully", asset_id)
        return doc
