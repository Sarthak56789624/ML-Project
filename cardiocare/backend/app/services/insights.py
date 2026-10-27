"""
Clinical recommendations engine (AHA / ACC / WHO guidelines)
and dataset insights provider.
"""
import json
import os
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.schemas.patient import PatientInput
from app.schemas.prediction import LifestyleRecommendation

_METRICS_CACHE: Optional[Dict[str, Any]] = None


def get_dataset_insights() -> Dict[str, Any]:
    """Returns dataset-level stats and evaluation metrics from artifacts/metrics.json."""
    global _METRICS_CACHE
    if _METRICS_CACHE is not None:
        return _METRICS_CACHE

    metrics_path = settings.METRICS_PATH
    if not os.path.exists(metrics_path):
        candidates = [
            os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
                "..",
                "ml",
                "artifacts",
                "metrics.json",
            ),
            os.path.join(os.getcwd(), "cardiocare", "ml", "artifacts", "metrics.json"),
            "cardiocare/ml/artifacts/metrics.json",
            "ml/artifacts/metrics.json",
        ]
        for c in candidates:
            if os.path.exists(c):
                metrics_path = c
                break

    if os.path.exists(metrics_path):
        with open(metrics_path, "r", encoding="utf-8") as f:
            _METRICS_CACHE = json.load(f)
            return _METRICS_CACHE

    return {
        "error": "Metrics artifact not found. Please run ml/export_metrics.py first."
    }


def generate_recommendations(
    patient: PatientInput, probability: float, risk_level: str
) -> List[LifestyleRecommendation]:
    """
    Rules-based clinical recommendations tailored to specific modifiable factors.
    """
    recs: List[LifestyleRecommendation] = []
    prio = 1

    # 1. Salt / Dietary Sodium
    if patient.Salt_Intake > 6.0:
        recs.append(
            LifestyleRecommendation(
                category="Diet & Sodium",
                title="Adopt DASH Diet & Reduce Salt",
                description=(
                    f"Current salt intake is {patient.Salt_Intake}g/day. Lower sodium to < 5g/day "
                    "(approx. 1 level teaspoon), increasing potassium-rich foods (bananas, leafy greens) "
                    "to lower systolic blood pressure by 4-8 mmHg."
                ),
                impact_potential="High",
                priority=prio,
            )
        )
        prio += 1

    # 2. Smoking
    if patient.Smoking_Status == "Smoker":
        recs.append(
            LifestyleRecommendation(
                category="Smoking Cessation",
                title="Structured Smoking Cessation Plan",
                description=(
                    "Cigarette smoking causes acute endothelial spasm and long-term arterial stiffening. "
                    "Consult a physician regarding nicotine replacement or counseling; arterial elasticity "
                    "begins improving within weeks of cessation."
                ),
                impact_potential="High",
                priority=prio,
            )
        )
        prio += 1

    # 3. Sleep
    if patient.Sleep_Duration < 6.5:
        recs.append(
            LifestyleRecommendation(
                category="Rest & Sleep",
                title="Target 7–8 Hours Restful Sleep",
                description=(
                    f"Current sleep duration ({patient.Sleep_Duration}h) is sub-optimal. Aim for 7 to 8 hours. "
                    "Establish a fixed bedtime routine and screen blackout 60 min before sleep to normalize "
                    "the nocturnal blood pressure dipping cycle."
                ),
                impact_potential="Moderate",
                priority=prio,
            )
        )
        prio += 1

    # 4. Stress
    if patient.Stress_Score >= 6:
        recs.append(
            LifestyleRecommendation(
                category="Stress Management",
                title="Sympathetic Nervous System Reset",
                description=(
                    f"Self-reported stress score is {patient.Stress_Score}/10. Practice 15-20 minutes daily "
                    "of diaphragmatic box-breathing, mindfulness meditation, or low-intensity yoga to dampen "
                    "vasoconstrictive sympathetic outflow."
                ),
                impact_potential="Moderate",
                priority=prio,
            )
        )
        prio += 1

    # 5. Weight / BMI
    if patient.BMI >= 25.0:
        cat_str = "obesity" if patient.BMI >= 30.0 else "overweight"
        recs.append(
            LifestyleRecommendation(
                category="Weight Management",
                title="Gradual 5–10% Weight Reduction",
                description=(
                    f"BMI of {patient.BMI} falls in the {cat_str} category. A gradual 5-10% body weight loss "
                    "through calorie-conscious, nutrient-dense meals can reduce systolic blood pressure by 1 mmHg per kg lost."
                ),
                impact_potential="High" if patient.BMI >= 30.0 else "Moderate",
                priority=prio,
            )
        )
        prio += 1

    # 6. Physical Activity
    if patient.Exercise_Level in ["Low", "Moderate"]:
        recs.append(
            LifestyleRecommendation(
                category="Physical Activity",
                title="150 Minutes/Week Moderate Aerobic Exercise",
                description=(
                    "Incorporate brisk walking, cycling, or swimming for at least 30 minutes 5 days a week, "
                    "paired with twice-weekly resistance training to enhance systemic vascular compliance."
                ),
                impact_potential="Moderate",
                priority=prio,
            )
        )
        prio += 1

    # 7. Blood Pressure Monitoring
    if patient.BP_History in ["Prehypertension", "Hypertension"] or risk_level in ["Moderate", "High"]:
        recs.append(
            LifestyleRecommendation(
                category="Clinical Monitoring",
                title="Home Blood Pressure Log & Clinical Follow-up",
                description=(
                    "Maintain a validated upper-arm digital BP log (measure morning and evening after 5 min rest). "
                    "Share readings with your healthcare provider for formal ambulatory evaluation."
                ),
                impact_potential="High",
                priority=prio,
            )
        )
        prio += 1

    # Fallback if already healthy
    if len(recs) == 0:
        recs.append(
            LifestyleRecommendation(
                category="Maintenance",
                title="Maintain Cardioprotective Habits",
                description=(
                    "Your current lifestyle parameters are favorable. Continue balanced nutrition, regular exercise, "
                    "and schedule annual cardiovascular wellness checks."
                ),
                impact_potential="Low",
                priority=1,
            )
        )

    return recs[:5]
