from __future__ import annotations

import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from firebase_admin import storage as fb_storage

from app.core.deps import get_current_user

router = APIRouter()

ALLOWED_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"}
MAX_BYTES = 10 * 1024 * 1024  # 10 MB


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Upload an image to Firebase Storage and return its public URL.

    Uses Firebase Admin SDK so it bypasses Storage security rules.
    """
    ext = Path(file.filename or "").suffix.lower() or ".jpg"
    if ext not in ALLOWED_EXTS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

    contents = await file.read()
    if len(contents) > MAX_BYTES:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    blob_path = f"products/{uuid.uuid4().hex}{ext}"
    bucket = fb_storage.bucket()
    blob = bucket.blob(blob_path)
    blob.upload_from_string(contents, content_type=file.content_type or "image/jpeg")

    try:
        blob.make_public()
        url = blob.public_url
    except Exception:
        url = f"https://storage.googleapis.com/{bucket.name}/{blob_path}"

    return {"url": url, "path": blob_path}
