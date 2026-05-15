"""Upload and analysis API routes."""

import asyncio
import logging
import os
import re
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

# ─── File-type magic bytes signatures ───────────────────────────────────────────
_MAGIC_SIGNATURES = {
    "pdf": [
        b"%PDF",           # Standard PDF header
    ],
    "docx": [
        b"PK\x03\x04",    # ZIP archive (DOCX is a ZIP container)
    ],
}

# Characters allowed in sanitised filenames
_SAFE_FILENAME_RE = re.compile(r"[^\w.\- ]", re.UNICODE)


def _sanitize_filename(filename: str) -> str:
    """Sanitize a filename to prevent path-traversal and injection attacks.

    - Strips directory components
    - Rejects null bytes
    - Removes non-printable / special characters
    - Rejects empty names
    """
    if "\x00" in filename:
        raise ValueError("Filename contains null bytes.")

    # Strip directory separators / path traversal
    filename = os.path.basename(filename)
    filename = filename.replace("..", "")

    # Remove unsafe characters
    name, _, ext = filename.rpartition(".")
    if not name:
        name = ext
        ext = ""
    name = _SAFE_FILENAME_RE.sub("_", name).strip("_") or "upload"
    ext = _SAFE_FILENAME_RE.sub("", ext).lower()
    return f"{name}.{ext}" if ext else name


def _validate_file_type(filename: str, content: bytes) -> str:
    """Validate that an uploaded file is genuinely a PDF or DOCX.

    Returns the validated extension on success.
    Raises ValueError with a user-friendly message on failure.
    """
    # --- Extension checks ---
    if "." not in filename:
        raise ValueError("Filename has no extension. Only .pdf and .docx files are accepted.")

    ext = filename.rsplit(".", 1)[-1].lower()

    # Reject double-extension tricks like "resume.pdf.exe"
    parts = filename.rsplit(".", 2)
    if len(parts) > 2:
        # More than one dot — verify ALL extensions are the same valid type
        exts = [p.lower() for p in parts[1:]]
        if not all(e in ("pdf", "docx") for e in exts):
            raise ValueError(
                f"Suspicious filename '{filename}'. Multiple or mismatched extensions are not allowed."
            )

    if ext not in ("pdf", "docx"):
        raise ValueError(
            f"Unsupported file type '.{ext}'. Only PDF and DOCX files are accepted."
        )

    # --- Magic-byte verification ---
    signatures = _MAGIC_SIGNATURES.get(ext, [])
    if not any(content[:len(sig)] == sig for sig in signatures):
        raise ValueError(
            f"File content does not match the '.{ext}' extension. "
            "The file may be corrupted or disguised. Only genuine PDF and DOCX files are accepted."
        )

    return ext


def _validate_file_size(content: bytes, filename: str) -> float:
    """Validate the file size is within the allowed limit. Returns size in MB."""
    size_mb = len(content) / (1024 * 1024)
    if size_mb > settings.max_upload_size_mb:
        raise ValueError(
            f"File '{filename}' is too large ({size_mb:.1f}MB). "
            f"Maximum allowed size is {settings.max_upload_size_mb}MB."
        )
    return size_mb

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
    # --- Security validation layer ------------------------------------------------
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided.")

    try:
        safe_name = _sanitize_filename(file.filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    content = await file.read()
    await file.seek(0)

    try:
        ext = _validate_file_type(safe_name, content)
        size_mb = _validate_file_size(content, safe_name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

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
        # --- Security validation layer ----------------------------------------
        if not file.filename:
            return BatchItemResult(filename=filename, success=False, error="No filename provided.")

        try:
            safe_name = _sanitize_filename(file.filename)
        except ValueError as e:
            return BatchItemResult(filename=filename, success=False, error=str(e))

        content = await file.read()
        await file.seek(0)

        try:
            ext = _validate_file_type(safe_name, content)
            size_mb = _validate_file_size(content, safe_name)
        except ValueError as e:
            return BatchItemResult(filename=filename, success=False, error=str(e))

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
