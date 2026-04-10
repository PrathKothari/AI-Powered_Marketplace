"""
Craft origin detection and visual search.
POST /discovery/analyze-craft -- upload an image, get:
  1. CLIP embedding -> Pinecone similarity search -> matching products
  2. Gemini vision analysis of craft origin, technique, history
"""

import base64
import logging
from typing import Any, Dict, List

import google.generativeai as genai
from fastapi import APIRouter, File, HTTPException, UploadFile
from firebase_admin import firestore as fa_firestore
from pinecone import Pinecone

from app.core.config import settings
from app.ml.embeddings import get_image_embedding

logger = logging.getLogger(__name__)
router = APIRouter()

SIMILARITY_THRESHOLD = 0.60  # minimum cosine similarity to count as a match


def _get_pinecone_index():
    if not settings.PINECONE_API_KEY:
        raise HTTPException(status_code=500, detail="Pinecone not configured")
    pc = Pinecone(api_key=settings.PINECONE_API_KEY)
    return pc.Index(settings.PINECONE_IMAGE_INDEX)


def _get_db():
    return fa_firestore.client()


def _gemini_analyze(image_bytes: bytes, matched_products: List[Dict[str, Any]]) -> str:
    """Call Gemini with the uploaded image and optional context about matches."""
    if not settings.GEMINI_API_KEY:
        return "Gemini API key not configured. Cannot generate analysis."

    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    image_part = genai.types.Part.from_bytes(
        data=image_bytes,
        mime_type="image/jpeg",
    )

    if matched_products:
        product_context = "\n".join(
            f"- {p['title']} ({p.get('craftType', 'Unknown')}, {p.get('region', 'India')}) -- Rs.{p.get('price', 'N/A')}"
            for p in matched_products
        )
        prompt = f"""You are an expert on Indian traditional arts and crafts.

Analyze this craft image. We found similar items in our marketplace catalog:
{product_context}

Provide a rich analysis covering:
1. **Craft Name & Type** -- what art form this is
2. **Region of Origin** -- which part of India this comes from
3. **Historical Background** -- brief history and cultural significance
4. **Technique & Materials** -- how it is made, what materials are used
5. **Distinctive Features** -- what makes this style unique

Keep the analysis informative, around 150-200 words. Use markdown formatting."""
    else:
        prompt = """You are an expert on Indian traditional arts and crafts.

Analyze this craft image. We could not find an exact match in our marketplace catalog.

Provide a rich analysis covering:
1. **Craft Name & Type** -- what art form this appears to be
2. **Region of Origin** -- which part of India this likely comes from
3. **Historical Background** -- brief history and cultural significance
4. **Technique & Materials** -- how it is typically made
5. **Distinctive Features** -- what makes this style unique

End by mentioning that this particular craft is not currently available in our marketplace but the user can explore similar items.

Keep the analysis informative, around 150-200 words. Use markdown formatting."""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[image_part, prompt],
        )
        return response.text
    except Exception as e:
        logger.error("Gemini API error: %s", e)
        return f"Unable to generate analysis: {e}"


@router.post("/analyze-craft")
async def analyze_craft(image: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Upload a craft image. Returns CLIP-based similarity search results
    and a Gemini-powered craft origin analysis.
    """
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    image_bytes = await image.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 10 MB")

    # 1. Generate CLIP embedding
    try:
        embedding = get_image_embedding(image_bytes)
    except Exception as e:
        logger.error("Embedding generation failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to process image")

    # 2. Query Pinecone for similar products
    matched_products: List[Dict[str, Any]] = []
    try:
        index = _get_pinecone_index()
        query_result = index.query(vector=embedding, top_k=5, include_metadata=True)

        db = _get_db()
        for match in query_result.get("matches", []):
            score = match.get("score", 0)
            if score < SIMILARITY_THRESHOLD:
                continue
            product_id = match["id"]
            meta = match.get("metadata", {})

            # Try Firestore first for user-listed products
            doc = db.collection("products").document(product_id).get()
            if doc.exists:
                data = doc.to_dict() or {}
                if data.get("title") and data.get("title") != "Untitled":
                    matched_products.append({
                        "productId": product_id,
                        "title": data.get("title", "Untitled"),
                        "price": data.get("price", 0),
                        "craftType": data.get("craftType", ""),
                        "region": data.get("region", ""),
                        "images": data.get("images", []),
                        "description": data.get("description", ""),
                        "similarity": round(score, 3),
                    })
                    continue

            # Fall back to Pinecone metadata (seeded dataset products)
            craft_class = meta.get("class", "")
            craft_type = craft_class.replace("_", " ").title() + " Painting" if craft_class else ""
            matched_products.append({
                "productId": product_id,
                "title": f"{craft_type} by {meta.get('designer', 'Unknown Artist')}",
                "price": 0,
                "craftType": craft_type,
                "region": meta.get("location", "India"),
                "images": [meta.get("storage_url", "")] if meta.get("storage_url") else [],
                "description": f"Traditional {craft_type.lower()} from {meta.get('location', 'India')}. Created by {meta.get('designer', 'Unknown Artist')}.",
                "designer": meta.get("designer", ""),
                "similarity": round(score, 3),
            })
    except HTTPException:
        logger.warning("Pinecone not configured -- skipping similarity search")
    except Exception as e:
        logger.warning("Pinecone query failed (index may be empty): %s", e)

    # 3. Gemini vision analysis
    analysis = _gemini_analyze(image_bytes, matched_products)

    return {
        "analysis": analysis,
        "matchedProducts": matched_products,
        "hasMatch": len(matched_products) > 0,
    }
