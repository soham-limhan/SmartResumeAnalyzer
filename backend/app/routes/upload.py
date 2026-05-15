"""Upload and analysis API routes."""

import asyncio
import logging
from typing import Optional

from fastapi import APIRouter, File, Form, UploadFile, HTTPException, Depends

from app.config import settings
from app.models.schemas import (
    AnalysisRecord, UploadResponse, BatchItemResult, BatchUploadResponse, ErrorResponse,
)
from app.services.extractor import extract_text
from app.services.analyzer import analyze_resume
from app.services.auth import get_current_user
from app.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter()

# In-memory store for guest (unauthenticated) analyses — volatile
_guest_store: dict[str, AnalysisRecord] = {}

# Semaphore to limit concurrent AI calls (protects Groq rate limits)
_analysis_semaphore = asyncio.Semaphore(3)


def get_guest_store() -> dict[str, AnalysisRecord]:
    """Get the guest analysis store (used by other route modules)."""
    return _guest_store


# ─── Single Upload ──────────────────────────────────────────────────────────────

@router.post(
    "/upload",
    response_model=UploadResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def upload_and_analyze(
    file: UploadFile = File(..., description="Resume file (PDF or DOCX)"),
    job_description: Optional[str] = Form(None, description="Optional job description for matching"),
    user: Optional[dict] = Depends(get_current_user),
):
    """Upload a resume file and get AI-powered analysis.

    Accepts PDF and DOCX files up to 10MB. Returns structured analysis
    including ATS score, skill assessment, and actionable recommendations.

    - Authenticated users: analysis is persisted to Firestore.
    - Guests: analysis is returned but stored only in-memory (lost on server restart).
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
    await file.seek(0)

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

        # Create record
        record = AnalysisRecord(
            filename=file.filename,
            file_size=len(content),
            file_type=ext,
            resume_text=resume_text,
            analysis=analysis,
            job_description=job_description,
            user_id=user["uid"] if user else None,
        )

        # Persist based on auth status
        if user:
            # Authenticated → save to Firestore
            db = get_db()
            doc_data = record.model_dump()
            doc_data["uploaded_at"] = record.uploaded_at.isoformat()
            db.collection("analyses").document(record.id).set(doc_data)
            logger.info(f"Analysis saved to Firestore for user {user['uid']}")
        else:
            # Guest → in-memory only
            _guest_store[record.id] = record
            logger.info(f"Guest analysis stored in-memory: {record.id}")

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
        if isinstance(e, HTTPException):
            raise
        logger.exception(f"Unexpected error processing {file.filename}")
        raise HTTPException(status_code=500, detail=f"Internal error: {e}")


# ─── Batch Upload (up to 25 files) ──────────────────────────────────────────────

async def _process_single_file(
    file: UploadFile,
    job_description: Optional[str],
    user: Optional[dict],
) -> BatchItemResult:
    """Process one resume file inside a batch. Returns a BatchItemResult."""
    filename = file.filename or "unknown"
    try:
        if not file.filename:
            return BatchItemResult(filename=filename, success=False, error="No filename provided.")

        ext = file.filename.lower().split(".")[-1] if "." in file.filename else ""
        if ext not in ("pdf", "docx"):
            return BatchItemResult(
                filename=filename, success=False,
                error=f"Unsupported file type '.{ext}'. Only PDF and DOCX are accepted.",
            )

        content = await file.read()
        await file.seek(0)

        size_mb = len(content) / (1024 * 1024)
        if size_mb > settings.max_upload_size_mb:
            return BatchItemResult(
                filename=filename, success=False,
                error=f"File too large ({size_mb:.1f}MB). Max is {settings.max_upload_size_mb}MB.",
            )

        resume_text = await extract_text(file)
        if not resume_text.strip():
            return BatchItemResult(
                filename=filename, success=False,
                error="Could not extract text. File may be scanned/image-based.",
            )

        # Use semaphore to limit concurrent AI calls
        async with _analysis_semaphore:
            analysis = await analyze_resume(resume_text, job_description)

        record = AnalysisRecord(
            filename=file.filename,
            file_size=len(content),
            file_type=ext,
            resume_text=resume_text,
            analysis=analysis,
            job_description=job_description,
            user_id=user["uid"] if user else None,
        )

        # Persist
        if user:
            db = get_db()
            doc_data = record.model_dump()
            doc_data["uploaded_at"] = record.uploaded_at.isoformat()
            db.collection("analyses").document(record.id).set(doc_data)
        else:
            _guest_store[record.id] = record

        logger.info(f"[BATCH] ✓ {filename} — ATS {analysis.ats_score}")

        return BatchItemResult(
            filename=filename,
            success=True,
            id=record.id,
            analysis=analysis,
            uploaded_at=record.uploaded_at,
        )

    except Exception as e:
        logger.error(f"[BATCH] ✗ {filename}: {e}")
        return BatchItemResult(filename=filename, success=False, error=str(e))


@router.post(
    "/batch-upload",
    response_model=BatchUploadResponse,
    responses={400: {"model": ErrorResponse}},
)
async def batch_upload_and_analyze(
    files: list[UploadFile] = File(..., description="Up to 25 resume files (PDF or DOCX)"),
    job_description: Optional[str] = Form(None, description="Shared job description for matching"),
    user: Optional[dict] = Depends(get_current_user),
):
    """Upload up to 25 resume files and analyze them all.

    Each file is processed concurrently (max 3 parallel AI calls).
    Returns per-file results including successes and failures.
    """
    if len(files) > 25:
        raise HTTPException(
            status_code=400,
            detail=f"Too many files ({len(files)}). Maximum batch size is 25.",
        )

    if not files:
        raise HTTPException(status_code=400, detail="No files provided.")

    logger.info(f"[BATCH] Starting batch analysis of {len(files)} file(s)")

    # Process all files concurrently (semaphore limits AI parallelism)
    tasks = [_process_single_file(f, job_description, user) for f in files]
    results = await asyncio.gather(*tasks)

    successful = sum(1 for r in results if r.success)
    failed = sum(1 for r in results if not r.success)

    logger.info(f"[BATCH] Complete: {successful} succeeded, {failed} failed out of {len(files)}")

    return BatchUploadResponse(
        total=len(results),
        successful=successful,
        failed=failed,
        results=list(results),
    )
