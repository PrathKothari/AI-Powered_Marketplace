"""Notification dispatcher for the KalaSetu Telegram Bot (Phase 7).

send_telegram_message: stateless httpx-based helper (safe from FastAPI context).
Scheduled jobs: order status polling, review prompts, stock alerts,
                artisan go-live notifications.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict, List, Optional

import httpx
from firebase_admin import firestore as fa_firestore
from google.cloud.firestore_v1.base_query import FieldFilter
from telegram.ext import ContextTypes

from app.core.config import settings

logger = logging.getLogger(__name__)

TELEGRAM_SEND_MESSAGE = "https://api.telegram.org/bot{token}/sendMessage"


# ──────────────────────────────────────────────
# Core send helper (sync-safe via httpx)
# ──────────────────────────────────────────────

async def send_telegram_message(
    telegram_id: int | str,
    text: str,
    parse_mode: str = "Markdown",
) -> None:
    url = TELEGRAM_SEND_MESSAGE.format(token=settings.TELEGRAM_BOT_TOKEN)
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                url,
                json={"chat_id": telegram_id, "text": text, "parse_mode": parse_mode},
            )
            resp.raise_for_status()
    except Exception as exc:
        logger.warning("Failed to send Telegram message to %s: %s", telegram_id, exc)


def _db():
    return fa_firestore.client()


def _get_telegram_id(uid: str) -> Optional[int | str]:
    """Look up a user's Telegram ID from the telegram_sessions collection."""
    try:
        doc = _db().collection("telegram_sessions").document(uid).get()
        if doc.exists:
            return (doc.to_dict() or {}).get("telegramId")
    except Exception as exc:
        logger.warning("Could not fetch telegramId for uid %s: %s", uid, exc)
    return None


# ──────────────────────────────────────────────
# PTB JobQueue callbacks
# ──────────────────────────────────────────────

async def job_order_status_notifications(context: ContextTypes.DEFAULT_TYPE) -> None:
    """Poll for orders whose status changed to 'shipped' and notify buyers."""
    db = _db()
    try:
        docs = (
            db.collection("orders")
            .where(filter=FieldFilter("status", "==", "shipped"))
            .limit(100)
            .stream()
        )
        orders: List[Dict[str, Any]] = []
        for doc in docs:
            o = doc.to_dict() or {}
            o["_id"] = doc.id
            if not o.get("shippingNotified"):  # filter in Python — no composite index needed
                orders.append(o)
    except Exception as exc:
        logger.error("order_status_notifications query failed: %s", exc)
        return

    for order in orders:
        uid: str = order.get("userId") or ""
        order_id: str = order.get("_id") or ""
        tg_id = _get_telegram_id(uid)
        if tg_id:
            await send_telegram_message(
                tg_id,
                f"Your order #{order_id[:8]} has been shipped! "
                "You'll receive it soon.",
            )
        try:
            db.collection("orders").document(order_id).update({"shippingNotified": True})
        except Exception as exc:
            logger.warning("Could not mark order %s as notified: %s", order_id, exc)


async def job_review_prompts(context: ContextTypes.DEFAULT_TYPE) -> None:
    """Prompt buyers to review items from delivered orders not yet reviewed."""
    db = _db()
    try:
        docs = (
            db.collection("orders")
            .where(filter=FieldFilter("status", "==", "delivered"))
            .limit(100)
            .stream()
        )
        orders: List[Dict[str, Any]] = []
        for doc in docs:
            o = doc.to_dict() or {}
            o["_id"] = doc.id
            if not o.get("reviewPromptSent"):  # filter in Python
                orders.append(o)
    except Exception as exc:
        logger.error("review_prompts query failed: %s", exc)
        return

    for order in orders:
        uid: str = order.get("userId") or ""
        order_id: str = order.get("_id") or ""
        tg_id = _get_telegram_id(uid)
        if tg_id:
            await send_telegram_message(
                tg_id,
                f"How was your order #{order_id[:8]}? "
                "Please leave a review to help other buyers and support our artisans! \U0001f64f",
            )
        try:
            db.collection("orders").document(order_id).update({"reviewPromptSent": True})
        except Exception as exc:
            logger.warning("Could not mark order %s review prompt sent: %s", order_id, exc)


async def job_stock_alerts(context: ContextTypes.DEFAULT_TYPE) -> None:
    """Notify artisans about products with low stock (stock <= 3)."""
    db = _db()
    try:
        docs = (
            db.collection("products")
            .where(filter=FieldFilter("active", "==", True))
            .limit(200)
            .stream()
        )
        products: List[Dict[str, Any]] = []
        for doc in docs:
            p = doc.to_dict() or {}
            p["_id"] = doc.id
            # Both conditions checked in Python — avoids composite index
            if p.get("stock", 999) <= 3 and not p.get("lowStockAlerted"):
                products.append(p)
    except Exception as exc:
        logger.error("stock_alerts query failed: %s", exc)
        return

    for product in products:
        artisan_id: str = product.get("artisanId") or ""
        product_id: str = product.get("_id") or ""
        stock = product.get("stock", 0)
        tg_id = _get_telegram_id(artisan_id)
        if tg_id:
            await send_telegram_message(
                tg_id,
                f"Stock alert: *{product.get('title', 'Your product')}* "
                f"only has {stock} unit{'s' if stock != 1 else ''} left. "
                "Consider restocking soon!",
            )
        try:
            db.collection("products").document(product_id).update({"lowStockAlerted": True})
        except Exception as exc:
            logger.warning("Could not mark product %s stock alerted: %s", product_id, exc)


async def job_live_stream_notifications(context: ContextTypes.DEFAULT_TYPE) -> None:
    """Notify buyers when an artisan they've bought from goes live."""
    db = _db()
    try:
        docs = (
            db.collection("live_sessions")
            .where(filter=FieldFilter("status", "==", "live"))
            .limit(20)
            .stream()
        )
        sessions: List[Dict[str, Any]] = []
        for doc in docs:
            s = doc.to_dict() or {}
            s["_id"] = doc.id
            if not s.get("startNotified"):  # filter in Python
                sessions.append(s)
    except Exception as exc:
        logger.error("live_stream_notifications query failed: %s", exc)
        return

    for session in sessions:
        artisan_id: str = session.get("userId") or ""
        session_id: str = session.get("_id") or ""
        title: str = session.get("title") or "Live Stream"

        try:
            order_docs = (
                db.collection("orders")
                .where(filter=FieldFilter("paymentStatus", "==", "paid"))
                .limit(200)
                .stream()
            )
            notified_uids: set = set()
            for order_doc in order_docs:
                o = order_doc.to_dict() or {}
                buyer_uid: str = o.get("userId") or ""
                if buyer_uid in notified_uids:
                    continue
                items: list = o.get("items") or []
                if any(item.get("artisanId") == artisan_id for item in items):
                    tg_id = _get_telegram_id(buyer_uid)
                    if tg_id:
                        await send_telegram_message(
                            tg_id,
                            f"Your favourite artisan is live! \U0001f534\n\n"
                            f"*{title}* — join now from the bot's Live Streams menu.",
                        )
                    notified_uids.add(buyer_uid)
        except Exception as exc:
            logger.warning(
                "Could not notify buyers for live session %s: %s", session_id, exc
            )

        try:
            db.collection("live_sessions").document(session_id).update({"startNotified": True})
        except Exception as exc:
            logger.warning("Could not mark live session %s notified: %s", session_id, exc)


async def job_reel_cleanup(context: ContextTypes.DEFAULT_TYPE) -> None:
    """Fail stale reel jobs (older than 15 min, not terminal) and notify sellers."""
    from app.services.storytelling import job_service  # local import avoids circular deps

    try:
        failed_seller_ids = await asyncio.get_event_loop().run_in_executor(
            None, job_service.fail_stale_jobs
        )
    except Exception as exc:
        logger.error("reel_cleanup: fail_stale_jobs raised: %s", exc)
        return

    for seller_id in failed_seller_ids:
        telegram_id = _get_telegram_id(seller_id)
        if telegram_id:
            await send_telegram_message(
                telegram_id,
                "Your reel generation timed out after 15 minutes. "
                "Please try again from your dashboard.",
            )


# ──────────────────────────────────────────────
# Job registration helper
# ──────────────────────────────────────────────

def register_notification_jobs(job_queue) -> None:
    """Register all periodic notification jobs with PTB's JobQueue."""
    job_queue.run_repeating(job_order_status_notifications, interval=300, first=30)
    job_queue.run_repeating(job_review_prompts, interval=21600, first=60)
    job_queue.run_repeating(job_stock_alerts, interval=3600, first=90)
    job_queue.run_repeating(job_live_stream_notifications, interval=120, first=10)
    job_queue.run_repeating(job_reel_cleanup, interval=600, first=120)  # every 10 min
