"""Ollama AI analysis service for resume evaluation."""

import json
import logging
from typing import Optional

import ollama

from app.config import settings
from app.models.schemas import ResumeAnalysis
from app.utils.prompts import RESUME_ANALYSIS_PROMPT, RESUME_MATCH_PROMPT

logger = logging.getLogger(__name__)


async def analyze_resume(
    resume_text: str,
    job_description: Optional[str] = None,
) -> ResumeAnalysis:
    """Analyze a resume using the Ollama AI model.

    Args:
        resume_text: Extracted text from the resume.
        job_description: Optional job description for matching analysis.

    Returns:
        Structured ResumeAnalysis object.

    Raises:
        RuntimeError: If Ollama fails or returns invalid data.
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

    try:
        logger.info(f"Sending resume ({len(resume_text)} chars) to Ollama model: {settings.ollama_model}")

        response = ollama.chat(
            model=settings.ollama_model,
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            format=ResumeAnalysis.model_json_schema(),
            options={
                "temperature": 0,
                "num_ctx": 4096,
            },
        )

        raw_content = response.message.content
        logger.info(f"Received response from Ollama ({len(raw_content)} chars)")

        # Parse the JSON response
        try:
            data = json.loads(raw_content)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Ollama JSON response: {e}")
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

    except ollama.ResponseError as e:
        logger.error(f"Ollama API error: {e}")
        if "not found" in str(e).lower():
            raise RuntimeError(
                f"Model '{settings.ollama_model}' not found. "
                f"Run: ollama create {settings.ollama_model} -f Modelfile"
            ) from e
        raise RuntimeError(f"AI analysis failed: {e}") from e

    except Exception as e:
        if isinstance(e, (ValueError, RuntimeError)):
            raise
        logger.error(f"Unexpected error during analysis: {e}")
        raise RuntimeError(f"An unexpected error occurred during analysis: {e}") from e
