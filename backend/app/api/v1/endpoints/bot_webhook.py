"""Razorpay webhook endpoint — verifies payment and notifies the Telegram user."""

from __future__ import annotations

import hashlib
import hmac
import logging
from typing import Any, Dict

import httpx
from fastapi import APIRouter, Header, HTTPException, Request
from firebase_admin import firestore as fa_firestore

from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

TELEGRAM_API = "https://api.telegram.org/bot{token}/sendMessage"


def _db():
    return fa_firestore.client()


async def _notify_telegram(telegram_id: int | str, text: str) -> None:
    """Send a plain-text Telegram message via direct HTTP (avoids cross-loop issues)."""
    url = TELEGRAM_API.format(token=settings.TELEGRAM_BOT_TOKEN)
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(url, json={"chat_id": telegram_id, "text": text})
    except Exception as exc:
        logger.warning("Failed to send Telegram notification to %s: %s", telegram_id, exc)


def _verify_razorpay_signature(body: bytes, signature: str) -> bool:
    """Verify Razorpay webhook signature using HMAC-SHA256."""
    secret = settings.RAZORPAY_KEY_SECRET
    if not secret:
        return False
    expected = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


@router.post("/razorpay")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: str = Header(default=""),
) -> Dict[str, str]:
    """
    Receives Razorpay webhook events.
    Handles: payment_link.paid
    Marks the order as paid in Firestore and notifies the buyer on Telegram.
    """
    body = await request.body()

    if not _verify_razorpay_signature(body, x_razorpay_signature):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    payload: Dict[str, Any] = await request.json()
    event: str = payload.get("event") or ""

    if event != "payment_link.paid":
        # Acknowledge other events without processing
        return {"status": "ignored"}

    entity: Dict[str, Any] = (
        payload.get("payload", {}).get("payment_link", {}).get("entity") or {}
    )
    order_id: str = entity.get("reference_id") or ""
    payment_id: str = (
        payload.get("payload", {}).get("payment", {}).get("entity", {}).get("id") or ""
    )

    if not order_id:
        logger.warning("razorpay_webhook: payment_link.paid missing reference_id")
        return {"status": "ok"}

    db = _db()
    try:
        doc_ref = db.collection("orders").document(order_id)
        doc = doc_ref.get()
    except Exception as exc:
        logger.error("Webhook: failed to fetch order %s: %s", order_id, exc)
        return {"status": "ok"}

    if not doc.exists:
        logger.warning("Webhook: order %s not found in Firestore", order_id)
        return {"status": "ok"}

    order: Dict[str, Any] = doc.to_dict() or {}

    # Update order status
    try:
        doc_ref.update(
            {
                "paymentStatus": "paid",
                "status": "processing",
                "razorpayPaymentId": payment_id,
                "paidAt": fa_firestore.SERVER_TIMESTAMP,
            }
        )
    except Exception as exc:
        logger.error("Webhook: failed to update order %s: %s", order_id, exc)
        return {"status": "ok"}

    # Notify the buyer via Telegram if we have their telegram_id
    uid: str = order.get("userId") or ""
    if uid:
        try:
            user_doc = db.collection("telegram_sessions").document(uid).get()
            if user_doc.exists:
                session_data = user_doc.to_dict() or {}
                telegram_id = session_data.get("telegramId")
                if telegram_id:
                    total = order.get("total", 0)
                    await _notify_telegram(
                        telegram_id,
                        f"Payment confirmed! Your order #{order_id[:8]} "
                        f"(₹{total:.2f}) is now being processed. "
                        "You'll receive a shipping update soon.",
                    )
        except Exception as exc:
            logger.warning("Webhook: could not notify user %s: %s", uid, exc)

    # Notify artisans
    items: list = order.get("items") or []
    artisan_ids_notified: set = set()
    for item in items:
        artisan_id: str = item.get("artisanId") or ""
        if artisan_id and artisan_id not in artisan_ids_notified:
            artisan_ids_notified.add(artisan_id)
            try:
                artisan_session = db.collection("telegram_sessions").document(artisan_id).get()
                if artisan_session.exists:
                    artisan_data = artisan_session.to_dict() or {}
                    tg_id = artisan_data.get("telegramId")
                    if tg_id:
                        await _notify_telegram(
                            tg_id,
                            f"New paid order! Order #{order_id[:8]} — "
                            f"{item.get('title', 'item')} ×{item.get('quantity', 1)}. "
                            "Please prepare it for shipping.",
                        )
            except Exception as exc:
                logger.warning("Webhook: could not notify artisan %s: %s", artisan_id, exc)

    return {"status": "ok"}
