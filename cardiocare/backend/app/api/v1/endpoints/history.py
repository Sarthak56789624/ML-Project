"""
Prediction history management endpoints.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.db.models import PredictionRecord
from app.schemas.history import HistoryResponse, HistoryItem, DeleteResponse
from app.schemas.prediction import RiskLevelEnum

router = APIRouter()


@router.get("/history", response_model=HistoryResponse, summary="Retrieve Prediction History")
async def get_history(
    limit: int = Query(50, ge=1, le=200, description="Page limit"),
    offset: int = Query(0, ge=0, description="Offset index"),
    patient_id: Optional[str] = Query(None, description="Filter by patient ID"),
    db: AsyncSession = Depends(get_db),
):
    query = select(PredictionRecord)
    if patient_id:
        query = query.where(PredictionRecord.patient_id == patient_id)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Fetch items
    query = query.order_by(desc(PredictionRecord.created_at)).limit(limit).offset(offset)
    result = await db.execute(query)
    records = result.scalars().all()

    items = [
        HistoryItem(
            id=r.id,
            created_at=r.created_at.isoformat() if r.created_at else "",
            age=r.age,
            bmi=r.bmi,
            salt_intake=r.salt_intake,
            stress_score=r.stress_score,
            sleep_duration=r.sleep_duration,
            family_history=r.family_history,
            exercise_level=r.exercise_level,
            smoking_status=r.smoking_status,
            bp_history=r.bp_history,
            medication=r.medication,
            probability=r.probability,
            risk_level=RiskLevelEnum(r.risk_level),
            label=r.label,
            model_used=r.model_used,
            patient_id=r.patient_id,
        )
        for r in records
    ]

    return HistoryResponse(
        total=total,
        items=items,
        limit=limit,
        offset=offset,
    )


@router.delete("/history/{record_id}", response_model=DeleteResponse, summary="Delete Prediction Record")
async def delete_history_item(
    record_id: str,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(PredictionRecord).where(PredictionRecord.id == record_id)
    result = await db.execute(stmt)
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prediction record with ID '{record_id}' not found."
        )

    await db.delete(record)
    await db.commit()

    return DeleteResponse(
        success=True,
        message="Record successfully deleted.",
        deleted_id=record_id,
    )
