"""
Export comprehensive evaluation metrics and dataset statistics to metrics.json.
Provides:
- For both models (Full & Lifestyle):
  - Accuracy, precision, recall, F1, ROC-AUC
  - Confusion matrix
  - ROC curve points (FPR, TPR, Threshold)
  - PR curve points (Precision, Recall, Threshold)
  - Threshold sensitivity analysis table (0.10 to 0.90)
  - Permutation feature importances
  - 5-fold CV scores
- Dataset-level stats:
  - Class balance
  - Per-feature histograms & statistics
  - Hypertension rate per category
  - Numerical correlation matrix (including target)
  - Group means (Hypertension vs Non-Hypertension)
"""
import json
import os
import sys
from datetime import datetime, timezone
import joblib
import numpy as np
import pandas as pd
import sklearn
from sklearn.inspection import permutation_importance
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_recall_curve,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)
from sklearn.model_selection import StratifiedKFold, cross_validate, train_test_split

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from features import (
    engineer_features,
    FULL_FEATURES,
    LIFESTYLE_FEATURES,
    RAW_NUMERIC_COLS,
    RAW_CATEGORICAL_COLS,
)

RANDOM_STATE = 42
ARTIFACTS_DIR = os.path.join(CURRENT_DIR, "artifacts")
DATA_PATH = os.path.join(CURRENT_DIR, "data", "hypertension_dataset.csv")


def clean_float(val):
    if np.isnan(val) or np.isinf(val):
        return 0.0
    return float(np.round(val, 4))


def compute_model_metrics(bundle, X_train, y_train, X_test, y_test, feature_cols):
    model = bundle["model"]
    probs = model.predict_proba(X_test[feature_cols])[:, 1]
    preds = (probs >= 0.5).astype(int)

    acc = clean_float(accuracy_score(y_test, preds))
    prec = clean_float(precision_score(y_test, preds))
    rec = clean_float(recall_score(y_test, preds))
    f1 = clean_float(f1_score(y_test, preds))
    auc = clean_float(roc_auc_score(y_test, probs))

    cm = confusion_matrix(y_test, preds).tolist()

    # ROC curve (downsampled to max 80 points)
    fpr, tpr, roc_th = roc_curve(y_test, probs)
    step_roc = max(1, len(fpr) // 60)
    roc_points = [
        {"fpr": clean_float(fpr[i]), "tpr": clean_float(tpr[i]), "threshold": clean_float(roc_th[i])}
        for i in range(0, len(fpr), step_roc)
    ]
    if {"fpr": clean_float(fpr[-1]), "tpr": clean_float(tpr[-1]), "threshold": clean_float(roc_th[-1])} not in roc_points:
        roc_points.append({"fpr": clean_float(fpr[-1]), "tpr": clean_float(tpr[-1]), "threshold": clean_float(roc_th[-1])})

    # PR curve
    p_curve, r_curve, pr_th = precision_recall_curve(y_test, probs)
    step_pr = max(1, len(p_curve) // 60)
    pr_points = [
        {"precision": clean_float(p_curve[i]), "recall": clean_float(r_curve[i]), "threshold": clean_float(pr_th[min(i, len(pr_th) - 1)])}
        for i in range(0, len(p_curve), step_pr)
    ]
    if len(p_curve) > 0:
        pr_points.append({"precision": clean_float(p_curve[-1]), "recall": clean_float(r_curve[-1]), "threshold": 1.0})

    # Threshold table
    threshold_table = []
    for t in np.arange(0.10, 0.91, 0.05):
        t_val = round(float(t), 2)
        p_t = (probs >= t_val).astype(int)
        threshold_table.append({
            "threshold": t_val,
            "accuracy": clean_float(accuracy_score(y_test, p_t)),
            "precision": clean_float(precision_score(y_test, p_t, zero_division=0)),
            "recall": clean_float(recall_score(y_test, p_t, zero_division=0)),
            "f1": clean_float(f1_score(y_test, p_t, zero_division=0)),
        })

    # Permutation importance on test set
    perm = permutation_importance(
        model,
        X_test[feature_cols],
        y_test,
        scoring="roc_auc",
        n_repeats=10,
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )
    importances = [
        {
            "feature": f,
            "importance": clean_float(perm.importances_mean[i]),
            "std": clean_float(perm.importances_std[i]),
        }
        for i, f in enumerate(feature_cols)
    ]
    importances.sort(key=lambda x: x["importance"], reverse=True)

    # 5-fold CV on train set
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    cv_res = cross_validate(
        model,
        X_train[feature_cols],
        y_train,
        cv=cv,
        scoring=["accuracy", "precision", "recall", "f1", "roc_auc"],
    )
    cv_scores = {
        "mean_roc_auc": clean_float(cv_res["test_roc_auc"].mean()),
        "std_roc_auc": clean_float(cv_res["test_roc_auc"].std()),
        "mean_accuracy": clean_float(cv_res["test_accuracy"].mean()),
        "std_accuracy": clean_float(cv_res["test_accuracy"].std()),
        "mean_recall": clean_float(cv_res["test_recall"].mean()),
        "mean_precision": clean_float(cv_res["test_precision"].mean()),
        "mean_f1": clean_float(cv_res["test_f1"].mean()),
        "fold_roc_auc": [clean_float(v) for v in cv_res["test_roc_auc"]],
    }

    return {
        "version": bundle.get("version", "1.0.0"),
        "model_type": bundle.get("model_type", "GradientBoostingClassifier"),
        "trained_at": bundle.get("trained_at", datetime.now(timezone.utc).isoformat()),
        "requires_bp_history": bundle.get("requires_bp_history", False),
        "features": feature_cols,
        "best_params": bundle.get("best_params", {}),
        "metrics": {
            "accuracy": acc,
            "precision": prec,
            "recall": rec,
            "f1": f1,
            "roc_auc": auc,
        },
        "confusion_matrix": cm,
        "roc_curve": roc_points,
        "pr_curve": pr_points,
        "threshold_table": threshold_table,
        "permutation_importances": importances,
        "cv_scores": cv_scores,
    }


def compute_dataset_stats(df_raw, df_fe):
    total = len(df_fe)
    pos_count = int(df_fe["target"].sum())
    neg_count = total - pos_count

    class_balance = {
        "positive_count": pos_count,
        "negative_count": neg_count,
        "total": total,
        "positive_rate": clean_float(pos_count / total),
        "negative_rate": clean_float(neg_count / total),
    }

    # Numerical histograms
    histograms = {}
    num_to_plot = RAW_NUMERIC_COLS + ["Lifestyle_Risk_Score"]
    for col in num_to_plot:
        s = df_fe[col]
        counts, bin_edges = np.histogram(s, bins=10)
        bin_labels = [f"{bin_edges[i]:.1f}-{bin_edges[i+1]:.1f}" for i in range(len(counts))]

        pos_s = df_fe.loc[df_fe["target"] == 1, col]
        neg_s = df_fe.loc[df_fe["target"] == 0, col]
        pos_counts, _ = np.histogram(pos_s, bins=bin_edges)
        neg_counts, _ = np.histogram(neg_s, bins=bin_edges)

        histograms[col] = {
            "bins": bin_labels,
            "bin_edges": [clean_float(x) for x in bin_edges],
            "total_counts": counts.tolist(),
            "positive_counts": pos_counts.tolist(),
            "negative_counts": neg_counts.tolist(),
            "mean": clean_float(s.mean()),
            "median": clean_float(s.median()),
            "std": clean_float(s.std()),
            "min": clean_float(s.min()),
            "max": clean_float(s.max()),
        }

    # Categorical distributions & hypertension rate
    cat_to_analyze = RAW_CATEGORICAL_COLS + ["BMI_Category", "Age_Group"]
    categorical_stats = {}
    rates_per_category = {}

    for col in cat_to_analyze:
        grouped = df_fe.groupby(col)["target"].agg(["count", "sum", "mean"]).reset_index()
        grouped["rate"] = (grouped["mean"] * 100).round(2)
        grouped["non_hypertensive"] = grouped["count"] - grouped["sum"]

        cat_list = []
        for _, row in grouped.iterrows():
            cat_list.append({
                "category": str(row[col]),
                "total": int(row["count"]),
                "hypertensive": int(row["sum"]),
                "non_hypertensive": int(row["non_hypertensive"]),
                "rate_percentage": clean_float(row["rate"]),
            })
        rates_per_category[col] = sorted(cat_list, key=lambda x: x["rate_percentage"], reverse=True)

        categorical_stats[col] = {
            "categories": [str(x) for x in grouped[col].tolist()],
            "counts": [int(x) for x in grouped["count"].tolist()],
            "rates": [clean_float(x) for x in grouped["rate"].tolist()],
        }

    # Numerical correlation matrix
    num_cols_corr = RAW_NUMERIC_COLS + ["Lifestyle_Risk_Score", "target"]
    corr_df = df_fe[num_cols_corr].corr().round(4)
    corr_matrix = {
        "columns": num_cols_corr,
        "values": [[clean_float(val) for val in row] for row in corr_df.values],
    }

    # Group means
    group_means = {}
    for col in RAW_NUMERIC_COLS + ["Lifestyle_Risk_Score"]:
        g0 = clean_float(df_fe.loc[df_fe["target"] == 0, col].mean())
        g1 = clean_float(df_fe.loc[df_fe["target"] == 1, col].mean())
        group_means[col] = {
            "no_hypertension_mean": g0,
            "hypertension_mean": g1,
            "difference": clean_float(g1 - g0),
        }

    return {
        "class_balance": class_balance,
        "histograms": histograms,
        "categorical_stats": categorical_stats,
        "hypertension_rate_per_category": rates_per_category,
        "correlation_matrix": corr_matrix,
        "group_means": group_means,
    }


def main():
    full_path = os.path.join(ARTIFACTS_DIR, "model_full.joblib")
    life_path = os.path.join(ARTIFACTS_DIR, "model_lifestyle.joblib")

    if not os.path.exists(full_path) or not os.path.exists(life_path):
        raise FileNotFoundError(
            "Trained models not found. Please run train.py before export_metrics.py"
        )

    bundle_full = joblib.load(full_path)
    bundle_life = joblib.load(life_path)

    df_raw = pd.read_csv(DATA_PATH)
    df_raw["target"] = df_raw["Has_Hypertension"].map({"Yes": 1, "No": 0})
    df_fe = engineer_features(df_raw.drop(columns=["Has_Hypertension"]))
    df_fe["target"] = df_raw["target"]

    train_idx, test_idx = train_test_split(
        df_fe.index, test_size=0.2, random_state=RANDOM_STATE, stratify=df_fe["target"]
    )

    X_train = df_fe.loc[train_idx]
    y_train = df_fe.loc[train_idx, "target"]
    X_test = df_fe.loc[test_idx]
    y_test = df_fe.loc[test_idx, "target"]

    print("Computing metrics for Model Full...")
    metrics_full = compute_model_metrics(
        bundle_full, X_train, y_train, X_test, y_test, FULL_FEATURES
    )

    print("Computing metrics for Model Lifestyle...")
    metrics_life = compute_model_metrics(
        bundle_life, X_train, y_train, X_test, y_test, LIFESTYLE_FEATURES
    )

    print("Computing dataset statistics and aggregations...")
    dataset_stats = compute_dataset_stats(df_raw, df_fe)

    output = {
        "metadata": {
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "sklearn_version": sklearn.__version__,
            "python_version": sys.version,
            "dataset_rows": len(df_raw),
            "random_state": RANDOM_STATE,
            "synthetic_data_note": "Dataset exhibits high separability and near-uniform demographic distributions characteristic of synthetic data. Intended for clinical demonstration and screening support, not definitive diagnosis.",
        },
        "models": {
            "model_full": metrics_full,
            "model_lifestyle": metrics_life,
        },
        "dataset_stats": dataset_stats,
    }

    out_path = os.path.join(ARTIFACTS_DIR, "metrics.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2)

    print(f"Metrics successfully written to {out_path}")
    print("Done Phase 1 export!")


if __name__ == "__main__":
    main()
