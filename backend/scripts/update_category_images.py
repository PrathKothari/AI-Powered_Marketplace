"""
Updates Firestore category documents with public image URLs from Firebase Storage.
Maps each category name to its dataset folder, picks the first image, and updates the doc.
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.firebase import init_firebase
init_firebase()

from firebase_admin import firestore as fa_firestore, storage

# Map Firestore category names to Storage dataset folders
CATEGORY_IMAGE_MAP = {
    "Madhubani Painting": "dataset/madhubani",
    "Warli Painting":     "dataset/warli",
    "Gond Art":           "dataset/gond",
    "Kalighat Painting":  "dataset/kalighat",
    "Tanjore Painting":   "dataset/kangra",    # closest available
    "Pattachitra":        "dataset/pichwai",   # closest available
    "Miniature Art":      "dataset/mandana",   # closest available
    "Kalamkari":          "dataset/kerala",    # closest available
}

def get_public_url(blob_name: str, bucket_name: str) -> str:
    return (
        f"https://firebasestorage.googleapis.com/v0/b/{bucket_name}"
        f"/o/{blob_name.replace('/', '%2F')}?alt=media"
    )

def update_category_images():
    db = fa_firestore.client()
    bucket = storage.bucket()

    # Fetch all active categories
    docs = db.collection("categories").where("active", "==", True).stream()
    categories = {doc.to_dict()["name"]: doc for doc in docs}

    for cat_name, folder in CATEGORY_IMAGE_MAP.items():
        if cat_name not in categories:
            print(f"  SKIP: '{cat_name}' not found in Firestore")
            continue

        # Get the first image blob from the folder
        blobs = list(bucket.list_blobs(prefix=folder + "/"))
        image_blobs = [b for b in blobs if not b.name.endswith("/")]
        if not image_blobs:
            print(f"  SKIP: no images in {folder}")
            continue

        blob = image_blobs[0]
        import uuid
        token = str(uuid.uuid4())
        blob.metadata = {"firebaseStorageDownloadTokens": token}
        blob.patch()
        public_url = (
            f"https://firebasestorage.googleapis.com/v0/b/{bucket.name}"
            f"/o/{blob.name.replace('/', '%2F')}?alt=media&token={token}"
        )

        # Update Firestore document
        doc = categories[cat_name]
        doc.reference.update({"imageUrl": public_url})
        print(f"  Updated '{cat_name}' -> {public_url}")

    print("\nDone!")

if __name__ == "__main__":
    update_category_images()
