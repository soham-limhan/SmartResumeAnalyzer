"""Upload and analysis API routes."""

import os
import logging
from typing import Optional

from fastapi import APIRouter, File, Form, UploadFile, HTTPException

from app.config import settings
from app.models.schemas import AnalysisRecord, UploadResponse, ErrorResponse
from app.services.extractor import extract_text
from app.services.analyzer import analyze_resume

logger = logging.getLogger(__name__)

router = APIRouter()

# In-memory storage for analysis records
_analysis_store: dict[str, AnalysisRecord] = {}


def get_store() -> dict[str, AnalysisRecord]:
    """Get the analysis store (used by other route modules)."""
    return _analysis_store


@router.post(
    "/upload",
    response_model=UploadResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def upload_and_analyze(
    file: UploadFile = File(..., description="Resume file (PDF or DOCX)"),
    job_description: Optional[str] = Form(None, description="Optional job description for matching"),
):
    """Upload a resume file and get AI-powered analysis.

    Accepts PDF and DOCX files up to 10MB. Returns structured analysis
    including ATS score, skill assessment, and actionable recommendations.
    """
    # Validate file type
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided.")

    ext = file.filename.lower().split(".")[-1] if "." in file.filename else ""
    if ext not in ("pdf", "docx"):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '.{ext}'. Only PDF and DOCX files are accepted.",
        )

    # Validate file size
    content = await file.read()
    await file.seek(0)  # Reset for extraction

    size_mb = len(content) / (1024 * 1024)
    if size_mb > settings.max_upload_size_mb:
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({size_mb:.1f}MB). Maximum size is {settings.max_upload_size_mb}MB.",
        )

    try:
        # Extract text
        logger.info(f"Extracting text from: {file.filename} ({size_mb:.2f}MB)")
        resume_text = await extract_text(file)

        if not resume_text.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not extract any text from the uploaded file. The file may be scanned/image-based.",
            )

        logger.info(f"Extracted {len(resume_text)} characters from {file.filename}")

        # Run AI analysis
        analysis = await analyze_resume(resume_text, job_description)

        # Save to store
        record = AnalysisRecord(
            filename=file.filename,
            file_size=len(content),
            file_type=ext,
            resume_text=resume_text,
            analysis=analysis,
            job_description=job_description,
        )
        _analysis_store[record.id] = record

        # Save file to disk
        upload_path = os.path.join(settings.upload_dir, f"{record.id}_{file.filename}")
        with open(upload_path, "wb") as f:
            f.write(content)

        logger.info(f"Analysis complete for {file.filename} — ATS Score: {analysis.ats_score}")

        return UploadResponse(
            id=record.id,
            filename=record.filename,
            analysis=analysis,
            uploaded_at=record.uploaded_at,
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.exception(f"Unexpected error processing {file.filename}")
        raise HTTPException(status_code=500, detail=f"Internal error: {e}")
