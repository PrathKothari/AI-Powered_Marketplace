from __future__ import annotations

from typing import Any, List, Optional

from pydantic import BaseModel, Field


class PaintingSignal(BaseModel):
    productId: Optional[str] = None
    title: Optional[str] = None
    style: Optional[str | List[str]] = None
    theme: Optional[str | List[str]] = None
    artist: Optional[str] = None
    colorPalette: Optional[str | List[str]] = None
    price: Optional[float] = None
    priceRange: Optional[str] = None
    interactionType: Optional[str] = None
    rating: Optional[float] = None
    reviewCount: Optional[int] = None
    stock: Optional[int] = None


class RecommendationRequest(BaseModel):
    userId: Optional[str] = None
    cartItems: List[PaintingSignal] = Field(default_factory=list)
    pastInteractions: List[PaintingSignal] = Field(default_factory=list)
    catalogItems: Optional[List[PaintingSignal]] = None
    excludeIds: List[str] = Field(default_factory=list)
    limit: int = Field(default=6, ge=5, le=8)


class RecommendationItem(BaseModel):
    productId: str
    title: str
    style: Optional[str] = None
    theme: Optional[str] = None
    artist: Optional[str] = None
    colorPalette: List[str] = Field(default_factory=list)
    priceRange: Optional[str] = None
    price: Optional[float] = None
    reason: str


class RecommendationResponse(BaseModel):
    recommendations: List[RecommendationItem]