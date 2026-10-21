"""
CardioCare Model Training Pipeline.
Trains two production models:
1. model_full: Includes BP_History and selected features (~99% ROC-AUC)
2. model_lifestyle: Excludes BP_History and Medication for patients without BP records (~87% ROC-AUC)

Saves both with version, sklearn version, and timestamp metadata to ml/artifacts/.
"""
import os
import sys
from datetime import datetime, timezone
import joblib
import pandas as pd
import numpy as np
import sklearn
from sklearn.model_selection import train_test_split, StratifiedKFold, RandomizedSearchCV
from sklearn.pipeline import Pipeline
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
)

# Ensure current directory is on sys.path for importing features
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from features import (
    engineer_features,
    make_preprocessor,
    FULL_NUM_COLS,
    FULL_CAT_COLS,
    FULL_BIN_COLS,
    FULL_FEATURES,
    LIFESTYLE_NUM_COLS,
    LIFESTYLE_CAT_COLS,
    LIFESTYLE_BIN_COLS,
    LIFESTYLE_FEATURES,
)

RANDOM_STATE = 42
DATA_PATH = os.path.join(CURRENT_DIR, "data", "hypertension_dataset.csv")
ARTIFACTS_DIR = os.path.join(CURRENT_DIR, "artifacts")


def load_and_preprocess_data():
    if not os.path.exists(DATA_PATH):
        # Fallback to local
        fallback = os.path.join(CURRENT_DIR, "hypertension_dataset.csv")
        if os.path.exists(fallback):
            path = fallback
        else:
            raise FileNotFoundError(f"Dataset not found at {DATA_PATH} or {fallback}")
    else:
        path = DATA_PATH

    print(f"[1/4] Loading dataset from {path}...")
    df = pd.read_csv(path)
    df["target"] = df["Has_Hypertension"].map({"Yes": 1, "No": 0})
    df = df.drop(columns=["Has_Hypertension"])

    print(f"[2/4] Applying clinical feature engineering on {len(df)} rows...")
    df_engineered = engineer_features(df)
    return df_engineered


def train_gradient_boosting(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    num_cols: list,
    cat_cols: list,
    bin_cols: list,
    model_name: str,
):
    print(f"\n--- Tuning {model_name} (5-fold CV, scoring='roc_auc') ---")
    preprocessor = make_preprocessor(num_cols, cat_cols, bin_cols)
    base_pipeline = Pipeline([
        ("prep", preprocessor),
        ("clf", GradientBoostingClassifier(random_state=RANDOM_STATE))
    ])

    param_dist = {
        "clf__n_estimators": [50, 100, 150, 200, 300],
        "clf__learning_rate": [0.01, 0.03, 0.05, 0.1],
        "clf__max_depth": [2, 3, 4],
        "clf__subsample": [0.7, 0.85, 1.0],
        "clf__min_samples_leaf": [1, 5, 10, 20],
    }

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    search = RandomizedSearchCV(
        base_pipeline,
        param_distributions=param_dist,
        n_iter=25,
        scoring="roc_auc",
        cv=cv,
        random_state=RANDOM_STATE,
        n_jobs=-1,
        verbose=1,
    )
    search.fit(X_train, y_train)
    print(f"{model_name} Best CV ROC-AUC: {search.best_score_:.4f}")
    best_params = {k.replace("clf__", ""): v for k, v in search.best_params_.items()}
    print(f"Best parameters: {best_params}")
    return search.best_estimator_, search.best_score_, best_params


def evaluate_model(model, X_test: pd.DataFrame, y_test: pd.Series, name: str):
    probs = model.predict_proba(X_test)[:, 1]
    preds = (probs >= 0.5).astype(int)
    acc = accuracy_score(y_test, preds)
    prec = precision_score(y_test, preds)
    rec = recall_score(y_test, preds)
    f1 = f1_score(y_test, preds)
    auc = roc_auc_score(y_test, probs)
    print(f"\nEvaluation on Test Set ({name}):")
    print(f"  Accuracy:  {acc:.4f}")
    print(f"  Precision: {prec:.4f}")
    print(f"  Recall:    {rec:.4f}")
    print(f"  F1 Score:  {f1:.4f}")
    print(f"  ROC-AUC:   {auc:.4f}")
    return {"accuracy": acc, "precision": prec, "recall": rec, "f1": f1, "roc_auc": auc}


def main():
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    df = load_and_preprocess_data()
    y = df["target"]

    # Stratified 80/20 split
    train_idx, test_idx = train_test_split(
        df.index, test_size=0.2, random_state=RANDOM_STATE, stratify=y
    )

    now_iso = datetime.now(timezone.utc).isoformat()
    version = "1.0.0"

    # ==========================
    # 1. Model Full
    # ==========================
    X_full = df[FULL_FEATURES]
    X_train_full = X_full.loc[train_idx]
    X_test_full = X_full.loc[test_idx]
    y_train = y.loc[train_idx]
    y_test = y.loc[test_idx]

    model_full, cv_auc_full, params_full = train_gradient_boosting(
        X_train_full,
        y_train,
        FULL_NUM_COLS,
        FULL_CAT_COLS,
        FULL_BIN_COLS,
        "Model Full (with BP_History)",
    )
    test_metrics_full = evaluate_model(model_full, X_test_full, y_test, "Model Full")

    full_payload = {
        "model": model_full,
        "features": FULL_FEATURES,
        "num_cols": FULL_NUM_COLS,
        "cat_cols": FULL_CAT_COLS,
        "bin_cols": FULL_BIN_COLS,
        "version": version,
        "sklearn_version": sklearn.__version__,
        "model_type": "GradientBoostingClassifier (Full)",
        "requires_bp_history": True,
        "trained_at": now_iso,
        "cv_roc_auc": float(cv_auc_full),
        "best_params": params_full,
        "test_metrics": test_metrics_full,
    }
    full_path = os.path.join(ARTIFACTS_DIR, "model_full.joblib")
    joblib.dump(full_payload, full_path)
    print(f"Saved full model to {full_path}")

    # ==========================
    # 2. Model Lifestyle
    # ==========================
    X_life = df[LIFESTYLE_FEATURES]
    X_train_life = X_life.loc[train_idx]
    X_test_life = X_life.loc[test_idx]

    model_life, cv_auc_life, params_life = train_gradient_boosting(
        X_train_life,
        y_train,
        LIFESTYLE_NUM_COLS,
        LIFESTYLE_CAT_COLS,
        LIFESTYLE_BIN_COLS,
        "Model Lifestyle (without BP_History / Medication)",
    )
    test_metrics_life = evaluate_model(model_life, X_test_life, y_test, "Model Lifestyle")

    life_payload = {
        "model": model_life,
        "features": LIFESTYLE_FEATURES,
        "num_cols": LIFESTYLE_NUM_COLS,
        "cat_cols": LIFESTYLE_CAT_COLS,
        "bin_cols": LIFESTYLE_BIN_COLS,
        "version": version,
        "sklearn_version": sklearn.__version__,
        "model_type": "GradientBoostingClassifier (Lifestyle Only)",
        "requires_bp_history": False,
        "trained_at": now_iso,
        "cv_roc_auc": float(cv_auc_life),
        "best_params": params_life,
        "test_metrics": test_metrics_life,
    }
    life_path = os.path.join(ARTIFACTS_DIR, "model_lifestyle.joblib")
    joblib.dump(life_payload, life_path)
    print(f"Saved lifestyle model to {life_path}")

    # Also save hypertension_model.joblib as an alias to model_full in /ml for backward compatibility
    compat_path = os.path.join(CURRENT_DIR, "hypertension_model.joblib")
    joblib.dump({"model": model_full, "features": FULL_FEATURES}, compat_path)
    print(f"Saved compatibility model to {compat_path}")


if __name__ == "__main__":
    main()
