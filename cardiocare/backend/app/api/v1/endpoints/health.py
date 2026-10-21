"""
Health and uptime check endpoint.
"""
import time
from datetime import datetime, timezone
from fastapi import APIRouter
from app.core.config import settings
from app.schemas.common import HealthResponse
from app.services.predictor import MODELS

router = APIRouter()
START_TIME = time.time()


@router.get("/health", response_model=HealthResponse, summary="System Health & Model Status")
async def health_check():
    model_full_loaded = "model_full" in MODELS
    model_life_loaded = "model_lifestyle" in MODELS

    v_full = MODELS.get("model_full", {}).get("version", "unknown") if model_full_loaded else "not_loaded"
    v_life = MODELS.get("model_lifestyle", {}).get("version", "unknown") if model_life_loaded else "not_loaded"

    return HealthResponse(
        status="healthy" if (model_full_loaded and model_life_loaded) else "degraded",
        model_full_loaded=model_full_loaded,
        model_lifestyle_loaded=model_life_loaded,
        model_full_version=v_full,
        model_lifestyle_version=v_life,
        uptime_seconds=round(time.time() - START_TIME, 2),
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
