from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional

from firebase_admin import firestore as fa_firestore

_COLLECTION = "reels"
_TERMINAL_STATUSES = {"complete", "failed"}
_JOB_TIMEOUT_MINUTES = 15


def _db():
    return fa_firestore.client()


def _now_iso() -> str:
    return datetime.utcnow().isoformat()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def create_job(product_id: str, seller_id: str, image_urls: list[str]) -> str:
    """Create a new reel generation job and persist it to Firestore.

    Returns the generated job_id.
    """
    job_id = f"reel_{product_id}"
    now = datetime.utcnow()
    expires_at = now + timedelta(minutes=_JOB_TIMEOUT_MINUTES)

    job_data = {
        "jobId": job_id,
        "productId": product_id,
        "sellerId": seller_id,
        "status": "pending",
        "mode": "ffmpeg",
        "imageUrls": image_urls,
        "validImageCount": len(image_urls),
        "clipDuration": 8,
        "videoUrl": None,
        "error": None,
        "createdAt": now,
        "expiresAt": expires_at,
        "completedAt": None,
    }

    _db().collection(_COLLECTION).document(job_id).set(job_data)
    return job_id


def get_job(job_id: str) -> Optional[dict]:
    """Return the job document for *job_id*, or None if it does not exist."""
    doc = _db().collection(_COLLECTION).document(job_id).get()
    if not doc.exists:
        return None
    return doc.to_dict()


def update_job(job_id: str, **kwargs) -> None:
    """Update arbitrary fields on an existing job document.

    Common usage::

        update_job(job_id, status="scripting")
        update_job(job_id, status="complete", videoUrl=url, completedAt=datetime.utcnow())
    """
    ALLOWED_FIELDS = {"status", "mode", "videoUrl", "error", "completedAt", "validImageCount", "clipDuration", "imageUrls"}
    filtered = {k: v for k, v in kwargs.items() if k in ALLOWED_FIELDS}
    if not filtered:
        return
    _db().collection(_COLLECTION).document(job_id).update(filtered)


def get_active_job_for_product(product_id: str) -> Optional[str]:
    """Return the job_id of an active (non-terminal) job for *product_id*, or None.

    Firestore does not support a native NOT-IN filter when combined with an
    equality filter on a different field, so we query by productId and filter
    the terminal statuses in Python.
    """
    docs = (
        _db()
        .collection(_COLLECTION)
        .where("productId", "==", product_id)
        .stream()
    )
    for doc in docs:
        data = doc.to_dict() or {}
        if data.get("status") not in _TERMINAL_STATUSES:
            return data.get("jobId") or doc.id
    return None


def fail_stale_jobs() -> list[str]:
    """Mark all timed-out in-progress jobs as failed.

    A job is considered stale when it is not in a terminal status and its
    *createdAt* timestamp is older than :data:`_JOB_TIMEOUT_MINUTES` minutes.

    Returns a deduplicated list of seller_ids whose jobs were failed so that
    callers can send notifications.
    """
    cutoff = datetime.utcnow() - timedelta(minutes=_JOB_TIMEOUT_MINUTES)
    db = _db()

    # Fetch all jobs whose createdAt is before the cutoff window.
    docs = (
        db
        .collection(_COLLECTION)
        .where("createdAt", "<", cutoff)
        .stream()
    )
    notified_sellers: list[str] = []

    for doc in docs:
        data = doc.to_dict() or {}
        if data.get("status") in _TERMINAL_STATUSES:
            continue

        job_id = data.get("jobId") or doc.id
        db.collection(_COLLECTION).document(job_id).update(
            {
                "status": "failed",
                "error": "Job timed out after 15 minutes",
            }
        )

        seller_id = data.get("sellerId")
        if seller_id and seller_id not in notified_sellers:
            notified_sellers.append(seller_id)

    return notified_sellers
