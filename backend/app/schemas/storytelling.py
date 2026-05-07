from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class StoryCreative(BaseModel):
    title: str = Field(default="Product Story")
    hook: str = Field(default="Discover More")
    main: str = Field(default="A cinematic product story.")
    cta: str = Field(default="Shop Now")
    tagline: str = Field(default="")
    music_mood: str = Field(default="cinematic")
    style_notes: str = Field(default="")
    visual_keywords: List[str] = Field(default_factory=list)
    scene_captions: List[str] = Field(default_factory=list)


class StoryVideoResponse(BaseModel):
    video_url: str
    local_path: Optional[str] = None
    creative: StoryCreative


class StoryVideoRequest(BaseModel):
    description: str
    image_urls: List[str]
    product_name: Optional[str] = None
    tone: str = "premium"
    audience: str = "online shoppers"
    style_preset: str = "museum_cinematic"
    duration_per_image: int = Field(default=4, ge=1, le=30)

    @field_validator("image_urls")
    @classmethod
    def _validate_image_urls(cls, value: List[str]) -> List[str]:
        if not value:
            raise ValueError("At least one product image is required")
        return value


class StoryCopyRequest(BaseModel):
    description: str
    image_count: int = Field(default=4, ge=1, le=12)
    product_name: Optional[str] = None
    tone: str = "premium"
    audience: str = "online shoppers"
    style_preset: str = "museum_cinematic"


class ReelGenerateRequest(BaseModel):
    productId: str
    imageUrls: List[str]
    description: str
    productName: Optional[str] = None
    tone: str = "premium"
    audience: str = "home decor enthusiasts"
    stylePreset: str = "artisan_story"

    @field_validator("imageUrls")
    @classmethod
    def _require_images(cls, v: List[str]) -> List[str]:
        if not v:
            raise ValueError("At least one image URL is required")
        return v


class ReelJobResponse(BaseModel):
    jobId: str
    status: str
    mode: Optional[str] = None
    videoUrl: Optional[str] = None
    error: Optional[str] = None
