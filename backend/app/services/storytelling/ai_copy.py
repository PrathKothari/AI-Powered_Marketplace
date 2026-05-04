from __future__ import annotations

import json
import re
from functools import lru_cache
from typing import Any, Dict, List

from app.core.config import settings

try:  # pragma: no cover - optional dependency/runtime configuration
    import vertexai
    from vertexai.generative_models import GenerativeModel
except Exception:  # pragma: no cover - keep local development working without Vertex AI
    vertexai = None
    GenerativeModel = None


STYLE_PRESETS: Dict[str, Dict[str, Any]] = {
    "museum_cinematic": {
        "label": "Museum Cinematic",
        "description": "Premium gallery lighting, elegant reveals, soft spotlighting, and refined pacing.",
        "visual_keywords": ["gallery light", "spotlight", "soft shadows", "luxury", "museum reveal"],
        "music_mood": "cinematic orchestral",
    },
    "artisan_story": {
        "label": "Artisan Story",
        "description": "Warm handmade energy with rich textures, human detail, and product-close storytelling.",
        "visual_keywords": ["handcrafted", "warm tones", "texture", "close-up", "authentic"],
        "music_mood": "warm ambient",
    },
    "editorial_premium": {
        "label": "Editorial Premium",
        "description": "High-fashion pacing, clean framing, bold text, and magazine-style motion.",
        "visual_keywords": ["editorial", "bold", "minimal", "clean", "refined"],
        "music_mood": "modern pulse",
    },
    "modern_minimal": {
        "label": "Modern Minimal",
        "description": "Simple, bright, and elegant with spacious layouts and concise messaging.",
        "visual_keywords": ["minimal", "bright", "spacious", "clean", "modern"],
        "music_mood": "light ambient",
    },
}


def _strip_json(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?", "", text).strip()
        text = re.sub(r"```$", "", text).strip()
    return text


def _compact_words(text: str, limit: int) -> str:
    words = [word for word in re.split(r"\s+", text.strip()) if word]
    return " ".join(words[:limit]).strip()


def _default_scene_captions(description: str, image_count: int) -> List[str]:
    product_fragment = _compact_words(description or "the product", 6)
    captions = []
    for index in range(image_count):
        if index == 0:
            captions.append(f"A closer look at {product_fragment}")
        elif index == image_count - 1:
            captions.append(f"Bring home {product_fragment}")
        else:
            captions.append(f"Elegant detail {index + 1}")
    return captions


def _normalize_scene_captions(captions: List[str], description: str, image_count: int) -> List[str]:
    cleaned = [str(item).strip() for item in captions if str(item).strip()]
    if not cleaned:
        cleaned = _default_scene_captions(description, image_count)
    while len(cleaned) < image_count:
        cleaned.append(f"Elegant detail {len(cleaned) + 1}")
    return cleaned[:image_count]


def _normalize_creative(data: Dict[str, Any], description: str, image_count: int, style_preset: str) -> Dict[str, Any]:
    preset = STYLE_PRESETS.get(style_preset, STYLE_PRESETS["museum_cinematic"])
    hook = _compact_words(str(data.get("hook") or "Discover More"), 5) or "Discover More"
    main = str(data.get("main") or description or "A premium product story.").strip()
    cta = _compact_words(str(data.get("cta") or "Shop Now"), 5) or "Shop Now"
    title = str(data.get("title") or _compact_words(description, 6) or "Product Story").strip()
    tagline = str(data.get("tagline") or "").strip()
    music_mood = str(data.get("music_mood") or preset["music_mood"]).strip()
    style_notes = str(data.get("style_notes") or preset["description"]).strip()

    visual_keywords = [str(item).strip() for item in data.get("visual_keywords", []) if str(item).strip()]
    if not visual_keywords:
        visual_keywords = list(preset["visual_keywords"])

    scene_captions = _normalize_scene_captions(list(data.get("scene_captions", [])), description, image_count)

    return {
        "title": title,
        "hook": hook,
        "main": main,
        "cta": cta,
        "tagline": tagline,
        "music_mood": music_mood,
        "style_notes": style_notes,
        "visual_keywords": visual_keywords,
        "scene_captions": scene_captions,
    }


@lru_cache(maxsize=1)
def _get_model() -> Any:
    # Prefer the simpler GEMINI_API_KEY flow (google-generativeai)
    if settings.GEMINI_API_KEY:
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            return genai.GenerativeModel(settings.GEMINI_MODEL_NAME)
        except Exception:
            pass

    # Fall back to Vertex AI if a Google Cloud project is configured
    if vertexai is not None and GenerativeModel is not None and settings.GOOGLE_CLOUD_PROJECT:
        try:
            vertexai.init(project=settings.GOOGLE_CLOUD_PROJECT, location=settings.GOOGLE_CLOUD_LOCATION)
            return GenerativeModel(settings.GEMINI_MODEL_NAME)
        except Exception:
            pass

    return None


def _fallback_copy(description: str, image_count: int, style_preset: str) -> Dict[str, Any]:
    preset = STYLE_PRESETS.get(style_preset, STYLE_PRESETS["museum_cinematic"])
    return _normalize_creative(
        {
            "hook": "Discover More",
            "main": description[:120] if description else "A premium product story.",
            "cta": "Shop Now",
            "title": _compact_words(description or "Product Story", 6),
            "tagline": "",
            "music_mood": preset["music_mood"],
            "style_notes": preset["description"],
            "visual_keywords": preset["visual_keywords"],
            "scene_captions": _default_scene_captions(description, image_count),
        },
        description,
        image_count,
        style_preset,
    )


def generate_ad_copy(
    description: str,
    *,
    image_count: int = 4,
    product_name: str | None = None,
    tone: str = "premium",
    audience: str = "online shoppers",
    style_preset: str = "museum_cinematic",
) -> Dict[str, Any]:
    preset = STYLE_PRESETS.get(style_preset, STYLE_PRESETS["museum_cinematic"])
    model = _get_model()

    if model is None:
        return _fallback_copy(description, image_count, style_preset)

    prompt = f"""
You are a senior creative director for a product promo video.

Goal:
- Create a short, premium promo for a product using uploaded product images.
- The visual language should feel inspired by a curated painting or museum-style aesthetic.
- Keep it cinematic, emotionally warm, and easy to overlay on video.

Inputs:
- product_name: {product_name or ""}
- product_description: {description}
- audience: {audience}
- tone: {tone}
- style_preset: {style_preset}
- style_notes: {preset['description']}
- image_count: {image_count}

Return ONLY valid JSON using this schema:
{{
  "title": "short title",
  "hook": "2 to 5 words",
  "main": "one cinematic sentence",
  "cta": "short call to action",
  "tagline": "optional short tagline",
  "music_mood": "short phrase",
  "style_notes": "short phrase",
  "visual_keywords": ["keyword1", "keyword2"],
  "scene_captions": ["caption for each image"]
}}

Rules:
- Keep hook and CTA short.
- Generate exactly {image_count} scene captions.
- Make every caption feel premium, elegant, and product-focused.
- Avoid markdown, code fences, and explanations.
""".strip()

    try:
        response = model.generate_content(prompt)
        raw_text = _strip_json(getattr(response, "text", "") or "")
        parsed = json.loads(raw_text)
        if not isinstance(parsed, dict):
            raise ValueError("AI response was not a JSON object")
        return _normalize_creative(parsed, description, image_count, style_preset)
    except Exception:
        return _fallback_copy(description, image_count, style_preset)


def generate_narration(
    description: str,
    *,
    product_name: str | None = None,
    tone: str = "premium",
    style_preset: str = "museum_cinematic",
    max_sentences: int = 5,
) -> str:
    """Generate a short historical narration for a product/story.

    The function attempts to use the configured model (Gemini/Vertex) and falls
    back to a simple composed description if AI is unavailable.
    """
    model = _get_model()
    # Product-first fallback when no model is available
    if model is None:
        base = f"{product_name + ' — ' if product_name else ''}{description or ''}"
        fallback_cta = "Bring it home today." if product_name else "Available now."
        short_benefit = "Handcrafted with care, offering rich texture and lasting presence."
        return (base + " " + short_benefit + " " + fallback_cta)[:1000]

    preset = STYLE_PRESETS.get(style_preset, STYLE_PRESETS["museum_cinematic"])
    prompt = f"""
You are a senior product storyteller and e-commerce copywriter. Produce a concise, product-focused audio narration (about {max_sentences} sentences) optimized for a 20-40 second social reel that highlights the product's key features, materials, craftsmanship, provenance, and the benefits of ownership. Use persuasive, benefit-led language while remaining natural and specific to the inputs. End with a short call-to-action or ownership cue (for example: "Bring it home", "Available now").

Inputs:
- product_name: {product_name or ''}
- product_description: {description}
- tone: {tone}
- style_notes: {preset['description']}

Rules:
- Prioritize tangible features (materials, size, finish), then benefits (what owning it feels/means), then provenance (handmade, origin) if present.
- Keep language concise, vivid, and actionable; avoid long historical exposition unless it supports product value.
- Include one brief CTA at the end.
- Return ONLY the narration text (no markdown, no JSON, no labels).
""".strip()

    try:
        response = model.generate_content(prompt)
        text = getattr(response, "text", "") or ""
        return text.strip()
    except Exception:
        # Best-effort product copy on error
        base = f"{product_name + ' — ' if product_name else ''}{description or ''}"
        return (base + " \u2014 Handcrafted and available now.")[:1000]