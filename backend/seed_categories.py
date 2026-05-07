"""
Run this script once to seed the Firestore categories collection
with Indian art style categories for KalaSetu.

Usage:
    python seed_categories.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.main import app  # triggers Firebase init
from firebase_admin import firestore
import uuid
from datetime import datetime

CATEGORIES = [
    {
        "name": "Madhubani",
        "description": "Traditional folk painting from Mithila region of Bihar, known for intricate patterns and natural colours.",
        "imageUrl": "https://firebasestorage.googleapis.com/v0/b/ai-market-asst-1.firebasestorage.app/o/dataset%2Fmadhubani%2Fmadhubani0.jpg?alt=media&token=770c03a1-9df2-43a8-a9c7-addb89ca132a",
        "gradientTheme": "from-rose-100 to-pink-100",
    },
    {
        "name": "Warli",
        "description": "Tribal art from Maharashtra using geometric shapes to depict nature and village life.",
        "imageUrl": "",
        "gradientTheme": "from-amber-100 to-orange-100",
    },
    {
        "name": "Pattachitra",
        "description": "Classical cloth-based scroll painting from Odisha with mythological themes.",
        "imageUrl": "",
        "gradientTheme": "from-yellow-100 to-amber-100",
    },
    {
        "name": "Tanjore",
        "description": "South Indian classical painting from Thanjavur featuring gold-foil and semi-precious stones.",
        "imageUrl": "",
        "gradientTheme": "from-yellow-100 to-yellow-200",
    },
    {
        "name": "Kalamkari",
        "description": "Hand-painted or block-printed cotton fabric from Andhra Pradesh using natural dyes.",
        "imageUrl": "",
        "gradientTheme": "from-teal-100 to-cyan-100",
    },
    {
        "name": "Gond",
        "description": "Vibrant tribal art from Madhya Pradesh depicting flora, fauna, and everyday life.",
        "imageUrl": "",
        "gradientTheme": "from-green-100 to-emerald-100",
    },
    {
        "name": "Phad",
        "description": "Religious scroll painting from Rajasthan, traditionally used to narrate folk deities' stories.",
        "imageUrl": "",
        "gradientTheme": "from-orange-100 to-red-100",
    },
    {
        "name": "Pichwai",
        "description": "Intricate devotional paintings from Nathdwara, Rajasthan depicting Lord Krishna's life.",
        "imageUrl": "",
        "gradientTheme": "from-indigo-100 to-purple-100",
    },
]


def seed():
    db = firestore.client()
    categories_ref = db.collection("categories")

    # Check existing
    existing = {doc.to_dict().get("name") for doc in categories_ref.stream()}
    print(f"Existing categories: {existing}")

    added = 0
    for cat in CATEGORIES:
        if cat["name"] in existing:
            print(f"  Skipping '{cat['name']}' (already exists)")
            continue
        category_id = str(uuid.uuid4())
        doc = {
            "categoryId": category_id,
            "name": cat["name"],
            "description": cat["description"],
            "imageUrl": cat["imageUrl"],
            "gradientTheme": cat["gradientTheme"],
            "createdAt": datetime.utcnow(),
            "active": True,
        }
        categories_ref.document(category_id).set(doc)
        print(f"  Added '{cat['name']}'")
        added += 1

    print(f"\nDone. Added {added} new categories.")


if __name__ == "__main__":
    seed()
