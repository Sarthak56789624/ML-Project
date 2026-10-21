"""
Prediction history schemas.
"""
from typing import List, Optional, Any
from pydantic import BaseModel, Field
from app.schemas.prediction import RiskLevelEnum


class HistoryItem(BaseModel):
    id: str = Field(..., description="Unique record UUID")
    created_at: str = Field(..., description="Timestamp of prediction")
    age: int
    bmi: float
    salt_intake: float
    stress_score: int
    sleep_duration: float
    family_history: str
    exercise_level: str
    smoking_status: str
    bp_history: Optional[str] = None
    medication: Optional[str] = None
    probability: float
    risk_level: RiskLevelEnum
    label: str
    model_used: str
    patient_id: Optional[str] = None


class HistoryResponse(BaseModel):
    total: int
    items: List[HistoryItem]
    limit: int
    offset: int


class DeleteResponse(BaseModel):
    success: bool
    message: str
    deleted_id: str
