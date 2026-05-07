"""Cart handlers for the KalaSetu Telegram Bot (Phase 4)."""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from firebase_admin import firestore as fa_firestore
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.constants import ParseMode
from telegram.ext import ContextTypes

from app.bot.auth.middleware import AUTH_SESSION_CACHE_KEY, require_auth

logger = logging.getLogger(__name__)

CART_COLLECTION = "carts"


# ──────────────────────────────────────────────
# Firestore cart helpers
# ──────────────────────────────────────────────

def _db():
    return fa_firestore.client()


def _get_cart(uid: str) -> Dict[str, Any]:
    """Return the cart document for uid, or an empty cart dict."""
    doc = _db().collection(CART_COLLECTION).document(uid).get()
    if doc.exists:
        return doc.to_dict() or {}
    return {"items": [], "uid": uid}


def _save_cart(uid: str, cart: Dict[str, Any]) -> None:
    _db().collection(CART_COLLECTION).document(uid).set(cart)


def _add_to_cart(uid: str, product: Dict[str, Any]) -> int:
    """Add one unit of product to cart. Returns new item count."""
    cart = _get_cart(uid)
    items: List[Dict[str, Any]] = cart.get("items") or []
    product_id = product.get("id") or product.get("productId") or ""
    for item in items:
        if item.get("productId") == product_id:
            item["quantity"] = item.get("quantity", 1) + 1
            _save_cart(uid, {**cart, "items": items})
            return len(items)
    items.append(
        {
            "productId": product_id,
            "title": product.get("title") or "Untitled",
            "price": product.get("price"),
            "craftType": product.get("craftType") or "",
            "artisanId": product.get("artisanId") or "",
            "quantity": 1,
        }
    )
    _save_cart(uid, {**cart, "items": items})
    return len(items)


def _remove_from_cart(uid: str, product_id: str) -> None:
    cart = _get_cart(uid)
    items: List[Dict[str, Any]] = [
        i for i in (cart.get("items") or []) if i.get("productId") != product_id
    ]
    _save_cart(uid, {**cart, "items": items})


def _clear_cart(uid: str) -> None:
    _save_cart(uid, {"uid": uid, "items": []})


# ──────────────────────────────────────────────
# Keyboard builders
# ──────────────────────────────────────────────

def _cart_keyboard(items: List[Dict[str, Any]], has_items: bool) -> InlineKeyboardMarkup:
    rows: List[List[InlineKeyboardButton]] = []
    for item in items:
        pid = item.get("productId") or ""
        title = (item.get("title") or "Item")[:25]
        qty = item.get("quantity", 1)
        rows.append(
            [
                InlineKeyboardButton(
                    f"{title} ×{qty}", callback_data=f"cart_detail:{pid}"
                ),
                InlineKeyboardButton("🗑 Remove", callback_data=f"cart_remove:{pid}"),
            ]
        )
    if has_items:
        rows.append(
            [InlineKeyboardButton("✅ Checkout", callback_data="checkout:start")]
        )
        rows.append(
            [InlineKeyboardButton("🗑 Clear Cart", callback_data="cart_clear")]
        )
    return InlineKeyboardMarkup(rows)


# ──────────────────────────────────────────────
# Public handlers
# ──────────────────────────────────────────────

@require_auth
async def show_cart(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Display the current cart contents."""
    session: Dict[str, Any] = context.user_data.get(AUTH_SESSION_CACHE_KEY) or {}
    uid: str = session.get("uid") or ""

    cart = _get_cart(uid)
    items: List[Dict[str, Any]] = cart.get("items") or []

    if not items:
        await update.effective_message.reply_text(
            "🛒 Your cart is empty. Browse crafts to add items!",
        )
        return

    total = sum(
        (item.get("price") or 0) * item.get("quantity", 1) for item in items
    )
    lines = ["🛒 *Your Cart*\n"]
    for item in items:
        qty = item.get("quantity", 1)
        price = item.get("price")
        price_str = f"₹{price}" if price is not None else "—"
        lines.append(f"• {item.get('title', 'Item')} ×{qty} — {price_str}")
    lines.append(f"\n*Total: ₹{total:.2f}*")

    await update.effective_message.reply_text(
        "\n".join(lines),
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=_cart_keyboard(items, has_items=True),
    )


async def handle_cart_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Route cart-related inline keyboard callbacks."""
    query = update.callback_query
    data: str = query.data or ""

    session: Dict[str, Any] = context.user_data.get(AUTH_SESSION_CACHE_KEY) or {}
    uid: str = session.get("uid") or ""

    if not uid:
        await query.answer("Please log in first.", show_alert=True)
        return

    # ── cart_add:{product_id} ─────────────────────────────────────────────
    if data.startswith("cart_add:"):
        product_id = data[len("cart_add:"):]
        db = _db()
        try:
            doc = db.collection("products").document(product_id).get()
        except Exception as exc:
            logger.error("Failed to fetch product %s: %s", product_id, exc)
            await query.answer("Could not add item. Please try again.", show_alert=True)
            return

        if not doc.exists:
            await query.answer("Product not found.", show_alert=True)
            return

        product = doc.to_dict() or {}
        product["id"] = doc.id
        count = _add_to_cart(uid, product)
        title = product.get("title") or "Item"

        await query.answer(f"Added to cart!")
        await query.message.reply_text(
            f"✅ *{title}* added to cart!\n\nYou have {count} item{'s' if count != 1 else ''} in your cart. Ready to checkout?",
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("💳 Checkout Now", callback_data="checkout:start")],
                [InlineKeyboardButton("🛒 View Cart", callback_data="show_cart")],
            ]),
        )
        return

    # ── cart_remove:{product_id} ─────────────────────────────────────────
    if data.startswith("cart_remove:"):
        product_id = data[len("cart_remove:"):]
        _remove_from_cart(uid, product_id)
        await query.answer("Item removed.")

        # Refresh cart display
        cart = _get_cart(uid)
        items: List[Dict[str, Any]] = cart.get("items") or []
        if not items:
            await query.edit_message_text("🛒 Your cart is now empty.")
            return

        total = sum(
            (item.get("price") or 0) * item.get("quantity", 1) for item in items
        )
        lines = ["🛒 *Your Cart*\n"]
        for item in items:
            qty = item.get("quantity", 1)
            price = item.get("price")
            price_str = f"₹{price}" if price is not None else "—"
            lines.append(f"• {item.get('title', 'Item')} ×{qty} — {price_str}")
        lines.append(f"\n*Total: ₹{total:.2f}*")

        await query.edit_message_text(
            "\n".join(lines),
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=_cart_keyboard(items, has_items=True),
        )
        return

    # ── cart_clear ────────────────────────────────────────────────────────
    if data == "cart_clear":
        await query.answer("Cart cleared.")
        _clear_cart(uid)
        await query.edit_message_text("🛒 Cart cleared.")
        return

    # ── show_cart ─────────────────────────────────────────────────────────
    if data == "show_cart":
        await query.answer()
        cart = _get_cart(uid)
        items: List[Dict[str, Any]] = cart.get("items") or []
        if not items:
            await query.message.reply_text("🛒 Your cart is empty.")
            return
        total = sum((i.get("price") or 0) * i.get("quantity", 1) for i in items)
        lines = ["🛒 *Your Cart*\n"]
        for item in items:
            qty = item.get("quantity", 1)
            price_str = f"₹{item.get('price')}" if item.get("price") is not None else "—"
            lines.append(f"• {item.get('title', 'Item')} ×{qty} — {price_str}")
        lines.append(f"\n*Total: ₹{total:.2f}*")
        await query.message.reply_text(
            "\n".join(lines),
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=_cart_keyboard(items, has_items=True),
        )
        return

    # ── cart_detail:{product_id} ─────────────────────────────────────────
    if data.startswith("cart_detail:"):
        product_id = data[len("cart_detail:"):]
        db = _db()
        try:
            doc = db.collection("products").document(product_id).get()
        except Exception as exc:
            logger.error("Failed to fetch product %s: %s", product_id, exc)
            await query.answer("Could not load product details.", show_alert=True)
            return

        if not doc.exists:
            await query.answer("Product not found.", show_alert=True)
            return

        await query.answer()
        p = doc.to_dict() or {}
        cart = _get_cart(uid)
        cart_item = next(
            (i for i in (cart.get("items") or []) if i.get("productId") == product_id),
            None,
        )
        qty = cart_item.get("quantity", 1) if cart_item else 1
        price = p.get("price")
        subtotal = (price or 0) * qty

        text = (
            f"*{p.get('title', 'Product')}*\n"
            f"Quantity: {qty}\n"
            f"Unit price: ₹{price}\n"
            f"Subtotal: ₹{subtotal}"
        )
        await query.message.reply_text(text, parse_mode=ParseMode.MARKDOWN)
        return

    await query.answer()
