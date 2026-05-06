import logging

from fastapi import APIRouter
from fastapi.concurrency import run_in_threadpool

from app.schemas.recommendation import RecommendationRequest, RecommendationResponse
from app.services.recommendation.recommender import generate_recommendations

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/")
async def root():
    return {"message": "Recommendation API ready"}


@router.post("/", response_model=RecommendationResponse)
async def recommend(payload: RecommendationRequest) -> RecommendationResponse:
    """
    Generate 5-8 painting recommendations based on the user's cart,
    past interactions, or — if no signals are provided — trending catalog items.
    """
    try:
        return await run_in_threadpool(generate_recommendations, payload)
    except Exception as e:
        logger.error("Recommendation generation failed: %s", e)
        return RecommendationResponse(recommendations=[])
