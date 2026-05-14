"""Export API routes for generating downloadable reports."""

from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse, JSONResponse

from app.models.schemas import ErrorResponse
from app.routes.upload import get_store
from app.services.export import generate_text_report, generate_json_export

router = APIRouter()


@router.get(
    "/export/{analysis_id}",
    responses={404: {"model": ErrorResponse}},
)
async def export_analysis(analysis_id: str, format: str = "text"):
    """Export an analysis as a downloadable report.

    Args:
        analysis_id: The analysis record ID.
        format: Export format — 'text' or 'json'. Defaults to 'text'.
    """
    store = get_store()
    record = store.get(analysis_id)
    if not record:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    record_dict = record.model_dump()

    if format == "json":
        content = generate_json_export(record_dict)
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
