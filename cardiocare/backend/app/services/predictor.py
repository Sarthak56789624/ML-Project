"""
CardioCare core prediction service.
Loads both models on startup, routes predictions, computes what-if scenarios,
and processes batch CSV inputs.
"""
import io
import os
import sys
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Tuple, List
import joblib
import pandas as pd
import numpy as np

# Ensure ml module is accessible
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
APP_DIR = os.path.dirname(CURRENT_DIR)
BACKEND_DIR = os.path.dirname(APP_DIR)
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)
ML_DIR = os.path.join(PROJECT_ROOT, "ml")

if ML_DIR not in sys.path:
    sys.path.insert(0, ML_DIR)

try:
    from features import (
        engineer_features,
        FULL_FEATURES,
        LIFESTYLE_FEATURES,
    )
    from features_diabetes import (
        engineer_diabetes_features,
        ALL_FEATURES as DIABETES_ALL_FEATURES,
    )
except ImportError:
    # Fallback to local import if ml is located relative to current working directory
    from cardiocare.ml.features import (
        engineer_features,
        FULL_FEATURES,
        LIFESTYLE_FEATURES,
    )
    from cardiocare.ml.features_diabetes import (
        engineer_diabetes_features,
        ALL_FEATURES as DIABETES_ALL_FEATURES,
    )

from app.core.config import settings
from app.schemas.patient import (
    PatientInput,
    DiabetesPatientInput,
    UnifiedPatientInput,
    SmokingStatusEnum,
    BPHistoryEnum,
    MedicationEnum,
)
from app.schemas.prediction import (
    PredictionResponse,
    RiskLevelEnum,
    WhatIfResponse,
    DiabetesPredictionResponse,
    CardiometabolicPredictionResponse,
    ContributingFactor,
    LifestyleRecommendation,
)
from app.services.explainer import explain_prediction
from app.services.insights import generate_recommendations

# Global model store
MODELS: Dict[str, Any] = {}
METADATA: Dict[str, Any] = {}


def load_models():
    """Loads model_full and model_lifestyle into memory."""
    global MODELS, METADATA

    full_path = settings.MODEL_FULL_PATH
    life_path = settings.MODEL_LIFESTYLE_PATH

    # Search fallbacks if running in different relative directories
    if not os.path.exists(full_path):
        candidates_full = [
            os.path.join(ML_DIR, "artifacts", "model_full.joblib"),
            os.path.join(PROJECT_ROOT, "cardiocare", "ml", "artifacts", "model_full.joblib"),
            "cardiocare/ml/artifacts/model_full.joblib",
            "../ml/artifacts/model_full.joblib",
        ]
        for c in candidates_full:
            if os.path.exists(c):
                full_path = c
                break

    if not os.path.exists(life_path):
        candidates_life = [
            os.path.join(ML_DIR, "artifacts", "model_lifestyle.joblib"),
            os.path.join(PROJECT_ROOT, "cardiocare", "ml", "artifacts", "model_lifestyle.joblib"),
            "cardiocare/ml/artifacts/model_lifestyle.joblib",
            "../ml/artifacts/model_lifestyle.joblib",
        ]
        for c in candidates_life:
            if os.path.exists(c):
                life_path = c
                break

    if os.path.exists(full_path):
        MODELS["model_full"] = joblib.load(full_path)
        print(f"Loaded model_full successfully from {full_path}")
    else:
        print(f"WARNING: model_full not found at {full_path}")

    if os.path.exists(life_path):
        MODELS["model_lifestyle"] = joblib.load(life_path)
        print(f"Loaded model_lifestyle successfully from {life_path}")
    else:
        print(f"WARNING: model_lifestyle not found at {life_path}")

    # Load Diabetes model
    diabetes_path = settings.MODEL_DIABETES_PATH
    if not os.path.exists(diabetes_path):
        candidates_diab = [
            os.path.join(ML_DIR, "artifacts", "model_diabetes.joblib"),
            os.path.join(PROJECT_ROOT, "cardiocare", "ml", "artifacts", "model_diabetes.joblib"),
            "cardiocare/ml/artifacts/model_diabetes.joblib",
            "../ml/artifacts/model_diabetes.joblib",
        ]
        for c in candidates_diab:
            if os.path.exists(c):
                diabetes_path = c
                break

    if os.path.exists(diabetes_path):
        MODELS["model_diabetes"] = joblib.load(diabetes_path)
        print(f"Loaded model_diabetes successfully from {diabetes_path}")
    else:
        print(f"WARNING: model_diabetes not found at {diabetes_path}")


def get_risk_level(prob: float) -> RiskLevelEnum:
    if prob < 0.35:
        return RiskLevelEnum.Low
    elif prob <= 0.65:
        return RiskLevelEnum.Moderate
    else:
        return RiskLevelEnum.High


def patient_to_df(patient: PatientInput) -> pd.DataFrame:
    data = {
        "Age": [patient.Age],
        "BMI": [patient.BMI],
        "Salt_Intake": [patient.Salt_Intake],
        "Stress_Score": [patient.Stress_Score],
        "Sleep_Duration": [patient.Sleep_Duration],
        "Family_History": [patient.Family_History.value if hasattr(patient.Family_History, "value") else patient.Family_History],
        "Exercise_Level": [patient.Exercise_Level.value if hasattr(patient.Exercise_Level, "value") else patient.Exercise_Level],
        "Smoking_Status": [patient.Smoking_Status.value if hasattr(patient.Smoking_Status, "value") else patient.Smoking_Status],
    }

    if patient.BP_History:
        data["BP_History"] = [patient.BP_History.value if hasattr(patient.BP_History, "value") else patient.BP_History]
    else:
        data["BP_History"] = [None]

    if patient.Medication:
        data["Medication"] = [patient.Medication.value if hasattr(patient.Medication, "value") else patient.Medication]
    else:
        data["Medication"] = ["None"]

    df = pd.DataFrame(data)
    return engineer_features(df)


def predict_patient(patient: PatientInput) -> PredictionResponse:
    """
    Core inference pipeline:
    1. Checks if BP_History is present.
    2. Routes to model_full or model_lifestyle.
    3. Computes probability, risk tier, contributing factors, recommendations.
    """
    has_bp_history = patient.BP_History is not None and str(patient.BP_History).strip() != ""

    if has_bp_history and "model_full" in MODELS:
        model_key = "model_full"
        bundle = MODELS["model_full"]
        feature_set = bundle.get("features", FULL_FEATURES)
        routing_explanation = (
            "Complete blood pressure history provided; evaluated using the high-precision "
            "clinical model (Full Model, ROC-AUC ~0.999)."
        )
    elif "model_lifestyle" in MODELS:
        model_key = "model_lifestyle"
        bundle = MODELS["model_lifestyle"]
        feature_set = bundle.get("features", LIFESTYLE_FEATURES)
        routing_explanation = (
            "BP History not specified or unknown; routed to the Lifestyle-focused model "
            "(ROC-AUC ~0.740) which evaluates cardiovascular risk solely from behavioral and metabolic factors."
        )
    else:
        raise RuntimeError("No model artifacts are loaded in memory.")

    model = bundle["model"]
    engineered_df = patient_to_df(patient)

    # Ensure all required columns exist
    X_input = engineered_df[feature_set]
    probs = model.predict_proba(X_input)[:, 1]
    probability = float(round(probs[0], 4))

    risk_level = get_risk_level(probability)
    label = "Hypertension" if probability >= 0.5 else "No Hypertension"

    # Explain factors
    contributing_factors = explain_prediction(bundle, engineered_df, probability, feature_set)

    # Clinical lifestyle recommendations
    recs = generate_recommendations(patient, probability, risk_level.value)

    now_iso = datetime.now(timezone.utc).isoformat()

    return PredictionResponse(
        probability=probability,
        risk_level=risk_level,
        label=label,
        threshold_used=0.5,
        model_used=model_key,
        model_version=bundle.get("version", "1.0.0"),
        routing_explanation=routing_explanation,
        contributing_factors=contributing_factors,
        recommendations=recs,
        timestamp=now_iso,
        prediction_id=None,
    )


def predict_what_if_scenario(patient: PatientInput, overrides: dict) -> WhatIfResponse:
    """
    Calculates the impact of hypothetical lifestyle adjustments:
    compares baseline patient probability against the modified patient.
    """
    baseline_pred = predict_patient(patient)

    # Apply overrides
    patient_dict = patient.model_dump()
    for k, v in overrides.items():
        if k in patient_dict and v is not None:
            patient_dict[k] = v

    modified_patient = PatientInput(**patient_dict)
    changed_pred = predict_patient(modified_patient)

    prob_delta = round(changed_pred.probability - baseline_pred.probability, 4)
    pct_change = round(
        ((changed_pred.probability - baseline_pred.probability) / (baseline_pred.probability + 1e-6)) * 100,
        1,
    )

    # Generate comparative narrative
    impact_items = []
    for k, v in overrides.items():
        orig_v = getattr(patient, k, None)
        if orig_v != v:
            impact_items.append(f"{k.replace('_', ' ')}: {orig_v} → {v}")

    if prob_delta < -0.01:
        direction = f"reduces risk by {abs(pct_change):.1f}% (down from {baseline_pred.probability:.1%} to {changed_pred.probability:.1%})"
    elif prob_delta > 0.01:
        direction = f"increases risk by {abs(pct_change):.1f}% (up from {baseline_pred.probability:.1%} to {changed_pred.probability:.1%})"
    else:
        direction = f"keeps predicted risk stable at {changed_pred.probability:.1%}"

    summary = f"Simulated modifications {direction}."

    return WhatIfResponse(
        baseline_probability=baseline_pred.probability,
        baseline_risk_level=baseline_pred.risk_level,
        changed_probability=changed_pred.probability,
        changed_risk_level=changed_pred.risk_level,
        probability_delta=prob_delta,
        percentage_change=pct_change,
        summary=summary,
        top_impact_changes=impact_items,
        baseline_factors=baseline_pred.contributing_factors,
        changed_factors=changed_pred.contributing_factors,
    )


def process_batch_csv(csv_content: str) -> Tuple[List[Dict[str, Any]], str, int, int]:
    """
    Validates and predicts up to 5,000 records from uploaded CSV.
    Returns: (results_list, output_csv_string, valid_count, error_count)
    """
    df = pd.read_csv(io.StringIO(csv_content))
    if len(df) > 5000:
        raise ValueError(f"Batch size exceeds maximum limit of 5,000 rows (got {len(df)}).")

    results = []
    output_rows = []
    valid_count = 0
    error_count = 0

    for idx, row in df.iterrows():
        try:
            # Map columns
            row_dict = row.to_dict()
            # Clean nan
            cleaned = {k: (None if pd.isna(v) else v) for k, v in row_dict.items()}

            patient = PatientInput(
                Age=int(cleaned["Age"]),
                BMI=float(cleaned["BMI"]),
                Salt_Intake=float(cleaned["Salt_Intake"]),
                Stress_Score=int(cleaned["Stress_Score"]),
                Sleep_Duration=float(cleaned["Sleep_Duration"]),
                Family_History=str(cleaned["Family_History"]),
                Exercise_Level=str(cleaned["Exercise_Level"]),
                Smoking_Status=str(cleaned["Smoking_Status"]),
                BP_History=cleaned.get("BP_History"),
                Medication=cleaned.get("Medication") or "None",
                patient_id=str(cleaned.get("patient_id", f"row_{idx+1}")),
            )
            pred = predict_patient(patient)
            valid_count += 1

            result_entry = {
                "row_index": idx + 1,
                "patient_id": patient.patient_id,
                "status": "success",
                "probability": pred.probability,
                "risk_level": pred.risk_level.value,
                "label": pred.label,
                "model_used": pred.model_used,
                "error": None,
            }
            results.append(result_entry)

            row_dict["Predicted_Probability"] = pred.probability
            row_dict["Risk_Level"] = pred.risk_level.value
            row_dict["Predicted_Label"] = pred.label
            row_dict["Model_Used"] = pred.model_used
            output_rows.append(row_dict)

        except Exception as e:
            error_count += 1
            results.append({
                "row_index": idx + 1,
                "patient_id": row_dict.get("patient_id", f"row_{idx+1}"),
                "status": "error",
                "probability": None,
                "risk_level": None,
                "label": None,
                "model_used": None,
                "error": str(e),
            })
            row_dict["Predicted_Probability"] = None
            row_dict["Risk_Level"] = "ERROR"
            row_dict["Predicted_Label"] = "ERROR"
            row_dict["Model_Used"] = None
            output_rows.append(row_dict)

    out_df = pd.DataFrame(output_rows)
    csv_buffer = io.StringIO()
    out_df.to_csv(csv_buffer, index=False)
    csv_string = csv_buffer.getvalue()

    return results, csv_string, valid_count, error_count


def predict_diabetes(patient: DiabetesPatientInput) -> DiabetesPredictionResponse:
    """
    Evaluates Type 2 Diabetes probability using the tuned LightGBM model.
    Derives ADA biomarker categories, cardiometabolic synergy, and personalized guidance.
    """
    if "model_diabetes" not in MODELS:
        load_models()
        if "model_diabetes" not in MODELS:
            raise RuntimeError("model_diabetes artifact could not be loaded into memory.")

    model = MODELS["model_diabetes"]

    raw_df = pd.DataFrame([{
        "gender": patient.gender.value if hasattr(patient.gender, "value") else str(patient.gender),
        "age": float(patient.age),
        "hypertension": int(patient.hypertension),
        "heart_disease": int(patient.heart_disease),
        "smoking_history": patient.smoking_history.value if hasattr(patient.smoking_history, "value") else str(patient.smoking_history),
        "bmi": float(patient.bmi),
        "HbA1c_level": float(patient.HbA1c_level),
        "blood_glucose_level": float(patient.blood_glucose_level),
    }])

    feat_df = engineer_diabetes_features(raw_df)
    features_ordered = [
        "age", "bmi", "HbA1c_level", "blood_glucose_level",
        "Cardiometabolic_Risk", "Glycemic_Index",
        "gender", "smoking_history", "hypertension", "heart_disease",
        "HbA1c_Category", "Glucose_Category", "BMI_Category", "Age_Group"
    ]

    probs = model.predict_proba(feat_df[features_ordered])[0]
    diab_prob = float(probs[1])

    optimal_thresh = 0.50
    is_diabetic = bool(diab_prob >= optimal_thresh)

    if diab_prob < 0.25:
        risk_level = RiskLevelEnum.Low
        label = "Low Diabetes Risk"
    elif diab_prob < 0.50:
        risk_level = RiskLevelEnum.Moderate
        label = "Moderate Diabetes Risk (Prediabetes Alert)"
    else:
        risk_level = RiskLevelEnum.High
        label = "High Diabetes Risk"

    # Explain contributing factors
    contributing_factors: List[ContributingFactor] = []

    # 1. HbA1c
    hba1c_val = patient.HbA1c_level
    hba1c_cat = feat_df["HbA1c_Category"].iloc[0]
    if hba1c_val >= 6.5:
        contributing_factors.append(ContributingFactor(
            feature="HbA1c_level",
            display_name="Hemoglobin A1c",
            value=f"{hba1c_val:.1f}%",
            signed_contribution=0.45,
            impact="increases_risk",
            human_readable=f"HbA1c is {hba1c_val:.1f}% (Diabetic threshold >= 6.5%), indicating chronic glycemic elevation."
        ))
    elif hba1c_val >= 5.7:
        contributing_factors.append(ContributingFactor(
            feature="HbA1c_level",
            display_name="Hemoglobin A1c",
            value=f"{hba1c_val:.1f}%",
            signed_contribution=0.20,
            impact="increases_risk",
            human_readable=f"HbA1c is {hba1c_val:.1f}% (Prediabetic range 5.7 - 6.4%), indicating impaired glucose metabolism."
        ))
    else:
        contributing_factors.append(ContributingFactor(
            feature="HbA1c_level",
            display_name="Hemoglobin A1c",
            value=f"{hba1c_val:.1f}%",
            signed_contribution=-0.25,
            impact="decreases_risk",
            human_readable="HbA1c is in normal optimal range (< 5.7%)."
        ))

    # 2. Blood Glucose
    glucose_val = patient.blood_glucose_level
    glucose_cat = feat_df["Glucose_Category"].iloc[0]
    if glucose_val >= 126:
        contributing_factors.append(ContributingFactor(
            feature="blood_glucose_level",
            display_name="Blood Glucose",
            value=f"{glucose_val:.0f} mg/dL",
            signed_contribution=0.35,
            impact="increases_risk",
            human_readable=f"Blood glucose is elevated ({glucose_val:.0f} mg/dL, threshold >= 126 mg/dL)."
        ))
    elif glucose_val >= 100:
        contributing_factors.append(ContributingFactor(
            feature="blood_glucose_level",
            display_name="Blood Glucose",
            value=f"{glucose_val:.0f} mg/dL",
            signed_contribution=0.15,
            impact="increases_risk",
            human_readable=f"Blood glucose indicates impaired fasting regulation ({glucose_val:.0f} mg/dL)."
        ))
    else:
        contributing_factors.append(ContributingFactor(
            feature="blood_glucose_level",
            display_name="Blood Glucose",
            value=f"{glucose_val:.0f} mg/dL",
            signed_contribution=-0.20,
            impact="decreases_risk",
            human_readable=f"Blood glucose is optimal ({glucose_val:.0f} mg/dL, normal < 100 mg/dL)."
        ))

    # 3. BMI
    bmi_val = patient.bmi
    if bmi_val >= 30.0:
        contributing_factors.append(ContributingFactor(
            feature="bmi",
            display_name="Body Mass Index (BMI)",
            value=f"{bmi_val:.1f} kg/m²",
            signed_contribution=0.20,
            impact="increases_risk",
            human_readable="Obesity-range BMI elevates peripheral insulin resistance."
        ))
    elif bmi_val < 25.0:
        contributing_factors.append(ContributingFactor(
            feature="bmi",
            display_name="Body Mass Index (BMI)",
            value=f"{bmi_val:.1f} kg/m²",
            signed_contribution=-0.15,
            impact="decreases_risk",
            human_readable="Normal healthy BMI protects against metabolic dysfunction."
        ))

    # 4. Cardiovascular Comorbidities
    if patient.hypertension == 1 or patient.heart_disease == 1:
        comorbid = []
        if patient.hypertension == 1:
            comorbid.append("Hypertension")
        if patient.heart_disease == 1:
            comorbid.append("Heart Disease")
        contributing_factors.append(ContributingFactor(
            feature="Cardiometabolic_Risk",
            display_name="Cardiovascular Comorbidities",
            value=" + ".join(comorbid),
            signed_contribution=0.18,
            impact="increases_risk",
            human_readable=f"Co-occurrence of {', '.join(comorbid)} strongly compounds vascular and metabolic risk."
        ))

    # Clinical Recommendations
    recommendations: List[LifestyleRecommendation] = []
    if hba1c_val >= 5.7 or glucose_val >= 100:
        recommendations.append(LifestyleRecommendation(
            category="Glycemic Control",
            title="Comprehensive Glycemic Workup & Fasting Panel",
            description="Consult a healthcare professional for a formal oral glucose tolerance test (OGTT) and continuous glucose monitoring.",
            impact_potential="High",
            priority=1,
        ))
    if bmi_val >= 25.0:
        recommendations.append(LifestyleRecommendation(
            category="Weight Management",
            title="Targeted 5%–7% Weight Reduction",
            description="A modest 5%–7% weight loss in individuals with elevated BMI reduces Type 2 diabetes progression by up to 58% (DPP Clinical Trial).",
            impact_potential="High",
            priority=2,
        ))
    if str(patient.smoking_history) in ["current", "ever"]:
        recommendations.append(LifestyleRecommendation(
            category="Smoking Cessation",
            title="Tobacco Cessation Program",
            description="Nicotine impairs cellular insulin sensitivity, exacerbating glycemic swings and microvascular damage.",
            impact_potential="High",
            priority=3,
        ))
    recommendations.append(LifestyleRecommendation(
        category="Physical Activity",
        title="150+ Minutes of Aerobic Exercise Weekly",
        description="Engage in moderate-to-vigorous aerobic exercise combined with 2 weekly resistance sessions to stimulate GLUT4 glucose transporters.",
        impact_potential="Moderate",
        priority=4,
    ))

    cm_score = int(feat_df["Cardiometabolic_Risk"].iloc[0])

    return DiabetesPredictionResponse(
        probability=round(diab_prob, 4),
        risk_level=risk_level,
        is_diabetic=is_diabetic,
        label=label,
        threshold_used=optimal_thresh,
        model_used="LightGBM Production Pipeline",
        contributing_factors=contributing_factors,
        recommendations=recommendations,
        hba1c_category=str(hba1c_cat),
        glucose_category=str(glucose_cat),
        cardiometabolic_risk_score=cm_score,
        timestamp=datetime.now(timezone.utc).isoformat(),
        patient_id=patient.patient_id,
    )


def predict_cardiometabolic(patient: UnifiedPatientInput) -> CardiometabolicPredictionResponse:
    """
    Evaluates joint Hypertension and Type 2 Diabetes risk in a single pass.
    Reuses common demographic and biometric inputs (Age, BMI, Smoking, BP status, Patient ID).
    """
    # 1. Map to Hypertension PatientInput
    smoking_status = (
        SmokingStatusEnum.Smoker
        if patient.smoking_habit == "current"
        else SmokingStatusEnum.Non_Smoker
    )
    bp_history = None if patient.bp_status in ["Unknown", None, ""] else BPHistoryEnum(patient.bp_status)
    medication = (
        MedicationEnum.None_
        if patient.bp_status in ["Unknown", None, ""]
        else (patient.medication or MedicationEnum.None_)
    )

    htn_patient = PatientInput(
        Age=patient.age,
        BMI=patient.bmi,
        Salt_Intake=patient.salt_intake,
        Stress_Score=patient.stress_score,
        Sleep_Duration=patient.sleep_duration,
        Family_History=patient.family_history_htn,
        Exercise_Level=patient.exercise_level,
        Smoking_Status=smoking_status,
        BP_History=bp_history,
        Medication=medication,
        patient_id=patient.patient_id,
    )

    # 2. Map to DiabetesPatientInput
    htn_flag = 1 if patient.bp_status == "Hypertension" else 0
    valid_smoking_hist = patient.smoking_habit
    if valid_smoking_hist not in ["never", "No Info", "current", "former", "ever", "not current"]:
        valid_smoking_hist = "never" if smoking_status == SmokingStatusEnum.Non_Smoker else "current"

    diab_patient = DiabetesPatientInput(
        gender=patient.gender,
        age=float(patient.age),
        hypertension=htn_flag,
        heart_disease=patient.heart_disease,
        smoking_history=valid_smoking_hist,
        bmi=patient.bmi,
        HbA1c_level=patient.hba1c_level,
        blood_glucose_level=patient.blood_glucose_level,
        patient_id=patient.patient_id,
    )

    # 3. Predict both conditions
    htn_res = predict_patient(htn_patient)
    diab_res = predict_diabetes(diab_patient)

    # 4. Synthesize combined risk and comorbidity synergies
    combined_score = round(((htn_res.probability * 0.5) + (diab_res.probability * 0.5)) * 100, 1)

    if combined_score < 30.0:
        combined_risk_level = RiskLevelEnum.Low
    elif combined_score < 60.0:
        combined_risk_level = RiskLevelEnum.Moderate
    else:
        combined_risk_level = RiskLevelEnum.High

    # Synergistic comorbidity analysis
    is_htn_high = htn_res.probability >= 0.5
    is_diab_high = diab_res.probability >= 0.5

    if is_htn_high and is_diab_high:
        synergy_headline = "High-Risk Concurrent Cardiometabolic Comorbidity"
        synergy_description = (
            "Elevated systemic vascular pressure coupled with chronic glycemic impairment creates "
            "synergistic endothelial microvascular damage. Patients with concurrent hypertension "
            "and diabetic risk exhibit a 2-3x multiplied incidence of coronary events, renal failure, "
            "and stroke. Aggressive multimodal intervention is strongly advised."
        )
    elif is_htn_high:
        synergy_headline = "Primary Cardiovascular / Hypertensive Vulnerability"
        synergy_description = (
            "Blood pressure regulation is the dominant driver of your cardiometabolic risk profile. "
            "Glycemic markers are currently within manageable ranges, but vascular resistance "
            "warrants sodium restriction, stress management, and close blood pressure tracking."
        )
    elif is_diab_high:
        synergy_headline = "Primary Metabolic / Glycemic Impairment"
        synergy_description = (
            "Elevated fasting glucose or HbA1c constitutes your primary health vulnerability. "
            "Vascular tone is relatively preserved, but sustained glycemic dysregulation will "
            "accelerate arterial stiffness over time without dietary modification and aerobic activity."
        )
    else:
        synergy_headline = "Optimal Cardiometabolic Health Profile"
        synergy_description = (
            "Both blood pressure indicators and glycemic biomarkers reside in low-risk brackets. "
            "Continue proactive healthy dietary patterns, regular physical activity, and routine "
            "annual preventive screenings."
        )

    # Merge and deduplicate top contributing factors
    all_factors = list(htn_res.contributing_factors) + list(diab_res.contributing_factors)
    seen_factors = set()
    top_combined_factors: List[ContributingFactor] = []
    for factor in sorted(all_factors, key=lambda f: abs(f.signed_contribution), reverse=True):
        if factor.display_name not in seen_factors:
            seen_factors.add(factor.display_name)
            top_combined_factors.append(factor)

    # Merge recommendations
    all_recs = list(htn_res.recommendations) + list(diab_res.recommendations)
    seen_recs = set()
    unified_recommendations: List[LifestyleRecommendation] = []
    for rec in sorted(all_recs, key=lambda r: r.priority):
        if rec.category not in seen_recs:
            seen_recs.add(rec.category)
            unified_recommendations.append(rec)

    return CardiometabolicPredictionResponse(
        hypertension=htn_res,
        diabetes=diab_res,
        combined_risk_score=combined_score,
        combined_risk_level=combined_risk_level,
        synergy_headline=synergy_headline,
        synergy_description=synergy_description,
        top_combined_factors=top_combined_factors[:6],
        unified_recommendations=unified_recommendations[:5],
        timestamp=datetime.now(timezone.utc).isoformat(),
        patient_id=patient.patient_id,
    )

