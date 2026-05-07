"""Inline keyboard builders for KalaSetu catalog browsing."""

from __future__ import annotations

from typing import List

from telegram import InlineKeyboardButton, InlineKeyboardMarkup


def categories_keyboard(categories: list[dict]) -> InlineKeyboardMarkup:
    """Build an inline keyboard listing all active categories.

    Two categories per row. Final row is a Cancel button.
    """
    rows: List[List[InlineKeyboardButton]] = []

    for i in range(0, len(categories), 2):
        pair = categories[i : i + 2]
        row = [
            InlineKeyboardButton(
                text=cat.get("name", cat["id"]),
                callback_data=f"cat:{cat['id']}:0",
            )
            for cat in pair
        ]
        rows.append(row)

    rows.append([InlineKeyboardButton("❌ Cancel", callback_data="cat:back")])
    return InlineKeyboardMarkup(rows)


def products_keyboard(
    products: list[dict],
    cat_id: str,
    page: int,
    total: int,
    page_size: int = 5,
) -> InlineKeyboardMarkup:
    """Build an inline keyboard listing products for a category page.

    One button per product (title truncated to 30 chars).
    Navigation row with Prev / Next when applicable.
    Back button at the bottom.
    """
    rows: List[List[InlineKeyboardButton]] = []

    for p in products:
        title = (p.get("title") or "Untitled")[:30]
        rows.append(
            [InlineKeyboardButton(title, callback_data=f"prod:{p['id']}")]
        )

    # Navigation row
    total_pages = max(1, (total + page_size - 1) // page_size)
    nav: List[InlineKeyboardButton] = []
    if page > 0:
        nav.append(
            InlineKeyboardButton("⬅️ Prev", callback_data=f"cat:{cat_id}:{page - 1}")
        )
    if page < total_pages - 1:
        nav.append(
            InlineKeyboardButton("Next ➡️", callback_data=f"cat:{cat_id}:{page + 1}")
        )
    if nav:
        rows.append(nav)

    rows.append([InlineKeyboardButton("🔙 Back", callback_data="cat:back")])
    return InlineKeyboardMarkup(rows)


def product_detail_keyboard(product_id: str, artisan_id: str) -> InlineKeyboardMarkup:
    """Build the inline keyboard shown beneath a product detail message."""
    return InlineKeyboardMarkup(
        [
            [
                InlineKeyboardButton("🛒 Add to Cart", callback_data=f"cart_add:{product_id}"),
                InlineKeyboardButton("👤 View Seller", callback_data=f"artisan:{artisan_id}"),
            ],
            [InlineKeyboardButton("🔙 Back", callback_data="cat:back")],
        ]
    )


def artisan_keyboard(artisan_id: str) -> InlineKeyboardMarkup:
    """Build the inline keyboard shown beneath an artisan profile message."""
    return InlineKeyboardMarkup(
        [
            [InlineKeyboardButton("🛍 View Listings", callback_data=f"artisan_listings:{artisan_id}:0")],
            [InlineKeyboardButton("🔙 Back", callback_data="cat:back")],
        ]
    )
