from pathlib import Path

from app.api.v1.endpoints import storytelling as storytelling_endpoint


def test_generate_story_pipeline_accepts_local_image_paths(client, monkeypatch, tmp_path):
    image_path = tmp_path / "story-image.jpg"
    image_path.write_bytes(b"fake-image-bytes")

    captured = {}

    def fake_generate_story_video(image_paths, description, **kwargs):
        captured["image_paths"] = image_paths
        captured["description"] = description
        captured["kwargs"] = kwargs
        return {
            "video_url": "http://testserver/media/videos/story.mp4",
            "local_path": str(tmp_path / "story.mp4"),
            "creative": {
                "title": "Product Story",
                "hook": "Discover More",
                "main": "A cinematic product story.",
                "cta": "Shop Now",
                "tagline": "Crafted with care",
                "music_mood": "cinematic",
                "style_notes": "Warm and premium",
                "visual_keywords": ["artisan", "handmade"],
                "scene_captions": ["First scene", "Second scene"],
            },
        }

    monkeypatch.setattr(storytelling_endpoint, "generate_story_video", fake_generate_story_video)

    response = client.post(
        "/api/v1/storytelling/generate",
        json={
            "description": "A handcrafted product with rich storytelling value.",
            "image_urls": [str(image_path)],
            "product_name": "Handmade Lamp",
            "tone": "premium",
            "audience": "online shoppers",
            "style_preset": "museum_cinematic",
            "duration_per_image": 4,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["video_url"] == "http://testserver/media/videos/story.mp4"
    assert body["creative"]["title"] == "Product Story"
    assert captured["image_paths"] == [str(image_path)]
    assert captured["description"] == "A handcrafted product with rich storytelling value."
    assert captured["kwargs"]["product_name"] == "Handmade Lamp"
    assert captured["kwargs"]["style_preset"] == "museum_cinematic"