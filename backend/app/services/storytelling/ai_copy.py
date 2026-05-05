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


def _normalize_narration(text: str) -> str:
    text = re.sub(r"\s+", " ", text or "").strip()
    text = text.replace("—", "-")
    return text


def _fit_word_budget(text: str, target_words: int) -> str:
    words = [word for word in _normalize_narration(text).split(" ") if word]
    if target_words <= 0:
        return ""
    if len(words) == target_words:
        return " ".join(words)
    if len(words) > target_words:
        return " ".join(words[:target_words])

    filler = [
        "It stands out for its refined finish.",
        "Every detail feels intentional and premium.",
        "It brings a calm sense of everyday luxury.",
        "Designed to be noticed and appreciated.",
    ]
    output = words[:]
    index = 0
    while len(output) < target_words:
        output.extend(filler[index % len(filler)].split())
        index += 1
    return " ".join(output[:target_words])


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
    target_seconds: int = 30,
) -> str:
    """Generate a longer, non-repetitive narration for a product story (30 seconds).

    The function attempts to use the configured model (Gemini/Vertex) with enhanced
    prompting to avoid repetition, and falls back to a diverse set of pre-written
    sentences if AI is unavailable.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    model = _get_model()
    preset = STYLE_PRESETS.get(style_preset, STYLE_PRESETS["museum_cinematic"])
    target_words = int(target_seconds * 2.5)
    target_words = max(target_words, 1)
    
    # Enhanced AI prompt for better narration generation
    if model is not None:
        prompt = f"""
You are a professional product storyteller creating narration for a 30-second social media video.

CRITICAL REQUIREMENTS:
- Generate {max_sentences} to {max_sentences + 2} complete sentences (NOT fewer)
- Target approximately {target_seconds} seconds of spoken content (~{target_words} words)
- Each sentence must introduce NEW information - ABSOLUTELY NO REPETITION
- Avoid repeating the product name (use "it" instead)
- Include a brief call-to-action at the end

PRODUCT DETAILS:
- Name: {product_name or "(unnamed product)"}
- Description: {description}
- Tone: {tone}
- Style: {preset['description']}

REQUIRED STRUCTURE:
1. Opening hook - Capture attention with a key benefit
2. Material or Origin - Describe craftsmanship or provenance
3. Design or Quality - Discuss distinctive features
4. Use or Experience - How it improves daily life
5. Emotion or Value - What it means to own
6. Final appeal - Call to action (Shop Now, Bring it Home, etc.)

STRICT RULES:
- NEVER repeat phrases or keywords (no "handcrafted handcrafted" or "premium premium")
- Each sentence must add completely new information
- Use varied, vivid language and active verbs
- Be specific about materials, techniques, or design elements
- Avoid vague adjectives unless truly necessary
- Return ONLY plain text narration (no markdown, no JSON, no explanations, no metadata)
- Minimum {target_words} words for proper duration
""".strip()

        try:
            response = model.generate_content(prompt)
            text = getattr(response, "text", "") or ""
            text = _normalize_narration(text)
            if text:
                # Validate length
                words = len(text.split())
                logger.info(f"AI narration generated: {words} words (~{words/2.5:.1f}s)")
                if words >= int(target_words * 0.7):  # Accept if 70%+ of target
                    return _fit_word_budget(text, target_words)
                else:
                    logger.warning(f"AI narration too short ({words} words < {int(target_words * 0.7)}), using fallback")
        except Exception as e:
            logger.warning(f"AI narration generation failed: {e}, using fallback")

    # Enhanced fallback narration - diverse sentences with no repetition
    logger.info("Using fallback narration generation")
    fallback_sentences = [
        f"Introducing {product_name or 'a carefully crafted product'}, where premium quality meets thoughtful design.",
        f"Crafted from {description if len(description.split()) <= 5 else 'premium materials'}, this piece embodies both elegance and durability.",
        "Every detail has been meticulously considered, from the selection of materials to the final finishing touches.",
        "The result is an object that feels as good as it looks, bringing a sense of refinement to everyday moments.",
        "Whether you're seeking a statement piece or a versatile addition to your collection, this delivers on both counts.",
        "Designed to stand the test of time, it's an investment in quality that pays dividends through years of use.",
        "The thoughtful proportions and refined aesthetic make it equally at home in contemporary or classic settings.",
        "Experience the difference when form and function unite in perfect harmony.",
        "This is more than a purchase—it's a commitment to owning something truly special.",
        "Perfect for those who understand that true luxury isn't loud; it's understated and enduring.",
        "Make it yours today and discover why discerning collectors choose pieces like this.",
        "Available now for those ready to elevate their standards.",
    ]
    
    # Build narration with sufficient length, avoiding repetition
    narration_parts = []
    words_so_far = 0
    
    for sentence in fallback_sentences:
        if words_so_far >= target_words:
            break
        narration_parts.append(sentence)
        words_so_far += len(sentence.split())
    
    narration = " ".join(narration_parts)
    
    # Ensure we have enough content (at least 70% of target)
    min_words = int(target_words * 0.7)
    if len(narration.split()) < min_words:
        extra_sentences = [
            "It's the kind of piece that becomes a favorite, noticed and appreciated by everyone who sees it.",
            "Designed for people who value substance and authenticity over trends.",
            "An excellent gift for someone special or a well-deserved treat for yourself.",
        ]
        for extra_sent in extra_sentences:
            if len(narration.split()) < min_words:
                narration += " " + extra_sent
    
    final_word_count = len(narration.split())
    logger.info(f"Fallback narration generated: {final_word_count} words (~{final_word_count/2.5:.1f}s)")
    return _fit_word_budget(narration, target_words)
