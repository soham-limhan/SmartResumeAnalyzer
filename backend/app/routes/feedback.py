"""Feedback API routes."""

import logging
from typing import List
from fastapi import APIRouter, HTTPException

from app.database import get_db
from app.models.schemas import FeedbackRequest, FeedbackRecord, ErrorResponse

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/feedback", response_model=FeedbackRecord, responses={400: {"model": ErrorResponse}})
async def submit_feedback(req: FeedbackRequest):
    """Submit new user feedback."""
    try:
        db = get_db()
        record = FeedbackRecord(
            name=req.name,
            role=req.role,
            quote=req.quote
        )
        
        doc_data = record.model_dump()
        doc_data["created_at"] = record.created_at.isoformat()
        
        db.collection("feedbacks").document(record.id).set(doc_data)
        logger.info(f"Saved new feedback from {req.name}")
        
        return record
    except Exception as e:
        logger.error(f"Failed to save feedback: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/feedback", response_model=List[FeedbackRecord])
async def get_feedback():
    """Retrieve the latest feedback entries."""
    try:
        db = get_db()
        # Fetch feedbacks, order by created_at descending, limit to 10
        docs = db.collection("feedbacks").order_by("created_at", direction="DESCENDING").limit(10).stream()
        
        results = []
        for doc in docs:
            data = doc.to_dict()
            results.append(data)
            
        return results
    except Exception as e:
        logger.error(f"Failed to fetch feedback: {e}")
        return []
