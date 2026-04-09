import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional, Any, Dict
from google.cloud import firestore
from firebase_admin import firestore as fa_firestore
from pydantic import BaseModel
import random

from app.core.deps import get_current_user

router = APIRouter()


class CreateProductRequest(BaseModel):
    title: str
    price: float
    description: str = ""
    craftType: str = ""
    region: str = ""
    materials: str = ""
    images: List[str] = []
    storyVideo: str = ""


def get_db():
    try:
        return fa_firestore.client()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _sanitize_product(doc_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """Ensure required fields exist with sensible defaults."""
    # Use Firestore document ID as productId if missing
    if not data.get("productId"):
        data["productId"] = doc_id

    # Assign a random INR price if missing or zero
    if not data.get("price"):
        data["price"] = random.randint(500, 2000)

    data.setdefault("currency", "INR")
    data.setdefault("title", data.get("name", "Untitled Painting"))
    data.setdefault("artisanId", "unknown")
    data.setdefault("craftType", data.get("category", ""))
    data.setdefault("region", "India")
    data.setdefault("images", [])
    data.setdefault("active", True)

    # Assign random stock 1–15 if missing (not written back to DB; seeding script handles that)
    if "stock" not in data:
        data["stock"] = random.randint(1, 15)

    return data


@router.post("", status_code=201)
def create_product(
    request: CreateProductRequest,
    current_user: dict = Depends(get_current_user),
    db: firestore.Client = Depends(get_db),
) -> Dict[str, Any]:
    """List a new product. Any authenticated user can sell."""
    product_id = str(uuid.uuid4())
    product_data = {
        "productId": product_id,
        "artisanId": current_user["sub"],
        "artisanName": current_user.get("name", ""),
        "title": request.title,
        "price": request.price,
        "description": request.description,
        "craftType": request.craftType,
        "region": request.region,
        "materials": request.materials,
        "images": request.images,
        "storyVideo": request.storyVideo,
        "currency": "INR",
        "stock": 10,
        "rating": 0.0,
        "reviewCount": 0,
        "active": True,
        "createdAt": datetime.utcnow().isoformat(),
    }
    db.collection("products").document(product_id).set(product_data)
    return product_data


@router.get("")
def get_products(
    craft_type: Optional[str] = Query(None, description="Filter by craft type / category"),
    active_only: bool = Query(True, description="Return only active products"),
    seller_id: Optional[str] = Query(None, description="Filter by seller/artisan UID"),
    db: firestore.Client = Depends(get_db),
) -> List[Dict[str, Any]]:
    ref = db.collection("products")
    if active_only:
        ref = ref.where("active", "==", True)
    if craft_type:
        ref = ref.where("craftType", "==", craft_type)
    if seller_id:
        ref = ref.where("artisanId", "==", seller_id)

    docs = ref.stream()
    products = []
    for doc in docs:
        data = doc.to_dict()
        if data is None:
            continue
        data = _sanitize_product(doc.id, data)
        products.append(data)

    return products


@router.get("/{product_id}")
def get_product(
    product_id: str,
    db: firestore.Client = Depends(get_db),
) -> Dict[str, Any]:
    doc_ref = db.collection("products").document(product_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Product not found")
    data = doc.to_dict() or {}
    return _sanitize_product(doc.id, data)
