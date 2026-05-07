"""Payment handlers for the KalaSetu Telegram Bot (Phase 5)."""

from __future__ import annotations

import logging
from typing import Any, Dict

import razorpay
from firebase_admin import firestore as fa_firestore
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.constants import ParseMode
from telegram.ext import ContextTypes

from app.bot.auth.middleware import AUTH_SESSION_CACHE_KEY
from app.core.config import settings

logger = logging.getLogger(__name__)


def _db():
    return fa_firestore.client()


def _razorpay_client():
    return razorpay.Client(
        auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
    )


async def handle_pay_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle pay:{order_id} callback — create a Razorpay payment link and send it."""
    query = update.callback_query
    await query.answer()
    data: str = query.data or ""
    order_id = data[len("pay:"):]

    session: Dict[str, Any] = context.user_data.get(AUTH_SESSION_CACHE_KEY) or {}
    uid: str = session.get("uid") or ""

    db = _db()
    try:
        doc = db.collection("orders").document(order_id).get()
    except Exception as exc:
        logger.error("Failed to fetch order %s: %s", order_id, exc)
        await query.edit_message_text("Could not load order. Please try again.")
        return

    if not doc.exists:
        await query.edit_message_text("Order not found.")
        return

    order: Dict[str, Any] = doc.to_dict() or {}

    if order.get("paymentStatus") == "paid":
        await query.answer("This order is already paid!", show_alert=True)
        return

    if order.get("userId") != uid:
        await query.answer("This is not your order.", show_alert=True)
        return

    total = order.get("total") or 0
    amount_paise = int(float(total) * 100)

    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        await query.edit_message_text(
            "Payment gateway is not configured. Please contact support."
        )
        return

    try:
        client = _razorpay_client()
        link = client.payment_link.create(
            {
                "amount": amount_paise,
                "currency": "INR",
                "description": f"KalaSetu Order {order_id[:8]}",
                "reference_id": order_id,
                "notify": {"sms": False, "email": False},
                "reminder_enable": False,
                "callback_url": f"{settings.FRONTEND_URL}/payment/success",
                "callback_method": "get",
            }
        )
        payment_link_url: str = link.get("short_url") or link.get("id") or ""
    except Exception as exc:
        logger.error("Failed to create Razorpay payment link for order %s: %s", order_id, exc)
        await query.edit_message_text(
            "Could not generate payment link. Please try again later."
        )
        return

    # Persist the payment link in Firestore so the webhook can match it
    try:
        db.collection("orders").document(order_id).update(
            {"razorpayLinkId": link.get("id"), "paymentStatus": "link_sent"}
        )
    except Exception as exc:
        logger.warning("Could not persist payment link for order %s: %s", order_id, exc)

    await query.edit_message_text(
        f"💳 *Pay for Order #{order_id[:8]}*\n\n"
        f"Amount: ₹{total:.2f}\n\n"
        "Tap the button below to complete payment securely via Razorpay:",
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=InlineKeyboardMarkup(
            [[InlineKeyboardButton("💳 Pay ₹{:.0f}".format(total), url=payment_link_url)]]
        ),
    )
