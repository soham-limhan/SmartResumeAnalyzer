"""AI analysis service for resume evaluation.

Supports two providers:
  - Groq Cloud (primary, when PROFILEX_AI_GROQ_API_KEY is set)
  - Ollama Local (fallback, for local development)
"""

import json
import logging
from typing import Optional

from app.config import settings
from app.models.schemas import ResumeAnalysis
from app.utils.prompts import RESUME_ANALYSIS_PROMPT, RESUME_MATCH_PROMPT

logger = logging.getLogger(__name__)

# ─── System prompt (same as the Modelfile) ──────────────────────────────────────
SYSTEM_PROMPT = (
    "You are an elite senior technical recruiter, ATS (Applicant Tracking System) "
    "expert, and career coach with 20+ years of experience reviewing resumes across "
    "all industries.\n\n"
    "Your role is to analyze resumes with extreme precision and provide structured, "
    "actionable feedback that helps candidates improve their chances of landing "
    "interviews.\n\n"
    "When analyzing a resume, you must:\n"
    "1. Score it against ATS compatibility standards (0-100)\n"
    "2. Identify strengths and weaknesses\n"
    "3. Detect missing critical skills for the target role\n"
    "4. Perform keyword density analysis\n"
    "5. Generate targeted interview questions\n"
    "6. Provide recruiter-perspective feedback\n"
    "7. Write a professional summary\n"
    "8. Give specific, actionable improvement recommendations\n\n"
    "Always respond with valid JSON matching the requested schema. Be specific, "
    "professional, constructive, and brutally honest in your analysis. "
    "Reference specific sections of the resume in your feedback."
)


# ─── Groq Cloud Provider ────────────────────────────────────────────────────────

async def _analyze_with_groq(prompt: str) -> str:
    """Send prompt to Groq cloud API and return raw JSON response."""
    from groq import Groq

    client = Groq(api_key=settings.groq_api_key)

    logger.info(f"Sending to Groq model: {settings.groq_model}")

    response = client.chat.completions.create(
        model=settings.groq_model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        temperature=0,
        max_tokens=4096,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content
    logger.info(f"Groq response received ({len(raw)} chars)")
    return raw


# ─── Ollama Local Provider ──────────────────────────────────────────────────────

async def _analyze_with_ollama(prompt: str) -> str:
    """Send prompt to local Ollama instance and return raw JSON response."""
    import ollama

    logger.info(f"Sending to Ollama model: {settings.ollama_model}")

    response = ollama.chat(
        model=settings.ollama_model,
        messages=[{"role": "user", "content": prompt}],
        format=ResumeAnalysis.model_json_schema(),
        options={
            "temperature": 0,
            "num_ctx": 4096,
        },
    )

    raw = response.message.content
    logger.info(f"Ollama response received ({len(raw)} chars)")
    return raw


# ─── Main Analysis Function ─────────────────────────────────────────────────────

async def analyze_resume(
    resume_text: str,
    job_description: Optional[str] = None,
) -> ResumeAnalysis:
    """Analyze a resume using the configured AI provider.

    Uses Groq cloud when API key is set, otherwise falls back to local Ollama.

    Args:
        resume_text: Extracted text from the resume.
        job_description: Optional job description for matching analysis.

    Returns:
        Structured ResumeAnalysis object.

    Raises:
        RuntimeError: If AI provider fails or returns invalid data.
    """
    if not resume_text.strip():
        raise ValueError("Resume text is empty. Could not extract content from the file.")

    # Choose prompt based on whether job description is provided
    if job_description and job_description.strip():
        prompt = RESUME_MATCH_PROMPT.format(
            resume_text=resume_text,
            job_description=job_description,
        )
    else:
        prompt = RESUME_ANALYSIS_PROMPT.format(resume_text=resume_text)

    provider = settings.ai_provider

    try:
        if provider == "groq":
            raw_content = await _analyze_with_groq(prompt)
        else:
            raw_content = await _analyze_with_ollama(prompt)

        # Parse the JSON response
        try:
            data = json.loads(raw_content)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI JSON response: {e}")
            logger.error(f"Raw response: {raw_content[:500]}")
            raise RuntimeError(
                "AI returned invalid JSON. Please try again."
            ) from e

        # Validate with Pydantic
        analysis = ResumeAnalysis.model_validate(data)

        # Override job_match_score if job description was provided but model didn't set it
        if job_description and analysis.job_match_score is None:
            analysis.job_match_score = analysis.ats_score

        return analysis

    except Exception as e:
        if isinstance(e, (ValueError, RuntimeError)):
            raise

        logger.error(f"AI analysis error ({provider}): {e}")

        # Provider-specific error messages
        if provider == "groq":
            error_str = str(e).lower()
            if "authentication" in error_str or "api_key" in error_str:
                raise RuntimeError(
                    "Groq API key is invalid. Check your PROFILEX_AI_GROQ_API_KEY."
                ) from e
            if "rate_limit" in error_str:
                raise RuntimeError(
                    "Groq rate limit exceeded. Please wait a moment and try again."
                ) from e
            raise RuntimeError(f"Groq analysis failed: {e}") from e
        else:
            if "not found" in str(e).lower():
                raise RuntimeError(
                    f"Model '{settings.ollama_model}' not found. "
                    f"Run: ollama create {settings.ollama_model} -f Modelfile"
                ) from e
            raise RuntimeError(f"Ollama analysis failed: {e}") from e


async def generate_single_answer(
    resume_text: str,
    question: str,
    job_description: Optional[str] = None
) -> str:
    """Generate a STAR suggested answer for a single interview question based on resume."""
    from app.utils.prompts import SINGLE_QUESTION_ANSWER_PROMPT
    
    job_context = ""
    if job_description and job_description.strip():
        job_context = f"\nTARGET JOB DESCRIPTION:\n{job_description.strip()}\n"
        
    prompt = SINGLE_QUESTION_ANSWER_PROMPT.format(
        question=question,
        resume_text=resume_text,
        job_context=job_context
    )
    
    provider = settings.ai_provider
    try:
        if provider == "groq":
            from groq import Groq
            client = Groq(api_key=settings.groq_api_key)
            response = client.chat.completions.create(
                model=settings.groq_model,
                messages=[
                    {"role": "system", "content": "You are a professional technical recruiter and career coach. Return only the suggested answer without formatting using the STAR method."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.4,
                max_tokens=2048,
            )
            return response.choices[0].message.content.strip()
        else:
            import ollama
            response = ollama.chat(
                model=settings.ollama_model,
                messages=[
                    {"role": "system", "content": "You are a professional technical recruiter and career coach. Return only the suggested answer without formatting using the STAR method."},
                    {"role": "user", "content": prompt}
                ],
                options={"temperature": 0.4},
            )
            return response.message.content.strip()
    except Exception as e:
        logger.error(f"Failed to generate single answer: {e}")
        return "Focus on structuring your response using the STAR method (Situation, Task, Action, Result). Emphasize your key achievements and contributions from your resume."
