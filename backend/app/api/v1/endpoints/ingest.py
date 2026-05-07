"""
Ingest API endpoints — upload & retrieve media assets.
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from typing import Optional, List

from app.services.ingest.agent import IngestAgent
from app.services.ingest.storage import get_media_metadata

router = APIRouter()
ingest_agent = IngestAgent()


@router.post("/upload")
async def upload_media(
    files: List[UploadFile] = File(...),
    artisan_id: str = Form(...),
    product_id: Optional[str] = Form(None),
):
    """
    Upload one or more image/audio files for preprocessing and Firestore storage.
    """
    if not files:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No files provided")

    results = []
    errors = []

    for file in files:
        if not file.filename:
            errors.append({"file": "unknown", "error": "No filename provided"})
            continue

        data = await file.read()
        if len(data) == 0:
            errors.append({"file": file.filename, "error": "Empty file"})
            continue

        try:
            result = await ingest_agent.ingest(
                file_data=data,
                filename=file.filename,
                content_type=file.content_type or "application/octet-stream",
                artisan_id=artisan_id,
                product_id=product_id,
            )
            results.append(result)
        except ValueError as e:
            errors.append({"file": file.filename, "error": str(e)})
        except Exception as e:
            errors.append({"file": file.filename, "error": f"Ingest failed: {str(e)}"})

    return {"uploaded": results, "errors": errors}


@router.get("/{asset_id}")
async def get_asset(asset_id: str):
    """
    Retrieve metadata for a media asset by its ID.
    """
    metadata = get_media_metadata(asset_id)
    if metadata is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    return metadata
