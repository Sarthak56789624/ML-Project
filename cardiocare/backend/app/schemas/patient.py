"""
Patient input schemas with strict Pydantic v2 validation.
"""
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class BPHistoryEnum(str, Enum):
    Normal = "Normal"
    Prehypertension = "Prehypertension"
    Hypertension = "Hypertension"


class MedicationEnum(str, Enum):
    ACE_Inhibitor = "ACE Inhibitor"
    Beta_Blocker = "Beta Blocker"
    Diuretic = "Diuretic"
    Other = "Other"
    None_ = "None"


class FamilyHistoryEnum(str, Enum):
    Yes = "Yes"
    No = "No"


class ExerciseLevelEnum(str, Enum):
    Low = "Low"
    Moderate = "Moderate"
    High = "High"


class SmokingStatusEnum(str, Enum):
    Smoker = "Smoker"
    Non_Smoker = "Non-Smoker"


class PatientInput(BaseModel):
    """
    Patient health and lifestyle indicators for hypertension screening.
    BP_History and Medication are optional: if BP_History is omitted,
    the engine routes to the lifestyle-only model.
    """
    Age: int = Field(..., ge=18, le=100, description="Age in years (18-100)")
    BMI: float = Field(..., ge=10.0, le=60.0, description="Body Mass Index in kg/m² (10.0-60.0)")
    Salt_Intake: float = Field(..., ge=0.0, le=25.0, description="Daily salt consumption in grams (0.0-25.0)")
    Stress_Score: int = Field(..., ge=0, le=10, description="Self-reported stress level (0-10)")
    Sleep_Duration: float = Field(..., ge=0.0, le=14.0, description="Nightly sleep duration in hours (0.0-14.0)")

    Family_History: FamilyHistoryEnum = Field(..., description="Family history of hypertension (Yes/No)")
    Exercise_Level: ExerciseLevelEnum = Field(..., description="Physical activity frequency (Low/Moderate/High)")
    Smoking_Status: SmokingStatusEnum = Field(..., description="Cigarette smoking status (Smoker/Non-Smoker)")

    BP_History: Optional[BPHistoryEnum] = Field(
        None,
        description="Past recorded blood pressure category (Normal/Prehypertension/Hypertension). Optional."
    )
    Medication: Optional[MedicationEnum] = Field(
        MedicationEnum.None_,
        description="Current anti-hypertensive medication type. Optional, defaults to None."
    )

    # Optional clinical metadata
    patient_id: Optional[str] = Field(None, max_length=64, description="Optional anonymous patient identifier")

    model_config = ConfigDict(
        use_enum_values=True,
        json_schema_extra={
            "example": {
                "Age": 52,
                "BMI": 28.4,
                "Salt_Intake": 9.5,
                "Stress_Score": 7,
                "Sleep_Duration": 5.5,
                "Family_History": "Yes",
                "Exercise_Level": "Low",
                "Smoking_Status": "Smoker",
                "BP_History": "Prehypertension",
                "Medication": "None",
            }
        }
    )


class WhatIfRequest(BaseModel):
    """
    Evaluates risk transition by applying hypothetical modifications to baseline patient.
    """
    patient: PatientInput
    overrides: dict = Field(
        ...,
        description="Field overrides (e.g. {'Salt_Intake': 5.0, 'Sleep_Duration': 8.0, 'Exercise_Level': 'High'})",
        json_schema_extra={"example": {"Salt_Intake": 5.0, "Sleep_Duration": 7.5, "Smoking_Status": "Non-Smoker"}},
    )


class GenderEnum(str, Enum):
    Female = "Female"
    Male = "Male"


class SmokingHistoryEnum(str, Enum):
    never = "never"
    no_info = "No Info"
    current = "current"
    former = "former"
    ever = "ever"
    not_current = "not current"


class DiabetesPatientInput(BaseModel):
    """
    Input schema for Type 2 Diabetes screening model.
    """
    gender: GenderEnum = Field(..., description="Biological sex (Female / Male)")
    age: float = Field(..., ge=1.0, le=110.0, description="Patient age in years (1 - 110)")
    hypertension: int = Field(..., ge=0, le=1, description="Hypertension history (0 = No, 1 = Yes)")
    heart_disease: int = Field(..., ge=0, le=1, description="Cardiovascular/Heart disease history (0 = No, 1 = Yes)")
    smoking_history: SmokingHistoryEnum = Field(..., description="Smoking status")
    bmi: float = Field(..., ge=10.0, le=75.0, description="Body Mass Index kg/m² (10.0 - 75.0)")
    HbA1c_level: float = Field(..., ge=3.5, le=14.0, description="Hemoglobin A1c percentage (3.5% - 14.0%)")
    blood_glucose_level: float = Field(..., ge=50.0, le=400.0, description="Blood glucose level in mg/dL (50 - 400)")
    patient_id: Optional[str] = Field(None, max_length=64, description="Optional patient identifier")

    model_config = ConfigDict(
        use_enum_values=True,
        json_schema_extra={
            "example": {
                "gender": "Female",
                "age": 52.0,
                "hypertension": 1,
                "heart_disease": 0,
                "smoking_history": "former",
                "bmi": 28.5,
                "HbA1c_level": 6.2,
                "blood_glucose_level": 130.0,
                "patient_id": "PT-DIAB-101",
            }
        },
    )


class UnifiedPatientInput(BaseModel):
    """
    Unified input schema for joint Hypertension & Type 2 Diabetes assessment.
    Eliminates redundant entries for shared features:
    - Age, BMI, Patient ID, Gender
    - Smoking Habit (maps to both models)
    - Blood Pressure Status (maps to both BP_History and hypertension flag)
    - Heart Disease & Family History
    """
    # Shared Demographics
    patient_id: Optional[str] = Field(None, max_length=64, description="Optional patient identifier")
    age: int = Field(..., ge=18, le=100, description="Patient age in years (18-100)")
    gender: GenderEnum = Field(GenderEnum.Female, description="Biological sex")
    bmi: float = Field(..., ge=10.0, le=60.0, description="Body Mass Index in kg/m²")

    # Shared Clinical History
    smoking_habit: str = Field("never", description="Smoking habit: 'never', 'former', 'current', or 'No Info'")
    bp_status: Optional[str] = Field("Normal", description="Blood pressure status: 'Normal', 'Prehypertension', 'Hypertension', or 'Unknown'")
    family_history_htn: FamilyHistoryEnum = Field(FamilyHistoryEnum.No, description="Family history of hypertension (Yes/No)")
    heart_disease: int = Field(0, ge=0, le=1, description="Cardiovascular / Heart disease history (0 = No, 1 = Yes)")

    # Hypertension Lifestyle Factors
    salt_intake: float = Field(6.0, ge=0.0, le=25.0, description="Daily salt intake (grams)")
    stress_score: int = Field(5, ge=0, le=10, description="Self-reported stress level (0-10)")
    sleep_duration: float = Field(7.0, ge=0.0, le=14.0, description="Sleep duration in hours (0-14)")
    exercise_level: ExerciseLevelEnum = Field(ExerciseLevelEnum.Moderate, description="Physical exercise frequency")
    medication: Optional[MedicationEnum] = Field(MedicationEnum.None_, description="Antihypertensive medication type")

    # Diabetes Glycemic Biomarkers
    hba1c_level: float = Field(5.5, ge=3.5, le=14.0, description="Glycated hemoglobin HbA1c percentage (3.5% - 14.0%)")
    blood_glucose_level: float = Field(95.0, ge=50.0, le=400.0, description="Fasting blood glucose in mg/dL (50 - 400)")

    model_config = ConfigDict(
        use_enum_values=True,
        json_schema_extra={
            "example": {
                "patient_id": "PT-UNIFIED-01",
                "age": 52,
                "gender": "Female",
                "bmi": 28.5,
                "smoking_habit": "former",
                "bp_status": "Prehypertension",
                "family_history_htn": "Yes",
                "heart_disease": 0,
                "salt_intake": 8.0,
                "stress_score": 6,
                "sleep_duration": 6.5,
                "exercise_level": "Moderate",
                "medication": "None",
                "hba1c_level": 6.1,
                "blood_glucose_level": 118.0,
            }
        },
    )

