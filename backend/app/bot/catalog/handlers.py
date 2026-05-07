"""Catalog browsing handlers for the KalaSetu Telegram Bot (Phase 2)."""

from __future__ import annotations

import logging
from typing import Any, Dict, List

from firebase_admin import firestore as fa_firestore
from telegram import Update
from telegram.constants import ParseMode
from telegram.ext import ContextTypes

from app.bot.auth.middleware import AUTH_SESSION_CACHE_KEY, require_auth
from app.bot.catalog.keyboards import (
    artisan_keyboard,
    categories_keyboard,
    product_detail_keyboard,
    products_keyboard,
)
from app.schemas.recommendation import PaintingSignal, RecommendationRequest
from app.services.recommendation.recommender import generate_recommendations

logger = logging.getLogger(__name__)

PAGE_SIZE = 5


# ──────────────────────────────────────────────
# Internal helpers
# ──────────────────────────────────────────────

def _db():
    return fa_firestore.client()


def _stars(rating: float | None) -> str:
    """Convert a numeric rating (0–5) to star emoji string."""
    if not rating:
        return "☆☆☆☆☆"
    full = int(round(float(rating)))
    full = max(0, min(5, full))
    return "⭐" * full + "☆" * (5 - full)


def _format_product(p: Dict[str, Any]) -> str:
    """Return a Markdown-formatted product detail string."""
    title = p.get("title") or "Untitled"
    price = p.get("price")
    craft = p.get("craftType") or ""
    region = p.get("region") or ""
    desc = (p.get("description") or "")[:300]
    stock = p.get("stock", 0)
    rating = p.get("rating")
    review_count = p.get("reviewCount", 0)

    lines: List[str] = [f"*{title}*"]
    if craft:
        lines.append(f"🏺 Craft: {craft}")
    if region:
        lines.append(f"📍 Region: {region}")
    if price is not None:
        lines.append(f"💰 Price: ₹{price}")
    if desc:
        lines.append(f"\n_{desc}_")
    lines.append(f"\n📦 Stock: {stock}")
    lines.append(f"{_stars(rating)} ({review_count} reviews)")
    return "\n".join(lines)


def _format_artisan(u: Dict[str, Any]) -> str:
    """Return a Markdown-formatted artisan profile string."""
    name = u.get("name") or "Unknown Artisan"
    craft = u.get("craftType") or ""
    region = u.get("region") or ""
    years = u.get("experienceYears")
    bio = (u.get("bio") or "")[:200]

    lines: List[str] = [f"*{name}*"]
    if craft:
        lines.append(f"🏺 Craft: {craft}")
    if region:
        lines.append(f"📍 Region: {region}")
    if years is not None:
        lines.append(f"🗓 Experience: {years} years")
    if bio:
        lines.append(f"\n_{bio}_")
    return "\n".join(lines)


# ──────────────────────────────────────────────
# Public handlers
# ──────────────────────────────────────────────

@require_auth
async def show_categories(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send the inline category browser to the user."""
    db = _db()
    try:
        docs = db.collection("categories").where("active", "==", True).stream()
        categories = []
        for doc in docs:
            data = doc.to_dict() or {}
            data["id"] = doc.id
            categories.append(data)
    except Exception as exc:
        logger.error("Firestore categories query failed: %s", exc)
        categories = []

    if not categories:
        await update.effective_message.reply_text("No categories found yet.")
        return

    await update.effective_message.reply_text(
        "🏺 *Browse Crafts*\n\nChoose a category to explore:",
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=categories_keyboard(categories),
    )


async def handle_catalog_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Route all catalog-related inline keyboard callbacks."""
    query = update.callback_query
    await query.answer()

    data: str = query.data or ""

    # ── cat:back / cat:cancel ─────────────────────────────────────────────
    if data in ("cat:back", "cat:cancel"):
        await query.edit_message_text("Use the menu to navigate.")
        return

    # ── cat:{cat_id}:{page} ───────────────────────────────────────────────
    if data.startswith("cat:"):
        parts = data.split(":")
        if len(parts) != 3:
            await query.edit_message_text("Use the menu to navigate.")
            return

        cat_id = parts[1]
        try:
            page = int(parts[2])
        except ValueError:
            page = 0

        db = _db()
        try:
            docs = (
                db.collection("products")
                .where("craftType", "==", cat_id)
                .where("active", "==", True)
                .limit(50)
                .stream()
            )
            all_products: List[Dict[str, Any]] = []
            for doc in docs:
                p = doc.to_dict() or {}
                p["id"] = doc.id
                all_products.append(p)
        except Exception as exc:
            logger.error("Firestore products query failed for cat %s: %s", cat_id, exc)
            all_products = []

        if not all_products:
            await query.edit_message_text("No products in this category yet.")
            return

        total = len(all_products)
        start = page * PAGE_SIZE
        page_products = all_products[start : start + PAGE_SIZE]

        category_label = cat_id.replace("_", " ").title()
        text = f"*{category_label}*\nShowing {start + 1}–{min(start + PAGE_SIZE, total)} of {total} products:"

        await query.edit_message_text(
            text,
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=products_keyboard(page_products, cat_id, page, total, PAGE_SIZE),
        )
        return

    # ── prod:{product_id} ─────────────────────────────────────────────────
    if data.startswith("prod:"):
        product_id = data[len("prod:"):]
        db = _db()
        try:
            doc = db.collection("products").document(product_id).get()
        except Exception as exc:
            logger.error("Firestore product fetch failed for %s: %s", product_id, exc)
            await query.edit_message_text("Could not load product details. Please try again.")
            return

        if not doc.exists:
            await query.edit_message_text("Product not found.")
            return

        p: Dict[str, Any] = doc.to_dict() or {}
        p["id"] = doc.id

        artisan_id = p.get("artisanId") or ""
        caption = _format_product(p)
        keyboard = product_detail_keyboard(product_id, artisan_id)

        images: List[str] = p.get("images") or []
        first_image = images[0] if images and images[0] else None

        try:
            if first_image:
                await query.message.reply_photo(
                    photo=first_image,
                    caption=caption,
                    parse_mode=ParseMode.MARKDOWN,
                    reply_markup=keyboard,
                )
                await query.edit_message_text("Use the menu to navigate.")
            else:
                await query.edit_message_text(
                    caption,
                    parse_mode=ParseMode.MARKDOWN,
                    reply_markup=keyboard,
                )
        except Exception as exc:
            logger.error("Failed to send product detail for %s: %s", product_id, exc)
            await query.edit_message_text(
                caption,
                parse_mode=ParseMode.MARKDOWN,
                reply_markup=keyboard,
            )
        return

    # ── artisan_listings:{uid}:{page} ─────────────────────────────────────
    if data.startswith("artisan_listings:"):
        _, uid, raw_page = data.split(":", 2)
        try:
            page = int(raw_page)
        except ValueError:
            page = 0

        db = _db()
        try:
            docs = (
                db.collection("products")
                .where("artisanId", "==", uid)
                .where("active", "==", True)
                .limit(20)
                .stream()
            )
            all_products: List[Dict[str, Any]] = []
            for doc in docs:
                p = doc.to_dict() or {}
                p["id"] = doc.id
                all_products.append(p)
        except Exception as exc:
            logger.error("Firestore artisan listings query failed for %s: %s", uid, exc)
            all_products = []

        if not all_products:
            await query.edit_message_text("This artisan has no active listings.")
            return

        total = len(all_products)
        start = page * PAGE_SIZE
        page_products = all_products[start : start + PAGE_SIZE]

        text = f"*Artisan's Listings*\nShowing {start + 1}–{min(start + PAGE_SIZE, total)} of {total} products:"

        await query.edit_message_text(
            text,
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=products_keyboard(page_products, f"_artisan_{uid}", page, total, PAGE_SIZE),
        )
        return

    # ── artisan:{uid} ─────────────────────────────────────────────────────
    if data.startswith("artisan:"):
        uid = data[len("artisan:"):]
        db = _db()
        try:
            doc = db.collection("users").document(uid).get()
        except Exception as exc:
            logger.error("Firestore artisan fetch failed for %s: %s", uid, exc)
            await query.edit_message_text("Could not load artisan profile. Please try again.")
            return

        if not doc.exists:
            await query.edit_message_text("Artisan profile not found.")
            return

        u: Dict[str, Any] = doc.to_dict() or {}
        text = _format_artisan(u)

        await query.edit_message_text(
            text,
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=artisan_keyboard(uid),
        )
        return

    # Unrecognised callback — silently ignore
    logger.warning("handle_catalog_callback: unrecognised callback data %r", data)


@require_auth
async def show_recommendations(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Fetch personalised product recommendations and send them to the user."""
    session: Dict[str, Any] = context.user_data.get(AUTH_SESSION_CACHE_KEY) or {}
    uid: str = session.get("uid") or ""

    db = _db()

    # Fetch last 10 orders for this user
    past_interactions: List[PaintingSignal] = []
    try:
        order_docs = (
            db.collection("orders")
            .where("userId", "==", uid)
            .order_by("createdAt", direction=fa_firestore.Query.DESCENDING)
            .limit(10)
            .stream()
        )
        for order_doc in order_docs:
            order = order_doc.to_dict() or {}
            for item in order.get("items") or []:
                past_interactions.append(
                    PaintingSignal(
                        productId=item.get("productId") or item.get("id") or "",
                        title=item.get("title") or item.get("name") or "",
                        style=item.get("craftType") or item.get("style") or None,
                        price=float(item["price"]) if item.get("price") is not None else None,
                        interactionType="purchase",
                    )
                )
    except Exception as exc:
        logger.error("Failed to fetch orders for uid %s: %s", uid, exc)

    # No order history — fall back to top 5 products by rating
    if not past_interactions:
        try:
            top_docs = (
                db.collection("products")
                .where("active", "==", True)
                .order_by("rating", direction=fa_firestore.Query.DESCENDING)
                .limit(5)
                .stream()
            )
            top_products: List[Dict[str, Any]] = []
            for doc in top_docs:
                p = doc.to_dict() or {}
                p["id"] = doc.id
                top_products.append(p)
        except Exception as exc:
            logger.error("Failed to fetch top products: %s", exc)
            top_products = []

        await update.effective_message.reply_text(
            "🌟 *Top Picks for You*\n\nPlace your first order for personalised recs!",
            parse_mode=ParseMode.MARKDOWN,
        )

        for p in top_products:
            product_id = p.get("id") or ""
            artisan_id = p.get("artisanId") or ""
            caption = _format_product(p)
            keyboard = product_detail_keyboard(product_id, artisan_id)
            images: List[str] = p.get("images") or []
            first_image = images[0] if images and images[0] else None

            try:
                if first_image:
                    await update.effective_message.reply_photo(
                        photo=first_image,
                        caption=caption,
                        parse_mode=ParseMode.MARKDOWN,
                        reply_markup=keyboard,
                    )
                else:
                    await update.effective_message.reply_text(
                        caption,
                        parse_mode=ParseMode.MARKDOWN,
                        reply_markup=keyboard,
                    )
            except Exception as exc:
                logger.error("Failed to send top-pick product %s: %s", product_id, exc)
        return

    # Build recommendation request from past purchase history
    req = RecommendationRequest(
        userId=uid,
        pastInteractions=past_interactions,
        limit=5,
    )

    try:
        response = generate_recommendations(req)
        recommended = response.recommendations
    except Exception as exc:
        logger.error("Recommendation engine error for uid %s: %s", uid, exc)
        await update.effective_message.reply_text(
            "😅 Couldn't load recommendations right now. Please try again shortly."
        )
        return

    if not recommended:
        await update.effective_message.reply_text(
            "🔍 No new recommendations at the moment. Keep exploring the catalogue!"
        )
        return

    await update.effective_message.reply_text(
        "✨ *Recommended for You*",
        parse_mode=ParseMode.MARKDOWN,
    )

    for rec_item in recommended:
        product_id = rec_item.productId
        # Fetch full product details from Firestore so we have images/artisanId
        try:
            doc = db.collection("products").document(product_id).get()
        except Exception as exc:
            logger.warning("Could not fetch rec product %s: %s", product_id, exc)
            doc = None

        if doc and doc.exists:
            p: Dict[str, Any] = doc.to_dict() or {}
            p["id"] = doc.id
        else:
            # Fall back to what the recommender returned
            p = {
                "id": product_id,
                "title": rec_item.title,
                "price": rec_item.price,
                "craftType": rec_item.style,
                "artisanId": rec_item.artist or "",
                "images": [],
            }

        artisan_id = p.get("artisanId") or ""
        caption = _format_product(p)
        # Append the recommendation reason in italics
        reason = rec_item.reason or ""
        if reason:
            caption += f"\n\n_💡 {reason}_"

        keyboard = product_detail_keyboard(product_id, artisan_id)
        images: List[str] = p.get("images") or []
        first_image = images[0] if images and images[0] else None

        try:
            if first_image:
                await update.effective_message.reply_photo(
                    photo=first_image,
                    caption=caption,
                    parse_mode=ParseMode.MARKDOWN,
                    reply_markup=keyboard,
                )
            else:
                await update.effective_message.reply_text(
                    caption,
                    parse_mode=ParseMode.MARKDOWN,
                    reply_markup=keyboard,
                )
        except Exception as exc:
            logger.error("Failed to send recommended product %s: %s", product_id, exc)
