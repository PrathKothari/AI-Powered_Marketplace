from __future__ import annotations

import math
import re
from collections import Counter
from statistics import mean
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

from firebase_admin import firestore as fa_firestore

from app.schemas.recommendation import (
    PaintingSignal,
    RecommendationItem,
    RecommendationRequest,
    RecommendationResponse,
)

ATTRIBUTE_WEIGHTS = {
    "style": 2.5,
    "theme": 2.0,
    "artist": 3.0,
    "colorPalette": 1.25,
}

INTERACTION_WEIGHTS = {
    "purchase": 1.0,
    "purchased": 1.0,
    "like": 0.85,
    "liked": 0.85,
    "favorite": 0.85,
    "favourited": 0.85,
    "save": 0.8,
    "saved": 0.8,
    "view": 0.55,
    "viewed": 0.55,
    "click": 0.6,
    "clicked": 0.6,
}


def _to_text_values(value: Any) -> List[str]:
    if value is None:
        return []

    if isinstance(value, str):
        parts = [part.strip() for part in re.split(r"[,/|;&]+", value) if part.strip()]
        return [part.lower() for part in (parts or [value.strip()]) if part]

    if isinstance(value, Iterable):
        values: List[str] = []
        for entry in value:
            values.extend(_to_text_values(entry))
        return values

    text = str(value).strip()
    return [text.lower()] if text else []


def _display_values(value: Any) -> List[str]:
    if value is None:
        return []

    if isinstance(value, str):
        parts = [part.strip() for part in re.split(r"[,/|;&]+", value) if part.strip()]
        return parts or [value.strip()]

    if isinstance(value, Iterable):
        values: List[str] = []
        for entry in value:
            values.extend(_display_values(entry))
        return values

    text = str(value).strip()
    return [text] if text else []


def _display_label(value: Any) -> str:
    values = _display_values(value)
    return values[0] if values else ""


def _extract_price(item: Dict[str, Any]) -> Optional[float]:
    price = item.get("price")
    if isinstance(price, (int, float)) and price > 0:
        return float(price)

    price_range = item.get("priceRange")
    if isinstance(price_range, (int, float)) and price_range > 0:
        return float(price_range)

    if isinstance(price_range, str):
        numbers = [float(match) for match in re.findall(r"\d+(?:\.\d+)?", price_range)]
        if len(numbers) >= 2:
            return float(mean(numbers[:2]))
        if len(numbers) == 1:
            return numbers[0]

    return None


def _format_price_range(price: Optional[float]) -> Optional[str]:
    if price is None:
        return None
    rounded = int(round(price / 50.0) * 50)
    lower = max(0, rounded - 150)
    upper = rounded + 150
    return f"₹{lower:,} - ₹{upper:,}"


def _normalize_item(item: PaintingSignal | Dict[str, Any], fallback_id: Optional[str] = None) -> Dict[str, Any]:
    data = item.model_dump() if isinstance(item, PaintingSignal) else dict(item)
    product_id = str(data.get("productId") or data.get("id") or fallback_id or "").strip()
    title = str(data.get("title") or data.get("name") or "Untitled Painting").strip()
    style = _display_label(data.get("style") or data.get("craftType") or data.get("artStyle"))
    theme = _display_label(data.get("theme") or data.get("category") or data.get("subject"))
    artist = _display_label(data.get("artist") or data.get("artistName") or data.get("artisanName"))
    color_palette = _display_values(data.get("colorPalette") or data.get("palette") or data.get("colors"))
    price = _extract_price(data)
    price_range = data.get("priceRange") or _format_price_range(price)

    return {
        "productId": product_id or title,
        "title": title,
        "style": style,
        "theme": theme,
        "artist": artist,
        "colorPalette": color_palette,
        "price": price,
        "priceRange": price_range,
        "rating": float(data.get("rating") or 0),
        "reviewCount": int(data.get("reviewCount") or 0),
        "stock": int(data.get("stock") or 0),
    }


def _interaction_weight(interaction_type: Optional[str]) -> float:
    if not interaction_type:
        return 0.55
    return INTERACTION_WEIGHTS.get(interaction_type.lower().strip(), 0.6)


def _build_profile(items: Sequence[PaintingSignal], *, weighted_by_interaction: bool = False) -> Dict[str, Any]:
    profile: Dict[str, Any] = {field: Counter() for field in ATTRIBUTE_WEIGHTS}
    profile["prices"] = []

    for item in items:
        weight = _interaction_weight(item.interactionType) if weighted_by_interaction else 1.0
        normalized = _normalize_item(item)

        for field in ATTRIBUTE_WEIGHTS:
            for value in _to_text_values(normalized.get(field)):
                profile[field][value] += weight

        if normalized.get("price"):
            profile["prices"].append((float(normalized["price"]), weight))

    return profile


def _average_price(profile: Dict[str, Any]) -> Optional[float]:
    prices: List[Tuple[float, float]] = profile.get("prices", [])
    if not prices:
        return None

    numerator = sum(price * weight for price, weight in prices)
    denominator = sum(weight for _, weight in prices)
    if denominator <= 0:
        return None
    return numerator / denominator


def _attribute_score(candidate: Dict[str, Any], profile: Dict[str, Any]) -> Tuple[float, List[Tuple[str, str]]]:
    score = 0.0
    hits: List[Tuple[str, str]] = []

    for field, weight in ATTRIBUTE_WEIGHTS.items():
        candidate_values = _to_text_values(candidate.get(field))
        if not candidate_values:
            continue

        counter: Counter = profile.get(field, Counter())
        total = sum(counter.values())
        if total <= 0:
            continue

        for value in candidate_values:
            if value in counter:
                contribution = weight * (counter[value] / total)
                score += contribution
                hits.append((field, value))

    return score, hits


def _price_score(candidate_price: Optional[float], preferred_price: Optional[float]) -> float:
    if candidate_price is None or preferred_price is None or preferred_price <= 0:
        return 0.0

    distance = abs(candidate_price - preferred_price)
    scale = max(candidate_price, preferred_price, 1.0)
    return max(0.0, 1.0 - (distance / scale))


def _popularity_score(candidate: Dict[str, Any]) -> float:
    rating = max(0.0, min(float(candidate.get("rating") or 0.0), 5.0)) / 5.0
    review_count = max(0.0, float(candidate.get("reviewCount") or 0.0))
    review_component = min(1.0, math.log10(review_count + 1.0) / 3.0)
    stock_component = min(1.0, float(candidate.get("stock") or 0.0) / 20.0)
    return (rating * 0.7) + (review_component * 0.25) + (stock_component * 0.05)


def _adjust_for_diversity(candidate: Dict[str, Any], selected: Sequence[Dict[str, Any]], score: float) -> float:
    penalty = 0.0
    for existing in selected:
        if candidate.get("artist") and candidate.get("artist") == existing.get("artist"):
            penalty += 0.45
        if candidate.get("style") and candidate.get("style") == existing.get("style"):
            penalty += 0.18
        if candidate.get("theme") and candidate.get("theme") == existing.get("theme"):
            penalty += 0.12
    return score - penalty


def _build_reason(
    candidate: Dict[str, Any],
    cart_hits: List[Tuple[str, str]],
    past_hits: List[Tuple[str, str]],
    price_match: bool,
    trending_only: bool,
) -> str:
    fragments: List[str] = []

    if cart_hits:
        top_fields = [value for field, value in cart_hits if field in {"style", "theme", "artist", "colorPalette"}]
        if top_fields:
            fragments.append(f"Matches your cart's {top_fields[0]} preference")
        else:
            fragments.append("Fits your current cart mix")

    if not fragments and past_hits:
        top_fields = [value for field, value in past_hits if field in {"style", "theme", "artist", "colorPalette"}]
        if top_fields:
            fragments.append(f"Aligns with your past interest in {top_fields[0]}")
        else:
            fragments.append("Reflects your past browsing pattern")

    if price_match:
        fragments.append("sits near your preferred price range")

    if not fragments and trending_only:
        fragments.append("Popular choice with strong ratings")

    if not fragments:
        fragments.append("Adds a useful bit of variety")

    reason = " and ".join(fragments)
    if not reason.endswith("."):
        reason += "."
    return reason


def _fetch_catalog_items() -> List[Dict[str, Any]]:
    try:
        db = fa_firestore.client()
        docs = db.collection("products").where("active", "==", True).stream()
    except Exception:
        return []

    items: List[Dict[str, Any]] = []
    for doc in docs:
        data = doc.to_dict() or {}
        data.setdefault("productId", doc.id)
        items.append(_normalize_item(data, doc.id))
    return items


def _candidate_items(payload: RecommendationRequest) -> List[Dict[str, Any]]:
    if payload.catalogItems is not None:
        return [_normalize_item(item) for item in payload.catalogItems]
    return _fetch_catalog_items()


def generate_recommendations(payload: RecommendationRequest) -> RecommendationResponse:
    cart_profile = _build_profile(payload.cartItems)
    past_profile = _build_profile(payload.pastInteractions, weighted_by_interaction=True)
    preferred_cart_price = _average_price(cart_profile)
    preferred_past_price = _average_price(past_profile)
    preferred_price = preferred_cart_price if preferred_cart_price is not None else preferred_past_price

    cart_ids = {
        str(item.productId or item.title).strip().lower()
        for item in payload.cartItems
        if item.productId or item.title
    }
    cart_titles = {
        str(item.title).strip().lower()
        for item in payload.cartItems
        if item.title
    }
    exclusions = {item.strip().lower() for item in payload.excludeIds if item.strip()}
    exclusions.update(cart_ids)
    exclusions.update(cart_titles)

    candidates = [candidate for candidate in _candidate_items(payload) if candidate.get("productId", "").strip().lower() not in exclusions and candidate.get("title", "").strip().lower() not in exclusions]

    if not candidates:
        return RecommendationResponse(recommendations=[])

    has_personal_signals = bool(payload.cartItems or payload.pastInteractions)

    scored_candidates: List[Dict[str, Any]] = []
    for candidate in candidates:
        cart_score, cart_hits = _attribute_score(candidate, cart_profile)
        past_score, past_hits = _attribute_score(candidate, past_profile)
        price_score = _price_score(candidate.get("price"), preferred_price)
        popularity_score = _popularity_score(candidate)

        if has_personal_signals:
            score = (cart_score * 1.0) + (past_score * 0.6) + (price_score * 1.4) + (popularity_score * 0.2)
        else:
            score = popularity_score * 1.5

        scored_candidates.append(
            {
                **candidate,
                "score": score,
                "cartHits": cart_hits,
                "pastHits": past_hits,
                "priceMatch": price_score >= 0.6,
            }
        )

    selected: List[Dict[str, Any]] = []
    remaining = scored_candidates[:]
    while remaining and len(selected) < payload.limit:
        best_index = 0
        best_score = float("-inf")
        for index, candidate in enumerate(remaining):
            adjusted_score = _adjust_for_diversity(candidate, selected, float(candidate["score"]))
            if adjusted_score > best_score:
                best_score = adjusted_score
                best_index = index

        selected.append(remaining.pop(best_index))

    recommendations = [
        RecommendationItem(
            productId=str(item.get("productId") or item.get("title") or ""),
            title=str(item.get("title") or "Untitled Painting"),
            style=item.get("style") or None,
            theme=item.get("theme") or None,
            artist=item.get("artist") or None,
            colorPalette=list(item.get("colorPalette") or []),
            priceRange=item.get("priceRange") or None,
            price=item.get("price"),
            reason=_build_reason(
                item,
                item.get("cartHits", []),
                item.get("pastHits", []),
                bool(item.get("priceMatch")),
                not has_personal_signals,
            ),
        )
        for item in selected
    ]

    return RecommendationResponse(recommendations=recommendations)