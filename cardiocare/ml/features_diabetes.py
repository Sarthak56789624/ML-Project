"""
Feature engineering definitions for CardioCare Diabetes Prediction Pipeline.
"""
from typing import List
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder

NUMERIC_FEATURES: List[str] = [
    "age",
    "bmi",
    "HbA1c_level",
    "blood_glucose_level",
    "Cardiometabolic_Risk",
    "Glycemic_Index",
]

CATEGORICAL_FEATURES: List[str] = [
    "gender",
    "smoking_history",
    "hypertension",
    "heart_disease",
    "HbA1c_Category",
    "Glucose_Category",
    "BMI_Category",
    "Age_Group",
]

ALL_FEATURES: List[str] = NUMERIC_FEATURES + CATEGORICAL_FEATURES
TARGET_COL: str = "diabetes"


def engineer_diabetes_features(data: pd.DataFrame) -> pd.DataFrame:
    """
    Applies ADA (American Diabetes Association) and WHO-aligned feature transformations:
    - HbA1c_Category: Normal (<5.7), Prediabetes (5.7-6.4), Diabetes (>=6.5)
    - Glucose_Category: Normal (<100), Prediabetes (100-125), Elevated (>=126)
    - BMI_Category: Underweight (<18.5), Normal (18.5-24.9), Overweight (25-29.9), Obese (>=30)
    - Age_Group: Youth (<18), Young Adult (18-35), Middle Aged (36-55), Senior (>55)
    - Cardiometabolic_Risk: Multi-factor score combining hypertension, heart disease, obesity, and senior age
    - Glycemic_Index: Interactive cross-product of HbA1c and Blood Glucose
    """
    df = data.copy()

    # 1. ADA HbA1c Categories
    df["HbA1c_Category"] = pd.cut(
        df["HbA1c_level"],
        bins=[-np.inf, 5.69, 6.49, np.inf],
        labels=["Normal", "Prediabetes", "Diabetes"],
    ).astype(str)

    # 2. Blood Glucose Categories
    df["Glucose_Category"] = pd.cut(
        df["blood_glucose_level"],
        bins=[-np.inf, 99.9, 125.9, np.inf],
        labels=["Normal", "Prediabetes", "Elevated"],
    ).astype(str)

    # 3. WHO BMI Categories
    df["BMI_Category"] = pd.cut(
        df["bmi"],
        bins=[-np.inf, 18.49, 24.99, 29.99, np.inf],
        labels=["Underweight", "Normal", "Overweight", "Obese"],
    ).astype(str)

    # 4. Age Bracket
    df["Age_Group"] = pd.cut(
        df["age"],
        bins=[-np.inf, 18, 35, 55, np.inf],
        labels=["Youth", "Young_Adult", "Middle_Aged", "Senior"],
    ).astype(str)

    # 5. Cardiometabolic Multi-Factor Score (0 to 4)
    df["Cardiometabolic_Risk"] = (
        (df["hypertension"] == 1).astype(int)
        + (df["heart_disease"] == 1).astype(int)
        + (df["bmi"] >= 30.0).astype(int)
        + (df["age"] >= 50.0).astype(int)
    )

    # 6. Glycemic Interaction
    df["Glycemic_Index"] = (df["HbA1c_level"] * df["blood_glucose_level"]) / 100.0

    return df


def make_diabetes_preprocessor() -> ColumnTransformer:
    """Builds leak-free ColumnTransformer pipeline for diabetes data."""
    return ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERIC_FEATURES),
            (
                "cat",
                OneHotEncoder(drop="first", sparse_output=False, handle_unknown="ignore"),
                CATEGORICAL_FEATURES,
            ),
        ],
        remainder="drop",
    )
