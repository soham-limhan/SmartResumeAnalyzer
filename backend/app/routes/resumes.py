"""Resume Builder API routes — Firestore CRUD endpoints."""

import logging
from datetime import datetime
from typing import Optional, List
import uuid

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from app.services.auth import get_current_user
from app.database import get_db
from app.models.schemas import ErrorResponse

logger = logging.getLogger(__name__)

router = APIRouter()


# ─── Pydantic Models for Resume Builder ──────────────────────────────────────────

class BuilderPersonalInfo(BaseModel):
    fullName: str = ""
    professionalTitle: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    linkedin: str = ""
    github: str = ""
    portfolioWebsite: str = ""
    professionalSummary: str = ""


class BuilderEducation(BaseModel):
    id: str
    degree: str
    institution: str
    startDate: str
    endDate: str
    gpa: Optional[str] = ""
    description: Optional[str] = ""


class BuilderExperience(BaseModel):
    id: str
    jobTitle: str
    company: str
    location: Optional[str] = ""
    startDate: str
    endDate: Optional[str] = ""
    current: bool = False
    responsibilities: Optional[str] = ""
    achievements: Optional[str] = ""


class BuilderSkills(BaseModel):
    technical: List[str] = []
    soft: List[str] = []
    languages: List[str] = []
    certifications: List[str] = []


class BuilderProject(BaseModel):
    id: str
    projectName: str
    description: str
    technologies: List[str] = []
    githubLink: Optional[str] = ""
    liveDemoLink: Optional[str] = ""


class ResumeModel(BaseModel):
    id: Optional[str] = None
    designTemplate: str = "modern_professional"
    personalInfo: BuilderPersonalInfo = Field(default_factory=BuilderPersonalInfo)
    education: List[BuilderEducation] = Field(default_factory=list)
    experience: List[BuilderExperience] = Field(default_factory=list)
    skills: BuilderSkills = Field(default_factory=BuilderSkills)
    projects: List[BuilderProject] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ─── CRUD Endpoints ───────────────────────────────────────────────────────────

@router.get(
    "/resumes",
    response_model=List[ResumeModel],
    responses={401: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    summary="Get user resumes",
)
async def get_resumes(user: dict = Depends(get_current_user)):
    """Retrieve all saved resumes for the currently logged-in user."""
    try:
        db = get_db()
        docs = (
            db.collection("resumes")
            .where("user_id", "==", user["uid"])
            .order_by("updated_at", direction="DESCENDING")
            .stream()
        )
        
        resumes = []
        for doc in docs:
            data = doc.to_dict()
            resumes.append(ResumeModel.model_validate(data))
        return resumes
    except Exception as e:
        logger.exception(f"Failed to fetch resumes for user {user['uid']}")
        raise HTTPException(status_code=500, detail=f"Database fetch failed: {e}")


@router.post(
    "/resumes",
    response_model=ResumeModel,
    responses={401: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    summary="Save or update a resume",
)
async def save_resume(
    resume: ResumeModel,
    user: dict = Depends(get_current_user)
):
    """Save a new resume or update an existing one under the user's profile."""
    try:
        db = get_db()
        resume_id = resume.id

        # If no ID, generate a new one
        if not resume_id:
            resume_id = uuid.uuid4().hex
            resume.id = resume_id
            resume.created_at = datetime.now()
        
        resume.updated_at = datetime.now()

        # Build database payload
        doc_data = resume.model_dump()
        doc_data["user_id"] = user["uid"]
        
        # Serialize datetime fields for Firestore validation
        doc_data["created_at"] = doc_data["created_at"].isoformat() if doc_data["created_at"] else datetime.now().isoformat()
        doc_data["updated_at"] = doc_data["updated_at"].isoformat()

        # Save to collection
        db.collection("resumes").document(resume_id).set(doc_data)
        logger.info(f"Resume saved successfully: id={resume_id}, user={user['uid']}")
        
        return resume
    except Exception as e:
        logger.exception(f"Failed to save resume for user {user['uid']}")
        raise HTTPException(status_code=500, detail=f"Database save failed: {e}")


@router.delete(
    "/resumes/{resume_id}",
    responses={401: {"model": ErrorResponse}, 404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    summary="Delete a resume",
)
async def delete_resume(
    resume_id: str,
    user: dict = Depends(get_current_user)
):
    """Delete a specific resume by its unique ID."""
    try:
        db = get_db()
        doc_ref = db.collection("resumes").document(resume_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Resume not found.")
            
        data = doc.to_dict()
        if data.get("user_id") != user["uid"]:
            raise HTTPException(status_code=403, detail="Not authorized to delete this resume.")
            
        doc_ref.delete()
        logger.info(f"Deleted resume: id={resume_id}, user={user['uid']}")
        return {"status": "success", "message": "Resume deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Failed to delete resume: id={resume_id}")
        raise HTTPException(status_code=500, detail=f"Database deletion failed: {e}")
