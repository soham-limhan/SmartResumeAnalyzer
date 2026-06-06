"""Export API routes for generating downloadable Word documents from the Resume Builder."""

import io
import logging
from typing import Any, Dict

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.services.builder_docx import generate_builder_docx
from app.models.schemas import ErrorResponse

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/resumes/export/docx",
    responses={500: {"model": ErrorResponse}},
    summary="Download built resume as DOCX",
)
async def download_built_docx(resume_data: Dict[str, Any]):
    """Generate and stream a Microsoft Word (.docx) file from the Resume Builder state payload."""
    try:
        docx_bytes = generate_builder_docx(resume_data)
    except Exception as e:
        logger.exception("Resume Builder DOCX generation failed")
        raise HTTPException(status_code=500, detail=f"DOCX generation failed: {e}")

    filename = "resume.docx"
    personal_info = resume_data.get("personalInfo", {})
    if personal_info.get("fullName"):
        safe_name = personal_info.get("fullName").replace(" ", "_").lower()
        filename = f"{safe_name}_resume.docx"

    return StreamingResponse(
        io.BytesIO(docx_bytes),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
