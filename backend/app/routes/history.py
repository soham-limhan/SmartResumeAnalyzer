"""Resume history API routes."""

from fastapi import APIRouter, HTTPException

from app.models.schemas import AnalysisRecord, HistoryListResponse, ErrorResponse
from app.routes.upload import get_store

router = APIRouter()


@router.get(
    "/history",
    response_model=HistoryListResponse,
)
async def list_history():
    """Get all past resume analyses, ordered by most recent first."""
    store = get_store()
    items = sorted(store.values(), key=lambda x: x.uploaded_at, reverse=True)
    return HistoryListResponse(total=len(items), items=items)


@router.get(
    "/history/{analysis_id}",
    response_model=AnalysisRecord,
    responses={404: {"model": ErrorResponse}},
)
async def get_analysis(analysis_id: str):
    """Get a specific analysis record by ID."""
    store = get_store()
    record = store.get(analysis_id)
    if not record:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return record


@router.delete(
    "/history/{analysis_id}",
    responses={404: {"model": ErrorResponse}},
)
async def delete_analysis(analysis_id: str):
    """Delete a specific analysis record."""
    store = get_store()
    if analysis_id not in store:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    del store[analysis_id]
    return {"status": "deleted", "id": analysis_id}
