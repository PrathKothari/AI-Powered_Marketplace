"""
Seed Pinecone with CLIP embeddings for all products in Firestore.

Usage:
    cd backend && source venv/bin/activate
    python seed_embeddings.py

For each product that has at least one image URL, this script:
1. Downloads the first image
2. Generates a 512-dim CLIP embedding
3. Upserts the vector into the Pinecone 'product-images' index

Safe to re-run -- upsert overwrites existing vectors for the same ID.
"""

import os
import sys
import requests
import logging

# Add project root so app imports work
sys.path.insert(0, os.path.dirname(__file__))

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
logger = logging.getLogger(__name__)


def main():
    # Import after path setup
    from app.core.config import settings
    from app.core.firebase import init_firebase
    from app.ml.embeddings import get_image_embedding
    from firebase_admin import firestore as fa_firestore
    from pinecone import Pinecone, ServerlessSpec

    init_firebase()
    db = fa_firestore.client()

    # Connect to Pinecone
    if not settings.PINECONE_API_KEY:
        logger.error("PINECONE_API_KEY not set in .env")
        return

    pc = Pinecone(api_key=settings.PINECONE_API_KEY)
    index_name = settings.PINECONE_IMAGE_INDEX

    # Create index if it doesn't exist (512-dim, cosine)
    existing_indexes = [idx.name for idx in pc.list_indexes()]
    if index_name not in existing_indexes:
        logger.info("Creating Pinecone index '%s' (512-dim, cosine)...", index_name)
        pc.create_index(
            name=index_name,
            dimension=512,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1"),
        )
        logger.info("Index created.")
    else:
        logger.info("Pinecone index '%s' already exists.", index_name)

    index = pc.Index(index_name)

    # Get all products
    docs = db.collection("products").stream()
    products = []
    for doc in docs:
        data = doc.to_dict()
        if data:
            data["_doc_id"] = doc.id
            products.append(data)

    logger.info("Found %d products in Firestore.", len(products))

    success = 0
    skipped = 0
    failed = 0

    for p in products:
        pid = p.get("productId") or p["_doc_id"]
        images = p.get("images", [])

        if not images or not images[0] or images[0].startswith("blob:"):
            logger.info("  SKIP %s (%s) -- no valid image URL", pid, p.get("title", "?"))
            skipped += 1
            continue

        image_url = images[0]
        logger.info("  Processing %s (%s)...", pid, p.get("title", "?"))

        try:
            resp = requests.get(image_url, timeout=30)
            resp.raise_for_status()
            image_bytes = resp.content

            embedding = get_image_embedding(image_bytes)

            index.upsert(vectors=[{
                "id": pid,
                "values": embedding,
                "metadata": {
                    "title": p.get("title", ""),
                    "craftType": p.get("craftType", ""),
                    "region": p.get("region", ""),
                },
            }])

            success += 1
            logger.info("    OK (embedded %d dims)", len(embedding))

        except Exception as e:
            logger.error("    FAIL: %s", e)
            failed += 1

    logger.info("Done. Success=%d  Skipped=%d  Failed=%d", success, skipped, failed)


if __name__ == "__main__":
    main()
