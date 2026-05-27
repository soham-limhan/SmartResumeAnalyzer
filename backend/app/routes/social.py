"""Social links integration API routes."""

import json
import logging
import re
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from app.config import settings
from app.models.schemas import (
    SocialLinkItem, SocialLinksProfile, AIRecommendRequest, AIRecommendResponse, ErrorResponse
)
from app.services.auth import get_current_user
from app.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter()

# ─── URL Normalisation & Platform Detection ───────────────────────────────────

PLATFORMS_DOMAINS = {
    "linkedin": r"(www\.)?linkedin\.com",
    "github": r"(www\.)?github\.com",
    "twitter": r"(www\.)?(twitter\.com|x\.com)",
    "leetcode": r"(www\.)?leetcode\.com",
    "hackerrank": r"(www\.)?hackerrank\.com",
    "kaggle": r"(www\.)?kaggle\.com",
    "behance": r"(www\.)?behance\.net",
    "dribbble": r"(www\.)?dribbble\.com",
    "medium": r"(www\.)?medium\.com",
    "stackoverflow": r"(www\.)?stackoverflow\.com",
    "youtube": r"(www\.)?(youtube\.com|youtu\.be)",
    "instagram": r"(www\.)?instagram\.com",
}

def clean_and_normalize_url(url: str) -> str:
    """Clean and normalize a raw URL."""
    url = url.strip()
    if not url:
        return ""
    
    # Prepend https:// if no protocol present
    if not re.match(r"^https?://", url, re.IGNORECASE):
        url = "https://" + url

    # Remove query string parameters like ?ref= or ?utm_source=
    url = url.split("?")[0]
    
    # Strip trailing slash
    if url.endswith("/") and url.count("/") > 3:
        url = url.rstrip("/")
        
    return url

def detect_platform_from_url(url: str) -> str:
    """Detect platform type from a URL's domain."""
    normalized = clean_and_normalize_url(url)
    
    for platform, pattern in PLATFORMS_DOMAINS.items():
        if re.search(pattern, normalized, re.IGNORECASE):
            return platform
            
    # Default to custom portfolio or website
    if "portfolio" in normalized.lower() or "website" in normalized.lower() or "blog" in normalized.lower():
        return "portfolio"
        
    return "custom"

# ─── Verification Helper ───
def validate_url_format(url: str) -> bool:
    """Verify that a normalized URL has a valid syntax structure."""
    regex = re.compile(
        r'^(?:http|ftp)s?://'  # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+(?:[A-Z]{2,6}\.?|[A-Z0-9-]{2,}\.?)|'  # domain...
        r'localhost|'  # localhost...
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
        r'(?::\d+)?'  # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE)
    return re.match(regex, url) is not None

# ─── API Endpoints ────────────────────────────────────────────────────────────

@router.get(
    "/social-links",
    response_model=SocialLinksProfile,
    summary="Get user social profile links",
    description="Fetch social media configuration links and settings from Firestore for authenticated users.",
)
async def get_social_links(user: Optional[dict] = Depends(get_current_user)):
    """Retrieve social links profile from Firestore, falling back to an empty profile."""
    if not user:
        # For guests, return a blank template, frontend handles localStorage
        return SocialLinksProfile()

    try:
        db = get_db()
        doc = db.collection("social_links").document(user["uid"]).get()
        if doc.exists:
            data = doc.to_dict()
            return SocialLinksProfile.model_validate(data)
        
        # Blank profile structure
        return SocialLinksProfile(user_id=user["uid"])
    except Exception as e:
        logger.error(f"Error fetching social links from Firestore: {e}")
        raise HTTPException(status_code=500, detail=f"Database lookup failed: {e}")


@router.post(
    "/social-links",
    response_model=SocialLinksProfile,
    responses={400: {"model": ErrorResponse}},
    summary="Update or create social profile links",
    description="Normalize, validate, and persist the list of social profile links for the authenticated user.",
)
async def update_social_links(
    profile_data: SocialLinksProfile,
    user: Optional[dict] = Depends(get_current_user)
):
    """Save social links list and configuration settings."""
    # Enforce user id if authenticated
    if user:
        profile_data.user_id = user["uid"]
    
    # Process, normalize, and validate all links
    normalized_links = []
    seen_platforms = set()
    
    # Sort links by client drag-and-drop order
    sorted_incoming = sorted(profile_data.links, key=lambda l: l.order)
    
    for idx, item in enumerate(sorted_incoming):
        # Normalize and validate URL
        normalized_url = clean_and_normalize_url(item.url)
        if not validate_url_format(normalized_url):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid URL structure for link: '{item.url}'"
            )
            
        # Detect platform if missing or custom/unset
        detected_p = detect_platform_from_url(normalized_url)
        if item.platform == "custom" and detected_p != "custom":
            item.platform = detected_p
        elif not item.platform or item.platform == "detect":
            item.platform = detected_p
            
        # Prevent duplicates for specific single-profile platforms
        if item.platform not in ("custom", "portfolio"):
            if item.platform in seen_platforms:
                # Discard duplicate profiles to maintain clean exports
                continue
            seen_platforms.add(item.platform)
            
        # Re-index ordering sequentially
        item.url = normalized_url
        item.order = idx
        item.is_verified = True
        normalized_links.append(item)
        
    profile_data.links = normalized_links
    profile_data.updated_at = datetime.now()

    if user:
        try:
            db = get_db()
            doc_data = profile_data.model_dump()
            doc_data["updated_at"] = profile_data.updated_at.isoformat()
            db.collection("social_links").document(user["uid"]).set(doc_data)
            logger.info(f"Social links updated in Firestore for user: {user['uid']}")
        except Exception as e:
            logger.error(f"Error saving social links to Firestore: {e}")
            raise HTTPException(status_code=500, detail=f"Database write failed: {e}")
            
    return profile_data


# ─── AI Social Presence Analysis ──────────────────────────────────────────────

AI_SYSTEM_PROMPT = (
    "You are an elite expert AI career coach, technical recruiter, and recruiter branding specialist.\n\n"
    "Your objective is to analyze a candidate's list of online profile links (e.g. LinkedIn, GitHub, Behance, LeetCode) "
    "and their target job description (or target role) to recommend profile improvements, missing profiles, and presence completeness.\n\n"
    "Guideline rules by industry:\n"
    "- Software roles: Priority is GitHub + LinkedIn + LeetCode / HackerRank + Stack Overflow.\n"
    "- Design roles: Priority is Behance + Dribbble + custom Portfolio Website.\n"
    "- Data roles: Priority is Kaggle + GitHub + LinkedIn + Medium / Blog.\n"
    "- Product/Management roles: Priority is LinkedIn + Twitter/X + Medium / Substack.\n\n"
    "Always return valid JSON matching the requested schema. Provide highly motivating, constructive, and actionable bullet points."
)

AI_USER_PROMPT = """Analyze the following online presence.
Active Links:
{links_text}

Target Job Role / Description:
{target}

Evaluate the online presence completeness (0 to 100).
Provide:
1. completeness_score: integer 0-100
2. missing_platforms: list of recommended social platforms they are currently missing (e.g. ["leetcode", "github"])
3. suggestions: list of actionable advice text for improvement (e.g., "Add your GitHub link to show open source contributions")
4. priority_list: list of active/missing platform names in the exact priority order they should appear in their resume header.
"""

async def _call_llm_for_social(prompt: str) -> str:
    """Call the active AI provider (Groq or Ollama) and return JSON string."""
    provider = settings.ai_provider
    
    if provider == "groq":
        from groq import Groq
        client = Groq(api_key=settings.groq_api_key)
        
        response = client.chat.completions.create(
            model=settings.groq_model,
            messages=[
                {"role": "system", "content": AI_SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_tokens=2048,
            response_format={"type": "json_object"},
        )
        return response.choices[0].message.content
    else:
        import ollama
        
        # Define the exact pydantic schema for Ollama structure validation
        class AIRecommendStructure(BaseModel):
            completeness_score: int
            missing_platforms: list[str]
            suggestions: list[str]
            priority_list: list[str]
            
        response = ollama.chat(
            model=settings.ollama_model,
            messages=[
                {"role": "system", "content": AI_SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            format=AIRecommendStructure.model_json_schema(),
            options={"temperature": 0.2},
        )
        return response.message.content

@router.post(
    "/social-links/ai-recommend",
    response_model=AIRecommendResponse,
    responses={500: {"model": ErrorResponse}},
    summary="Generate AI recommendations for online presence",
    description="Analyze active profile links against a target role/job description to suggest missing portfolios and priorities.",
)
async def generate_social_recommendations(request_data: AIRecommendRequest):
    """Use AI to audit the candidate's active links and propose corrections."""
    links_text = ""
    if request_data.current_links:
        for link in request_data.current_links:
            if link.is_enabled:
                links_text += f"- {link.platform.upper()}: {link.url}\n"
    else:
        links_text = "(No links provided yet)\n"

    target = request_data.target_role or request_data.job_description or "General Professional"
    
    prompt = AI_USER_PROMPT.format(links_text=links_text, target=target)
    
    try:
        raw_output = await _call_llm_for_social(prompt)
        parsed = json.loads(raw_output)
        
        # Validate schema
        return AIRecommendResponse.model_validate(parsed)
    except Exception as e:
        logger.error(f"AI Social Recommendation analysis failed: {e}")
        # Return elegant default fallback so the UI never crashes
        fallback_score = 40 if not request_data.current_links else 70
        return AIRecommendResponse(
            completeness_score=fallback_score,
            missing_platforms=["github", "leetcode"] if "software" in target.lower() else ["behance", "dribbble"] if "design" in target.lower() else ["linkedin"],
            suggestions=[
                "Ensure your LinkedIn profile is updated with your latest professional achievements and experience.",
                "Link your primary code repositories or design portfolios directly to showcase proof of work to prospective recruiters."
            ],
            priority_list=["linkedin", "github", "portfolio"]
        )
