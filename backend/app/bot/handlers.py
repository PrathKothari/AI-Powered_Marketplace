"""
KalaSetu Telegram Bot — Handler logic.

Handles:
  /start, /help  — informational commands
  Text messages    — conversational AI + product search when relevant
  Image messages   — CLIP-based visual search against product-images Pinecone index
"""

import io
import logging
from typing import Any, Dict, List

from google import genai
from firebase_admin import firestore as fa_firestore
from pinecone import Pinecone
from telegram import Update
from telegram.constants import ParseMode, ChatAction
from telegram.ext import ContextTypes

from app.core.config import settings
from app.ml.embeddings import get_image_embedding
from app.ml.text_embeddings import get_text_embedding

logger = logging.getLogger(__name__)

SIMILARITY_THRESHOLD = 0.55
FRONTEND_URL = "http://localhost:3001"


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

def _get_pinecone_text_index():
    pc = Pinecone(api_key=settings.PINECONE_API_KEY)
    return pc.Index(settings.PINECONE_TEXT_INDEX)


def _get_pinecone_image_index():
    pc = Pinecone(api_key=settings.PINECONE_API_KEY)
    return pc.Index(settings.PINECONE_IMAGE_INDEX)


def _get_db():
    return fa_firestore.client()


def _fetch_product_from_firestore(db, product_id: str) -> Dict[str, Any] | None:
    doc = db.collection("products").document(product_id).get()
    if doc.exists:
        data = doc.to_dict() or {}
        data.setdefault("productId", product_id)
        return data
    return None


def _classify_intent(user_query: str) -> str:
    """Use Gemini to classify whether the user wants to chat or search products.
    Returns 'search' or 'chat'."""
    query_lower = user_query.lower()

    # Fast keyword-based classification (no API call needed)
    SEARCH_KEYWORDS = [
        "have", "available", "buy", "price", "cost", "stock", "show me",
        "find", "search", "looking for", "painting", "art", "craft",
        "madhubani", "warli", "pattachitra", "kalighat", "tanjore", "gond",
        "kalamkari", "miniature", "pichwai", "kangra", "mandana",
        "rajasthan", "odisha", "bengal", "kerala", "bihar", "tamil",
        "product", "sell", "order", "marketplace", "catalog", "collection",
        "recommend", "suggest", "similar", "like this",
    ]
    CHAT_KEYWORDS = [
        "hi", "hello", "hey", "namaste", "good morning", "good evening",
        "how are you", "what's up", "whats up", "thanks", "thank you",
        "bye", "goodbye", "who are you", "what are you", "your name",
        "help me", "what can you do",
    ]

    # Check for exact chat patterns first (short greetings)
    if query_lower.strip() in ["hi", "hello", "hey", "namaste", "thanks", "thank you", "bye", "ok", "okay"]:
        return "chat"

    for keyword in CHAT_KEYWORDS:
        if keyword in query_lower and len(user_query.split()) <= 6:
            return "chat"

    for keyword in SEARCH_KEYWORDS:
        if keyword in query_lower:
            return "search"

    # For ambiguous messages, try Gemini if available
    if settings.GEMINI_API_KEY:
        try:
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[f'Classify as SEARCH or CHAT (one word only). Message: "{user_query}"'],
            )
            result = (response.text or "").strip().upper()
            if "SEARCH" in result:
                return "search"
            return "chat"
        except Exception as e:
            logger.warning("Gemini intent classification failed: %s", e)

    # Default: if message is longer than 3 words, assume search
    return "search" if len(user_query.split()) > 3 else "chat"


def _gemini_conversation(user_query: str) -> str:
    """Handle general conversation using Gemini."""
    if not settings.GEMINI_API_KEY:
        return "🙏 Namaste! I'm KalaSetu Bot. Ask me about Indian art and crafts, or send me a photo to identify!"

    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    prompt = f"""You are KalaSetu Bot — a warm, knowledgeable, and friendly conversational assistant for an Indian art marketplace called KalaSetu.

You're chatting with a user on Telegram. Be natural, warm, and personable — like a friend who happens to be passionate about Indian art and culture.

Guidelines:
- Be conversational and human — use emojis sparingly but naturally
- If they greet you, greet them back warmly and briefly mention what you can help with
- If they ask about you, explain you're KalaSetu's assistant who helps discover Indian art
- If they thank you, be gracious
- If they ask general questions about Indian art, share your knowledge enthusiastically
- Keep responses concise (2-4 sentences for greetings, up to a short paragraph for questions)
- If their message seems like it could be product-related, gently suggest they can ask you to find specific crafts
- Use Telegram markdown: *bold*, _italic_. Do NOT use # headers.
- Always maintain a warm, cultured, Indian hospitality tone

The user said: "{user_query}"

Respond naturally:"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[prompt],
        )
        return response.text or "🙏 Namaste! How can I help you discover beautiful Indian art today?"
    except Exception as e:
        logger.error("Gemini conversation error: %s", e)
        return "🙏 Namaste! I'm KalaSetu Bot. I can help you find beautiful Indian art and crafts. Just ask me about any art form or send me a photo!"


def _gemini_product_response(user_query: str, matched_products: List[Dict[str, Any]], is_image: bool = False) -> str:
    """Use Gemini to compose a friendly, helpful product search reply."""
    if not settings.GEMINI_API_KEY:
        return _fallback_format(matched_products, is_image)

    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    if matched_products:
        product_context = "\n".join(
            f"- **{p.get('title', 'Untitled')}** | Craft: {p.get('craftType', 'N/A')} | "
            f"Region: {p.get('region', 'India')} | Price: ₹{p.get('price', 'N/A')} | "
            f"Link: {FRONTEND_URL}/product/{p.get('productId', '')}"
            for p in matched_products
        )
        prompt = f"""You are KalaSetu Bot — a friendly, conversational assistant for an Indian art marketplace.

A user {"sent an image" if is_image else f"asked: '{user_query}'"}.

We found these matching products in our catalog:
{product_context}

Respond naturally like a helpful friend:
1. React to their query warmly
2. Share the matching products with prices and clickable links
3. Add a brief, interesting tidbit about the art form if relevant
4. Invite them to keep exploring

Keep it concise and conversational (under 250 words). Use Telegram markdown (*bold*, _italic_).
Do NOT use # headers. Be warm, not corporate."""
    else:
        prompt = f"""You are KalaSetu Bot — a friendly, conversational assistant for an Indian art marketplace.

A user {"sent an image of a craft" if is_image else f"asked: '{user_query}'"}.

We could NOT find matching products in our catalog right now.

Respond warmly:
1. Acknowledge what they're looking for
2. Share something interesting about that art form if you recognize it
3. Suggest browsing the marketplace: {FRONTEND_URL}/marketplace
4. Mention they can list their own crafts too at {FRONTEND_URL}/sell

Keep it concise and friendly. Use Telegram markdown (*bold*, _italic_).
Do NOT use # headers. Be encouraging, not apologetic."""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[prompt],
        )
        return response.text or _fallback_format(matched_products, is_image)
    except Exception as e:
        logger.error("Gemini error: %s", e)
        return _fallback_format(matched_products, is_image)


def _fallback_format(products: List[Dict[str, Any]], is_image: bool = False) -> str:
    """Simple fallback formatting if Gemini is unavailable."""
    if not products:
        return (
            "🙏 I couldn't find an exact match in our catalog right now.\n\n"
            f"Browse our full collection here: {FRONTEND_URL}/marketplace"
        )

    lines = ["🎨 *Here's what I found for you:*\n"]
    for p in products:
        title = p.get("title", "Untitled")
        price = p.get("price", 0)
        craft = p.get("craftType", "")
        region = p.get("region", "")
        pid = p.get("productId", "")
        link = f"{FRONTEND_URL}/product/{pid}"

        lines.append(f"• *{title}*")
        if craft or region:
            lines.append(f"  {craft} from {region}")
        if price:
            lines.append(f"  💰 ₹{price}")
        lines.append(f"  🔗 [View Product]({link})\n")

    lines.append(f"\n🛍️ [Browse all crafts]({FRONTEND_URL}/marketplace)")
    return "\n".join(lines)


# ──────────────────────────────────────────────
# Command Handlers
# ──────────────────────────────────────────────

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command."""
    welcome = (
        "🙏 *Namaste! Welcome to KalaSetu Bot*\n\n"
        "I'm your friendly assistant for discovering authentic Indian art and crafts.\n\n"
        "Here's what I can do:\n"
        "🔍 *Find crafts* — Ask me about any art style or painting\n"
        "📷 *Identify art* — Send a photo and I'll find similar pieces\n"
        "💬 *Chat* — Ask me anything about Indian art and culture!\n\n"
        "Try saying:\n"
        '• _"Hi! What crafts do you have?"_\n'
        '• _"Tell me about Madhubani art"_\n'
        "• Or just send a photo of any craft!\n\n"
        f"🛍️ [Visit our Marketplace]({FRONTEND_URL}/marketplace)"
    )
    await update.message.reply_text(welcome, parse_mode=ParseMode.MARKDOWN, disable_web_page_preview=True)


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /help command."""
    help_text = (
        "*KalaSetu Bot — Help*\n\n"
        "💬 *Chat with me* — I love talking about Indian art!\n"
        "🔍 *Search products* — Ask if we have specific crafts\n"
        "📷 *Send a photo* — I'll identify the craft and find similar ones\n\n"
        "I can tell the difference between casual conversation and product searches, "
        "so just talk naturally!\n\n"
        "*Commands:*\n"
        "/start — Welcome message\n"
        "/help — This help message\n\n"
        f"🛍️ [Visit Marketplace]({FRONTEND_URL}/marketplace)"
    )
    await update.message.reply_text(help_text, parse_mode=ParseMode.MARKDOWN, disable_web_page_preview=True)


# ──────────────────────────────────────────────
# Text Message Handler
# ──────────────────────────────────────────────

async def handle_text_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle incoming text messages — classify intent, then chat or search."""
    user_query = update.message.text.strip()
    if not user_query:
        return

    await update.message.chat.send_action(ChatAction.TYPING)

    try:
        # 1. Classify intent: is this a product search or casual chat?
        intent = _classify_intent(user_query)
        logger.info("User query: '%s' → intent: %s", user_query[:50], intent)

        if intent == "chat":
            # Pure conversation — no product search needed
            response_text = _gemini_conversation(user_query)
            await update.message.reply_text(
                response_text,
                parse_mode=ParseMode.MARKDOWN,
                disable_web_page_preview=True,
            )
            return

        # 2. Product search flow
        embedding = get_text_embedding(user_query)

        index = _get_pinecone_text_index()
        query_result = index.query(vector=embedding, top_k=5, include_metadata=True)

        db = _get_db()
        matched_products: List[Dict[str, Any]] = []

        for match in query_result.get("matches", []):
            score = match.get("score", 0)
            if score < SIMILARITY_THRESHOLD:
                continue

            product_id = match["id"]
            meta = match.get("metadata", {})

            product = _fetch_product_from_firestore(db, product_id)
            if product and product.get("title") and product.get("title") != "Untitled":
                product["similarity"] = round(score, 3)
                matched_products.append(product)
            else:
                matched_products.append({
                    "productId": product_id,
                    "title": meta.get("title", "Untitled"),
                    "price": meta.get("price", 0),
                    "craftType": meta.get("craftType", ""),
                    "region": meta.get("region", ""),
                    "description": meta.get("description", ""),
                    "similarity": round(score, 3),
                })

        # 3. Generate conversational product response
        response_text = _gemini_product_response(user_query, matched_products[:3])

        await update.message.reply_text(
            response_text,
            parse_mode=ParseMode.MARKDOWN,
            disable_web_page_preview=False,
        )

        # 4. Send product images if available
        for product in matched_products[:3]:
            images = product.get("images", [])
            if images and images[0]:
                try:
                    await update.message.reply_photo(
                        photo=images[0],
                        caption=f"🎨 {product.get('title', '')} — ₹{product.get('price', 'N/A')}",
                    )
                except Exception:
                    pass

    except Exception as e:
        logger.error("Text handler error: %s", e, exc_info=True)
        await update.message.reply_text(
            "😅 Oops, something went wrong on my end. Let's try that again!",
        )


# ──────────────────────────────────────────────
# Image Message Handler
# ──────────────────────────────────────────────

async def handle_image_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle incoming image messages — CLIP-based visual search."""
    await update.message.chat.send_action(ChatAction.TYPING)

    try:
        photo = update.message.photo[-1]
        file = await context.bot.get_file(photo.file_id)

        image_bytes_io = io.BytesIO()
        await file.download_to_memory(image_bytes_io)
        image_bytes = image_bytes_io.getvalue()

        if not image_bytes:
            await update.message.reply_text("❌ Couldn't download the image. Please try again.")
            return

        await update.message.reply_text("🔍 Let me take a look at this... One moment!")
        await update.message.chat.send_action(ChatAction.TYPING)

        embedding = get_image_embedding(image_bytes)

        index = _get_pinecone_image_index()
        query_result = index.query(vector=embedding, top_k=5, include_metadata=True)

        db = _get_db()
        matched_products: List[Dict[str, Any]] = []

        for match in query_result.get("matches", []):
            score = match.get("score", 0)
            if score < SIMILARITY_THRESHOLD:
                continue

            product_id = match["id"]
            meta = match.get("metadata", {})

            product = _fetch_product_from_firestore(db, product_id)
            if product and product.get("title") and product.get("title") != "Untitled":
                product["similarity"] = round(score, 3)
                matched_products.append(product)
                continue

            craft_class = meta.get("class", "")
            craft_type = craft_class.replace("_", " ").title() + " Painting" if craft_class else ""
            matched_products.append({
                "productId": product_id,
                "title": f"{craft_type} by {meta.get('designer', 'Unknown Artist')}",
                "price": 0,
                "craftType": craft_type,
                "region": meta.get("location", "India"),
                "images": [meta.get("storage_url", "")] if meta.get("storage_url") else [],
                "description": f"Traditional {craft_type.lower()} from {meta.get('location', 'India')}.",
                "similarity": round(score, 3),
            })

        response_text = _gemini_product_response("", matched_products[:3], is_image=True)

        await update.message.reply_text(
            response_text,
            parse_mode=ParseMode.MARKDOWN,
            disable_web_page_preview=False,
        )

        for product in matched_products[:3]:
            images = product.get("images", [])
            if images and images[0]:
                try:
                    await update.message.reply_photo(
                        photo=images[0],
                        caption=f"🎨 {product.get('title', '')} — ₹{product.get('price', 'N/A')}",
                    )
                except Exception:
                    pass

    except Exception as e:
        logger.error("Image search error: %s", e, exc_info=True)
        await update.message.reply_text(
            "😅 Had trouble analyzing that image. Could you try a different photo?",
        )
