from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List
from google.cloud import firestore
import firebase_admin
from firebase_admin import firestore as fa_firestore
from app.schemas.firestore import CategoryBase
import uuid
import datetime

router = APIRouter()

def get_db():
    try:
        return fa_firestore.client()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("", response_model=List[CategoryBase])
def get_categories(db: firestore.Client = Depends(get_db)):
    categories_ref = db.collection('categories').where('active', '==', True)
    docs = categories_ref.stream()
    categories = []
    for doc in docs:
        data = doc.to_dict()
        categories.append(CategoryBase(**data))
    return categories

@router.get("/{category_id}", response_model=CategoryBase)
def get_category(category_id: str, db: firestore.Client = Depends(get_db)):
    doc_ref = db.collection('categories').document(category_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Category not found")
    return CategoryBase(**doc.to_dict())

@router.post("/", response_model=CategoryBase)
def create_category(category: CategoryBase, db: firestore.Client = Depends(get_db)):
    if not category.categoryId:
        category.categoryId = str(uuid.uuid4())
    doc_ref = db.collection('categories').document(category.categoryId)
    # Using mode='json' converts datetimes to ISO strings which prevents offset-naive exceptions in Firestore
    doc_ref.set(category.model_dump(mode='json'))
    return category

@router.put("/{category_id}", response_model=CategoryBase)
def update_category(category_id: str, category_update: dict, db: firestore.Client = Depends(get_db)):
    doc_ref = db.collection('categories').document(category_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Handle datetime conversion if needed in update dictionary
    doc_ref.update(category_update)
    updated_doc = doc_ref.get()
    return CategoryBase(**updated_doc.to_dict())

@router.delete("/{category_id}")
def delete_category(category_id: str, db: firestore.Client = Depends(get_db)):
    doc_ref = db.collection('categories').document(category_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Category not found")
    # Soft delete
    doc_ref.update({'active': False})
    return {"message": "Category deleted successfully"}
