"""
Chat API endpoint — powers the in-platform KalaSetu chatbot.

Handles text queries with intent classification, product search via Pinecone,
and conversational responses via Gemini.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import logging

from google import genai
from firebase_admin import firestore as fa_firestore
from pinecone import Pinecone

from app.core.config import settings
from app.ml.text_embeddings import get_text_embedding

logger = logging.getLogger(__name__)
router = APIRouter()

SIMILARITY_THRESHOLD = 0.50
FRONTEND_URL = "http://localhost:3001"

SYSTEM_PROMPT = """You are Kala, the friendly AI assistant for KalaSetu — an online marketplace celebrating authentic Indian art and handicrafts.

Your personality:
- You're warm, curious, and genuinely passionate about Indian art and culture
- You talk like a knowledgeable friend, not a customer service bot
- You use a casual but respectful tone — think of a young art curator at a gallery opening
- You sprinkle in cultural context naturally — you love sharing little-known facts about art traditions
- You use emojis naturally but don't overdo it (1-2 per message max)
- You keep messages concise and readable
- You NEVER use markdown headers (#). You can use **bold** and *italic* sparingly.
- If you don't know something, you're honest about it
- You occasionally ask follow-up questions to keep the conversation going
- When sharing product links, format them cleanly
- If someone asks something completely unrelated to art/crafts, you gently steer back but still answer briefly
"""

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


class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = None


class ProductMatch(BaseModel):
    productId: str
    title: str
    price: float
    craftType: str
    region: str
    description: str
    images: List[str]
    similarity: float


class ChatResponse(BaseModel):
    reply: str
    intent: str
    products: List[Dict[str, Any]]


def _classify_intent(user_query: str) -> str:
    query_lower = user_query.lower().strip()

    if query_lower in ["hi", "hello", "hey", "namaste", "thanks", "thank you", "bye", "ok", "okay"]:
        return "chat"

    for keyword in CHAT_KEYWORDS:
        if keyword in query_lower and len(user_query.split()) <= 6:
            return "chat"

    for keyword in SEARCH_KEYWORDS:
        if keyword in query_lower:
            return "search"

    return "search" if len(user_query.split()) > 3 else "chat"


def _get_db():
    return fa_firestore.client()


def _fetch_product(db, product_id: str) -> Dict[str, Any] | None:
    doc = db.collection("products").document(product_id).get()
    if doc.exists:
        data = doc.to_dict() or {}
        data.setdefault("productId", product_id)
        return data
    return None


def _search_products(query: str) -> List[Dict[str, Any]]:
    """Search for products using text embeddings and Pinecone."""
    try:
        embedding = get_text_embedding(query)
        pc = Pinecone(api_key=settings.PINECONE_API_KEY)
        index = pc.Index(settings.PINECONE_TEXT_INDEX)
        result = index.query(vector=embedding, top_k=5, include_metadata=True)

        db = _get_db()
        products = []
        for match in result.get("matches", []):
            score = match.get("score", 0)
            if score < SIMILARITY_THRESHOLD:
                continue
            product = _fetch_product(db, match["id"])
            if product:
                product["similarity"] = round(score, 3)
                products.append(product)

        return products[:3]
    except Exception as e:
        logger.error("Product search failed: %s", e)
        return []


def _gemini_respond(user_query: str, products: List[Dict[str, Any]], history: List[Dict[str, str]] | None, intent: str) -> str:
    """Generate a conversational response using Gemini."""
    if not settings.GEMINI_API_KEY:
        if products:
            return _fallback_product_response(products)
        return "🙏 Hey there! I'm Kala from KalaSetu. I help people discover amazing Indian art — ask me anything!"

    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    # Build conversation context
    history_text = ""
    if history and len(history) > 0:
        recent = history[-6:]  # Keep last 6 messages for context
        history_text = "\n".join(
            f"{'User' if m.get('role') == 'user' else 'Kala'}: {m.get('content', '')}"
            for m in recent
        )
        history_text = f"\nRecent conversation:\n{history_text}\n"

    if intent == "search" and products:
        product_info = "\n".join(
            f"- {p.get('title', 'Untitled')} | {p.get('craftType', 'N/A')} | "
            f"₹{p.get('price', 0)} | From: {p.get('region', 'India')} | "
            f"Description: {(p.get('description', '') or '')[:200]}"
            for p in products
        )
        prompt = f"""{SYSTEM_PROMPT}
{history_text}
The user asked: "{user_query}"

You searched KalaSetu and found these products:
{product_info}

Respond naturally and excitedly about what you found. Mention each product with its name, price, and a brief interesting detail. Write flowing conversational text, NOT bullet points. Keep it under 200 words. End with something engaging."""
    elif intent == "search":
        prompt = f"""{SYSTEM_PROMPT}
{history_text}
The user asked: "{user_query}"

You searched KalaSetu but couldn't find an exact match right now. Be honest but encouraging — maybe suggest they browse the marketplace or try different search terms. If you recognize the art form, share a fun fact. Keep it under 120 words."""
    else:
        prompt = f"""{SYSTEM_PROMPT}
{history_text}
The user said: "{user_query}"

Have a natural, warm conversation. Keep it to 2-4 sentences. If they're asking about art, share your passion. If it's a greeting, be warm and mention briefly what you can help with. Be genuinely engaging."""

    try:
        response = client.models.generate_content(
            model="gemini-3.1-flash-preview",
            contents=[prompt],
        )
        return response.text or _fallback_response(intent, products)
    except Exception as e:
        logger.error("Gemini error: %s", e)
        return _fallback_response(intent, products)


def _fallback_response(intent: str, products: List[Dict[str, Any]]) -> str:
    if products:
        return _fallback_product_response(products)
    if intent == "chat":
        return "🙏 Hey! I'm Kala from KalaSetu. I can help you find beautiful Indian art and crafts — just ask me about any art form!"
    return "I couldn't find an exact match, but our marketplace has hundreds of beautiful Indian crafts. Try browsing our collection!"


def _fallback_product_response(products: List[Dict[str, Any]]) -> str:
    lines = ["Here's what I found for you! 🎨\n"]
    for p in products:
        title = p.get("title", "Untitled")
        price = p.get("price", 0)
        craft = p.get("craftType", "")
        lines.append(f"**{title}** — ₹{price} ({craft})")
    lines.append("\nWant to know more about any of these?")
    return "\n".join(lines)


@router.post("/message", response_model=ChatResponse)
async def chat_message(request: ChatRequest):
    """Handle a chat message and return a conversational response with optional product matches."""
    message = request.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    intent = _classify_intent(message)
    products: List[Dict[str, Any]] = []

    if intent == "search":
        products = _search_products(message)

    reply = _gemini_respond(message, products, request.conversation_history, intent)

    # Clean products for response (only essential fields)
    clean_products = []
    for p in products:
        clean_products.append({
            "productId": p.get("productId", ""),
            "title": p.get("title", "Untitled"),
            "price": p.get("price", 0),
            "craftType": p.get("craftType", ""),
            "region": p.get("region", ""),
            "description": (p.get("description", "") or "")[:200],
            "images": p.get("images", [])[:1],
            "similarity": p.get("similarity", 0),
        })

    return ChatResponse(reply=reply, intent=intent, products=clean_products)
