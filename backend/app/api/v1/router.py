from fastapi import APIRouter

from app.api.v1.endpoints import (
    storytelling,
    catalog,
    discovery,
    live,
    recommendation,
    users,
    analytics,
    auth,
    ingest,
    categories,
    reviews,
    orders,
    payments,
)

api_router = APIRouter()

# Register routes for each functional domain
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(storytelling.router, prefix="/storytelling", tags=["Storytelling"])
api_router.include_router(catalog.router, prefix="/catalog", tags=["Catalog"])
api_router.include_router(discovery.router, prefix="/discovery", tags=["Discovery"])
api_router.include_router(live.router, prefix="/live", tags=["Live"])
api_router.include_router(recommendation.router, prefix="/recommendation", tags=["Recommendation"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(ingest.router, prefix="/ingest", tags=["Ingest"])
api_router.include_router(categories.router, prefix="/categories", tags=["Categories"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["Reviews"])
api_router.include_router(orders.router, prefix="/orders", tags=["Orders"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payments"])
