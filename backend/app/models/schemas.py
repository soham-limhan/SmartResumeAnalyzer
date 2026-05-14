"""Pydantic schemas for request/response models."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
import uuid


# ─── AI Analysis Schema ────────────────────────────────────────────────────────

class SkillScore(BaseModel):
    """Individual skill proficiency score."""
    name: str
    score: int = Field(ge=0, le=100, description="Proficiency score 0-100")
    category: str = Field(default="general", description="Skill category")


class KeywordAnalysis(BaseModel):
    """Keyword frequency analysis result."""
    keyword: str
    count: int
    relevance: str = Field(description="high, medium, or low relevance")


class ResumeAnalysis(BaseModel):
    """Complete AI analysis result for a resume."""
    ats_score: int = Field(ge=0, le=100, description="ATS compatibility score")
    ai_confidence: float = Field(ge=0.0, le=1.0, description="AI confidence in analysis")
    summary: str = Field(description="Professional AI-generated summary")
    strengths: list[str] = Field(description="Key resume strengths")
    weaknesses: list[str] = Field(description="Areas for improvement")
    missing_skills: list[str] = Field(description="Critical missing skills")
    keyword_analysis: list[KeywordAnalysis] = Field(description="Keyword frequency data")
    suggestions: list[str] = Field(description="Actionable improvement recommendations")
    interview_questions: list[str] = Field(description="Potential interview questions")
    recruiter_feedback: str = Field(description="Recruiter-perspective feedback")
    job_match_score: Optional[int] = Field(default=None, ge=0, le=100)
    skill_scores: list[SkillScore] = Field(description="Skill proficiency breakdown")
    experience_level: str = Field(default="mid", description="junior, mid, senior, executive")
    industry_fit: list[str] = Field(default_factory=list, description="Best-fit industries")


# ─── API Response Models ────────────────────────────────────────────────────────

class AnalysisRecord(BaseModel):
    """Stored analysis record with metadata."""
    id: str = Field(default_factory=lambda: uuid.uuid4().hex)
    filename: str
    file_size: int = 0
    file_type: str = "pdf"
    uploaded_at: datetime = Field(default_factory=datetime.now)
    resume_text: str = ""
    analysis: ResumeAnalysis
    job_description: Optional[str] = None
    user_id: Optional[str] = None


class UploadResponse(BaseModel):
    """Response after successful upload and analysis."""
    id: str
    filename: str
    analysis: ResumeAnalysis
    uploaded_at: datetime


class HistoryListResponse(BaseModel):
    """Paginated history list response."""
    total: int
    items: list[AnalysisRecord]


class ErrorResponse(BaseModel):
    """Standard error response."""
    error: str
    detail: Optional[str] = None


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    version: str
    ollama: dict
