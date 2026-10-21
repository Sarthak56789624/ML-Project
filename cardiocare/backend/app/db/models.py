"""
Database models for persisting prediction history.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, Text
from app.db.database import Base


class PredictionRecord(Base):
    __tablename__ = "prediction_history"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)

    # Patient Inputs
    age = Column(Integer, nullable=False)
    bmi = Column(Float, nullable=False)
    salt_intake = Column(Float, nullable=False)
    stress_score = Column(Integer, nullable=False)
    sleep_duration = Column(Float, nullable=False)
    family_history = Column(String(10), nullable=False)
    exercise_level = Column(String(20), nullable=False)
    smoking_status = Column(String(20), nullable=False)
    bp_history = Column(String(30), nullable=True)
    medication = Column(String(30), nullable=True)
    patient_id = Column(String(64), nullable=True, index=True)

    # Prediction Outputs
    probability = Column(Float, nullable=False)
    risk_level = Column(String(20), nullable=False)
    label = Column(String(30), nullable=False)
    model_used = Column(String(30), nullable=False)

    # Serialized factors & recommendations (JSON text)
    details_json = Column(Text, nullable=True)
