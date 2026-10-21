"""
Model metadata and evaluation metrics endpoints.
"""
from fastapi import APIRouter
from app.core.config import settings
from app.schemas.common import ModelInfoResponse
from app.services.predictor import MODELS
from app.services.insights import get_dataset_insights

router = APIRouter()


@router.get("/model/info", response_model=ModelInfoResponse, summary="Model Architecture & Metadata")
async def get_model_info():
    data = get_dataset_insights()
    meta = data.get("metadata", {})
    models_dict = data.get("models", {})

    full_metrics = models_dict.get("model_full", {}).get("metrics", {})
    life_metrics = models_dict.get("model_lifestyle", {}).get("metrics", {})

    return ModelInfoResponse(
        name="CardioCare Gradient Boosting Pipeline",
        version=models_dict.get("model_full", {}).get("version", "1.0.0"),
        sklearn_version=meta.get("sklearn_version", "unknown"),
        trained_at=meta.get("exported_at", "unknown"),
        models_available=["model_full", "model_lifestyle"],
        features_full=models_dict.get("model_full", {}).get("features", []),
        features_lifestyle=models_dict.get("model_lifestyle", {}).get("features", []),
        metrics_summary={
            "model_full": full_metrics,
            "model_lifestyle": life_metrics,
        },
        synthetic_data_note=meta.get(
            "synthetic_data_note",
            "Dataset demonstrates synthetic generation properties with clear class separation."
        ),
    )


@router.get("/model/metrics", summary="Full Evaluation Metrics & Curves")
async def get_model_metrics():
    """Returns complete evaluation metrics, ROC/PR curve points, confusion matrices, and threshold trade-offs."""
    return get_dataset_insights()
