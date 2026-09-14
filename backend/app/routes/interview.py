"""Mock Interview API routes."""

import logging
import uuid
from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from pydantic import BaseModel

from app.config import settings
from app.models.schemas import (
    InterviewGenerateRequest,
    InterviewGenerateResponse,
    InterviewTranscribeResponse,
    InterviewEvaluateRequest,
    InterviewEvaluationResult,
    MockInterviewSessionRecord,
    ErrorResponse,
)
from app.services.interview import (
    generate_interview_questions,
    transcribe_audio_file,
    evaluate_interview_session,
)
from app.services.auth import get_current_user
from app.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter()

# In-memory store for guest interview sessions
_guest_interview_store: dict[str, MockInterviewSessionRecord] = {}


def get_guest_interview_store() -> dict[str, MockInterviewSessionRecord]:
    """Get the guest interview session store."""
    return _guest_interview_store


# ─── 1. Generate Interview Questions ─────────────────────────────────────────

@router.post(
    "/interview/generate",
    response_model=InterviewGenerateResponse,
    responses={500: {"model": ErrorResponse}},
)
async def api_generate_interview_questions(
    req: InterviewGenerateRequest,
    user: Optional[dict] = Depends(get_current_user),
):
    """Generate custom interview questions for a given topic and difficulty."""
    try:
        response = await generate_interview_questions(
            topic=req.topic,
            difficulty=req.difficulty,
            count=req.count,
            experience_level=req.experience_level or "mid",
            resume_text=req.resume_text,
        )
        return response
    except Exception as e:
        logger.error(f"Error generating interview questions: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate interview questions: {str(e)}",
        )


# ─── 2. Transcribe Spoken Answer Audio ────────────────────────────────────────

@router.post(
    "/interview/transcribe",
    response_model=InterviewTranscribeResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def api_transcribe_audio(
    audio: UploadFile = File(...),
    user: Optional[dict] = Depends(get_current_user),
):
    """Transcribe spoken audio from candidate microphone using Groq Whisper."""
    try:
        content = await audio.read()
        if not content:
            raise HTTPException(status_code=400, detail="Empty audio file received.")

        result = await transcribe_audio_file(
            file_bytes=content,
            filename=audio.filename or "recording.webm",
            content_type=audio.content_type or "audio/webm",
        )
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Audio transcription endpoint error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Audio transcription failed: {str(e)}",
        )


# ─── 3. Evaluate Interview Answers & Save Session ─────────────────────────────

@router.post(
    "/interview/evaluate",
    response_model=MockInterviewSessionRecord,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def api_evaluate_interview(
    req: InterviewEvaluateRequest,
    user: Optional[dict] = Depends(get_current_user),
):
    """Evaluate candidate answers, compute multi-band scores, and persist the session."""
    if not req.answers:
        raise HTTPException(status_code=400, detail="No answers provided for evaluation.")

    try:
        # Run AI Evaluation
        evaluation = await evaluate_interview_session(
            topic=req.topic,
            difficulty=req.difficulty,
            answers=req.answers,
        )

        session_id = uuid.uuid4().hex
        user_id = user["uid"] if user else None

        record = MockInterviewSessionRecord(
            id=session_id,
            user_id=user_id,
            created_at=datetime.now(),
            topic=req.topic,
            difficulty=req.difficulty,
            answers=req.answers,
            evaluation=evaluation,
        )

        # Persist to Firestore if authenticated, otherwise memory
        if user_id:
            try:
                db = get_db()
                db.collection("mock_interviews").document(session_id).set(
                    record.model_dump(mode="json")
                )
                logger.info(f"Saved mock interview {session_id} to Firestore for user {user_id}")
            except Exception as fe:
                logger.warning(f"Failed to persist to Firestore, storing in memory fallback: {fe}")
                _guest_interview_store[session_id] = record
        else:
            _guest_interview_store[session_id] = record
            logger.info(f"Saved mock interview {session_id} to guest store")

        return record

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Interview evaluation error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to evaluate interview answers: {str(e)}",
        )


# ─── 4. List Interview History ────────────────────────────────────────────────

@router.get(
    "/interview/history",
    response_model=List[MockInterviewSessionRecord],
)
async def api_get_interview_history(
    user: Optional[dict] = Depends(get_current_user),
):
    """Get previous mock interview sessions for current user or guest."""
    if user:
        try:
            db = get_db()
            docs = (
                db.collection("mock_interviews")
                .where("user_id", "==", user["uid"])
                .order_by("created_at", direction="DESCENDING")
                .limit(20)
                .stream()
            )
            records = []
            for doc in docs:
                records.append(MockInterviewSessionRecord(**doc.to_dict()))
            return records
        except Exception as e:
            logger.warning(f"Error fetching interviews from Firestore: {e}")

    # Guest store
    return list(_guest_interview_store.values())[::-1]


# ─── 5. Get Single Interview Session ──────────────────────────────────────────

@router.get(
    "/interview/{session_id}",
    response_model=MockInterviewSessionRecord,
    responses={404: {"model": ErrorResponse}},
)
async def api_get_interview_session(
    session_id: str,
    user: Optional[dict] = Depends(get_current_user),
):
    """Retrieve a specific interview session by ID."""
    if user:
        try:
            db = get_db()
            doc = db.collection("mock_interviews").document(session_id).get()
            if doc.exists:
                data = doc.to_dict()
                if data.get("user_id") == user["uid"]:
                    return MockInterviewSessionRecord(**data)
        except Exception as e:
            logger.warning(f"Error getting interview from Firestore: {e}")

    if session_id in _guest_interview_store:
        return _guest_interview_store[session_id]

    raise HTTPException(status_code=404, detail="Mock interview session not found.")


# ─── 6. Delete Interview Session ──────────────────────────────────────────────

@router.delete(
    "/interview/{session_id}",
)
async def api_delete_interview_session(
    session_id: str,
    user: Optional[dict] = Depends(get_current_user),
):
    """Delete a mock interview session."""
    if user:
        try:
            db = get_db()
            doc_ref = db.collection("mock_interviews").document(session_id)
            doc = doc_ref.get()
            if doc.exists and doc.to_dict().get("user_id") == user["uid"]:
                doc_ref.delete()
                return {"success": True, "message": "Session deleted"}
        except Exception as e:
            logger.warning(f"Error deleting interview from Firestore: {e}")

    if session_id in _guest_interview_store:
        del _guest_interview_store[session_id]
        return {"success": True, "message": "Session deleted"}

    raise HTTPException(status_code=404, detail="Mock interview session not found.")
