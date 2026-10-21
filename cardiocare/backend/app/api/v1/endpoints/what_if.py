"""
What-If scenario simulation endpoint.
"""
from fastapi import APIRouter
from app.schemas.patient import WhatIfRequest
from app.schemas.prediction import WhatIfResponse
from app.services.predictor import predict_what_if_scenario

router = APIRouter()


@router.post(
    "/what-if",
    response_model=WhatIfResponse,
    summary="Simulate Lifestyle & Clinical Interventions",
    description=(
        "Simulates how targeted changes (e.g. lowering salt intake, improving sleep duration, "
        "exercising more, or quitting smoking) alter predicted hypertension probability."
    ),
)
async def what_if_simulation(request: WhatIfRequest):
    return predict_what_if_scenario(request.patient, request.overrides)
