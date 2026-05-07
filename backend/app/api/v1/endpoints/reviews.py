from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from google.cloud import firestore
from firebase_admin import firestore as fa_firestore
from pydantic import BaseModel, Field
import uuid
from datetime import datetime

router = APIRouter()


class ReviewCreate(BaseModel):
    name: str = Field(..., min_length=1)
    rating: int = Field(..., ge=1, le=5)
    comment: str = Field(..., min_length=1)


def get_db():
    try:
        return fa_firestore.client()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{product_id}", response_model=List[Dict[str, Any]])
def get_reviews(product_id: str, db: firestore.Client = Depends(get_db)):
    # No order_by — avoids requiring a composite Firestore index; sort in Python instead
    docs = (
        db.collection("reviews")
        .where("productId", "==", product_id)
        .stream()
    )
    results = [{"reviewId": doc.id, **doc.to_dict()} for doc in docs]
    results.sort(key=lambda r: r.get("createdAt", ""), reverse=True)
    return results


@router.post("/{product_id}", response_model=Dict[str, Any])
def add_review(product_id: str, review: ReviewCreate, db: firestore.Client = Depends(get_db)):
    # Check product exists
    product_ref = db.collection("products").document(product_id)
    product_doc = product_ref.get()
    if not product_doc.exists:
        raise HTTPException(status_code=404, detail="Product not found")

    # Save review
    review_id = str(uuid.uuid4())
    review_data = {
        "reviewId": review_id,
        "productId": product_id,
        "name": review.name,
        "rating": review.rating,
        "comment": review.comment,
        "createdAt": datetime.utcnow().isoformat(),
    }
    db.collection("reviews").document(review_id).set(review_data)

    # Recompute average rating across all reviews for this product
    all_reviews = list(
        db.collection("reviews").where("productId", "==", product_id).stream()
    )
    ratings = [r.to_dict().get("rating", 0) for r in all_reviews if r.to_dict()]
    new_avg = round(sum(ratings) / len(ratings), 2) if ratings else review.rating

    # Update product with new rating and reviewCount
    product_ref.update({"rating": new_avg, "reviewCount": len(ratings)})

    return review_data
