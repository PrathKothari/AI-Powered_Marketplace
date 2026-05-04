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
    narration: str | None = Field(default=None)


class StoryVideoResponse(BaseModel):
    video_url: str
    local_path: Optional[str] = None
    narration: Optional[str] = None


class StoryVideoRequest(BaseModel):
    description: str
    image_urls: List[str]
    product_name: Optional[str] = None
    painting_name: Optional[str] = None
    art_style: Optional[str] = None
    price: Optional[str] = None
    state_of_origin: Optional[str] = None
    materials: Optional[str] = None
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
