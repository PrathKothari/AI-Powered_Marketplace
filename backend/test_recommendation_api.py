from __future__ import annotations
##

def _sample_catalog():
    return [
        {
            "productId": "p1",
            "title": "Monsoon Geometry",
            "style": "abstract",
            "theme": "nature",
            "artist": "Asha Rao",
            "colorPalette": ["indigo", "teal"],
            "price": 4200,
            "priceRange": "₹4,000 - ₹4,500",
            "rating": 4.8,
            "reviewCount": 120,
            "stock": 4,
        },
        {
            "productId": "p2",
            "title": "City Echoes",
            "style": "modern",
            "theme": "urban",
            "artist": "R. Menon",
            "colorPalette": ["charcoal", "amber"],
            "price": 3900,
            "priceRange": "₹3,500 - ₹4,000",
            "rating": 4.6,
            "reviewCount": 95,
            "stock": 6,
        },
        {
            "productId": "p3",
            "title": "Forest Whisper",
            "style": "realism",
            "theme": "nature",
            "artist": "Nina Kapoor",
            "colorPalette": ["olive", "sage"],
            "price": 6100,
            "priceRange": "₹6,000 - ₹6,500",
            "rating": 4.7,
            "reviewCount": 88,
            "stock": 3,
        },
        {
            "productId": "p4",
            "title": "Portrait in Blue",
            "style": "portrait",
            "theme": "portrait",
            "artist": "Asha Rao",
            "colorPalette": ["blue", "cream"],
            "price": 4500,
            "priceRange": "₹4,500 - ₹5,000",
            "rating": 4.5,
            "reviewCount": 60,
            "stock": 2,
        },
        {
            "productId": "p5",
            "title": "Rustic Lines",
            "style": "abstract",
            "theme": "urban",
            "artist": "Meera Seth",
            "colorPalette": ["rust", "sand"],
            "price": 4700,
            "priceRange": "₹4,500 - ₹5,000",
            "rating": 4.2,
            "reviewCount": 30,
            "stock": 5,
        },
        {
            "productId": "p6",
            "title": "Quiet Horizon",
            "style": "minimal",
            "theme": "landscape",
            "artist": "Tara Singh",
            "colorPalette": ["beige", "white"],
            "price": 2800,
            "priceRange": "₹2,500 - ₹3,000",
            "rating": 4.9,
            "reviewCount": 180,
            "stock": 10,
        },
    ]


def test_recommendations_prioritize_cart_and_exclude_cart_items(client, monkeypatch):
    from app.services.recommendation import recommender

    monkeypatch.setattr(recommender, "_fetch_catalog_items", lambda: _sample_catalog())

    response = client.post(
        "/api/v1/recommendation/",
        json={
            "limit": 5,
            "cartItems": [
                {
                    "productId": "p1",
                    "title": "Monsoon Geometry",
                    "style": "abstract",
                    "theme": "nature",
                    "artist": "Asha Rao",
                    "colorPalette": ["indigo", "teal"],
                    "price": 4200,
                }
            ],
            "pastInteractions": [
                {
                    "title": "City Echoes",
                    "style": "modern",
                    "theme": "urban",
                    "artist": "R. Menon",
                    "colorPalette": ["charcoal", "amber"],
                    "price": 3900,
                    "interactionType": "viewed",
                }
            ],
        },
    )

    assert response.status_code == 200
    body = response.json()
    recommendations = body["recommendations"]

    assert len(recommendations) == 5
    assert all(item["productId"] != "p1" for item in recommendations)
    assert recommendations[0]["title"] in {"City Echoes", "Rustic Lines", "Portrait in Blue"}
    assert any("cart" in item["reason"].lower() or "past" in item["reason"].lower() for item in recommendations)


def test_recommendations_use_past_behavior_when_cart_is_empty(client, monkeypatch):
    from app.services.recommendation import recommender

    monkeypatch.setattr(recommender, "_fetch_catalog_items", lambda: _sample_catalog())

    response = client.post(
        "/api/v1/recommendation/",
        json={
            "limit": 5,
            "pastInteractions": [
                {
                    "title": "Portrait in Blue",
                    "style": "portrait",
                    "theme": "portrait",
                    "artist": "Asha Rao",
                    "colorPalette": ["blue", "cream"],
                    "price": 4500,
                    "interactionType": "liked",
                }
            ],
        },
    )

    assert response.status_code == 200
    body = response.json()
    recommendations = body["recommendations"]

    assert len(recommendations) == 5
    assert recommendations[0]["artist"] == "Asha Rao"
    assert any("past" in item["reason"].lower() for item in recommendations)


def test_recommendations_fall_back_to_trending_when_no_signals_exist(client, monkeypatch):
    from app.services.recommendation import recommender

    trending_catalog = _sample_catalog()
    trending_catalog[0]["rating"] = 4.95
    trending_catalog[0]["reviewCount"] = 250
    trending_catalog[1]["rating"] = 4.2
    trending_catalog[1]["reviewCount"] = 10

    monkeypatch.setattr(recommender, "_fetch_catalog_items", lambda: trending_catalog)

    response = client.post(
        "/api/v1/recommendation/",
        json={"limit": 5},
    )

    assert response.status_code == 200
    body = response.json()
    recommendations = body["recommendations"]

    assert len(recommendations) == 5
    assert recommendations[0]["title"] == "Monsoon Geometry"
    assert all("popular" in item["reason"].lower() or "ratings" in item["reason"].lower() for item in recommendations)