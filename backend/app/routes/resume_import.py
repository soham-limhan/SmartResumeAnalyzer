"""Resume import API endpoint — POST /api/resumes/import

Accepts a PDF or DOCX file, extracts structured data using the AI import service,
and returns a confidence-scored ImportedResume JSON object.
"""

import logging
from typing import Optional

from fastapi import APIRouter, File, UploadFile, HTTPException, Depends

from app.models.schemas import ImportedResume, ErrorResponse
from app.services.extractor import extract_text
from app.services.resume_importer import extract_and_parse
from app.services.auth import get_current_user

# Re-use the validation helpers from the upload route
from app.routes.upload import _sanitize_filename, _validate_file_type, _validate_file_size

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/resumes/import",
    response_model=ImportedResume,
    responses={
        400: {"model": ErrorResponse},
        422: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
    summary="Import and extract structured data from an existing resume",
    description=(
        "Upload a PDF or DOCX resume file (up to 10 MB). "
        "The server extracts plain text, sends it through an AI extraction pipeline "
        "that identifies all resume sections, and returns a structured JSON object "
        "with per-field confidence scores (0–100). "
        "Fields that could not be found are returned as null. "
        "Authentication is optional — the endpoint works for guests as well."
    ),
)
async def import_resume(
    file: UploadFile = File(..., description="Resume file — PDF or DOCX, max 10 MB"),
    user: Optional[dict] = Depends(get_current_user),
):
    """Extract structured resume data from an uploaded file with AI confidence scoring.

    Pipeline:
        1. Validate filename, extension, magic bytes, and size
        2. Extract plain text (PyMuPDF for PDF, python-docx for DOCX)
        3. Send text through AI extraction prompt
        4. Normalize + deduplicate extracted data
        5. Return ImportedResume with per-field confidence scores
    """
    # ── 1. Security validation ─────────────────────────────────────────────────
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided.")

    try:
        safe_name = _sanitize_filename(file.filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    content = await file.read()
    await file.seek(0)

    try:
        _validate_file_type(safe_name, content)
        size_mb = _validate_file_size(content, safe_name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    logger.info(
        f"[IMPORT] Starting import for '{file.filename}' ({size_mb:.2f} MB)"
        + (f" — user {user['uid']}" if user else " — guest")
    )

    # ── 2. Text extraction ────────────────────────────────────────────────────
    try:
        resume_text = await extract_text(file)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception(f"[IMPORT] Text extraction failed for '{file.filename}'")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to read the file. It may be password-protected or corrupted. Error: {e}",
        )

    if not resume_text.strip():
        raise HTTPException(
            status_code=422,
            detail=(
                "Could not extract any readable text from the uploaded file. "
                "The PDF may contain only scanned images. "
                "Please use a PDF with selectable text, or a DOCX file."
            ),
        )

    logger.info(f"[IMPORT] Extracted {len(resume_text)} characters from '{file.filename}'")

    # ── 3. AI extraction ──────────────────────────────────────────────────────
    try:
        result = await extract_and_parse(
            resume_text=resume_text,
            filename=file.filename,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.exception(f"[IMPORT] Unexpected error during AI extraction for '{file.filename}'")
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred during extraction: {e}",
        )

    logger.info(
        f"[IMPORT] ✓ Complete for '{file.filename}': "
        f"personal={bool(result.personal.fullName.value)}, "
        f"education={len(result.education)}, "
        f"experience={len(result.experience)}, "
        f"projects={len(result.projects)}"
    )

    return result
