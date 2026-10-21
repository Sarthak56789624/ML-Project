"""
Diabetes risk assessment and model evaluation endpoints.
"""
import os
import json
from fastapi import APIRouter, HTTPException, status
from app.core.config import settings
from app.schemas.patient import DiabetesPatientInput, UnifiedPatientInput
from app.schemas.prediction import DiabetesPredictionResponse, CardiometabolicPredictionResponse
from app.services.predictor import predict_diabetes, predict_cardiometabolic

router = APIRouter()


@router.post(
    "/predict/cardiometabolic",
    response_model=CardiometabolicPredictionResponse,
    summary="Integrated Cardiometabolic Risk Screening",
    description=(
        "Simultaneously screens for both Hypertension and Type 2 Diabetes risk from unified "
        "patient demographics, lifestyle indicators, and metabolic biomarkers without entering shared data twice."
    ),
)
async def predict_cardiometabolic_risk(patient: UnifiedPatientInput):
    try:
        return predict_cardiometabolic(patient)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cardiometabolic screening error: {str(e)}",
        )



@router.post(
    "/predict/diabetes",
    response_model=DiabetesPredictionResponse,
    summary="Predict Type 2 Diabetes Risk",
    description=(
        "Evaluates a single patient's metabolic, demographic, and glycemic biomarkers "
        "(HbA1c, fasting glucose, BMI, hypertension, heart disease history) using the tuned "
        "LightGBM pipeline."
    ),
)
async def predict_diabetes_risk(patient: DiabetesPatientInput):
    try:
        return predict_diabetes(patient)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Diabetes risk prediction error: {str(e)}",
        )


@router.get(
    "/diabetes/metrics",
    summary="Diabetes Model Performance Metrics",
    description="Returns cross-validated test metrics, ROC-AUC, PR-AUC, confusion matrix parameters, and feature importances.",
)
async def get_diabetes_metrics():
    path = settings.DIABETES_METRICS_PATH
    if not os.path.exists(path):
        # Fallback check
        candidates = [
            "cardiocare/ml/artifacts/diabetes_metrics.json",
            "../ml/artifacts/diabetes_metrics.json",
            os.path.join(settings.BASE_DIR, "cardiocare", "ml", "artifacts", "diabetes_metrics.json"),
        ]
        for c in candidates:
            if os.path.exists(c):
                path = c
                break

    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Diabetes metrics file not found.",
    )
