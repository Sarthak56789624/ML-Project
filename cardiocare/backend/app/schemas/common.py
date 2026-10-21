"""
Health, metadata, and standard error schemas.
"""
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = "healthy"
    model_full_loaded: bool
    model_lifestyle_loaded: bool
    model_full_version: str
    model_lifestyle_version: str
    uptime_seconds: float
    timestamp: str


class ModelInfoResponse(BaseModel):
    name: str
    version: str
    sklearn_version: str
    trained_at: str
    models_available: List[str]
    features_full: List[str]
    features_lifestyle: List[str]
    metrics_summary: Dict[str, Any]
    synthetic_data_note: str


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[Any] = None
    request_id: Optional[str] = None
