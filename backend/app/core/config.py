from pathlib import Path
import os
from typing import List, Union
from dotenv import load_dotenv
from pydantic import AliasChoices, AnyHttpUrl, Field, field_validator
from typing import Optional
from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv(".env.local")

class Settings(BaseSettings):
    """
    Application configuration settings using Pydantic.
    """
    PROJECT_NAME: str = "AI Artisan Marketplace"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Paths and media defaults
    BASE_DIR: Path = Path(__file__).resolve().parents[2]
    STORY_UPLOAD_DIR: str = Field(default="temp_uploads", validation_alias=AliasChoices("STORY_UPLOAD_DIR", "UPLOAD_DIR"))
    STORY_OUTPUT_DIR: str = Field(default="temp_outputs", validation_alias=AliasChoices("STORY_OUTPUT_DIR", "OUTPUT_DIR"))
    STORY_MEDIA_DIR: str = "generated_media"
    STORY_DEFAULT_MUSIC: str = "assets/music.mp3"
    STORY_FONT_PATH: str = ""
    STORYBOARD_OUTPUT_DIR: str = "generated-videos"
    STORYBOARD_TEMP_DIR: str = "tmp/video-scenes"
    STORYBOARD_VIDEO_WIDTH: int = 1080
    STORYBOARD_VIDEO_HEIGHT: int = 1920
    STORYBOARD_DEFAULT_DURATION_SECONDS: int = 30
    STORYBOARD_ASPECT_RATIO: str = "9:16"
    STORYBOARD_BACKGROUND_MUSIC_PATH: str = ""
    STORYBOARD_BACKGROUND_MUSIC_VOLUME: float = 0.12
    STORYBOARD_KEEP_TEMP: bool = False

    # Video generation defaults
    STORY_SECONDS_PER_IMAGE: int = 4
    STORY_MIN_TOTAL_DURATION: int = 30
    STORY_VIDEO_FPS: int = 30
    TEMP_DIR: str = "temp"
    GEMINI_MODEL_NAME: str = Field(default="gemini-1.5-flash", validation_alias=AliasChoices("GEMINI_MODEL_NAME", "VERTEX_MODEL"))
    GOOGLE_CLOUD_LOCATION: str = Field(default="us-central1", validation_alias=AliasChoices("GOOGLE_CLOUD_LOCATION", "GCP_REGION"))
    GOOGLE_CLOUD_PROJECT: str = Field(default="", validation_alias=AliasChoices("GOOGLE_CLOUD_PROJECT", "GCP_PROJECT_ID"))

    # Storage
    GCS_BUCKET_NAME: str = Field(default="", validation_alias=AliasChoices("GCS_BUCKET_NAME", "CLOUD_STORAGE_BUCKET_NAME"))
    GCS_PUBLIC_PREFIX: str = "videos"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []

    # CORS - stored as comma-separated string, parsed via property
    BACKEND_CORS_ORIGINS: str = ""

    @computed_field
    @property
    def cors_origins(self) -> list[str]:
        if not self.BACKEND_CORS_ORIGINS:
            return []
        return [origin.strip() for origin in self.BACKEND_CORS_ORIGINS.split(",")]

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./app.db"

    # Firebase
    FIREBASE_PROJECT_ID: str = ""
    FIREBASE_PRIVATE_KEY: str = ""
    FIREBASE_CLIENT_EMAIL: str = ""
    FIREBASE_API_KEY: Optional[str] = None
    FIREBASE_STORAGE_BUCKET: str = ""

    # Google OAuth
    GOOGLE_CLIENT_ID: Optional[str] = None

    # Email (Gmail SMTP)
    EMAIL_SENDER: Optional[str] = None      # your Gmail address
    EMAIL_PASSWORD: Optional[str] = None    # Gmail App Password (not your login password)

    # AI/ML
    ML_MODEL_PATH: str = "./app/ml/models"
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL_NAME: str = "gpt-4o-mini"
    HF_TOKEN: Optional[str] = None
    # FAL (video generation) settings
    FAL_API_KEY: Optional[str] = Field(default=None, validation_alias=AliasChoices("FAL_API_KEY", "FAL_KEY"))
    FAL_API_URL: Optional[str] = Field(default="https://api.fal.ai", validation_alias=AliasChoices("FAL_API_URL", "FAL_URL"))

    # Kling (alternative video generation provider)
    KLING_ACCESS_KEY: Optional[str] = Field(default=None, validation_alias=AliasChoices("KLING_ACCESS_KEY", "KLING_KEY", "KLING_ACCESS"))
    KLING_SECRET_KEY: Optional[str] = Field(default=None, validation_alias=AliasChoices("KLING_SECRET_KEY", "KLING_SECRET"))
    KLING_API_URL: Optional[str] = Field(default="https://api-singapore.klingai.com", validation_alias=AliasChoices("KLING_API_URL", "KLING_URL"))

    # Text-to-Speech / Audio defaults
    STORY_TTS_LANGUAGE: str = "en-US"
    STORY_TTS_VOICE: str = "en-US-Wavenet-D"
    STORY_TTS_SPEAKING_RATE: float = 1.0
    STORY_TTS_PITCH: float = 0.0
    STORY_MUSIC_VOLUME: float = 0.15

    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=(".env.local", ".env"),
        env_file_encoding="utf-8",
    )
    # Pinecone
    PINECONE_API_KEY: str = ""
    PINECONE_IMAGE_INDEX: str = "product-images"
    PINECONE_TEXT_INDEX: str = "product-text"

    # Razorpay
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""

    # Telegram
    TELEGRAM_BOT_TOKEN: str = ""

    # Load .env.local first (for local secrets), then .env as fallback
    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=(".env.local", ".env"),
        env_file_encoding='utf-8',
        extra='ignore',
    )

settings = Settings()

# Prefer explicit FAL_KEY env var if provided (supports older setups that set FAL_KEY)
# Pydantic already accepts the alias, but prefer the raw env var if present and
# the parsed `FAL_API_KEY` is empty.
if not settings.FAL_API_KEY:
    _env_fal = os.getenv("FAL_KEY")
    if _env_fal:
        settings.FAL_API_KEY = _env_fal
