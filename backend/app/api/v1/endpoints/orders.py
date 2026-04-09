import uuid
from datetime import datetime
from typing import List, Dict, Any

from fastapi import APIRouter, HTTPException, Depends
from firebase_admin import firestore as fa_firestore
from pydantic import BaseModel

from app.core.deps import get_current_user

router = APIRouter()


class OrderItem(BaseModel):
    id: str
    name: str
    price: float
    quantity: int
    image: str = ""


class CreateOrderRequest(BaseModel):
    items: List[OrderItem]
    total: float


def get_db():
    return fa_firestore.client()


@router.post("/", response_model=Dict[str, Any], status_code=201)
def create_order(
    request: CreateOrderRequest,
    current_user: dict = Depends(get_current_user),
):
    """Create a new order from cart items. Requires authentication."""
    if not request.items:
        raise HTTPException(status_code=400, detail="Order must contain at least one item")

    db = get_db()
    order_id = f"ORD-{uuid.uuid4().hex[:8].upper()}"

    order_data = {
        "orderId": order_id,
        "userId": current_user["sub"],
        "items": [item.model_dump() for item in request.items],
        "total": request.total,
        "status": "Processing",
        "createdAt": datetime.utcnow().isoformat(),
    }

    db.collection("orders").document(order_id).set(order_data)
    return order_data


@router.get("/", response_model=List[Dict[str, Any]])
def get_orders(current_user: dict = Depends(get_current_user)):
    """Get all orders for the authenticated user, newest first."""
    db = get_db()
    docs = (
        db.collection("orders")
        .where("userId", "==", current_user["sub"])
        .stream()
    )
    results = [doc.to_dict() for doc in docs]
    results.sort(key=lambda o: o.get("createdAt", ""), reverse=True)
    return results


@router.get("/{order_id}", response_model=Dict[str, Any])
def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific order by ID. Only the owner can access it."""
    db = get_db()
    doc = db.collection("orders").document(order_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Order not found")
    data = doc.to_dict()
    if data.get("userId") != current_user["sub"]:
        raise HTTPException(status_code=403, detail="Access denied")
    return data
