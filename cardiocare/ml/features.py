"""
Shared feature engineering and preprocessing definitions for CardioCare.
Ensures zero train/serve skew between training pipelines and the FastAPI backend.
"""
from typing import List, Tuple
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder

# Raw expected feature columns
RAW_NUMERIC_COLS: List[str] = [
    "Age",
    "Salt_Intake",
    "Stress_Score",
    "Sleep_Duration",
    "BMI",
]

RAW_CATEGORICAL_COLS: List[str] = [
    "BP_History",
    "Medication",
    "Family_History",
    "Exercise_Level",
    "Smoking_Status",
]

TARGET_COL: str = "Has_Hypertension"

# Full Model Feature Sets (Trained with BP_History and selected features)
FULL_NUM_COLS: List[str] = [
    "Age",
    "Salt_Intake",
    "Stress_Score",
    "Sleep_Duration",
    "BMI",
    "Lifestyle_Risk_Score",
]
FULL_CAT_COLS: List[str] = [
    "BP_History",
    "Medication",
    "Family_History",
    "Smoking_Status",
    "BMI_Category",
    "Age_Group",
]
FULL_BIN_COLS: List[str] = ["High_Stress"]
FULL_FEATURES: List[str] = FULL_NUM_COLS + FULL_CAT_COLS + FULL_BIN_COLS

# Lifestyle Model Feature Sets (Excludes BP_History and Medication)
LIFESTYLE_NUM_COLS: List[str] = [
    "Age",
    "Salt_Intake",
    "Stress_Score",
    "Sleep_Duration",
    "BMI",
    "Lifestyle_Risk_Score",
]
LIFESTYLE_CAT_COLS: List[str] = [
    "Family_History",
    "Smoking_Status",
    "BMI_Category",
    "Age_Group",
    "Exercise_Level",
]
LIFESTYLE_BIN_COLS: List[str] = ["High_Stress"]
LIFESTYLE_FEATURES: List[str] = LIFESTYLE_NUM_COLS + LIFESTYLE_CAT_COLS + LIFESTYLE_BIN_COLS


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Applies deterministic, clinically-motivated feature engineering:
    - Medication: NaN / None -> 'None'
    - BMI_Category: Underweight (<18.5), Normal (18.5-25), Overweight (25-30), Obese (>=30)
    - Age_Group: 18-34, 35-49, 50-64, 65+
    - Poor_Sleep: 1 if Sleep_Duration < 6 hours else 0
    - High_Stress: 1 if Stress_Score >= 7 else 0
    - Lifestyle_Risk_Score: Sum of risk indicators (smoker, low exercise, poor sleep, high stress, overweight/obese)
    """
    d = df.copy()

    # Fill Medication if missing
    if "Medication" in d.columns:
        d["Medication"] = d["Medication"].fillna("None")
        d["Medication"] = d["Medication"].replace({"": "None", "nan": "None", "null": "None"})
    else:
        d["Medication"] = "None"

    # BMI Category
    d["BMI_Category"] = pd.cut(
        d["BMI"],
        bins=[0, 18.5, 25, 30, 100],
        labels=["Underweight", "Normal", "Overweight", "Obese"],
    ).astype(str)

    # Age Group
    d["Age_Group"] = pd.cut(
        d["Age"],
        bins=[17, 34, 49, 64, 120],
        labels=["18-34", "35-49", "50-64", "65+"],
    ).astype(str)

    # Poor Sleep & High Stress indicators
    poor_sleep = (d["Sleep_Duration"] < 6).astype(int)
    d["Poor_Sleep"] = poor_sleep
    d["High_Stress"] = (d["Stress_Score"] >= 7).astype(int)

    # Exercise level fallback if missing for full model
    exercise_is_low = (d["Exercise_Level"] == "Low").astype(int) if "Exercise_Level" in d.columns else 0
    smoking_is_smoker = (d["Smoking_Status"] == "Smoker").astype(int) if "Smoking_Status" in d.columns else 0
    bmi_is_high = d["BMI_Category"].isin(["Overweight", "Obese"]).astype(int)

    # Composite lifestyle score: 0 to 5
    d["Lifestyle_Risk_Score"] = (
        smoking_is_smoker
        + exercise_is_low
        + d["Poor_Sleep"]
        + d["High_Stress"]
        + bmi_is_high
    )

    return d


def make_preprocessor(
    num_cols: List[str], cat_cols: List[str], bin_cols: List[str] = ()
) -> ColumnTransformer:
    """
    Builds standard ColumnTransformer pipeline:
    - StandardScaler for numeric features
    - OneHotEncoder with handle_unknown='ignore' and drop='if_binary' for categoricals
    - passthrough for binary 0/1 features
    """
    return ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), list(num_cols)),
            ("cat", OneHotEncoder(handle_unknown="ignore", drop="if_binary"), list(cat_cols)),
            ("bin", "passthrough", list(bin_cols)),
        ]
    )
