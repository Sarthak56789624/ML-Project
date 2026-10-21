"""
Application configuration using Pydantic Settings v2.
"""
import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "CardioCare — Hypertension Risk Predictor"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "Production-grade clinical risk prediction engine for hypertension."
    API_V1_STR: str = "/api/v1"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*",
    ]

    # Optional API Key for write protection
    API_KEY: Optional[str] = None
    API_KEY_HEADER: str = "X-API-Key"

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./cardiocare.db"

    # Artifacts Paths (supports both relative and container environments)
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    ML_ARTIFACTS_DIR: str = os.getenv(
        "ML_ARTIFACTS_DIR",
        os.path.join(os.path.dirname(BASE_DIR), "ml", "artifacts"),
    )

    @property
    def MODEL_FULL_PATH(self) -> str:
        return os.path.join(self.ML_ARTIFACTS_DIR, "model_full.joblib")

    @property
    def MODEL_LIFESTYLE_PATH(self) -> str:
        return os.path.join(self.ML_ARTIFACTS_DIR, "model_lifestyle.joblib")

    @property
    def METRICS_PATH(self) -> str:
        return os.path.join(self.ML_ARTIFACTS_DIR, "metrics.json")

    @property
    def MODEL_DIABETES_PATH(self) -> str:
        return os.path.join(self.ML_ARTIFACTS_DIR, "model_diabetes.joblib")

    @property
    def DIABETES_METRICS_PATH(self) -> str:
        return os.path.join(self.ML_ARTIFACTS_DIR, "diabetes_metrics.json")

    # Rate Limiting
    RATE_LIMIT_DEFAULT: str = "60/minute"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
