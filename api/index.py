"""
Vercel Serverless Function entrypoint for CardioCare FastAPI backend.
Exports ASGI `app` callable for @vercel/python runtime.
"""
import os
import sys

# Setup import paths
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
BACKEND_DIR = os.path.join(PROJECT_ROOT, "cardiocare", "backend")
ML_DIR = os.path.join(PROJECT_ROOT, "cardiocare", "ml")

for p in [BACKEND_DIR, ML_DIR, PROJECT_ROOT]:
    if p not in sys.path:
        sys.path.insert(0, p)

os.environ["VERCEL"] = "1"
os.environ.setdefault("ML_ARTIFACTS_DIR", os.path.join(ML_DIR, "artifacts"))

from app.main import app  # noqa: E402
