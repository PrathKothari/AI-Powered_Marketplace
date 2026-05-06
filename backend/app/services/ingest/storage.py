"""
storage.py — Firebase Cloud Storage upload and Firestore metadata write.
"""

import logging
import uuid
from typing import Dict, Any

from firebase_admin import storage, firestore

logger = logging.getLogger(__name__)

MEDIA_ASSETS_COLLECTION = "media_assets"


def upload_to_firebase(
    data: bytes,
    destination_path: str,
    content_type: str = "application/octet-stream",
) -> str:
    """
    Upload bytes to Firebase Cloud Storage and return the public URL.
    """
    bucket = storage.bucket()
    blob = bucket.blob(destination_path)
    blob.upload_from_string(data, content_type=content_type)
    blob.make_public()
    logger.info("Uploaded to Firebase Storage: %s", blob.public_url)
    return blob.public_url


def save_media_metadata(metadata: Dict[str, Any]) -> str:
    """
    Write a media-asset document to Firestore. Returns the document ID.
    """
    db = firestore.client()
    doc_id = metadata.get("assetId") or str(uuid.uuid4())
    metadata["assetId"] = doc_id
    db.collection(MEDIA_ASSETS_COLLECTION).document(doc_id).set(metadata)
    logger.info("Saved metadata to Firestore: %s/%s", MEDIA_ASSETS_COLLECTION, doc_id)
    return doc_id


def get_media_metadata(asset_id: str) -> Dict[str, Any] | None:
    """
    Retrieve a single media-asset document from Firestore.
    """
    db = firestore.client()
    doc = db.collection(MEDIA_ASSETS_COLLECTION).document(asset_id).get()
    if doc.exists:
        return doc.to_dict()
    return None
