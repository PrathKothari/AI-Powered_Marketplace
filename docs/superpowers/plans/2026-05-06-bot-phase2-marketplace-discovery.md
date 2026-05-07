# Bot Phase 2 — Marketplace & Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let Telegram users browse the catalog by category, view product details, see artisan profiles, get personalized recommendations, and get Gemini cultural analysis on craft photos.

**Architecture:** New `bot/catalog/` module with inline-keyboard–driven navigation. A persistent ReplyKeyboard main menu routes to all major features. Callback data uses prefixed patterns (`cat:`, `prod:`, `artisan:`, `rec:`) dispatched by a single CallbackQueryHandler multiplexer in `main.py`.

**Tech Stack:** python-telegram-bot v21, Firebase Admin SDK (Firestore), Pinecone, Google Gemini SDK, sentence-transformers, CLIP.

---

## File Map

| Action | Path |
|---|---|
| Create | `backend/app/bot/menu.py` |
| Create | `backend/app/bot/catalog/__init__.py` |
| Create | `backend/app/bot/catalog/handlers.py` |
| Create | `backend/app/bot/catalog/keyboards.py` |
| Create | `tests/bot/test_catalog_handlers.py` |
| Modify | `backend/app/bot/handlers.py` — route main-menu text taps |
| Modify | `backend/app/bot/main.py` — register catalog handlers |
| Modify | `backend/app/bot/auth/strings.py` — add catalog string keys |
| Modify | `backend/app/bot/auth/conversation.py` — show main menu after login |

---

## Task 1 — Persistent Main Menu

**Files:**
- Create: `backend/app/bot/menu.py`
- Modify: `backend/app/bot/auth/conversation.py` (lines ~321, ~412 — after welcome messages)
- Modify: `backend/app/bot/handlers.py` (add menu text routing)

### Steps

- [ ] **1.1 — Create `menu.py`**

```python
# backend/app/bot/menu.py
"""Persistent reply-keyboard main menu shown to authenticated users."""
from telegram import KeyboardButton, ReplyKeyboardMarkup

MENU_BROWSE   = "🔍 Browse Crafts"
MENU_SELL     = "🎨 Sell Your Work"
MENU_CART     = "🛒 My Cart"
MENU_ORDERS   = "📦 My Orders"
MENU_DASHBOARD = "📊 Dashboard"

MENU_COMMANDS = {MENU_BROWSE, MENU_SELL, MENU_CART, MENU_ORDERS, MENU_DASHBOARD}


def main_menu_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        [
            [KeyboardButton(MENU_BROWSE), KeyboardButton(MENU_SELL)],
            [KeyboardButton(MENU_CART),   KeyboardButton(MENU_ORDERS)],
            [KeyboardButton(MENU_DASHBOARD)],
        ],
        resize_keyboard=True,
        is_persistent=True,
    )
```

- [ ] **1.2 — Show menu after login (returning user) in `conversation.py`**

In `continue_with_phone`, replace `reply_markup=ReplyKeyboardRemove()` on the completion message with `reply_markup=main_menu_keyboard()`:

```python
# at the top of conversation.py, add import:
from app.bot.menu import main_menu_keyboard

# in continue_with_phone, change:
await update.effective_message.reply_text(
    _completion_summary(..., returning=True),
    reply_markup=main_menu_keyboard(),   # ← was ReplyKeyboardRemove()
)
```

Do the same in `handle_name_input` for new users.

- [ ] **1.3 — Route menu taps in `handlers.py`**

Add at the top of `handle_text_message` (before intent classification):

```python
from app.bot.menu import MENU_COMMANDS, MENU_BROWSE, MENU_SELL, MENU_CART, MENU_ORDERS, MENU_DASHBOARD
from app.bot.catalog.handlers import show_categories
from app.bot.cart.handlers import show_cart          # Phase 4 — stub for now
from app.bot.orders.handlers import show_order_history  # Phase 4 — stub for now

@require_auth
async def handle_text_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_query = update.message.text.strip()
    if not user_query:
        return

    # Route main-menu taps before AI classification
    if user_query == MENU_BROWSE:
        return await show_categories(update, context)
    if user_query == MENU_SELL:
        from app.bot.sell.conversation import start_sell_flow  # Phase 3 stub
        return await start_sell_flow(update, context)
    if user_query == MENU_CART:
        return await show_cart(update, context)
    if user_query == MENU_ORDERS:
        return await show_order_history(update, context)
    if user_query == MENU_DASHBOARD:
        from app.bot.orders.handlers import show_dashboard  # Phase 7 stub
        return await show_dashboard(update, context)

    # ... existing intent classification continues below
```

For Phase 2, stub the Phase 3/4/7 imports with temporary "coming soon" functions so the menu registers without crashing. Add to `handlers.py`:

```python
# Temporary stubs — replaced by Phase 3/4/7
async def _coming_soon(update, context):
    await update.effective_message.reply_text("Coming soon! 🚧")
```

And in `handlers.py`, before the menu routing block, define:
```python
async def show_cart(update, context): await _coming_soon(update, context)
async def show_order_history(update, context): await _coming_soon(update, context)
async def show_dashboard(update, context): await _coming_soon(update, context)
async def start_sell_flow(update, context): await _coming_soon(update, context)
```

- [ ] **1.4 — Write test**

```python
# tests/bot/test_catalog_handlers.py
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from telegram import Update, Message, User, Chat
from telegram.ext import ContextTypes
from app.bot.menu import MENU_BROWSE, main_menu_keyboard, MENU_COMMANDS


def make_update(text: str) -> tuple[Update, ContextTypes.DEFAULT_TYPE]:
    user = MagicMock(spec=User); user.id = 123456
    chat = MagicMock(spec=Chat); chat.id = 123456
    message = MagicMock(spec=Message)
    message.text = text
    message.chat = chat
    message.reply_text = AsyncMock()
    message.chat.send_action = AsyncMock()
    update = MagicMock(spec=Update)
    update.effective_user = user
    update.effective_chat = chat
    update.effective_message = message
    update.message = message
    update.update_id = 1
    context = MagicMock(spec=ContextTypes.DEFAULT_TYPE)
    context.user_data = {
        "_telegram_auth_session": {"uid": "uid123", "name": "Meera", "language": "en", "lastActivityAt": None}
    }
    context.bot = AsyncMock()
    return update, context


def test_main_menu_keyboard_has_all_buttons():
    kb = main_menu_keyboard()
    flat = [btn.text for row in kb.keyboard for btn in row]
    for cmd in MENU_COMMANDS:
        assert cmd in flat


@pytest.mark.asyncio
async def test_menu_browse_routes_to_categories():
    update, context = make_update(MENU_BROWSE)
    with patch("app.bot.catalog.handlers.fa_firestore") as mock_fs:
        mock_fs.client.return_value.collection.return_value.where.return_value.stream.return_value = []
        from app.bot.handlers import handle_text_message
        with patch("app.bot.auth.middleware.fetch_session", return_value={"uid": "u1", "name": "x", "language": "en"}):
            with patch("app.bot.auth.middleware.update_last_activity"):
                await handle_text_message(update, context)
    update.effective_message.reply_text.assert_called_once()
    args = update.effective_message.reply_text.call_args
    assert "craft" in args[0][0].lower() or "category" in args[0][0].lower() or args[1].get("reply_markup") is not None
```

- [ ] **1.5 — Run test (expect FAIL until catalog handler exists)**

```bash
cd backend && python -m pytest tests/bot/test_catalog_handlers.py::test_main_menu_keyboard_has_all_buttons -v
```

- [ ] **1.6 — Commit skeleton**

```bash
git add backend/app/bot/menu.py backend/app/bot/handlers.py backend/app/bot/auth/conversation.py
git commit -m "feat(bot): add persistent main menu keyboard and menu tap routing"
```

---

## Task 2 — Category Browser

**Files:**
- Create: `backend/app/bot/catalog/__init__.py`
- Create: `backend/app/bot/catalog/handlers.py`
- Create: `backend/app/bot/catalog/keyboards.py`

- [ ] **2.1 — Create `catalog/__init__.py`** (empty)

- [ ] **2.2 — Create `catalog/keyboards.py`**

```python
# backend/app/bot/catalog/keyboards.py
from telegram import InlineKeyboardButton, InlineKeyboardMarkup
from typing import Any


def categories_keyboard(categories: list[dict[str, Any]]) -> InlineKeyboardMarkup:
    rows = []
    for i in range(0, len(categories), 2):
        row = []
        for cat in categories[i:i+2]:
            row.append(InlineKeyboardButton(cat["name"], callback_data=f"cat:{cat['id']}:0"))
        rows.append(row)
    rows.append([InlineKeyboardButton("❌ Cancel", callback_data="cat:cancel")])
    return InlineKeyboardMarkup(rows)


def products_keyboard(products: list[dict[str, Any]], cat_id: str, page: int, total: int, page_size: int = 5) -> InlineKeyboardMarkup:
    rows = []
    for p in products:
        rows.append([
            InlineKeyboardButton(f"👁 {p['title'][:30]}", callback_data=f"prod:{p['id']}"),
        ])
    nav = []
    if page > 0:
        nav.append(InlineKeyboardButton("← Prev", callback_data=f"cat:{cat_id}:{page-1}"))
    if (page + 1) * page_size < total:
        nav.append(InlineKeyboardButton("Next →", callback_data=f"cat:{cat_id}:{page+1}"))
    if nav:
        rows.append(nav)
    rows.append([InlineKeyboardButton("🔙 Categories", callback_data="cat:back")])
    return InlineKeyboardMarkup(rows)


def product_detail_keyboard(product_id: str, artisan_id: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("🛒 Add to Cart", callback_data=f"cart_add:{product_id}"),
            InlineKeyboardButton("👤 Seller", callback_data=f"artisan:{artisan_id}"),
        ],
        [InlineKeyboardButton("🔙 Back", callback_data="cat:back")],
    ])


def artisan_keyboard(artisan_id: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("🛍 View Listings", callback_data=f"artisan_listings:{artisan_id}:0")],
        [InlineKeyboardButton("🔙 Back", callback_data="cat:back")],
    ])
```

- [ ] **2.3 — Create `catalog/handlers.py`**

```python
# backend/app/bot/catalog/handlers.py
"""Catalog browsing handlers: categories → products → product detail → artisan profile."""
from __future__ import annotations
import logging
from typing import Any

from firebase_admin import firestore as fa_firestore
from telegram import Update
from telegram.constants import ParseMode
from telegram.ext import ContextTypes

from app.bot.auth.middleware import AUTH_SESSION_CACHE_KEY, require_auth
from app.bot.catalog.keyboards import (
    categories_keyboard, products_keyboard, product_detail_keyboard, artisan_keyboard
)

logger = logging.getLogger(__name__)
PAGE_SIZE = 5


def _db():
    return fa_firestore.client()


def _get_categories() -> list[dict[str, Any]]:
    docs = _db().collection("categories").where("active", "==", True).stream()
    return [{"id": d.id, **d.to_dict()} for d in docs]


def _get_products_by_category(cat_id: str) -> list[dict[str, Any]]:
    docs = (
        _db().collection("products")
        .where("craftType", "==", cat_id)
        .where("active", "==", True)
        .limit(50)
        .stream()
    )
    return [{"id": d.id, **d.to_dict()} for d in docs]


def _get_product(product_id: str) -> dict[str, Any] | None:
    doc = _db().collection("products").document(product_id).get()
    if not doc.exists:
        return None
    return {"id": doc.id, **doc.to_dict()}


def _get_user(uid: str) -> dict[str, Any] | None:
    doc = _db().collection("users").document(uid).get()
    if not doc.exists:
        return None
    return doc.to_dict() or {}


@require_auth
async def show_categories(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    cats = _get_categories()
    if not cats:
        await update.effective_message.reply_text("No categories found yet.")
        return
    await update.effective_message.reply_text(
        "Choose a craft type to browse:",
        reply_markup=categories_keyboard(cats),
    )


async def handle_catalog_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Single multiplexer for all cat:, prod:, artisan: callbacks."""
    query = update.callback_query
    await query.answer()
    data = query.data or ""

    if data == "cat:back" or data == "cat:cancel":
        await query.edit_message_text("Use the menu buttons to navigate.")
        return

    if data.startswith("cat:") and not data.startswith("cat:back"):
        parts = data.split(":")
        cat_id = parts[1]
        page = int(parts[2]) if len(parts) > 2 else 0
        products = _get_products_by_category(cat_id)
        if not products:
            await query.edit_message_text(f"No products found in this category yet.")
            return
        start = page * PAGE_SIZE
        page_prods = products[start:start + PAGE_SIZE]
        text = f"*{cat_id}* — {len(products)} product(s)\n\nTap a product to see details:"
        await query.edit_message_text(
            text,
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=products_keyboard(page_prods, cat_id, page, len(products), PAGE_SIZE),
        )
        return

    if data.startswith("prod:"):
        product_id = data.split(":", 1)[1]
        product = _get_product(product_id)
        if not product:
            await query.edit_message_text("Product not found.")
            return
        text = (
            f"*{product.get('title', 'Untitled')}*\n\n"
            f"₹{product.get('price', 'N/A')} | {product.get('craftType', '')} from {product.get('region', '')}\n\n"
            f"{product.get('description', '')[:300]}\n\n"
            f"Stock: {product.get('stock', 0)} available\n"
            f"Rating: {'⭐' * round(product.get('rating', 0))} ({product.get('reviewCount', 0)} reviews)"
        )
        artisan_id = product.get("artisanId", "")
        images = product.get("images", [])
        if images and images[0]:
            await context.bot.send_photo(
                chat_id=update.effective_chat.id,
                photo=images[0],
                caption=text,
                parse_mode=ParseMode.MARKDOWN,
                reply_markup=product_detail_keyboard(product_id, artisan_id),
            )
        else:
            await context.bot.send_message(
                chat_id=update.effective_chat.id,
                text=text,
                parse_mode=ParseMode.MARKDOWN,
                reply_markup=product_detail_keyboard(product_id, artisan_id),
            )
        return

    if data.startswith("artisan:") and not data.startswith("artisan_listings:"):
        uid = data.split(":", 1)[1]
        user = _get_user(uid)
        if not user:
            await query.edit_message_text("Artisan profile not found.")
            return
        text = (
            f"*{user.get('name', 'Artisan')}*\n\n"
            f"Craft: {user.get('craftType', 'N/A')}\n"
            f"Region: {user.get('region', 'India')}\n"
            f"Experience: {user.get('experienceYears', '?')} years\n\n"
            f"{user.get('bio', '')[:200]}"
        )
        await query.edit_message_text(
            text, parse_mode=ParseMode.MARKDOWN, reply_markup=artisan_keyboard(uid)
        )
        return

    if data.startswith("artisan_listings:"):
        parts = data.split(":")
        uid = parts[1]
        page = int(parts[2]) if len(parts) > 2 else 0
        docs = (
            _db().collection("products")
            .where("artisanId", "==", uid)
            .where("active", "==", True)
            .limit(20)
            .stream()
        )
        products = [{"id": d.id, **d.to_dict()} for d in docs]
        if not products:
            await query.edit_message_text("This artisan has no active listings.")
            return
        start = page * PAGE_SIZE
        page_prods = products[start:start + PAGE_SIZE]
        text = f"Listings by this artisan ({len(products)} total):"
        await query.edit_message_text(
            text,
            reply_markup=products_keyboard(page_prods, f"artisan_{uid}", page, len(products), PAGE_SIZE),
        )
        return
```

- [ ] **2.4 — Write tests**

```python
# tests/bot/test_catalog_handlers.py  (add to existing file)
@pytest.mark.asyncio
async def test_show_categories_empty():
    update, context = make_update("🔍 Browse Crafts")
    with patch("app.bot.catalog.handlers._get_categories", return_value=[]):
        with patch("app.bot.auth.middleware.fetch_session", return_value={"uid": "u1", "name": "x", "language": "en"}):
            with patch("app.bot.auth.middleware.update_last_activity"):
                from app.bot.catalog.handlers import show_categories
                await show_categories(update, context)
    update.effective_message.reply_text.assert_called_once()
    assert "No categories" in update.effective_message.reply_text.call_args[0][0]


@pytest.mark.asyncio
async def test_show_categories_with_data():
    update, context = make_update("🔍 Browse Crafts")
    cats = [{"id": "madhubani", "name": "Madhubani"}, {"id": "warli", "name": "Warli"}]
    with patch("app.bot.catalog.handlers._get_categories", return_value=cats):
        with patch("app.bot.auth.middleware.fetch_session", return_value={"uid": "u1", "name": "x", "language": "en"}):
            with patch("app.bot.auth.middleware.update_last_activity"):
                from app.bot.catalog.handlers import show_categories
                await show_categories(update, context)
    call_kwargs = update.effective_message.reply_text.call_args[1]
    keyboard = call_kwargs["reply_markup"]
    flat = [btn.callback_data for row in keyboard.inline_keyboard for btn in row]
    assert "cat:madhubani:0" in flat
    assert "cat:warli:0" in flat


@pytest.mark.asyncio
async def test_product_detail_callback():
    update, context = make_update("")
    query = MagicMock(); query.data = "prod:prod123"; query.answer = AsyncMock()
    update.callback_query = query
    update.effective_chat = MagicMock(); update.effective_chat.id = 123

    product = {
        "id": "prod123", "title": "Madhubani Painting", "price": 1500,
        "craftType": "Madhubani", "region": "Bihar", "description": "Beautiful painting",
        "stock": 5, "rating": 4.5, "reviewCount": 3, "artisanId": "uid456", "images": [],
    }
    with patch("app.bot.catalog.handlers._get_product", return_value=product):
        from app.bot.catalog.handlers import handle_catalog_callback
        await handle_catalog_callback(update, context)
    context.bot.send_message.assert_called_once()
    msg_text = context.bot.send_message.call_args[1]["text"]
    assert "Madhubani Painting" in msg_text
    assert "1500" in msg_text
```

- [ ] **2.5 — Run tests**

```bash
cd backend && python -m pytest tests/bot/test_catalog_handlers.py -v
```

Expected: all pass.

- [ ] **2.6 — Commit**

```bash
git add backend/app/bot/catalog/ tests/bot/test_catalog_handlers.py
git commit -m "feat(bot): add catalog browser — categories, products, artisan profiles"
```

---

## Task 3 — Recommendations

**Files:**
- Modify: `backend/app/bot/catalog/handlers.py` — add `show_recommendations`
- Modify: `backend/app/bot/handlers.py` — route MENU_BROWSE to also offer "Recommended" button

- [ ] **3.1 — Add `show_recommendations` to `catalog/handlers.py`**

```python
# append to catalog/handlers.py
from app.services.recommendation.recommender import recommend  # existing service
from app.bot.auth.middleware import fetch_session


@require_auth
async def show_recommendations(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    session = context.user_data.get(AUTH_SESSION_CACHE_KEY, {})
    uid = session.get("uid")
    if not uid:
        await update.effective_message.reply_text("Could not identify your account.")
        return

    # Build a minimal request from the user's order history
    orders_docs = (
        _db().collection("orders")
        .where("userId", "==", uid)
        .limit(10)
        .stream()
    )
    past_interactions = []
    for doc in orders_docs:
        for item in (doc.to_dict() or {}).get("items", []):
            past_interactions.append({
                "productId": item.get("productId", ""),
                "interactionType": "purchase",
                "style": item.get("craftType", ""),
                "artist": item.get("artisanId", ""),
                "theme": item.get("craftType", ""),
                "colorPalette": [],
            })

    if not past_interactions:
        await update.effective_message.reply_text(
            "Place your first order to get personalized recommendations! "
            "For now, here are some popular items:"
        )
        # Fall back to top-rated products
        docs = (
            _db().collection("products")
            .where("active", "==", True)
            .order_by("rating", direction=fa_firestore.Query.DESCENDING)
            .limit(5)
            .stream()
        )
        products = [{"id": d.id, **d.to_dict()} for d in docs]
    else:
        from app.schemas.recommendation import RecommendationRequest
        req = RecommendationRequest(
            userId=uid, cartItems=[], pastInteractions=past_interactions
        )
        result = recommend(req)
        product_ids = [r.productId for r in result.recommendations]
        products = [p for pid in product_ids if (p := _get_product(pid))]

    for p in products[:5]:
        text = (
            f"*{p.get('title', 'Untitled')}*\n"
            f"₹{p.get('price', '?')} | {p.get('craftType', '')} from {p.get('region', '')}"
        )
        keyboard = product_detail_keyboard(p["id"], p.get("artisanId", ""))
        images = p.get("images", [])
        if images and images[0]:
            await context.bot.send_photo(
                chat_id=update.effective_chat.id,
                photo=images[0],
                caption=text,
                parse_mode=ParseMode.MARKDOWN,
                reply_markup=keyboard,
            )
        else:
            await context.bot.send_message(
                chat_id=update.effective_chat.id,
                text=text,
                parse_mode=ParseMode.MARKDOWN,
                reply_markup=keyboard,
            )
```

- [ ] **3.2 — Register recommendations callback in `main.py`**

In `_build_app`, in the `handle_catalog_callback` CallbackQueryHandler pattern, extend to also match `rec:show`:

```python
app.add_handler(
    CallbackQueryHandler(
        handle_catalog_callback,
        pattern=r"^(cat:|prod:|artisan:|cart_add:|rec:)",
    ),
    group=1,
)
```

- [ ] **3.3 — Commit**

```bash
git add backend/app/bot/catalog/handlers.py backend/app/bot/main.py
git commit -m "feat(bot): add personalized product recommendations"
```

---

## Task 4 — Extended Image Analysis (Gemini Origin Detection)

**Files:**
- Modify: `backend/app/bot/handlers.py` — extend `handle_image_message` to also call Gemini vision analysis

- [ ] **4.1 — Add Gemini cultural analysis to `handle_image_message`**

In `handlers.py`, after the existing CLIP search and `_gemini_product_response` call, add:

```python
async def _gemini_craft_analysis(image_bytes: bytes, language_code: str = "en") -> str:
    """Run Gemini vision analysis to identify craft origin and cultural context."""
    if not settings.GEMINI_API_KEY:
        return ""
    import base64
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    img_b64 = base64.b64encode(image_bytes).decode()
    prompt = f"""You are an expert in Indian traditional crafts and folk art.
Analyze this craft image and provide:
1. Craft name and type
2. Region/state of origin
3. Cultural significance (2-3 sentences)
4. Key identifying techniques or motifs

Be concise. Use Telegram markdown (*bold*, _italic_). {_language_instruction(language_code)}"""
    try:
        from google.genai import types as genai_types
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                genai_types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                prompt,
            ],
        )
        return response.text or ""
    except Exception as e:
        logger.warning("Gemini craft analysis failed: %s", e)
        return ""
```

Then in `handle_image_message`, after `response_text = _gemini_product_response(...)`, add:

```python
        # Cultural analysis
        analysis = await _gemini_craft_analysis(image_bytes, language_code=language)
        if analysis:
            await update.message.reply_text(
                f"*About this craft:*\n\n{analysis}",
                parse_mode=ParseMode.MARKDOWN,
            )
```

- [ ] **4.2 — Commit**

```bash
git add backend/app/bot/handlers.py
git commit -m "feat(bot): add Gemini cultural origin analysis to image search"
```

---

## Task 5 — Register All Catalog Handlers in `main.py`

**Files:**
- Modify: `backend/app/bot/main.py`

- [ ] **5.1 — Update `_build_app`**

```python
# main.py — add imports
from app.bot.catalog.handlers import handle_catalog_callback

# in _build_app, after existing handlers:
app.add_handler(
    CallbackQueryHandler(
        handle_catalog_callback,
        pattern=r"^(cat:|prod:|artisan)",
    ),
    group=1,
)
```

- [ ] **5.2 — Smoke test: start the bot and send "🔍 Browse Crafts"**

Expected: bot replies with an inline keyboard of categories.

- [ ] **5.3 — Commit**

```bash
git add backend/app/bot/main.py
git commit -m "feat(bot): register catalog callback handler"
```
