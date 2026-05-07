"""Product listing ConversationHandler for KalaSetu Telegram Bot (Phase 3)."""

from __future__ import annotations

import logging
import time
from typing import Any, Dict, List

from firebase_admin import firestore as fa_firestore, storage as fa_storage
from telegram import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    ReplyKeyboardRemove,
    Update,
)
from telegram.constants import ParseMode
from telegram.ext import (
    CallbackQueryHandler,
    CommandHandler,
    ContextTypes,
    ConversationHandler,
    MessageHandler,
    filters,
)

from app.bot.auth.middleware import AUTH_SESSION_CACHE_KEY, get_telegram_user_id, mark_update_consumed, require_auth
from app.bot.sell.reel import STYLE_LABELS, generate_reel_for_product

logger = logging.getLogger(__name__)

# ── Conversation states ────────────────────────────────────────────────────────
TITLE, PRICE, DESCRIPTION, CRAFT_TYPE, REGION, PHOTOS, CONFIRM = range(7)

# ── context.user_data keys ─────────────────────────────────────────────────────
_K_TITLE  = "_sell_title"
_K_PRICE  = "_sell_price"
_K_DESC   = "_sell_description"
_K_CRAFT  = "_sell_craft"
_K_REGION = "_sell_region"
_K_PHOTOS = "_sell_photos"

_SELL_KEYS = [_K_TITLE, _K_PRICE, _K_DESC, _K_CRAFT, _K_REGION, _K_PHOTOS]

CRAFT_TYPES = [
    "Madhubani", "Warli", "Pattachitra", "Kalighat", "Tanjore",
    "Gond", "Kalamkari", "Miniature", "Pichwai", "Other",
]

INDIAN_REGIONS = [
    "Rajasthan", "Gujarat", "Maharashtra", "Bihar",
    "Uttar Pradesh", "West Bengal", "Odisha", "Tamil Nadu",
    "Karnataka", "Andhra Pradesh", "Kerala", "Madhya Pradesh",
    "Jharkhand", "Himachal Pradesh", "Other",
]


def _db():
    return fa_firestore.client()


def _clear_sell_data(context: ContextTypes.DEFAULT_TYPE) -> None:
    for k in _SELL_KEYS:
        context.user_data.pop(k, None)


def _craft_keyboard() -> InlineKeyboardMarkup:
    rows = []
    for i in range(0, len(CRAFT_TYPES), 2):
        pair = CRAFT_TYPES[i:i + 2]
        rows.append([
            InlineKeyboardButton(c, callback_data=f"craft_type:{c}")
            for c in pair
        ])
    return InlineKeyboardMarkup(rows)


def _reel_prompt_keyboard(product_id: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("🎬 Generate Reel", callback_data=f"sell_reel:{product_id}")],
        [InlineKeyboardButton("Skip for now", callback_data=f"sell_skip_reel:{product_id}")],
    ])


def _style_keyboard(product_id: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [InlineKeyboardButton(label, callback_data=f"sell_style:{style}:{product_id}")]
        for style, label in STYLE_LABELS.items()
    ])


def _region_keyboard() -> InlineKeyboardMarkup:
    rows = []
    for i in range(0, len(INDIAN_REGIONS), 2):
        pair = INDIAN_REGIONS[i:i + 2]
        rows.append([
            InlineKeyboardButton(r, callback_data=f"sell_region:{r}")
            for r in pair
        ])
    return InlineKeyboardMarkup(rows)


def _confirm_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("✅ Create Listing", callback_data="sell_confirm"),
            InlineKeyboardButton("❌ Cancel", callback_data="sell_cancel"),
        ]
    ])


async def _upload_photo_to_storage(photo_bytes: bytes, uid: str) -> str:
    """Upload photo bytes to Firebase Storage and return a download URL."""
    try:
        from urllib.parse import quote
        bucket = fa_storage.bucket()
        path = f"products/{uid}/{int(time.time() * 1000)}.jpg"
        blob = bucket.blob(path)
        blob.upload_from_string(photo_bytes, content_type="image/jpeg")
        # Uniform bucket-level access — use REST download URL instead of make_public()
        encoded = quote(path, safe="")
        return f"https://firebasestorage.googleapis.com/v0/b/{bucket.name}/o/{encoded}?alt=media"
    except Exception as exc:
        logger.error("Firebase Storage upload failed: %s", exc)
        return ""


# ── Entry point ────────────────────────────────────────────────────────────────

@require_auth
async def start_sell_flow(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    mark_update_consumed(update, context)
    _clear_sell_data(context)
    await update.effective_message.reply_text(
        "🎨 *List Your Product*\n\nLet's get your craft on KalaSetu!\n\nWhat's the *title* of your product?",
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=ReplyKeyboardRemove(),
    )
    return TITLE


# ── State handlers ─────────────────────────────────────────────────────────────

async def handle_title(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    mark_update_consumed(update, context)
    title = (update.message.text or "").strip()
    if not title:
        await update.message.reply_text("Please enter a title.")
        return TITLE
    context.user_data[_K_TITLE] = title
    await update.message.reply_text(
        f"Got it: *{title}*\n\nWhat's the *price* in ₹?",
        parse_mode=ParseMode.MARKDOWN,
    )
    return PRICE


async def handle_price(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    mark_update_consumed(update, context)
    raw = (update.message.text or "").strip().replace("₹", "").replace(",", "")
    try:
        price = float(raw)
        if price <= 0:
            raise ValueError
    except ValueError:
        await update.message.reply_text("Please enter a valid price (e.g. 1500).")
        return PRICE
    context.user_data[_K_PRICE] = price
    await update.message.reply_text(
        f"Price set: ₹{price:.0f}\n\nWrite a *description* for your product:",
        parse_mode=ParseMode.MARKDOWN,
    )
    return DESCRIPTION


async def handle_description(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    mark_update_consumed(update, context)
    desc = (update.message.text or "").strip()
    if not desc:
        await update.message.reply_text("Please enter a description.")
        return DESCRIPTION
    context.user_data[_K_DESC] = desc
    await update.message.reply_text(
        "🏺 What *craft type* is this?",
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=_craft_keyboard(),
    )
    return CRAFT_TYPE


async def handle_craft_type_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    mark_update_consumed(update, context)
    query = update.callback_query
    await query.answer()
    craft = (query.data or "").split(":", 1)[1]
    context.user_data[_K_CRAFT] = craft
    await query.edit_message_text(f"Craft type: *{craft}*", parse_mode=ParseMode.MARKDOWN)
    await query.message.reply_text(
        "📍 Which *state / region* is this craft from?",
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=_region_keyboard(),
    )
    return REGION


async def handle_region_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    mark_update_consumed(update, context)
    query = update.callback_query
    await query.answer()
    region = (query.data or "sell_region:Other").split(":", 1)[1]
    context.user_data[_K_REGION] = region
    context.user_data[_K_PHOTOS] = []
    await query.edit_message_text(f"Region: *{region}*", parse_mode=ParseMode.MARKDOWN)
    await query.message.reply_text(
        "📸 Send your product photos (up to 5).\nSend /done when you're finished.",
    )
    return PHOTOS


async def handle_photos(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    mark_update_consumed(update, context)
    session = context.user_data.get(AUTH_SESSION_CACHE_KEY, {})
    uid = session.get("uid", "unknown")
    photos: List[str] = context.user_data.get(_K_PHOTOS, [])

    if len(photos) >= 5:
        await update.message.reply_text("You've already sent 5 photos. Send /done to continue.")
        return PHOTOS

    photo = update.message.photo[-1]  # highest resolution
    tg_file = await context.bot.get_file(photo.file_id)

    # Use Telegram CDN URL directly (avoids Firebase Storage IAM/ACL requirements).
    # file_path in PTB v21 is the full HTTPS URL on api.telegram.org.
    url = tg_file.file_path

    photos.append(url)
    context.user_data[_K_PHOTOS] = photos
    await update.message.reply_text(
        f"Photo {len(photos)} received. Send more or send /done."
    )
    return PHOTOS


async def handle_done_photos(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    mark_update_consumed(update, context)
    photos: List[str] = context.user_data.get(_K_PHOTOS, [])
    if not photos:
        await update.message.reply_text("Please send at least one photo before continuing.")
        return PHOTOS

    title  = context.user_data.get(_K_TITLE, "")
    price  = context.user_data.get(_K_PRICE, 0)
    craft  = context.user_data.get(_K_CRAFT, "")
    region = context.user_data.get(_K_REGION, "")

    summary = (
        f"*Review your listing:*\n\n"
        f"📦 Title: {title}\n"
        f"💰 Price: ₹{price:.0f}\n"
        f"🏺 Craft: {craft}\n"
        f"📍 Region: {region}\n"
        f"🖼 Photos: {len(photos)}"
    )
    await update.message.reply_text(
        summary,
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=_confirm_keyboard(),
    )
    return CONFIRM


async def handle_confirm_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    mark_update_consumed(update, context)
    query = update.callback_query
    await query.answer()

    if (query.data or "") == "sell_cancel":
        _clear_sell_data(context)
        await query.edit_message_text("Listing cancelled.")
        return ConversationHandler.END

    # Create product in Firestore
    session = context.user_data.get(AUTH_SESSION_CACHE_KEY, {})
    uid   = session.get("uid", "")
    name  = session.get("name", "Artisan")

    product: Dict[str, Any] = {
        "title":       context.user_data.get(_K_TITLE, ""),
        "price":       float(context.user_data.get(_K_PRICE, 0)),
        "description": context.user_data.get(_K_DESC, ""),
        "craftType":   context.user_data.get(_K_CRAFT, ""),
        "region":      context.user_data.get(_K_REGION, ""),
        "images":      context.user_data.get(_K_PHOTOS, []),
        "artisanId":   uid,
        "artisanName": name,
        "active":      True,
        "stock":       10,
        "rating":      0.0,
        "reviewCount": 0,
        "currency":    "INR",
        "storyVideo":  None,
        "createdAt":   fa_firestore.SERVER_TIMESTAMP,
    }

    try:
        _, ref = _db().collection("products").add(product)
        product_id = ref.id
    except Exception as exc:
        logger.error("Failed to create product: %s", exc)
        await query.edit_message_text("Something went wrong. Please try again.")
        return ConversationHandler.END

    _clear_sell_data(context)

    await query.edit_message_text(
        f"✅ *Listing created!*\n\n_{product.get('title')}_\n\nNow let's make it stand out — generate a short reel?",
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=_reel_prompt_keyboard(product_id),
    )
    return ConversationHandler.END


# ── Reel callbacks (registered globally, not inside the ConversationHandler) ──

async def handle_reel_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    product_id = (query.data or "").split(":", 1)[1]
    await query.edit_message_text(
        "Choose a style for your reel:",
        reply_markup=_style_keyboard(product_id),
    )


async def handle_style_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    parts = (query.data or "").split(":")
    style = parts[1] if len(parts) > 1 else "museum_cinematic"
    product_id = parts[2] if len(parts) > 2 else ""

    doc = _db().collection("products").document(product_id).get()
    if not doc.exists:
        await query.edit_message_text("Product not found.")
        return

    product = {"id": product_id, **(doc.to_dict() or {})}
    await query.edit_message_text("⏳ Generating your reel…")

    video_url = await generate_reel_for_product(
        product=product,
        style=style,
        bot=context.bot,
        chat_id=update.effective_chat.id,
    )

    if video_url:
        try:
            _db().collection("products").document(product_id).update({"storyVideo": video_url})
        except Exception as exc:
            logger.warning("Failed to save storyVideo for %s: %s", product_id, exc)


async def handle_skip_reel_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    await query.edit_message_text("No worries! You can generate a reel any time from your listings. 🙂")


# ── My listings ────────────────────────────────────────────────────────────────

@require_auth
async def show_my_listings(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    session = context.user_data.get(AUTH_SESSION_CACHE_KEY, {})
    uid = session.get("uid", "")
    telegram_id = get_telegram_user_id(update)

    PAGE_SIZE = 5
    raw_page = 0
    if update.callback_query:
        await update.callback_query.answer()
        parts = (update.callback_query.data or "").split(":")
        raw_page = int(parts[1]) if len(parts) > 1 else 0

    try:
        docs = (
            _db().collection("products")
            .where("artisanId", "==", uid)
            .limit(50)
            .stream()
        )
        listings = [{"id": d.id, **(d.to_dict() or {})} for d in docs]
    except Exception as exc:
        logger.error("Failed to fetch listings for %s: %s", uid, exc)
        listings = []

    if not listings:
        text = "You haven't listed any products yet. Tap *🎨 Sell Your Work* to get started!"
        if update.callback_query:
            await update.callback_query.edit_message_text(text, parse_mode=ParseMode.MARKDOWN)
        else:
            await update.effective_message.reply_text(text, parse_mode=ParseMode.MARKDOWN)
        return

    start = raw_page * PAGE_SIZE
    page = listings[start:start + PAGE_SIZE]
    rows = []
    for p in page:
        pid = p["id"]
        status = "✅" if p.get("active") else "⏸"
        label = f"{status} {(p.get('title') or 'Untitled')[:25]} — ₹{p.get('price', '?')}"
        rows.append([
            InlineKeyboardButton(label, callback_data=f"sell_toggle:{pid}"),
            InlineKeyboardButton("🗑", callback_data=f"sell_delete:{pid}"),
        ])

    nav = []
    if raw_page > 0:
        nav.append(InlineKeyboardButton("⬅️ Prev", callback_data=f"sell_my_listings:{raw_page - 1}"))
    if start + PAGE_SIZE < len(listings):
        nav.append(InlineKeyboardButton("Next ➡️", callback_data=f"sell_my_listings:{raw_page + 1}"))
    if nav:
        rows.append(nav)

    keyboard = InlineKeyboardMarkup(rows)
    text = f"*Your Listings* ({len(listings)} total)\n✅ = active  ⏸ = paused  🗑 = delete"

    if update.callback_query:
        await update.callback_query.edit_message_text(text, parse_mode=ParseMode.MARKDOWN, reply_markup=keyboard)
    else:
        await update.effective_message.reply_text(text, parse_mode=ParseMode.MARKDOWN, reply_markup=keyboard)


async def handle_sell_listing_callbacks(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    data = query.data or ""

    if data.startswith("sell_toggle:"):
        product_id = data.split(":", 1)[1]
        doc = _db().collection("products").document(product_id).get()
        if doc.exists:
            current = (doc.to_dict() or {}).get("active", True)
            _db().collection("products").document(product_id).update({"active": not current})
            status = "paused ⏸" if current else "active ✅"
            await query.answer(f"Listing {status}", show_alert=True)
        await show_my_listings(update, context)

    elif data.startswith("sell_delete:"):
        product_id = data.split(":", 1)[1]
        try:
            _db().collection("products").document(product_id).update({"active": False})
            await query.answer("Listing removed.", show_alert=True)
        except Exception as exc:
            logger.error("Failed to delete listing %s: %s", product_id, exc)
        await show_my_listings(update, context)

    elif data.startswith("sell_my_listings:"):
        await show_my_listings(update, context)


# ── ConversationHandler builder ────────────────────────────────────────────────

def build_sell_conversation_handler() -> ConversationHandler:
    return ConversationHandler(
        name="sell_flow",
        entry_points=[
            MessageHandler(filters.Regex("^🎨 Sell Your Work$"), start_sell_flow),
        ],
        states={
            TITLE: [MessageHandler(filters.TEXT & ~filters.COMMAND, handle_title)],
            PRICE: [MessageHandler(filters.TEXT & ~filters.COMMAND, handle_price)],
            DESCRIPTION: [MessageHandler(filters.TEXT & ~filters.COMMAND, handle_description)],
            CRAFT_TYPE: [CallbackQueryHandler(handle_craft_type_callback, pattern=r"^craft_type:")],
            REGION: [CallbackQueryHandler(handle_region_callback, pattern=r"^sell_region:")],
            PHOTOS: [
                MessageHandler(filters.PHOTO, handle_photos),
                CommandHandler("done", handle_done_photos),
            ],
            CONFIRM: [CallbackQueryHandler(handle_confirm_callback, pattern=r"^sell_(confirm|cancel)$")],
        },
        fallbacks=[CommandHandler("cancel", lambda u, c: (
            _clear_sell_data(c), ConversationHandler.END
        ))],
        allow_reentry=True,
    )
