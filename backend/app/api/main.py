from fastapi import APIRouter

from app.api.routes import anomalies, items, login, private, production, users, utils
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(items.router)
api_router.include_router(production.router, prefix="/production", tags=["production"])
api_router.include_router(anomalies.router, prefix="/anomalies", tags=["anomalies"])


if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
