from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Literal

from app.core.config import settings

logger = logging.getLogger(__name__)

Tone = Literal["warm", "premium", "rustic", "festive", "elegant", "handmade"]
CameraEffect = Literal["slow_zoom_in", "slow_zoom_out", "pan_left", "pan_right", "hold", "detail_zoom"]
Transition = Literal["fade", "cut", "crossfade"]
TextPosition = Literal["top", "middle", "bottom"]

VALID_TONES = {"warm", "premium", "rustic", "festive", "elegant", "handmade"}
VALID_EFFECTS = {"slow_zoom_in", "slow_zoom_out", "pan_left", "pan_right", "hold", "detail_zoom"}
VALID_TRANSITIONS = {"fade", "cut", "crossfade"}
VALID_TEXT_POSITIONS = {"top", "middle", "bottom"}
SCENE_PURPOSES = ["hook", "craft_origin", "product_detail", "lifestyle_value", "price_cta"]


@dataclass(frozen=True)
class ProductStoryInput:
    product_name: str
    price: str | None
    product_type: str | None
    description: str
    image_paths: list[str]
    artisan_name: str | None = None
    location: str | None = None
    brand_name: str | None = None
    tone: str = "warm"
    duration_seconds: int | None = None
    aspect_ratio: str = "9:16"


def _compact_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def _clip_words(value: str, limit: int) -> str:
    words = [word for word in _compact_whitespace(value).split(" ") if word]
    return " ".join(words[:limit])


def build_storyboard_prompt(product: ProductStoryInput) -> str:
    image_count = len(product.image_paths)
    duration = int(product.duration_seconds or settings.STORYBOARD_DEFAULT_DURATION_SECONDS)
    price_line = product.price or "not provided"
    return f"""
You are a video creative director for local artisan marketplace products in India.

Create a warm, ethical, non-exaggerated product storytelling storyboard.

Return ONLY valid JSON. Do not return markdown. Do not explain anything.

Required JSON schema:
{{
  "title": "short title",
  "tone": "warm | premium | rustic | festive | elegant | handmade",
  "durationSeconds": {duration},
  "aspectRatio": "9:16",
  "scenes": [
    {{
      "sceneNumber": 1,
      "purpose": "hook",
      "imageIndex": 0,
      "duration": 4,
      "overlayText": "Handmade with care",
      "narrationText": "Every piece begins with a story.",
      "cameraEffect": "slow_zoom_in",
      "transition": "fade",
      "textPosition": "bottom",
      "mood": "warm"
    }}
  ]
}}

Product inputs:
- productName: {product.product_name or "Unnamed product"}
- price: {price_line}
- productType: {product.product_type or "handmade product"}
- description: {product.description}
- artisanName: {product.artisan_name or "not provided"}
- location: {product.location or "not provided"}
- brandName: {product.brand_name or "not provided"}
- imageCount: {image_count}
- targetDurationSeconds: {duration}
- aspectRatio: {product.aspect_ratio}
- preferredTone: {product.tone}

Story structure:
1. Hook: introduce the product emotionally.
2. Craft/origin: mention artisan, craft, handmade nature, or origin only if supported by inputs.
3. Product detail: highlight material, use-case, design, uniqueness, or product type.
4. Lifestyle/value: make it feel useful, beautiful, personal, or gift-worthy.
5. Price/CTA: show product name, price, and a soft call to action.

Rules:
- Generate exactly 5 scenes.
- Match scene imageIndex to available images; reuse images if fewer than 5 images.
- Keep overlayText short, ideally 2 to 6 words.
- Keep narrationText natural and concise.
- Use only these cameraEffect values: slow_zoom_in, slow_zoom_out, pan_left, pan_right, hold, detail_zoom.
- Use only these transition values: fade, cut.
- Use only these textPosition values: top, middle, bottom.
- Do not invent fake claims such as 100% organic, award-winning, ancient technique, made by women artisans, eco-friendly, or certified unless present in the input description.
- Avoid cringe marketing language and phrases like "unlock your style" or "revolutionize your life".
- Premium but simple. Suitable for Indian local artisans.
""".strip()


def _strip_json(text: str) -> str:
    text = (text or "").strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?", "", text).strip()
        text = re.sub(r"```$", "", text).strip()
    start = text.find("{")
    end = text.rfind("}")
    if start >= 0 and end >= start:
        return text[start : end + 1]
    return text


def _parse_json_object(raw_text: str) -> dict[str, Any]:
    parsed = json.loads(_strip_json(raw_text))
    if not isinstance(parsed, dict):
        raise ValueError("Storyboard response was not a JSON object")
    return parsed


def _generate_with_gemini(prompt: str) -> dict[str, Any] | None:
    if not settings.GEMINI_API_KEY:
        return None

    try:
        import google.generativeai as genai  # type: ignore

        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel(settings.GEMINI_MODEL_NAME)
        response = model.generate_content(prompt)
        return _parse_json_object(getattr(response, "text", "") or "")
    except Exception as first_error:
        logger.info("google.generativeai storyboard call unavailable: %s", first_error)

    try:
        from google import genai  # type: ignore

        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        response = client.models.generate_content(model=settings.GEMINI_MODEL_NAME, contents=prompt)
        return _parse_json_object(getattr(response, "text", "") or "")
    except Exception as second_error:
        logger.warning("Gemini storyboard generation failed: %s", second_error)
        return None


def _generate_with_openai(prompt: str) -> dict[str, Any] | None:
    if not getattr(settings, "OPENAI_API_KEY", None):
        return None

    try:
        from openai import OpenAI  # type: ignore

        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model=getattr(settings, "OPENAI_MODEL_NAME", "gpt-4o-mini"),
            messages=[
                {"role": "system", "content": "Return only valid JSON."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.6,
        )
        content = response.choices[0].message.content or ""
        return _parse_json_object(content)
    except Exception as error:
        logger.warning("OpenAI storyboard generation failed: %s", error)
        return None


def _repair_storyboard(raw_data: dict[str, Any], product: ProductStoryInput) -> dict[str, Any] | None:
    repair_prompt = f"""
Repair this storyboard into ONLY valid JSON matching the required schema.
Keep the same meaning, but fix invalid fields, missing fields, durations, and image indexes.
Do not add claims not present in product inputs.

Product:
{json.dumps(product.__dict__, ensure_ascii=False)}

Storyboard to repair:
{json.dumps(raw_data, ensure_ascii=False)}
""".strip()

    return _generate_with_gemini(repair_prompt) or _generate_with_openai(repair_prompt)


def generate_local_storyboard(product: ProductStoryInput) -> dict[str, Any]:
    name = product.product_name or "this handmade piece"
    product_type = product.product_type or "handmade piece"
    description = _compact_whitespace(product.description)
    detail = _clip_words(description, 14) or f"a thoughtfully made {product_type}"
    maker = product.artisan_name or product.brand_name or "the artisan"
    place = f" in {product.location}" if product.location else ""
    price = product.price or ""
    image_count = max(len(product.image_paths), 1)
    durations = _spread_duration(int(product.duration_seconds or settings.STORYBOARD_DEFAULT_DURATION_SECONDS), 5)

    scene_templates = [
        ("hook", f"Meet {name}", f"{name} is made to bring simple beauty into everyday moments.", "slow_zoom_in", "bottom"),
        ("craft_origin", "Made with care", f"Created by {maker}{place}, it carries the quiet value of hands-on craft.", "pan_right", "bottom"),
        ("product_detail", "Details that matter", f"The design focuses on {detail}, giving it a personal and useful character.", "detail_zoom", "bottom"),
        ("lifestyle_value", "Beautiful every day", f"Use it, gift it, or keep it close as a piece that feels thoughtful and warm.", "slow_zoom_out", "middle"),
        ("price_cta", "Bring it home", f"{name}{f' is available for {price}' if price else ' is ready to bring home'}. Choose handmade elegance for your space.", "hold", "bottom"),
    ]

    return {
        "title": f"{name} Story",
        "tone": product.tone if product.tone in VALID_TONES else "warm",
        "durationSeconds": sum(durations),
        "aspectRatio": product.aspect_ratio or "9:16",
        "scenes": [
            {
                "sceneNumber": index + 1,
                "purpose": purpose,
                "imageIndex": index % image_count,
                "duration": durations[index],
                "overlayText": overlay,
                "narrationText": narration,
                "cameraEffect": effect,
                "transition": "fade",
                "textPosition": position,
                "mood": product.tone if product.tone in VALID_TONES else "warm",
            }
            for index, (purpose, overlay, narration, effect, position) in enumerate(scene_templates)
        ],
    }


def _spread_duration(total_seconds: int, scene_count: int) -> list[int]:
    total_seconds = max(int(total_seconds), scene_count)
    base = total_seconds // scene_count
    remainder = total_seconds % scene_count
    return [base + (1 if index < remainder else 0) for index in range(scene_count)]


def _normalize_duration(value: Any, fallback: int) -> int:
    try:
        return max(int(round(float(value))), 1)
    except Exception:
        return fallback


def normalize_storyboard(
    data: dict[str, Any],
    product: ProductStoryInput,
    *,
    audio_duration_seconds: float | None = None,
) -> dict[str, Any]:
    if not product.image_paths:
        raise ValueError("At least one product image is required")

    image_count = len(product.image_paths)
    fallback = generate_local_storyboard(product)
    target_total = int(product.duration_seconds or settings.STORYBOARD_DEFAULT_DURATION_SECONDS)
    scenes_in = data.get("scenes") if isinstance(data.get("scenes"), list) else []
    fallback_scenes = fallback["scenes"]

    scenes: list[dict[str, Any]] = []
    for index in range(5):
        source = scenes_in[index] if index < len(scenes_in) and isinstance(scenes_in[index], dict) else {}
        fallback_scene = fallback_scenes[index]
        duration = _normalize_duration(source.get("duration"), fallback_scene["duration"])
        try:
            image_index = int(source.get("imageIndex", fallback_scene["imageIndex"]))
        except Exception:
            image_index = fallback_scene["imageIndex"]

        scene = {
            "sceneNumber": index + 1,
            "purpose": str(source.get("purpose") or fallback_scene["purpose"] or SCENE_PURPOSES[index]),
            "imageIndex": image_index % image_count,
            "duration": duration,
            "overlayText": _clip_words(str(source.get("overlayText") or fallback_scene["overlayText"]), 7),
            "narrationText": _compact_whitespace(str(source.get("narrationText") or fallback_scene["narrationText"])),
            "cameraEffect": str(source.get("cameraEffect") or fallback_scene["cameraEffect"]),
            "transition": str(source.get("transition") or "fade"),
            "textPosition": str(source.get("textPosition") or fallback_scene["textPosition"]),
            "mood": str(source.get("mood") or source.get("tone") or fallback_scene["mood"]),
        }
        if scene["purpose"] not in SCENE_PURPOSES:
            scene["purpose"] = SCENE_PURPOSES[index]
        if scene["cameraEffect"] not in VALID_EFFECTS:
            scene["cameraEffect"] = fallback_scene["cameraEffect"]
        if scene["transition"] not in VALID_TRANSITIONS:
            scene["transition"] = "fade"
        if scene["textPosition"] not in VALID_TEXT_POSITIONS:
            scene["textPosition"] = "bottom"
        if scene["mood"] not in VALID_TONES:
            scene["mood"] = product.tone if product.tone in VALID_TONES else "warm"
        scenes.append(scene)

    current_total = sum(int(scene["duration"]) for scene in scenes)
    desired_total = target_total
    if audio_duration_seconds and audio_duration_seconds > current_total:
        desired_total = int(round(audio_duration_seconds))

    if desired_total > current_total:
        scenes[-1]["duration"] += desired_total - current_total

    total = sum(int(scene["duration"]) for scene in scenes)
    tone = str(data.get("tone") or product.tone or fallback["tone"])
    if tone not in VALID_TONES:
        tone = fallback["tone"]

    return {
        "title": _compact_whitespace(str(data.get("title") or fallback["title"])) or "Product Story",
        "tone": tone,
        "durationSeconds": total,
        "aspectRatio": str(data.get("aspectRatio") or product.aspect_ratio or "9:16"),
        "scenes": scenes,
    }


def generate_storyboard(
    product: ProductStoryInput,
    *,
    audio_duration_seconds: float | None = None,
    debug_output_dir: str | Path | None = None,
) -> dict[str, Any]:
    if not product.image_paths:
        raise ValueError("At least one product image is required")

    provider_used = "local"
    prompt = build_storyboard_prompt(product)
    raw_data = _generate_with_gemini(prompt)
    if raw_data is not None:
        provider_used = "gemini"
    else:
        raw_data = _generate_with_openai(prompt)
        if raw_data is not None:
            provider_used = "openai"

    if raw_data is None:
        raw_data = generate_local_storyboard(product)

    try:
        storyboard = normalize_storyboard(raw_data, product, audio_duration_seconds=audio_duration_seconds)
    except Exception as error:
        logger.warning("Storyboard validation failed, attempting repair: %s", error)
        repaired = _repair_storyboard(raw_data, product)
        if repaired is not None:
            try:
                storyboard = normalize_storyboard(repaired, product, audio_duration_seconds=audio_duration_seconds)
                provider_used = f"{provider_used}_repair"
            except Exception as repair_error:
                logger.warning("Storyboard repair failed: %s", repair_error)
                storyboard = normalize_storyboard(generate_local_storyboard(product), product, audio_duration_seconds=audio_duration_seconds)
                provider_used = "local"
        else:
            storyboard = normalize_storyboard(generate_local_storyboard(product), product, audio_duration_seconds=audio_duration_seconds)
            provider_used = "local"

    storyboard["provider"] = provider_used

    if debug_output_dir:
        output_dir = Path(debug_output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        debug_path = output_dir / "storyboard.json"
        debug_path.write_text(json.dumps(storyboard, indent=2, ensure_ascii=False), encoding="utf-8")
        storyboard["debugStoryboardPath"] = str(debug_path)

    logger.info("Storyboard generated with provider=%s duration=%ss scenes=%d", provider_used, storyboard["durationSeconds"], len(storyboard["scenes"]))
    return storyboard
