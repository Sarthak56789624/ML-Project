"""
Prediction and What-If response models.
"""
from enum import Enum
from typing import List, Optional, Any
from pydantic import BaseModel, Field


class RiskLevelEnum(str, Enum):
    Low = "Low"
    Moderate = "Moderate"
    High = "High"


class ContributingFactor(BaseModel):
    feature: str = Field(..., description="Feature identifier")
    display_name: str = Field(..., description="Human friendly feature name")
    value: Any = Field(..., description="Observed feature value")
    signed_contribution: float = Field(..., description="Signed directional impact (+ raises risk, - lowers risk)")
    impact: str = Field(..., description="'increases_risk' or 'decreases_risk'")
    human_readable: str = Field(..., description="Clinical explanation of why this factor impacts risk")


class LifestyleRecommendation(BaseModel):
    category: str = Field(..., description="Lifestyle domain (Salt, Sleep, Stress, etc.)")
    title: str = Field(..., description="Concise actionable headline")
    description: str = Field(..., description="Detailed clinical advice")
    impact_potential: str = Field(..., description="High / Moderate / Low")
    priority: int = Field(..., description="Priority ordering (1 highest)")


class PredictionResponse(BaseModel):
    probability: float = Field(..., ge=0.0, le=1.0, description="Predicted probability of hypertension (0.0 to 1.0)")
    risk_level: RiskLevelEnum = Field(..., description="Risk categorization: Low (<0.35), Moderate (0.35-0.65), High (>0.65)")
    label: str = Field(..., description="Binary classification label ('Hypertension' or 'No Hypertension')")
    threshold_used: float = Field(0.5, description="Decision threshold applied")
    model_used: str = Field(..., description="'model_full' or 'model_lifestyle'")
    model_version: str = Field(..., description="Version of the model artifact used")
    routing_explanation: str = Field(..., description="Why this model was chosen (e.g. BP history availability)")
    contributing_factors: List[ContributingFactor] = Field(..., description="Key driving factors for this specific patient")
    recommendations: List[LifestyleRecommendation] = Field(..., description="Personalized non-pharmacological advice")
    timestamp: str = Field(..., description="ISO 8601 prediction timestamp")
    prediction_id: Optional[str] = Field(None, description="Persisted prediction ID in history")


class WhatIfResponse(BaseModel):
    baseline_probability: float
    baseline_risk_level: RiskLevelEnum
    changed_probability: float
    changed_risk_level: RiskLevelEnum
    probability_delta: float
    percentage_change: float
    summary: str
    top_impact_changes: List[str]
    baseline_factors: List[ContributingFactor]
    changed_factors: List[ContributingFactor]


class DiabetesPredictionResponse(BaseModel):
    probability: float = Field(..., ge=0.0, le=1.0, description="Predicted probability of Type 2 Diabetes (0.0 to 1.0)")
    risk_level: RiskLevelEnum = Field(..., description="Risk category: Low (<0.25), Moderate (0.25-0.50), High (>0.50)")
    is_diabetic: bool = Field(..., description="Binary diagnostic indication based on optimal threshold")
    label: str = Field(..., description="Risk category headline (e.g. 'High Diabetes Risk' or 'Low Diabetes Risk')")
    threshold_used: float = Field(..., description="Optimal decision threshold calibrated from validation")
    model_used: str = Field(..., description="Model identifier (e.g. 'LightGBM Production Pipeline')")
    contributing_factors: List[ContributingFactor] = Field(..., description="Key driving clinical and physiological factors")
    recommendations: List[LifestyleRecommendation] = Field(..., description="Personalized dietary and monitoring guidelines")
    hba1c_category: str = Field(..., description="ADA classification (Normal / Prediabetes / Diabetes)")
    glucose_category: str = Field(..., description="Fasting glucose category (Normal / Prediabetes / Elevated)")
    cardiometabolic_risk_score: int = Field(..., ge=0, le=4, description="Cardiometabolic synergy score (0 to 4)")
    timestamp: str = Field(..., description="ISO 8601 prediction timestamp")
    patient_id: Optional[str] = Field(None, description="Optional patient identifier")


class CardiometabolicPredictionResponse(BaseModel):
    """
    Combined response for joint Hypertension and Diabetes risk assessment.
    """
    hypertension: PredictionResponse
    diabetes: DiabetesPredictionResponse
    combined_risk_score: float = Field(..., description="Unified cardiometabolic risk index (0.0 - 100.0)")
    combined_risk_level: RiskLevelEnum = Field(..., description="Overall cardiometabolic risk category")
    synergy_headline: str = Field(..., description="Clinical headline evaluating comorbidity synergy")
    synergy_description: str = Field(..., description="Detailed clinical analysis of concurrent cardiometabolic risks")
    top_combined_factors: List[ContributingFactor] = Field(..., description="Key driving factors across both conditions")
    unified_recommendations: List[LifestyleRecommendation] = Field(..., description="Prioritized recommendations")
    timestamp: str = Field(..., description="ISO 8601 prediction timestamp")
    patient_id: Optional[str] = Field(None, description="Optional patient identifier")

