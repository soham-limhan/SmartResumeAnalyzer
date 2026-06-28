"""AI resume enhancement service.

Rewrites and improves resume content using the configured AI provider (Groq or Ollama).
Supports four enhancement modes: professional, technical, executive, fresher.
"""

import json
import logging
from typing import Optional

from app.config import settings
from app.models.schemas import EnhancedResume
from app.utils.enhance_prompts import (
    ENHANCE_SYSTEM_PROMPTS,
    RESUME_ENHANCE_PROMPT,
    JOB_CONTEXT_TEMPLATE,
)

logger = logging.getLogger(__name__)

_MODE_DISPLAY_NAMES = {
    "professional": "Professional (Corporate ATS)",
    "technical": "Technical (Engineering & Data)",
    "executive": "Executive (Leadership & Strategy)",
    "fresher": "Fresher (Students & Entry-Level)",
}

VALID_MODES = list(_MODE_DISPLAY_NAMES.keys())


# ─── Groq Provider ─────────────────────────────────────────────────────────────

async def _enhance_with_groq(system_prompt: str, user_prompt: str) -> str:
    """Send enhancement prompt to Groq cloud API."""
    from groq import Groq

    client = Groq(api_key=settings.groq_api_key)
    logger.info(f"Sending enhancement to Groq model: {settings.groq_model}")

    response = client.chat.completions.create(
        model=settings.groq_model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.3,   # Slightly creative but mostly deterministic
        max_tokens=8192,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content
    logger.info(f"Groq enhancement response received ({len(raw)} chars)")
    return raw


# ─── Ollama Provider ────────────────────────────────────────────────────────────

async def _enhance_with_ollama(system_prompt: str, user_prompt: str) -> str:
    """Send enhancement prompt to local Ollama instance."""
    import ollama

    logger.info(f"Sending enhancement to Ollama model: {settings.ollama_model}")

    # Combine system + user for Ollama
    combined_prompt = f"{system_prompt}\n\n{user_prompt}"

    response = ollama.chat(
        model=settings.ollama_model,
        messages=[{"role": "user", "content": combined_prompt}],
        format=EnhancedResume.model_json_schema(),
        options={
            "temperature": 0.3,
            "num_ctx": 8192,
        },
    )

    raw = response.message.content
    logger.info(f"Ollama enhancement response received ({len(raw)} chars)")
    return raw


# ─── Main Enhancement Function ──────────────────────────────────────────────────

async def enhance_resume(
    resume_text: str,
    mode: str,
    job_description: Optional[str] = None,
) -> EnhancedResume:
    """Enhance a resume using the configured AI provider.

    Args:
        resume_text: The extracted plain text of the resume.
        mode: Enhancement mode — 'professional', 'technical', 'executive', or 'fresher'.
        job_description: Optional job description for targeted enhancement.

    Returns:
        Structured EnhancedResume object with before/after content for each section.

    Raises:
        ValueError: If mode is invalid or resume text is empty.
        RuntimeError: If the AI provider fails or returns invalid data.
    """
    if not resume_text.strip():
        raise ValueError("Resume text is empty. Cannot enhance an empty resume.")

    if mode not in VALID_MODES:
        raise ValueError(
            f"Invalid enhancement mode '{mode}'. "
            f"Choose from: {', '.join(VALID_MODES)}"
        )

    # Build prompt
    mode_name = _MODE_DISPLAY_NAMES[mode]
    job_context = ""
    if job_description and job_description.strip():
        job_context = JOB_CONTEXT_TEMPLATE.format(
            job_description=job_description.strip()
        )

    user_prompt = RESUME_ENHANCE_PROMPT.format(
        mode=mode,
        mode_name=mode_name,
        resume_text=resume_text,
        job_context=job_context,
    )

    system_prompt = ENHANCE_SYSTEM_PROMPTS[mode]
    provider = settings.ai_provider

    try:
        if provider == "groq":
            raw_content = await _enhance_with_groq(system_prompt, user_prompt)
        else:
            raw_content = await _enhance_with_ollama(system_prompt, user_prompt)

        # Parse JSON
        try:
            data = json.loads(raw_content)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI enhancement JSON: {e}")
            logger.error(f"Raw response (first 500 chars): {raw_content[:500]}")
            raise RuntimeError(
                "AI returned invalid JSON for enhancement. Please try again."
            ) from e

        # Validate and return structured model
        enhanced = EnhancedResume.model_validate(data)
        logger.info(
            f"Enhancement complete — mode={mode}, "
            f"score: {enhanced.original_ats_score} → {enhanced.estimated_new_ats_score}, "
            f"improvements: {enhanced.total_improvements}"
        )
        return enhanced

    except Exception as e:
        if isinstance(e, (ValueError, RuntimeError)):
            raise

        logger.error(f"AI enhancement error ({provider}): {e}")

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
            raise RuntimeError(f"Groq enhancement failed: {e}") from e
        else:
            raise RuntimeError(f"Ollama enhancement failed: {e}") from e
