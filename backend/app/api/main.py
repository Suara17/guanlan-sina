from fastapi import APIRouter

from app.api.routes import (
    anomalies,
    cases,
    items,
    knowledge_graph,
    login,
    private,
    production,
    simulation,
    solutions,
    tianchou,
    users,
    utils,
)
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(items.router)
api_router.include_router(production.router, prefix="/production", tags=["production"])
api_router.include_router(anomalies.router, prefix="/anomalies", tags=["anomalies"])
api_router.include_router(solutions.router, prefix="/solutions", tags=["solutions"])
api_router.include_router(cases.router, prefix="/cases", tags=["cases"])

# 注册天筹优化路由
api_router.include_router(tianchou.router, prefix="/tianchou", tags=["tianchou"])

# 注册异常模拟路由
api_router.include_router(simulation.router, prefix="/simulation", tags=["simulation"])

# 注册知识图谱路由
if settings.neo4j_enabled:
    api_router.include_router(
        knowledge_graph.router,
        prefix="/knowledge-graph",
        tags=["knowledge-graph"],
    )

if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
