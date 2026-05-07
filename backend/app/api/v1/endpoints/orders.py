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


class UpdateStatusRequest(BaseModel):
    status: str


def get_db():
    return fa_firestore.client()


def _resolve_seller_ids(db, items: List[OrderItem]) -> List[str]:
    """Look up each product in Firestore and return unique artisan UIDs."""
    seller_ids = set()
    for item in items:
        try:
            doc = db.collection("products").document(item.id).get()
            if doc.exists:
                data = doc.to_dict() or {}
                aid = data.get("artisanId")
                if aid:
                    seller_ids.add(aid)
        except Exception:
            pass
    return list(seller_ids)


@router.post("/", response_model=Dict[str, Any], status_code=201)
def create_order(
    request: CreateOrderRequest,
    current_user: dict = Depends(get_current_user),
):
    """Create a new order from cart items. Requires authentication."""
    if not request.items:
        raise HTTPException(status_code=400, detail="Order must contain at least one item")

    db = get_db()
    seller_ids = _resolve_seller_ids(db, request.items)
    order_id = f"ORD-{uuid.uuid4().hex[:8].upper()}"

    order_data = {
        "orderId": order_id,
        "userId": current_user["sub"],
        "sellerIds": seller_ids,
        "items": [item.model_dump() for item in request.items],
        "total": request.total,
        "status": "Processing",
        "createdAt": datetime.utcnow().isoformat(),
    }

    db.collection("orders").document(order_id).set(order_data)
    return order_data


@router.get("/seller", response_model=List[Dict[str, Any]])
def get_seller_orders(current_user: dict = Depends(get_current_user)):
    """Get all orders that contain the authenticated user's products (seller view)."""
    db = get_db()
    docs = (
        db.collection("orders")
        .where("sellerIds", "array_contains", current_user["sub"])
        .stream()
    )
    results = [doc.to_dict() for doc in docs]
    results.sort(key=lambda o: o.get("createdAt", ""), reverse=True)
    return results


@router.get("/", response_model=List[Dict[str, Any]])
def get_orders(current_user: dict = Depends(get_current_user)):
    """Get all orders for the authenticated user (buyer view), newest first."""
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
    """Get a specific order. Accessible by the buyer or any seller whose product is in it."""
    db = get_db()
    doc = db.collection("orders").document(order_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Order not found")
    data = doc.to_dict()
    uid = current_user["sub"]
    if data.get("userId") != uid and uid not in data.get("sellerIds", []):
        raise HTTPException(status_code=403, detail="Access denied")
    return data


@router.patch("/{order_id}/status", response_model=Dict[str, Any])
def update_order_status(order_id: str, request: UpdateStatusRequest, current_user: dict = Depends(get_current_user)):
    """Update order status. Buyer or seller of the order can update."""
    valid_statuses = ["Processing", "Shipped", "Delivered"]
    if request.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Status must be one of {valid_statuses}")
    db = get_db()
    doc_ref = db.collection("orders").document(order_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Order not found")
    data = doc.to_dict()
    uid = current_user["sub"]
    if data.get("userId") != uid and uid not in data.get("sellerIds", []):
        raise HTTPException(status_code=403, detail="Access denied")
    doc_ref.update({"status": request.status})
    return {**data, "status": request.status}
