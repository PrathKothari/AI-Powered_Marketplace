from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.core.config import settings
from app.core.logging import setup_logging
from app.api.router import api_router

# Setup logging
setup_logging()

def create_application() -> FastAPI:
    """
    Initialize and configure the FastAPI application.
    """
    application = FastAPI(
        title=settings.PROJECT_NAME,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url=f"{settings.API_V1_STR}/docs",  # e.g. /api/v1/docs
        description="Backend for AI-Powered Artisan Marketplace",
        version="0.1.0",
    )

    # Set all CORS enabled origins
    if settings.BACKEND_CORS_ORIGINS:
        application.add_middleware(
            CORSMiddleware,
            allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    # Include API router
    application.include_router(api_router, prefix=settings.API_V1_STR)

    media_root = Path(settings.STORY_MEDIA_DIR)
    media_root.mkdir(parents=True, exist_ok=True)
    application.mount("/media", StaticFiles(directory=str(media_root)), name="media")

    return application

app = create_application()

@app.get("/health")
async def health_check():
    """
    Health check endpoint.
    """
    return {"status": "ok", "project": settings.PROJECT_NAME}
