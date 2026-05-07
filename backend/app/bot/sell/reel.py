"""Reel generation helpers for the KalaSetu Telegram sell flow."""

from __future__ import annotations

import asyncio
import logging
import os
from typing import Optional

from app.ml.pipelines.video_generator import generate_story_video

logger = logging.getLogger(__name__)

# Human-readable labels shown as captions on the sent video
STYLE_LABELS: dict[str, str] = {
    "museum_cinematic": "Museum Cinematic",
    "artisan_story": "Artisan Story",
    "editorial_premium": "Editorial Premium",
    "modern_minimal": "Modern Minimal",
}


def _run_generate_story_video(product: dict, style: str) -> dict:
    """Synchronous wrapper that calls generate_story_video with product data."""
    image_paths = product.get("images", [])
    description = product.get("description", "")
    product_name = product.get("title", "")
    return generate_story_video(
        image_paths,
        description,
        product_name=product_name,
        style_preset=style,
    )


async def generate_reel_for_product(
    product: dict,
    style: str,
    bot,
    chat_id: int,
) -> Optional[str]:
    """Generate a promotional reel for a product and send it to the user.

    Sends a "generating" notice, calls the synchronous video pipeline via an
    executor (so the event loop is not blocked), then delivers the result as a
    Telegram video message.

    Returns the public video URL/path on success, or None on failure.
    """
    style_label = STYLE_LABELS.get(style, style)

    await bot.send_message(
        chat_id=chat_id,
        text=f"Generating your reel ({style_label})... this takes ~30 seconds 🎬",
    )

    loop = asyncio.get_event_loop()
    try:
        result = await loop.run_in_executor(
            None, _run_generate_story_video, product, style
        )
    except Exception as exc:
        logger.error(
            "Reel generation failed for product '%s' (style=%s): %s",
            product.get("title", "unknown"),
            style,
            exc,
            exc_info=True,
        )
        await bot.send_message(
            chat_id=chat_id,
            text="Reel generation failed. Your listing is saved without a video.",
        )
        return None

    video_url: Optional[str] = result.get("video_url") if isinstance(result, dict) else None
    local_path: Optional[str] = result.get("local_path") if isinstance(result, dict) else None
    title = product.get("title", "Your product")
    caption = f"🎬 *{title}* — {style_label} reel"

    try:
        if video_url and video_url.startswith("http"):
            # Remote URL — pass directly to Telegram
            await bot.send_video(
                chat_id=chat_id,
                video=video_url,
                caption=caption,
                parse_mode="Markdown",
            )
            return video_url
        elif local_path and os.path.isfile(local_path):
            # Local file — read bytes and send
            with open(local_path, "rb") as fh:
                video_bytes = fh.read()
            await bot.send_video(
                chat_id=chat_id,
                video=video_bytes,
                caption=caption,
                parse_mode="Markdown",
            )
            return local_path
        elif video_url:
            # Non-http URL (e.g. /media/videos/...) — try passing as-is
            await bot.send_video(
                chat_id=chat_id,
                video=video_url,
                caption=caption,
                parse_mode="Markdown",
            )
            return video_url
        else:
            raise ValueError("generate_story_video returned neither a URL nor a local path")
    except Exception as exc:
        logger.error(
            "Failed to send reel video for product '%s': %s",
            product.get("title", "unknown"),
            exc,
            exc_info=True,
        )
        await bot.send_message(
            chat_id=chat_id,
            text="Reel generation failed. Your listing is saved without a video.",
        )
        return None
