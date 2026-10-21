"""
Batch prediction endpoint supporting CSV uploads (up to 5 MB, max 5,000 rows).
"""
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends
from fastapi.responses import Response
from app.schemas.patient import PatientInput
from app.services.predictor import process_batch_csv

router = APIRouter()
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


@router.post(
    "/predict/batch",
    summary="Batch Predict via CSV Upload",
    description="Upload a CSV dataset up to 5 MB (max 5,000 rows). Returns prediction results and processed CSV download.",
)
async def predict_batch(
    file: UploadFile = File(..., description="CSV file with patient demographic and health records"),
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Please upload a standard .csv file."
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds maximum allowed threshold of 5 MB."
        )

    try:
        csv_text = content.decode("utf-8")
    except UnicodeDecodeError:
        try:
            csv_text = content.decode("latin-1")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to decode CSV text encoding. Please ensure UTF-8 encoding."
            )

    try:
        results, output_csv, valid_count, error_count = process_batch_csv(csv_text)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch processing error: {str(e)}"
        )

    return {
        "filename": file.filename,
        "total_rows": valid_count + error_count,
        "successful_predictions": valid_count,
        "failed_rows": error_count,
        "results": results[:100],  # Return first 100 in JSON payload for quick UI preview
        "has_more": len(results) > 100,
        "download_csv": output_csv,
    }
