"""
Single patient risk assessment endpoint.
"""
import json
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.db.database import get_db
from app.db.models import PredictionRecord
from app.schemas.patient import PatientInput
from app.schemas.prediction import PredictionResponse
from app.services.predictor import predict_patient

router = APIRouter()


async def verify_optional_api_key(x_api_key: Optional[str] = Header(None)):
    if settings.API_KEY and x_api_key != settings.API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API Key header."
        )


@router.post(
    "/predict",
    response_model=PredictionResponse,
    summary="Predict Hypertension Risk",
    description=(
        "Evaluates a single patient record. Automatically routes to the Lifestyle model if "
        "BP_History is omitted, returning risk score, contributing drivers, and actionable advice."
    ),
    dependencies=[Depends(verify_optional_api_key)],
)
async def predict_risk(
    patient: PatientInput,
    db: AsyncSession = Depends(get_db),
):
    # Run prediction through core engine
    result = predict_patient(patient)

    # Persist to SQLite history
    record_id = str(uuid.uuid4())
    try:
        factors_json = json.dumps([f.model_dump() for f in result.contributing_factors])
        recs_json = json.dumps([r.model_dump() for r in result.recommendations])
        details = json.dumps({"factors": factors_json, "recommendations": recs_json})

        db_record = PredictionRecord(
            id=record_id,
            age=patient.Age,
            bmi=patient.BMI,
            salt_intake=patient.Salt_Intake,
            stress_score=patient.Stress_Score,
            sleep_duration=patient.Sleep_Duration,
            family_history=str(patient.Family_History.value if hasattr(patient.Family_History, "value") else patient.Family_History),
            exercise_level=str(patient.Exercise_Level.value if hasattr(patient.Exercise_Level, "value") else patient.Exercise_Level),
            smoking_status=str(patient.Smoking_Status.value if hasattr(patient.Smoking_Status, "value") else patient.Smoking_Status),
            bp_history=str(patient.BP_History.value if hasattr(patient.BP_History, "value") else patient.BP_History) if patient.BP_History else None,
            medication=str(patient.Medication.value if hasattr(patient.Medication, "value") else patient.Medication) if patient.Medication else "None",
            patient_id=patient.patient_id,
            probability=result.probability,
            risk_level=result.risk_level.value,
            label=result.label,
            model_used=result.model_used,
            details_json=details,
        )
        db.add(db_record)
        await db.commit()
        result.prediction_id = record_id
    except Exception as e:
        # Logging error without failing user prediction
        print(f"Warning: Failed to persist prediction record to DB: {e}")
        await db.rollback()

    return result
