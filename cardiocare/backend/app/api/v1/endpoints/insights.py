"""
Dataset insights and population analytics endpoint.
"""
from fastapi import APIRouter
from app.services.insights import get_dataset_insights

router = APIRouter()


@router.get("/insights/dataset", summary="Dataset Level Analytics & Distributions")
async def get_dataset_analytics():
    """
    Returns aggregated demographics, class balance, risk rates per category,
    numerical histograms, and correlation matrices for dashboard visualization.
    """
    data = get_dataset_insights()
    return data.get("dataset_stats", {})
