"""
Run this script once to seed Firestore `products` collection from
the painting images already in Firebase Storage under dataset/.

Usage:
    cd backend && python seed_products.py

Each image becomes one product document with:
  - A unique productId
  - craftType matching its Firestore category name
  - A random price between ₹500–₹2000
  - The Firebase Storage public URL as the image
"""

import sys, os, uuid, random
from datetime import datetime

sys.path.insert(0, os.path.dirname(__file__))

from app.core.firebase import init_firebase
init_firebase()

from firebase_admin import firestore as fa_firestore, storage

# Maps Storage folder → Firestore category name (craftType)
FOLDER_TO_CRAFT = {
    "dataset/madhubani":  "Madhubani Painting",
    "dataset/warli":      "Warli Painting",
    "dataset/gond":       "Gond Art",
    "dataset/kalighat":   "Kalighat Painting",
    "dataset/kangra":     "Tanjore Painting",
    "dataset/pichwai":    "Pattachitra",
    "dataset/mandana":    "Miniature Art",
    "dataset/kerala":     "Kalamkari",
}

# Maps craftType → artisan name / region for flavour
CRAFT_META = {
    "Madhubani Painting": {"region": "Bihar", "artisan": "Mithila Artists Collective"},
    "Warli Painting":     {"region": "Maharashtra", "artisan": "Palghar Tribal Art Group"},
    "Gond Art":           {"region": "Madhya Pradesh", "artisan": "Gondi Heritage Studio"},
    "Kalighat Painting":  {"region": "West Bengal", "artisan": "Kalighat Pat Artisans"},
    "Tanjore Painting":   {"region": "Tamil Nadu", "artisan": "Thanjavur Master Painters"},
    "Pattachitra":        {"region": "Odisha", "artisan": "Raghurajpur Patua Guild"},
    "Miniature Art":      {"region": "Rajasthan", "artisan": "Jaipur Miniature Studio"},
    "Kalamkari":          {"region": "Andhra Pradesh", "artisan": "Srikalahasti Kalam Arts"},
}

BUCKET_NAME = storage.bucket().name


def public_url(blob_name: str, token: str) -> str:
    return (
        f"https://firebasestorage.googleapis.com/v0/b/{BUCKET_NAME}"
        f"/o/{blob_name.replace('/', '%2F')}?alt=media&token={token}"
    )


def seed():
    db = fa_firestore.client()
    bucket = storage.bucket()
    products_ref = db.collection("products")

    # Gather existing productIds to avoid duplicates
    existing_ids = {doc.id for doc in products_ref.stream()}
    print(f"Existing products: {len(existing_ids)}")

    added = 0
    for folder, craft_type in FOLDER_TO_CRAFT.items():
        blobs = [b for b in bucket.list_blobs(prefix=folder + "/") if not b.name.endswith("/")]
        if not blobs:
            print(f"  SKIP (no images): {folder}")
            continue

        meta = CRAFT_META.get(craft_type, {"region": "India", "artisan": "Indian Artisan"})

        for blob in blobs:
            # Deterministic productId based on blob path so re-runs are idempotent
            product_id = str(uuid.uuid5(uuid.NAMESPACE_URL, blob.name))
            if product_id in existing_ids:
                print(f"  SKIP (exists): {blob.name}")
                continue

            # Ensure blob has a download token
            if not (blob.metadata or {}).get("firebaseStorageDownloadTokens"):
                token = str(uuid.uuid4())
                blob.metadata = {"firebaseStorageDownloadTokens": token}
                blob.patch()
            else:
                token = blob.metadata["firebaseStorageDownloadTokens"]

            img_url = public_url(blob.name, token)
            filename = blob.name.split("/")[-1]
            title = f"{craft_type} – {filename.rsplit('.', 1)[0].replace('_', ' ').title()}"

            stock = random.randint(1, 15)
            doc = {
                "productId": product_id,
                "artisanId": meta["artisan"],
                "title": title,
                "description": f"Authentic {craft_type} painting from {meta['region']}.",
                "price": random.randint(500, 2000),
                "currency": "INR",
                "images": [img_url],
                "craftType": craft_type,
                "region": meta["region"],
                "stock": stock,
                "rating": round(random.uniform(3.5, 5.0), 1),
                "reviewCount": 0,
                "createdAt": datetime.utcnow().isoformat(),
                "active": True,
            }

            products_ref.document(product_id).set(doc)
            existing_ids.add(product_id)
            added += 1
            print(f"  Added: {title}")

    print(f"\nDone. Added {added} new products.")


if __name__ == "__main__":
    seed()
