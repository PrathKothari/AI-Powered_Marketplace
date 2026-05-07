import logging
from typing import Any, Dict, Optional, List

from fastapi import APIRouter, Depends, HTTPException, status
from firebase_admin import firestore
from pydantic import BaseModel

from app.core.deps import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()


def get_db():
    return firestore.client()


# ── Request / Response schemas ────────────────────────────────────────────────

class UpdateProfileRequest(BaseModel):
    bio: Optional[str] = None
    craftType: Optional[str] = None
    region: Optional[str] = None
    experienceYears: Optional[int] = None
    languages: Optional[List[str]] = None
    photoUrl: Optional[str] = None


class PublicProfile(BaseModel):
    uid: str
    name: str
    bio: Optional[str] = None
    craftType: Optional[str] = None
    region: Optional[str] = None
    experienceYears: Optional[int] = None
    languages: Optional[List[str]] = None
    photoUrl: Optional[str] = None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.patch("/profile")
async def update_user_profile(
    request: UpdateProfileRequest,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Update the authenticated user's profile (bio, craft details)."""
    uid = current_user["sub"]
    db = get_db()

    update_data: Dict[str, Any] = {}
    for field, value in request.model_dump(exclude_none=True).items():
        update_data[field] = value

    if not update_data:
        doc = db.collection("users").document(uid).get()
        return doc.to_dict() if doc.exists else {}

    db.collection("users").document(uid).update(update_data)
    logger.info("Updated profile for user %s: %s", uid, list(update_data.keys()))

    # Return the full profile
    doc = db.collection("users").document(uid).get()
    return doc.to_dict() if doc.exists else update_data


@router.get("/profile/{user_id}")
async def get_public_profile(user_id: str) -> Dict[str, Any]:
    """Get a user's public profile (name, bio, craft info). No auth required."""
    db = get_db()
    doc = db.collection("users").document(user_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="User not found")

    data = doc.to_dict()
    return PublicProfile(
        uid=data.get("uid", user_id),
        name=data.get("name", ""),
        bio=data.get("bio"),
        craftType=data.get("craftType"),
        region=data.get("region"),
        experienceYears=data.get("experienceYears"),
        languages=data.get("languages"),
        photoUrl=data.get("photoUrl"),
    ).model_dump()
