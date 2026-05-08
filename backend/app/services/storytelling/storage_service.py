from __future__ import annotations

import shutil
import uuid
from pathlib import Path
from typing import Optional

from app.core.config import settings

try:  # pragma: no cover - optional at runtime
    from google.cloud import storage
except Exception:  # pragma: no cover - keep local fallback working
    storage = None


MEDIA_ROOT = Path(settings.STORY_MEDIA_DIR)
MEDIA_ROOT.mkdir(parents=True, exist_ok=True)
(MEDIA_ROOT / "videos").mkdir(parents=True, exist_ok=True)


def _local_public_url(filename: str) -> str:
    return f"/media/videos/{filename}"


def upload_file_to_gcs(local_path: str, destination_name: Optional[str] = None) -> str:
    destination_name = destination_name or f"videos/{uuid.uuid4()}.mp4"

    # Try Firebase Storage via firebase_admin first (already initialized with credentials)
    try:
        from firebase_admin import storage as fb_storage
        bucket = fb_storage.bucket()
        blob_path = f"{settings.GCS_PUBLIC_PREFIX}/{Path(destination_name).name}"
        blob = bucket.blob(blob_path)
        blob.upload_from_filename(local_path, content_type="video/mp4")
        try:
            blob.make_public()
            return blob.public_url
        except Exception:
            # Uniform bucket-level access — public_url still works if the bucket is configured public
            return f"https://storage.googleapis.com/{bucket.name}/{blob_path}"
    except Exception:
        pass

    # Fallback: try google-cloud-storage client
    if settings.GCS_BUCKET_NAME and storage is not None:
        try:
            client = storage.Client(project=settings.GOOGLE_CLOUD_PROJECT or None)
            bucket = client.bucket(settings.GCS_BUCKET_NAME)
            blob = bucket.blob(f"{settings.GCS_PUBLIC_PREFIX}/{Path(destination_name).name}")
            blob.upload_from_filename(local_path)
            try:
                blob.make_public()
            except Exception:
                pass
            return blob.public_url
        except Exception:
            pass

    # Final fallback: serve from local /media/videos/ mount
    local_target = MEDIA_ROOT / "videos" / Path(destination_name).name
    shutil.copy2(local_path, local_target)
    return _local_public_url(local_target.name)