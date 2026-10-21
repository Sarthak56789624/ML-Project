"""
API v1 Router combining all endpoint modules.
"""
from fastapi import APIRouter
from app.api.v1.endpoints import (
    health,
    predict,
    batch,
    what_if,
    model,
    insights,
    history,
    diabetes,
)

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(predict.router, tags=["Predictions"])
api_router.include_router(diabetes.router, tags=["Diabetes Prediction"])
api_router.include_router(batch.router, tags=["Batch Predictions"])
api_router.include_router(what_if.router, tags=["What-If Interventions"])
api_router.include_router(model.router, tags=["Model Info & Metrics"])
api_router.include_router(insights.router, tags=["Dataset Insights"])
api_router.include_router(history.router, tags=["History"])
