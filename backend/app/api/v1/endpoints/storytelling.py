from __future__ import annotations

import uuid
from pathlib import Path
from urllib.parse import urlparse
from typing import List, Optional

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.concurrency import run_in_threadpool

from app.core.deps import get_current_user
from app.core.config import settings
from app.ml.pipelines.video_generator import generate_story_video, run_reel_pipeline
from app.schemas.storytelling import (
    ReelGenerateRequest,
    ReelJobResponse,
    StoryCreative,
    StoryVideoRequest,
    StoryVideoResponse,
)
from app.services.storytelling import job_service
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


@router.post("/generate", response_model=ReelJobResponse)
async def generate_reel(
    payload: ReelGenerateRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    """Start an async reel generation job for a product.

    Returns the existing job_id immediately if a non-terminal job is already
    active for this product (prevents duplicate submissions).
    """
    seller_id: str = current_user["sub"]

    existing_job_id = await run_in_threadpool(
        job_service.get_active_job_for_product, payload.productId
    )
    if existing_job_id:
        job = await run_in_threadpool(job_service.get_job, existing_job_id)
        return ReelJobResponse(
            jobId=existing_job_id,
            status=job.get("status", "pending") if job else "pending",
            mode=job.get("mode") if job else None,
        )

    job_id = await run_in_threadpool(
        job_service.create_job,
        payload.productId,
        seller_id,
        payload.imageUrls,
    )

    background_tasks.add_task(run_reel_pipeline, job_id)

    return ReelJobResponse(jobId=job_id, status="pending")


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


@router.get("/status/{job_id}", response_model=ReelJobResponse)
async def get_reel_status(
    job_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Return the current status of a reel generation job."""
    job = await run_in_threadpool(job_service.get_job, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    seller_id: str = current_user["sub"]
    if job.get("sellerId") != seller_id:
        raise HTTPException(status_code=403, detail="Not authorised to view this job")

    return ReelJobResponse(
        jobId=job.get("jobId", job_id),
        status=job.get("status", "unknown"),
        mode=job.get("mode"),
        videoUrl=job.get("videoUrl"),
        error=job.get("error"),
    )


@router.delete("/jobs/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_reel_job(
    job_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Cancel a pending reel generation job.

    Only pending jobs can be cancelled; in-progress jobs are left to finish.
    """
    job = await run_in_threadpool(job_service.get_job, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    seller_id: str = current_user["sub"]
    if job.get("sellerId") != seller_id:
        raise HTTPException(status_code=403, detail="Not authorised to cancel this job")

    current_status = job.get("status", "")
    if current_status not in {"pending"}:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot cancel a job with status '{current_status}'",
        )

    await run_in_threadpool(job_service.update_job, job_id, status="failed", error="Cancelled by seller")


@router.get("/styles")
async def list_styles():
    return STYLE_PRESETS
