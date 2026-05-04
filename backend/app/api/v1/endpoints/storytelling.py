from __future__ import annotations

import uuid
from pathlib import Path
from urllib.parse import urlparse
from typing import List, Optional

import httpx
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool

from app.core.config import settings
from app.ml.pipelines.video_generator import generate_story_video
from app.schemas.storytelling import StoryCreative, StoryVideoRequest, StoryVideoResponse
from app.services.storytelling.ai_copy import STYLE_PRESETS, generate_ad_copy

router = APIRouter()

UPLOAD_DIR = Path(settings.STORY_UPLOAD_DIR)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


async def _save_upload(file: UploadFile) -> str:
    suffix = Path(file.filename or "image.jpg").suffix or ".jpg"
    target_name = f"{uuid.uuid4()}{suffix}"
    target_path = UPLOAD_DIR / target_name
    with open(target_path, "wb") as destination:
        destination.write(await file.read())
    return str(target_path)


async def _materialize_image_source(source: str) -> str:
    parsed_source = urlparse(source)

    if parsed_source.scheme in {"http", "https"}:
        suffix = Path(parsed_source.path).suffix or ".jpg"
        target_path = UPLOAD_DIR / f"{uuid.uuid4()}{suffix}"

        async with httpx.AsyncClient(follow_redirects=True, timeout=60.0) as client:
            response = await client.get(source)
            response.raise_for_status()

        target_path.write_bytes(response.content)
        return str(target_path)

    local_path = Path(source)
    if local_path.exists():
        return str(local_path)

    raise HTTPException(status_code=400, detail=f"Unable to resolve image source: {source}")


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


async def _generate_story_response(
    image_paths: List[str],
    description: str,
    *,
    product_name: Optional[str] = None,
    tone: str = "premium",
    audience: str = "online shoppers",
    style_preset: str = "museum_cinematic",
    duration_per_image: int = 4,
) -> StoryVideoResponse:
    if style_preset not in STYLE_PRESETS:
        style_preset = "museum_cinematic"

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

    image_paths = [await _save_upload(file) for file in files]

    return await _generate_story_response(
        image_paths,
        description,
        product_name=product_name,
        tone=tone,
        audience=audience,
        style_preset=style_preset,
        duration_per_image=duration_per_image,
    )


@router.post("/generate", response_model=StoryVideoResponse)
async def generate_story_pipeline(payload: StoryVideoRequest):
    image_paths = [await _materialize_image_source(source) for source in payload.image_urls]

    # Enrich the user-provided description with painting metadata so the AI can
    # produce a more informed historical narration and reel copy.
    parts = [payload.description or ""]
    if getattr(payload, "painting_name", None):
        parts.append(f"Painting: {payload.painting_name}")
    if getattr(payload, "art_style", None):
        parts.append(f"Art style: {payload.art_style}")
    if getattr(payload, "price", None):
        parts.append(f"Price: {payload.price}")
    if getattr(payload, "state_of_origin", None):
        parts.append(f"State of origin: {payload.state_of_origin}")
    if getattr(payload, "materials", None):
        parts.append(f"Materials: {payload.materials}")

    enriched_description = "\n".join([p for p in parts if p])

    return await _generate_story_response(
        image_paths,
        enriched_description,
        product_name=payload.painting_name or payload.product_name,
        tone=payload.tone,
        audience=payload.audience,
        style_preset=payload.style_preset,
        duration_per_image=payload.duration_per_image,
    )


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
