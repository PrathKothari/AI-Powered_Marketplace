from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field

class UserBase(BaseModel):
    uid: str
    role: str = Field(..., description="'artisan' or 'buyer'")
    name: str
    email: EmailStr
    photoUrl: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(from_attributes=True)

class ArtisanProfileBase(BaseModel):
    artisanId: str
    craftType: str
    region: str
    experienceYears: Optional[int] = None
    bio: Optional[str] = None
    languages: Optional[List[str]] = list()
    verified: bool = False

    model_config = ConfigDict(from_attributes=True)

class ProductBase(BaseModel):
    productId: str
    artisanId: str
    title: str
    description: Optional[str] = None
    price: float
    currency: str = "INR"
    images: List[str]
    craftType: str
    region: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    active: bool = True

    model_config = ConfigDict(from_attributes=True)

class StoryBase(BaseModel):
    storyId: str
    productId: str
    artisanId: str
    language: str
    storyText: str
    audioUrl: Optional[str] = None
    ImageUrls: Optional[List[str]] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(from_attributes=True)

class InteractionBase(BaseModel):
    userId: str
    productId: str
    type: str = Field(..., description="'view', 'like', 'save'")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(from_attributes=True)

class SearchLogBase(BaseModel):
    userId: Optional[str] = None
    queryType: str = Field(..., description="'image' or 'text'")
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(from_attributes=True)

class MediaAssetBase(BaseModel):
    assetId: str
    artisanId: str
    productId: Optional[str] = None
    mediaType: str = Field(..., description="'image' or 'audio'")
    originalFilename: str
    storageUrl: str
    thumbnailUrl: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    durationSeconds: Optional[float] = None
    sizeBytes: int
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(from_attributes=True)

class CategoryBase(BaseModel):
    categoryId: Optional[str] = None
    name: str
    description: Optional[str] = ""
    imageUrl: Optional[str] = ""
    gradientTheme: Optional[str] = "from-purple-100 to-indigo-100"
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    active: bool = True

    model_config = ConfigDict(from_attributes=True, extra="ignore")
