"""Pydantic schemas for request/response models."""

from datetime import datetime
from typing import Optional, Union
from pydantic import BaseModel, Field, field_validator
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

    @field_validator("relevance", mode="before")
    @classmethod
    def coerce_relevance(cls, v):
        """Coerce float/int relevance values from LLM to string categories.

        The Groq LLM sometimes returns numeric relevance (0.0–1.0) instead of
        the expected string values ("high", "medium", "low"). This validator
        normalises both cases so Pydantic never rejects valid AI output.
        """
        if isinstance(v, (int, float)):
            if v >= 0.7:
                return "high"
            elif v >= 0.4:
                return "medium"
            else:
                return "low"
        if isinstance(v, str):
            # Normalise to lowercase; accept any string the model sends
            return v.lower().strip()
        return str(v)


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


class BatchItemResult(BaseModel):
    """Result for a single file within a batch upload."""
    filename: str
    success: bool
    id: Optional[str] = None
    analysis: Optional[ResumeAnalysis] = None
    uploaded_at: Optional[datetime] = None
    error: Optional[str] = None


class BatchUploadResponse(BaseModel):
    """Response for a batch resume upload."""
    total: int
    successful: int
    failed: int
    results: list[BatchItemResult]


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
