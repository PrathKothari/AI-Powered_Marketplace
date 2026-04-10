from __future__ import annotations

import uuid
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool

from app.ml.pipelines.video_generator import generate_story_video
from app.schemas.storytelling import StoryCreative, StoryVideoResponse
from app.services.storytelling.ai_copy import STYLE_PRESETS, generate_ad_copy

router = APIRouter()

UPLOAD_DIR = Path("temp_uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


async def _save_upload(file: UploadFile) -> str:
    suffix = Path(file.filename or "image.jpg").suffix or ".jpg"
    target_name = f"{uuid.uuid4()}{suffix}"
    target_path = UPLOAD_DIR / target_name
    with open(target_path, "wb") as destination:
        destination.write(await file.read())
    return str(target_path)


def _validate_images(files: List[UploadFile]) -> None:
    if not files:
        raise HTTPException(status_code=400, detail="At least one product image is required")

    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
    for file in files:
        suffix = Path(file.filename or "").suffix.lower()
        if suffix not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type for {file.filename}. Use JPG, PNG, WEBP, or BMP.",
            )


@router.post("/generate-video", response_model=StoryVideoResponse)
async def generate_video(
    description: str = Form(...),
    product_name: Optional[str] = Form(None),
    tone: str = Form("premium"),
    audience: str = Form("online shoppers"),
    style_preset: str = Form("museum_cinematic"),
    duration_per_image: int = Form(4),
    files: List[UploadFile] = File(...),
):
    _validate_images(files)

    if style_preset not in STYLE_PRESETS:
        style_preset = "museum_cinematic"

    image_paths = [await _save_upload(file) for file in files]

    result = await run_in_threadpool(
        generate_story_video,
        image_paths,
        description,
        product_name=product_name,
        tone=tone,
        audience=audience,
        style_preset=style_preset,
        duration_per_image=duration_per_image,
    )

    return StoryVideoResponse(**result)


@router.post("/generate-copy", response_model=StoryCreative)
async def generate_copy(
    description: str = Form(...),
    image_count: int = Form(4),
    product_name: Optional[str] = Form(None),
    tone: str = Form("premium"),
    audience: str = Form("online shoppers"),
    style_preset: str = Form("museum_cinematic"),
):
    if style_preset not in STYLE_PRESETS:
        style_preset = "museum_cinematic"

    creative = await run_in_threadpool(
        generate_ad_copy,
        description,
        image_count=image_count,
        product_name=product_name,
        tone=tone,
        audience=audience,
        style_preset=style_preset,
    )

    return StoryCreative(**creative)


@router.get("/styles")
async def list_styles():
    return STYLE_PRESETS
