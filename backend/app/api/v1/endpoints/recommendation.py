from __future__ import annotations

from fastapi import APIRouter
from fastapi.concurrency import run_in_threadpool

from app.schemas.recommendation import RecommendationRequest, RecommendationResponse
from app.services.recommendation.recommender import generate_recommendations

router = APIRouter()

@router.get('/')
async def root():
    return {'message': 'Recommendation API ready'}

@router.post('/', response_model=RecommendationResponse)
async def recommend(payload: RecommendationRequest) -> RecommendationResponse:
    return await run_in_threadpool(generate_recommendations, payload)
