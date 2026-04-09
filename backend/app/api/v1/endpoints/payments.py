import hashlib
import hmac
import uuid
from datetime import datetime
from typing import List

import razorpay
from fastapi import APIRouter, HTTPException, Depends
from firebase_admin import firestore as fa_firestore
from pydantic import BaseModel

from app.core.config import settings
from app.core.deps import get_current_user
from app.api.v1.endpoints.orders import _resolve_seller_ids

router = APIRouter()


def get_razorpay_client():
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=500, detail="Razorpay not configured")
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


def get_db():
    return fa_firestore.client()


class CartItem(BaseModel):
    id: str
    name: str
    price: float
    quantity: int
    image: str = ""


class CreatePaymentOrderRequest(BaseModel):
    amount: float          # in INR
    currency: str = "INR"
    items: List[CartItem]


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    items: List[CartItem]
    total: float


@router.post("/create-order")
def create_payment_order(
    request: CreatePaymentOrderRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Create a Razorpay order. Returns the order details needed
    to open the Razorpay checkout modal on the frontend.
    """
    client = get_razorpay_client()

    # Razorpay amount is in paise (1 INR = 100 paise)
    amount_paise = int(request.amount * 100)

    razorpay_order = client.order.create({
        "amount": amount_paise,
        "currency": request.currency,
        "receipt": f"receipt_{uuid.uuid4().hex[:8]}",
        "payment_capture": 1,  # auto-capture
    })

    return {
        "razorpay_order_id": razorpay_order["id"],
        "amount": amount_paise,
        "currency": request.currency,
        "key_id": settings.RAZORPAY_KEY_ID,
    }


@router.post("/verify")
def verify_payment(
    request: VerifyPaymentRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """
    Verify Razorpay payment signature. If valid, create the order in Firestore.
    """
    # Verify HMAC-SHA256 signature
    payload = f"{request.razorpay_order_id}|{request.razorpay_payment_id}"
    expected = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(),
        payload.encode(),
        hashlib.sha256,
    ).hexdigest()

    if expected != request.razorpay_signature:
        raise HTTPException(status_code=400, detail="Payment verification failed — invalid signature")

    # Signature valid → create order in Firestore
    order_id = f"ORD-{uuid.uuid4().hex[:8].upper()}"
    seller_ids = _resolve_seller_ids(db, request.items)
    order_data = {
        "orderId": order_id,
        "userId": current_user["sub"],
        "sellerIds": seller_ids,
        "items": [item.model_dump() for item in request.items],
        "total": request.total,
        "status": "Processing",
        "paymentId": request.razorpay_payment_id,
        "razorpayOrderId": request.razorpay_order_id,
        "createdAt": datetime.utcnow().isoformat(),
    }
    db.collection("orders").document(order_id).set(order_data)

    return {"success": True, "orderId": order_id}
