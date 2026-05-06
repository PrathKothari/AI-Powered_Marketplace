from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.ml.pipelines.video_generator import generate_story_video


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate a local artisan product story video.")
    parser.add_argument("--image", action="append", required=True, help="Local product image path. Repeat for multiple images.")
    parser.add_argument("--name", default="Handmade Ceramic Mug")
    parser.add_argument("--price", default="Rs. 899")
    parser.add_argument("--type", default="Ceramic craft")
    parser.add_argument("--description", default="A hand-shaped ceramic mug with a soft glaze, made for slow mornings and thoughtful gifting.")
    parser.add_argument("--artisan", default="")
    parser.add_argument("--location", default="")
    parser.add_argument("--audio", default="", help="Optional existing narration audio path.")
    args = parser.parse_args()

    result = generate_story_video(
        args.image,
        args.description,
        product_name=args.name,
        price=args.price,
        product_type=args.type,
        artisan_name=args.artisan or None,
        location=args.location or None,
        tone="warm",
        style_preset="artisan_story",
        generated_narration_audio_path=args.audio or None,
    )

    print("Video URL:", result["video_url"])
    print("Local path:", result["local_path"])
    print("Storyboard:", result.get("storyboard_path"))


if __name__ == "__main__":
    main()
