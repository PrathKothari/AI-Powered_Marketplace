from typing import List, Optional

from pydantic import BaseModel, Field


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


class StoryCopyRequest(BaseModel):
    description: str
    image_count: int = Field(default=4, ge=1, le=12)
    product_name: Optional[str] = None
    tone: str = "premium"
    audience: str = "online shoppers"
    style_preset: str = "museum_cinematic"
