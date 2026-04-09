from typing import Optional
from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """
    Application configuration settings using Pydantic.
    """
    PROJECT_NAME: str = "AI Artisan Marketplace"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

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
    HF_TOKEN: Optional[str] = None

    # Pinecone
    PINECONE_API_KEY: str = ""
    PINECONE_IMAGE_INDEX: str = "product-images"
    PINECONE_TEXT_INDEX: str = "product-text"

    # Razorpay
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", env_file_encoding='utf-8', extra='ignore')

settings = Settings()
