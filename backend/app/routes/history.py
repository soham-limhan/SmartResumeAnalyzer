"""Resume history API routes."""

from typing import Optional

from fastapi import APIRouter, HTTPException, Depends

from app.models.schemas import AnalysisRecord, HistoryListResponse, ErrorResponse
from app.services.auth import get_current_user
from app.database import get_db
from app.routes.upload import get_guest_store

router = APIRouter()


@router.get(
    "/history",
    response_model=HistoryListResponse,
)
async def list_history(user: Optional[dict] = Depends(get_current_user)):
    """Get all past resume analyses for the current user.

    - Authenticated users: returns analyses from Firestore filtered by user_id.
    - Guests: returns analyses from in-memory store (volatile).
    """
    if user:
        # Authenticated → query Firestore
        db = get_db()
        docs = (
            db.collection("analyses")
            .where("user_id", "==", user["uid"])
            .order_by("uploaded_at", direction="DESCENDING")
            .stream()
        )
        items = []
        for doc in docs:
            data = doc.to_dict()
            items.append(data)

        return HistoryListResponse(total=len(items), items=items)
    else:
        # Guest → in-memory store
        store = get_guest_store()
        items = sorted(store.values(), key=lambda x: x.uploaded_at, reverse=True)
        return HistoryListResponse(
            total=len(items),
            items=[item.model_dump() for item in items],
        )


@router.get(
    "/history/{analysis_id}",
    responses={404: {"model": ErrorResponse}},
)
async def get_analysis(analysis_id: str, user: Optional[dict] = Depends(get_current_user)):
    """Get a specific analysis record by ID."""
    if user:
        # Authenticated → Firestore
        db = get_db()
        doc = db.collection("analyses").document(analysis_id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Analysis not found.")

        data = doc.to_dict()
        # Verify ownership
        if data.get("user_id") != user["uid"]:
            raise HTTPException(status_code=404, detail="Analysis not found.")

        return data
    else:
        # Guest → in-memory
        store = get_guest_store()
        record = store.get(analysis_id)
        if not record:
            raise HTTPException(status_code=404, detail="Analysis not found.")
        return record


@router.delete(
    "/history/{analysis_id}",
    responses={404: {"model": ErrorResponse}},
)
async def delete_analysis(analysis_id: str, user: Optional[dict] = Depends(get_current_user)):
    """Delete a specific analysis record."""
    if user:
        # Authenticated → Firestore
        db = get_db()
        doc = db.collection("analyses").document(analysis_id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Analysis not found.")

        data = doc.to_dict()
        if data.get("user_id") != user["uid"]:
            raise HTTPException(status_code=404, detail="Analysis not found.")

        db.collection("analyses").document(analysis_id).delete()
    else:
        # Guest → in-memory
        store = get_guest_store()
        if analysis_id not in store:
            raise HTTPException(status_code=404, detail="Analysis not found.")
        del store[analysis_id]

    return {"status": "deleted", "id": analysis_id}
