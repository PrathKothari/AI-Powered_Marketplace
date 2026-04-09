"""
Run once to add random stock (1–15) and rating (3.5–5.0) to any existing
Firestore products that don't already have those fields.

Usage:
    cd backend && python backfill_stock.py
"""

import sys, os, random
sys.path.insert(0, os.path.dirname(__file__))

from app.core.firebase import init_firebase
init_firebase()

from firebase_admin import firestore as fa_firestore


def backfill():
    db = fa_firestore.client()
    docs = list(db.collection("products").stream())
    print(f"Found {len(docs)} products")

    updated = 0
    for doc in docs:
        data = doc.to_dict() or {}
        updates = {}

        if "stock" not in data:
            updates["stock"] = random.randint(1, 15)

        if "rating" not in data:
            # Random rating between 3.5 and 5.0 (rounded to 1 decimal)
            updates["rating"] = round(random.uniform(3.5, 5.0), 1)
            updates["reviewCount"] = 0

        if updates:
            doc.reference.update(updates)
            print(f"  Updated {doc.id}: {updates}")
            updated += 1
        else:
            print(f"  SKIP {doc.id} (already complete)")

    print(f"\nDone. Updated {updated} products.")


if __name__ == "__main__":
    backfill()
