"""
Comprehensive pytest test suite for CardioCare API.
Validates:
1. Health check & uptime
2. Schema validation constraints (Age 18-100, BMI 10-60, etc.)
3. Prediction sanity for known high-risk and low-risk patients
4. Routing to lifestyle model when BP_History is omitted
5. What-if scenario monotonicity (lifestyle improvement reduces risk)
6. Batch CSV upload with valid and erroneous rows
7. Model info and dataset metrics endpoints
"""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
import asyncio
from app.db.database import init_db
from app.services.predictor import load_models


@pytest.fixture(scope="session", autouse=True)
def setup_app():
    asyncio.run(init_db())
    load_models()


@pytest.mark.asyncio
async def test_health_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_full_loaded"] is True
    assert data["model_lifestyle_loaded"] is True


@pytest.mark.asyncio
async def test_schema_validation_out_of_bounds():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Invalid Age (< 18) and Invalid BMI (> 60)
        invalid_patient = {
            "Age": 12,
            "BMI": 85.0,
            "Salt_Intake": 30.0,
            "Stress_Score": 15,
            "Sleep_Duration": -2,
            "Family_History": "Yes",
            "Exercise_Level": "Low",
            "Smoking_Status": "Smoker",
        }
        res = await ac.post("/api/v1/predict", json=invalid_patient)
    assert res.status_code == 422
    err_data = res.json()
    assert err_data["error"] == "VALIDATION_ERROR"
    assert len(err_data["detail"]) > 0


@pytest.mark.asyncio
async def test_prediction_sanity_high_risk_patient():
    high_risk_patient = {
        "Age": 68,
        "BMI": 33.5,
        "Salt_Intake": 14.0,
        "Stress_Score": 9,
        "Sleep_Duration": 4.5,
        "Family_History": "Yes",
        "Exercise_Level": "Low",
        "Smoking_Status": "Smoker",
        "BP_History": "Hypertension",
        "Medication": "Diuretic",
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/v1/predict", json=high_risk_patient)
    assert res.status_code == 200
    data = res.json()
    assert data["probability"] > 0.65
    assert data["risk_level"] == "High"
    assert data["label"] == "Hypertension"
    assert data["model_used"] == "model_full"
    assert len(data["contributing_factors"]) > 0
    assert len(data["recommendations"]) > 0


@pytest.mark.asyncio
async def test_prediction_sanity_low_risk_patient():
    low_risk_patient = {
        "Age": 24,
        "BMI": 21.0,
        "Salt_Intake": 4.0,
        "Stress_Score": 2,
        "Sleep_Duration": 8.5,
        "Family_History": "No",
        "Exercise_Level": "High",
        "Smoking_Status": "Non-Smoker",
        "BP_History": "Normal",
        "Medication": "None",
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/v1/predict", json=low_risk_patient)
    assert res.status_code == 200
    data = res.json()
    assert data["probability"] < 0.35
    assert data["risk_level"] == "Low"
    assert data["label"] == "No Hypertension"
    assert data["model_used"] == "model_full"


@pytest.mark.asyncio
async def test_routing_to_lifestyle_model():
    patient_without_bp = {
        "Age": 45,
        "BMI": 26.0,
        "Salt_Intake": 7.0,
        "Stress_Score": 5,
        "Sleep_Duration": 7.0,
        "Family_History": "No",
        "Exercise_Level": "Moderate",
        "Smoking_Status": "Non-Smoker",
        # BP_History omitted
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/v1/predict", json=patient_without_bp)
    assert res.status_code == 200
    data = res.json()
    assert data["model_used"] == "model_lifestyle"
    assert "Lifestyle" in data["routing_explanation"]


@pytest.mark.asyncio
async def test_what_if_monotonicity():
    # Patient with poor lifestyle
    baseline_patient = {
        "Age": 55,
        "BMI": 31.0,
        "Salt_Intake": 12.0,
        "Stress_Score": 8,
        "Sleep_Duration": 5.0,
        "Family_History": "Yes",
        "Exercise_Level": "Low",
        "Smoking_Status": "Smoker",
        "BP_History": "Prehypertension",
    }
    # Simulate lifestyle improvements: reduce salt to 4g, sleep 8h, quit smoking, high exercise
    overrides = {
        "Salt_Intake": 4.0,
        "Sleep_Duration": 8.0,
        "Smoking_Status": "Non-Smoker",
        "Exercise_Level": "High",
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post(
            "/api/v1/what-if",
            json={"patient": baseline_patient, "overrides": overrides},
        )
    assert res.status_code == 200
    data = res.json()
    # Risk should decrease or remain non-increasing
    assert data["changed_probability"] <= data["baseline_probability"]
    assert data["probability_delta"] <= 0.0


@pytest.mark.asyncio
async def test_batch_prediction_csv():
    csv_content = """Age,BMI,Salt_Intake,Stress_Score,Sleep_Duration,Family_History,Exercise_Level,Smoking_Status,BP_History,Medication,patient_id
65,30.5,12.0,8,5.0,Yes,Low,Smoker,Hypertension,Diuretic,p1
25,22.0,4.5,2,8.0,No,High,Non-Smoker,Normal,None,p2
999,99.0,50.0,20,50.0,Invalid,Invalid,Invalid,Invalid,Invalid,p3_bad
"""
    files = {"file": ("patients.csv", csv_content.encode("utf-8"), "text/csv")}
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/v1/predict/batch", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["successful_predictions"] == 2
    assert data["failed_rows"] == 1
    assert "download_csv" in data


@pytest.mark.asyncio
async def test_model_info_and_metrics():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res_info = await ac.get("/api/v1/model/info")
        res_metrics = await ac.get("/api/v1/model/metrics")
        res_insights = await ac.get("/api/v1/insights/dataset")

    assert res_info.status_code == 200
    assert "model_full" in res_info.json()["models_available"]

    assert res_metrics.status_code == 200
    assert "models" in res_metrics.json()

    assert res_insights.status_code == 200
    assert "class_balance" in res_insights.json()


@pytest.mark.asyncio
async def test_history_flow():
    # Make a prediction to persist a record
    patient = {
        "Age": 50,
        "BMI": 27.0,
        "Salt_Intake": 8.0,
        "Stress_Score": 6,
        "Sleep_Duration": 6.0,
        "Family_History": "Yes",
        "Exercise_Level": "Moderate",
        "Smoking_Status": "Non-Smoker",
        "BP_History": "Prehypertension",
        "patient_id": "test_patient_history",
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        pred_res = await ac.post("/api/v1/predict", json=patient)
        assert pred_res.status_code == 200
        pred_id = pred_res.json()["prediction_id"]
        assert pred_id is not None

        # Query history
        hist_res = await ac.get("/api/v1/history?limit=10")
        assert hist_res.status_code == 200
        hist_data = hist_res.json()
        assert hist_data["total"] >= 1
        found = any(item["id"] == pred_id for item in hist_data["items"])
        assert found is True

        # Delete history record
        del_res = await ac.delete(f"/api/v1/history/{pred_id}")
        assert del_res.status_code == 200
        assert del_res.json()["success"] is True


@pytest.mark.asyncio
async def test_diabetes_prediction_endpoint():
    patient = {
        "gender": "Female",
        "age": 55.0,
        "hypertension": 1,
        "heart_disease": 0,
        "smoking_history": "former",
        "bmi": 32.5,
        "HbA1c_level": 7.0,
        "blood_glucose_level": 180.0,
        "patient_id": "PT-DIAB-TEST-1",
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/v1/predict/diabetes", json=patient)
    assert res.status_code == 200
    data = res.json()
    assert "probability" in data
    assert data["probability"] > 0.50
    assert data["is_diabetic"] is True
    assert data["risk_level"] in ["Moderate", "High"]
    assert len(data["contributing_factors"]) > 0
    assert len(data["recommendations"]) > 0
    assert data["hba1c_category"] == "Diabetes"
    assert data["glucose_category"] == "Elevated"


@pytest.mark.asyncio
async def test_diabetes_metrics_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/diabetes/metrics")
    assert res.status_code == 200
    data = res.json()
    assert "test_metrics" in data
    assert data["test_metrics"]["roc_auc"] > 0.95
    assert "feature_importances" in data


@pytest.mark.asyncio
async def test_cardiometabolic_prediction_endpoint():
    unified_patient = {
        "patient_id": "PT-UNIFIED-TEST",
        "age": 56,
        "gender": "Female",
        "bmi": 29.5,
        "smoking_habit": "former",
        "bp_status": "Prehypertension",
        "family_history_htn": "Yes",
        "heart_disease": 0,
        "salt_intake": 8.5,
        "stress_score": 7,
        "sleep_duration": 6.0,
        "exercise_level": "Moderate",
        "medication": "None",
        "hba1c_level": 6.3,
        "blood_glucose_level": 124.0,
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/v1/predict/cardiometabolic", json=unified_patient)
    assert res.status_code == 200
    data = res.json()
    assert "hypertension" in data
    assert "diabetes" in data
    assert "combined_risk_score" in data
    assert 0.0 <= data["combined_risk_score"] <= 100.0
    assert "combined_risk_level" in data
    assert "synergy_headline" in data
    assert len(data["top_combined_factors"]) > 0
    assert len(data["unified_recommendations"]) > 0

