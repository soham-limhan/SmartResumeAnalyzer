"""Export API routes for generating downloadable reports."""

from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import PlainTextResponse, JSONResponse

from app.models.schemas import ErrorResponse
from app.services.auth import get_current_user
from app.services.export import generate_text_report, generate_json_export
from app.database import get_db
from app.routes.upload import get_guest_store

router = APIRouter()


@router.get(
    "/export/{analysis_id}",
    responses={404: {"model": ErrorResponse}},
)
async def export_analysis(
    analysis_id: str,
    format: str = "text",
    user: Optional[dict] = Depends(get_current_user),
):
    """Export an analysis as a downloadable report.

    Args:
        analysis_id: The analysis record ID.
        format: Export format — 'text' or 'json'. Defaults to 'text'.
    """
    record_dict = None

    if user:
        # Authenticated → Firestore
        db = get_db()
        doc = db.collection("analyses").document(analysis_id).get()
        if doc.exists:
            data = doc.to_dict()
            if data.get("user_id") == user["uid"]:
                record_dict = data

    if not record_dict:
        # Try guest store
        store = get_guest_store()
        record = store.get(analysis_id)
        if record:
            record_dict = record.model_dump()

    if not record_dict:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    if format == "json":
        return JSONResponse(
            content=record_dict,
            headers={
                "Content-Disposition": f'attachment; filename="smartresume_report_{analysis_id[:8]}.json"',
            },
        )
    else:
        content = generate_text_report(record_dict)
        return PlainTextResponse(
            content=content,
            headers={
                "Content-Disposition": f'attachment; filename="smartresume_report_{analysis_id[:8]}.txt"',
            },
        )
