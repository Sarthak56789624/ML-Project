"""
CardioCare Diabetes Model Training Pipeline.
Trains an optimized LightGBM classifier on the 100,000-record clinical dataset.
Outputs model_diabetes.joblib and diabetes_metrics.json to ml/artifacts/.
"""
import os
import sys
import json
import time
from datetime import datetime, timezone
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, StratifiedKFold, RandomizedSearchCV
from sklearn.pipeline import Pipeline
import lightgbm as lgb
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
    classification_report,
)

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from features_diabetes import (
    engineer_diabetes_features,
    make_diabetes_preprocessor,
    ALL_FEATURES,
    TARGET_COL,
    NUMERIC_FEATURES,
    CATEGORICAL_FEATURES,
)

RANDOM_STATE = 42
DATA_PATH = os.path.join(CURRENT_DIR, "data", "diabetes_prediction_dataset.csv")
if not os.path.exists(DATA_PATH):
    fallback = os.path.join(os.path.dirname(CURRENT_DIR), "..", "diabetes_prediction_dataset.csv")
    if os.path.exists(fallback):
        DATA_PATH = fallback
    else:
        DATA_PATH = "diabetes_prediction_dataset.csv"

ARTIFACTS_DIR = os.path.join(CURRENT_DIR, "artifacts")
os.makedirs(ARTIFACTS_DIR, exist_ok=True)


def load_and_preprocess_data():
    print(f"[1/4] Loading diabetes dataset from {DATA_PATH}...")
    df = pd.read_csv(DATA_PATH)
    # Deduplicate
    df = df.drop_duplicates().copy()
    # Standardize gender
    df = df[df["gender"].isin(["Female", "Male"])].copy()
    print(f"[2/4] Applying clinical feature engineering on {len(df):,} patient records...")
    df_feat = engineer_diabetes_features(df)
    return df_feat


def train_model():
    df = load_and_preprocess_data()
    X = df[ALL_FEATURES]
    y = df[TARGET_COL]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=RANDOM_STATE, stratify=y
    )
    print(f"[3/4] Training set: {len(X_train):,} samples | Test set: {len(X_test):,} samples")

    preprocessor = make_diabetes_preprocessor()
    base_pipeline = Pipeline([
        ("prep", preprocessor),
        (
            "clf",
            lgb.LGBMClassifier(
                n_estimators=150,
                learning_rate=0.05,
                max_depth=6,
                num_leaves=31,
                scale_pos_weight=1.5,
                random_state=RANDOM_STATE,
                n_jobs=-1,
                verbose=-1,
            ),
        ),
    ])

    print("[4/4] Fitting tuned LightGBM model...")
    t0 = time.time()
    base_pipeline.fit(X_train, y_train)
    elapsed = time.time() - t0
    print(f"Model fitting complete in {elapsed:.2f}s!")

    # Evaluate
    y_prob = base_pipeline.predict_proba(X_test)[:, 1]
    y_pred = (y_prob >= 0.50).astype(int)

    roc = roc_auc_score(y_test, y_prob)
    pr_auc = average_precision_score(y_test, y_prob)
    f1 = f1_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    acc = accuracy_score(y_test, y_pred)

    print("\n=== TEST SET PERFORMANCE EVALUATION ===")
    print(f"ROC-AUC:   {roc:.4f}")
    print(f"PR-AUC:    {pr_auc:.4f}")
    print(f"F1-Score:  {f1:.4f}")
    print(f"Recall:    {rec:.4f}")
    print(f"Precision: {prec:.4f}")
    print(f"Accuracy:  {acc:.4f}")
    print("\nClassification Report:\n", classification_report(y_test, y_pred))

    # Feature Importance
    fitted_prep = base_pipeline.named_steps["prep"]
    cat_names = fitted_prep.named_transformers_["cat"].get_feature_names_out(CATEGORICAL_FEATURES).tolist()
    all_names = NUMERIC_FEATURES + cat_names
    clf = base_pipeline.named_steps["clf"]
    importances = clf.feature_importances_
    df_imp = pd.DataFrame({"Feature": all_names, "Importance": importances}).sort_values(by="Importance", ascending=False)

    # Save artifacts
    model_path = os.path.join(ARTIFACTS_DIR, "model_diabetes.joblib")
    metrics_path = os.path.join(ARTIFACTS_DIR, "diabetes_metrics.json")
    joblib.dump(base_pipeline, model_path)
    print(f"\nModel saved to: {model_path}")

    metrics = {
        "model_name": "LightGBM Production Pipeline",
        "target": "diabetes",
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "trained_timestamp": datetime.now(timezone.utc).isoformat(),
        "test_metrics": {
            "roc_auc": float(roc),
            "pr_auc": float(pr_auc),
            "f1_score": float(f1),
            "recall": float(rec),
            "precision": float(prec),
            "accuracy": float(acc),
        },
        "feature_importances": df_imp.head(15).to_dict(orient="records"),
    }
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"Metrics saved to: {metrics_path}")


if __name__ == "__main__":
    train_model()
