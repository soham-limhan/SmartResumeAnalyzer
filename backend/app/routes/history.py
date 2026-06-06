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
            .stream()
        )
        items = []
        for doc in docs:
            data = doc.to_dict()
            items.append(data)

        # Sort client-side by uploaded_at descending (lexicographical ISO string sorting)
        items.sort(key=lambda x: x.get("uploaded_at") or "", reverse=True)

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


from pydantic import BaseModel

class InterviewAnswerRequest(BaseModel):
    question: str

@router.post(
    "/history/{analysis_id}/interview-answer",
    responses={404: {"model": ErrorResponse}},
)
async def generate_interview_question_answer(
    analysis_id: str,
    req: InterviewAnswerRequest,
    user: Optional[dict] = Depends(get_current_user)
):
    """Generate a custom AI answer for a single interview question, and persist it to the record."""
    from app.services.analyzer import generate_single_answer
    
    # 1. Lookup the analysis record
    record = None
    if user:
        db = get_db()
        doc = db.collection("analyses").document(analysis_id).get()
        if doc.exists:
            data = doc.to_dict()
            if data.get("user_id") == user["uid"]:
                record = data
    else:
        store = get_guest_store()
        record = store.get(analysis_id)
        if record:
            record = record.model_dump()
            
    if not record:
        raise HTTPException(status_code=404, detail="Analysis not found.")
        
    resume_text = record.get("resume_text", "")
    job_description = record.get("job_description")
    
    # 2. Call LLM to generate custom answer
    answer = await generate_single_answer(resume_text, req.question, job_description)
    
    # 3. Update the record so we persist the generated answer for future calls
    analysis = record.get("analysis", {})
    questions = analysis.get("interview_questions", [])
    
    updated_questions = []
    found = False
    for q in questions:
        q_text = q if isinstance(q, str) else q.get("question", "")
        if q_text.strip().lower() == req.question.strip().lower():
            updated_questions.append({"question": req.question, "answer": answer})
            found = True
        else:
            updated_questions.append(q)
            
    if not found:
        updated_questions.append({"question": req.question, "answer": answer})
        
    analysis["interview_questions"] = updated_questions
    record["analysis"] = analysis
    
    # 4. Save back to Firestore or in-memory
    if user:
        db = get_db()
        db.collection("analyses").document(analysis_id).set(record)
    else:
        store = get_guest_store()
        from app.models.schemas import AnalysisRecord
        if isinstance(record.get("uploaded_at"), str):
            from datetime import datetime
            record["uploaded_at"] = datetime.fromisoformat(record["uploaded_at"])
        store[analysis_id] = AnalysisRecord.model_validate(record)
        
    return {"question": req.question, "answer": answer}
