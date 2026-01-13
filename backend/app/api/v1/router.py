from fastapi import APIRouter

from app.api.v1.endpoints import (
    storytelling,
    catalog,
    discovery,
    live,
    recommendation,
    users,
    analytics
)

api_router = APIRouter()

# Register routes for each functional domain
api_router.include_router(storytelling.router, prefix="/storytelling", tags=["Storytelling"])
api_router.include_router(catalog.router, prefix="/catalog", tags=["Catalog"])
api_router.include_router(discovery.router, prefix="/discovery", tags=["Discovery"])
api_router.include_router(live.router, prefix="/live", tags=["Live"])
api_router.include_router(recommendation.router, prefix="/recommendation", tags=["Recommendation"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
