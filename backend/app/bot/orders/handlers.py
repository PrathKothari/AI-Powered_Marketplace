"""Order & checkout handlers for the KalaSetu Telegram Bot (Phase 4)."""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from firebase_admin import firestore as fa_firestore
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.constants import ParseMode
from telegram.ext import (
    CallbackQueryHandler,
    CommandHandler,
    ContextTypes,
    ConversationHandler,
    MessageHandler,
    filters,
)

from app.bot.auth.middleware import AUTH_SESSION_CACHE_KEY, mark_update_consumed, require_auth
from app.bot.cart.handlers import _get_cart, _clear_cart

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────
# ConversationHandler states
# ──────────────────────────────────────────────

ADDR_NAME = 10
ADDR_LINE = 11
ADDR_PINCODE = 12
CONFIRM_ORDER = 13

_ORDER_DATA_KEY = "_order_checkout"


def _db():
    return fa_firestore.client()


# ──────────────────────────────────────────────
# Keyboard helpers
# ──────────────────────────────────────────────

def _confirm_order_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        [
            [
                InlineKeyboardButton("✅ Place Order", callback_data="order_confirm:yes"),
                InlineKeyboardButton("❌ Cancel", callback_data="order_confirm:no"),
            ]
        ]
    )


def _order_detail_keyboard(order_id: str, is_artisan: bool = False) -> InlineKeyboardMarkup:
    rows: List[List[InlineKeyboardButton]] = [
        [InlineKeyboardButton("🔙 Back", callback_data="order_list:0")]
    ]
    if is_artisan:
        rows.insert(
            0,
            [InlineKeyboardButton("🚚 Mark Shipped", callback_data=f"order_ship:{order_id}")],
        )
    return InlineKeyboardMarkup(rows)


def _orders_list_keyboard(
    orders: List[Dict[str, Any]], page: int, total: int, page_size: int = 5
) -> InlineKeyboardMarkup:
    rows: List[List[InlineKeyboardButton]] = []
    for order in orders:
        oid = order.get("id") or ""
        status = order.get("status") or "pending"
        label = f"Order #{oid[:8]} — {status}"
        rows.append([InlineKeyboardButton(label, callback_data=f"order_detail:{oid}")])

    nav: List[InlineKeyboardButton] = []
    total_pages = max(1, (total + page_size - 1) // page_size)
    if page > 0:
        nav.append(InlineKeyboardButton("⬅️ Prev", callback_data=f"order_list:{page - 1}"))
    if page < total_pages - 1:
        nav.append(InlineKeyboardButton("Next ➡️", callback_data=f"order_list:{page + 1}"))
    if nav:
        rows.append(nav)
    return InlineKeyboardMarkup(rows)


# ──────────────────────────────────────────────
# Checkout conversation
# ──────────────────────────────────────────────

def _clear_checkout_data(context: ContextTypes.DEFAULT_TYPE) -> None:
    context.user_data.pop(_ORDER_DATA_KEY, None)


async def start_checkout(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Entry point triggered by checkout:start callback."""
    query = update.callback_query
    if query:
        await query.answer()

    session: Dict[str, Any] = context.user_data.get(AUTH_SESSION_CACHE_KEY) or {}
    uid: str = session.get("uid") or ""

    cart = _get_cart(uid)
    items: List[Dict[str, Any]] = cart.get("items") or []
    if not items:
        msg = update.effective_message
        await msg.reply_text("Your cart is empty. Add items before checking out.")
        return ConversationHandler.END

    context.user_data[_ORDER_DATA_KEY] = {"uid": uid, "items": items}

    await update.effective_message.reply_text(
        "📦 *Checkout*\n\nEnter the recipient name for delivery:",
        parse_mode=ParseMode.MARKDOWN,
    )
    return ADDR_NAME


async def collect_addr_name(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    mark_update_consumed(update, context)
    name = (update.message.text or "").strip()
    if not name:
        await update.message.reply_text("Please enter a valid name.")
        return ADDR_NAME
    context.user_data[_ORDER_DATA_KEY]["addrName"] = name
    await update.message.reply_text("📍 Enter the delivery address (street, city):")
    return ADDR_LINE


async def collect_addr_line(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    mark_update_consumed(update, context)
    line = (update.message.text or "").strip()
    if not line:
        await update.message.reply_text("Please enter a valid address.")
        return ADDR_LINE
    context.user_data[_ORDER_DATA_KEY]["addrLine"] = line
    await update.message.reply_text("📮 Enter the PIN code:")
    return ADDR_PINCODE


async def collect_addr_pincode(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    mark_update_consumed(update, context)
    pincode = (update.message.text or "").strip()
    if not pincode.isdigit() or len(pincode) != 6:
        await update.message.reply_text("Please enter a valid 6-digit PIN code.")
        return ADDR_PINCODE

    data: Dict[str, Any] = context.user_data[_ORDER_DATA_KEY]
    data["pincode"] = pincode
    items: List[Dict[str, Any]] = data.get("items") or []

    total = sum((i.get("price") or 0) * i.get("quantity", 1) for i in items)
    lines = [
        "📋 *Order Summary*\n",
        f"📦 Deliver to: {data.get('addrName')}",
        f"📍 {data.get('addrLine')}, {pincode}\n",
    ]
    for item in items:
        qty = item.get("quantity", 1)
        price = item.get("price")
        lines.append(f"• {item.get('title', 'Item')} ×{qty} — ₹{price}")
    lines.append(f"\n*Total: ₹{total:.2f}*")

    await update.message.reply_text(
        "\n".join(lines),
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=_confirm_order_keyboard(),
    )
    return CONFIRM_ORDER


async def handle_order_confirm_callback(
    update: Update, context: ContextTypes.DEFAULT_TYPE
) -> int:
    mark_update_consumed(update, context)
    query = update.callback_query
    await query.answer()
    choice = (query.data or "").split(":", 1)[1]

    if choice == "no":
        _clear_checkout_data(context)
        await query.edit_message_text("Order cancelled. Your cart is still saved.")
        return ConversationHandler.END

    data: Dict[str, Any] = context.user_data.get(_ORDER_DATA_KEY) or {}
    uid: str = data.get("uid") or ""
    items: List[Dict[str, Any]] = data.get("items") or []
    total = sum((i.get("price") or 0) * i.get("quantity", 1) for i in items)

    order = {
        "userId": uid,
        "items": items,
        "total": total,
        "status": "pending_payment",
        "paymentStatus": "pending",
        "deliveryAddress": {
            "name": data.get("addrName"),
            "line": data.get("addrLine"),
            "pincode": data.get("pincode"),
        },
        "createdAt": fa_firestore.SERVER_TIMESTAMP,
    }

    try:
        _, doc_ref = _db().collection("orders").add(order)
        order_id = doc_ref.id
    except Exception as exc:
        logger.error("Failed to create order for uid %s: %s", uid, exc)
        await query.edit_message_text("Failed to place order. Please try again.")
        return ConversationHandler.END

    _clear_cart(uid)
    _clear_checkout_data(context)

    await query.edit_message_text(
        f"✅ *Order placed!*\n\nOrder ID: `{order_id}`\n\n"
        f"Total: ₹{total:.2f}\n\n"
        "Tap *Pay Now* below to complete payment, or pay later from My Orders.",
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=InlineKeyboardMarkup(
            [[InlineKeyboardButton("💳 Pay Now", callback_data=f"pay:{order_id}")]]
        ),
    )
    return ConversationHandler.END


async def cancel_checkout(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    _clear_checkout_data(context)
    await update.effective_message.reply_text("Checkout cancelled.")
    return ConversationHandler.END


def build_checkout_conversation_handler() -> ConversationHandler:
    return ConversationHandler(
        entry_points=[CallbackQueryHandler(start_checkout, pattern=r"^checkout:start$")],
        states={
            ADDR_NAME: [MessageHandler(filters.TEXT & ~filters.COMMAND, collect_addr_name)],
            ADDR_LINE: [MessageHandler(filters.TEXT & ~filters.COMMAND, collect_addr_line)],
            ADDR_PINCODE: [MessageHandler(filters.TEXT & ~filters.COMMAND, collect_addr_pincode)],
            CONFIRM_ORDER: [
                CallbackQueryHandler(handle_order_confirm_callback, pattern=r"^order_confirm:(yes|no)$")
            ],
        },
        fallbacks=[CommandHandler("cancel", cancel_checkout)],
        allow_reentry=True,
        per_message=False,
    )


# ──────────────────────────────────────────────
# Order history & detail
# ──────────────────────────────────────────────

@require_auth
async def show_order_history(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    session: Dict[str, Any] = context.user_data.get(AUTH_SESSION_CACHE_KEY) or {}
    uid: str = session.get("uid") or ""

    await _send_orders_page(update, uid, page=0)


async def _send_orders_page(
    update: Update, uid: str, page: int, edit: bool = False
) -> None:
    PAGE_SIZE = 5
    db = _db()
    try:
        docs = (
            db.collection("orders")
            .where("userId", "==", uid)
            .order_by("createdAt", direction=fa_firestore.Query.DESCENDING)
            .limit(50)
            .stream()
        )
        all_orders: List[Dict[str, Any]] = []
        for doc in docs:
            o = doc.to_dict() or {}
            o["id"] = doc.id
            all_orders.append(o)
    except Exception as exc:
        logger.error("Failed to fetch orders for uid %s: %s", uid, exc)
        all_orders = []

    if not all_orders:
        msg = "📦 You haven't placed any orders yet."
        if edit and update.callback_query:
            await update.callback_query.edit_message_text(msg)
        else:
            await update.effective_message.reply_text(msg)
        return

    total = len(all_orders)
    start = page * PAGE_SIZE
    page_orders = all_orders[start : start + PAGE_SIZE]

    text = f"📦 *My Orders* (showing {start + 1}–{min(start + PAGE_SIZE, total)} of {total})"
    keyboard = _orders_list_keyboard(page_orders, page, total, PAGE_SIZE)

    if edit and update.callback_query:
        await update.callback_query.edit_message_text(
            text, parse_mode=ParseMode.MARKDOWN, reply_markup=keyboard
        )
    else:
        await update.effective_message.reply_text(
            text, parse_mode=ParseMode.MARKDOWN, reply_markup=keyboard
        )


async def handle_order_callbacks(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    data: str = query.data or ""

    session: Dict[str, Any] = context.user_data.get(AUTH_SESSION_CACHE_KEY) or {}
    uid: str = session.get("uid") or ""

    # ── order_list:{page} ─────────────────────────────────────────────────
    if data.startswith("order_list:"):
        page = int(data.split(":", 1)[1])
        await _send_orders_page(update, uid, page, edit=True)
        return

    # ── order_detail:{order_id} ──────────────────────────────────────────
    if data.startswith("order_detail:"):
        order_id = data[len("order_detail:"):]
        db = _db()
        try:
            doc = db.collection("orders").document(order_id).get()
        except Exception as exc:
            logger.error("Failed to fetch order %s: %s", order_id, exc)
            await query.edit_message_text("Could not load order details.")
            return

        if not doc.exists:
            await query.edit_message_text("Order not found.")
            return

        o: Dict[str, Any] = doc.to_dict() or {}
        items = o.get("items") or []
        addr = o.get("deliveryAddress") or {}
        lines = [
            f"📦 *Order #{order_id[:8]}*",
            f"Status: {o.get('status', 'pending')}",
            f"Payment: {o.get('paymentStatus', 'pending')}",
            f"\n📍 {addr.get('name', '')} — {addr.get('line', '')}, {addr.get('pincode', '')}\n",
        ]
        for item in items:
            qty = item.get("quantity", 1)
            lines.append(f"• {item.get('title', 'Item')} ×{qty} — ₹{item.get('price', '—')}")
        lines.append(f"\n*Total: ₹{o.get('total', 0):.2f}*")

        # Check if user is the artisan for any item
        session_artisan_uid: str = session.get("uid") or ""
        is_artisan = any(
            item.get("artisanId") == session_artisan_uid for item in items
        )

        pay_status = o.get("paymentStatus") or "pending"
        keyboard = _order_detail_keyboard(order_id, is_artisan=is_artisan)
        if pay_status == "pending":
            kb_rows = list(keyboard.inline_keyboard)
            kb_rows.insert(
                0,
                [InlineKeyboardButton("💳 Pay Now", callback_data=f"pay:{order_id}")],
            )
            keyboard = InlineKeyboardMarkup(kb_rows)

        await query.edit_message_text(
            "\n".join(lines),
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=keyboard,
        )
        return

    # ── order_ship:{order_id} ────────────────────────────────────────────
    if data.startswith("order_ship:"):
        order_id = data[len("order_ship:"):]
        db = _db()
        try:
            db.collection("orders").document(order_id).update({"status": "shipped"})
            await query.edit_message_text(
                f"✅ Order #{order_id[:8]} marked as shipped.",
            )
        except Exception as exc:
            logger.error("Failed to update order %s: %s", order_id, exc)
            await query.answer("Could not update order status.", show_alert=True)
        return


# ──────────────────────────────────────────────
# Dashboard
# ──────────────────────────────────────────────

@require_auth
async def show_dashboard(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show artisan sales dashboard."""
    session: Dict[str, Any] = context.user_data.get(AUTH_SESSION_CACHE_KEY) or {}
    uid: str = session.get("uid") or ""

    db = _db()

    # Fetch products by this artisan
    try:
        product_docs = (
            db.collection("products")
            .where("artisanId", "==", uid)
            .limit(100)
            .stream()
        )
        products = []
        for doc in product_docs:
            p = doc.to_dict() or {}
            p["id"] = doc.id
            products.append(p)
    except Exception as exc:
        logger.error("Dashboard products query failed for uid %s: %s", uid, exc)
        products = []

    # Fetch recent orders containing this artisan's products
    product_ids = {p["id"] for p in products}
    total_revenue = 0.0
    recent_orders = 0
    try:
        order_docs = (
            db.collection("orders")
            .where("paymentStatus", "==", "paid")
            .order_by("createdAt", direction=fa_firestore.Query.DESCENDING)
            .limit(100)
            .stream()
        )
        for order_doc in order_docs:
            o = order_doc.to_dict() or {}
            for item in (o.get("items") or []):
                if item.get("productId") in product_ids:
                    total_revenue += (item.get("price") or 0) * item.get("quantity", 1)
                    recent_orders += 1
    except Exception as exc:
        logger.error("Dashboard orders query failed for uid %s: %s", uid, exc)

    active_count = sum(1 for p in products if p.get("active"))
    total_count = len(products)
    avg_rating = (
        sum(p.get("rating") or 0 for p in products) / total_count if total_count else 0
    )

    text = (
        "📊 *Your Dashboard*\n\n"
        f"🏷 Listings: {active_count} active / {total_count} total\n"
        f"⭐ Avg Rating: {avg_rating:.1f}\n"
        f"📦 Items sold (paid): {recent_orders}\n"
        f"💰 Total Revenue: ₹{total_revenue:.2f}"
    )
    await update.effective_message.reply_text(text, parse_mode=ParseMode.MARKDOWN)
