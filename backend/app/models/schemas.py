"""Pydantic schemas for request/response models."""

from datetime import datetime
from typing import Optional, Union, List
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


class InterviewQuestion(BaseModel):
    """An interview question and suggested answer."""
    question: str
    answer: str


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
    interview_questions: list[Union[InterviewQuestion, str]] = Field(description="Potential interview questions and suggested answers")
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


# ─── AI Enhancement Schemas ────────────────────────────────────────────────────

class EnhancedExperienceSection(BaseModel):
    """Before/after for a single work experience entry."""
    company: str = ""
    title: str = ""
    duration: str = ""
    original_bullets: List[str] = Field(default_factory=list)
    enhanced_bullets: List[str] = Field(default_factory=list)
    improvements: List[str] = Field(default_factory=list)


class EnhancedEducationSection(BaseModel):
    """Before/after for a single education entry."""
    institution: str = ""
    degree: str = ""
    year: str = ""
    original: str = ""
    enhanced: str = ""
    improvements: List[str] = Field(default_factory=list)


class EnhancedProjectSection(BaseModel):
    """Before/after for a single project entry."""
    name: str = ""
    original: str = ""
    enhanced: str = ""
    improvements: List[str] = Field(default_factory=list)


class EnhancedSummarySection(BaseModel):
    """Before/after for the professional summary."""
    original: str = ""
    enhanced: str = ""
    improvements: List[str] = Field(default_factory=list)


class EnhancedSkillsSection(BaseModel):
    """Before/after for the skills section."""
    original: List[str] = Field(default_factory=list)
    enhanced: List[str] = Field(default_factory=list)
    keywords_added: List[str] = Field(default_factory=list)


class EnhancedAchievementsSection(BaseModel):
    """Before/after for achievements/awards."""
    original: List[str] = Field(default_factory=list)
    enhanced: List[str] = Field(default_factory=list)


class EnhancedResume(BaseModel):
    """Complete AI-enhanced resume with before/after content per section."""
    mode: str = Field(description="Enhancement mode used")
    candidate_name: str = Field(default="")
    contact_info: str = Field(default="")
    original_ats_score: int = Field(ge=0, le=100, description="Estimated original ATS score")
    estimated_new_ats_score: int = Field(ge=0, le=100, description="Estimated ATS score after enhancement")
    professional_summary: EnhancedSummarySection = Field(default_factory=EnhancedSummarySection)
    experience_sections: List[EnhancedExperienceSection] = Field(default_factory=list)
    education_sections: List[EnhancedEducationSection] = Field(default_factory=list)
    projects_sections: List[EnhancedProjectSection] = Field(default_factory=list)
    skills_section: EnhancedSkillsSection = Field(default_factory=EnhancedSkillsSection)
    achievements_section: EnhancedAchievementsSection = Field(default_factory=EnhancedAchievementsSection)
    total_improvements: int = Field(default=0, description="Total number of improvements made")
    action_verbs_added: int = Field(default=0)
    keywords_added_count: int = Field(default=0)
    enhancement_highlights: List[str] = Field(default_factory=list)


class EnhancedResumeRecord(BaseModel):
    """Stored enhancement record with metadata."""
    id: str = Field(default_factory=lambda: uuid.uuid4().hex)
    analysis_id: str
    mode: str
    enhanced_at: datetime = Field(default_factory=datetime.now)
    enhanced_resume: EnhancedResume
    job_description: Optional[str] = None
    user_id: Optional[str] = None


class EnhanceRequest(BaseModel):
    """Request body for resume enhancement."""
    analysis_id: str = Field(description="ID of the analysis record to enhance")
    mode: str = Field(
        description="Enhancement mode: professional, technical, executive, or fresher"
    )
    job_description: Optional[str] = Field(
        default=None,
        description="Optional job description for targeted enhancement"
    )


class EnhanceResponse(BaseModel):
    """Response after successful AI enhancement."""
    id: str
    analysis_id: str
    mode: str
    enhanced_resume: EnhancedResume
    enhanced_at: datetime


# ─── Social Media Links Integration Schemas ─────────────────────────────────────

class SocialLinkItem(BaseModel):
    """Metadata for a single social profile link."""
    id: str
    platform: str  # linkedin, github, portfolio, twitter, leetcode, hackerrank, kaggle, behance, dribbble, medium, stackoverflow, youtube, instagram, custom
    url: str
    label: Optional[str] = None
    is_enabled: bool = True
    order: int = 0
    is_verified: bool = True


class SocialLinksProfile(BaseModel):
    """Stored social media links and integration settings for a user."""
    user_id: Optional[str] = None
    display_mode: str = "compact"  # compact, expanded, icon_only, ats_safe
    links: list[SocialLinkItem] = []
    updated_at: datetime = Field(default_factory=datetime.now)


class AIRecommendRequest(BaseModel):
    """Request schema for AI social links recommendation."""
    current_links: list[SocialLinkItem] = []
    target_role: Optional[str] = None
    job_description: Optional[str] = None


class AIRecommendResponse(BaseModel):
    """Structured response for AI social links evaluation."""
    completeness_score: int = Field(ge=0, le=100)
    missing_platforms: list[str] = []
    suggestions: list[str] = []
    priority_list: list[str] = []

# ─── Feedback Schemas ─────────────────────────────────────────────────────────

class FeedbackRequest(BaseModel):
    """Request schema for submitting user feedback."""
    name: str = Field(min_length=1, max_length=100)
    role: str = Field(min_length=1, max_length=100)
    quote: str = Field(min_length=5, max_length=1000)

class FeedbackRecord(BaseModel):
    """Stored feedback record with metadata."""
    id: str = Field(default_factory=lambda: uuid.uuid4().hex)
    name: str
    role: str
    quote: str
    created_at: datetime = Field(default_factory=datetime.now)
