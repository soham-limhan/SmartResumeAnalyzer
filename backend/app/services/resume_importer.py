"""Resume import service — AI-powered structured data extraction with confidence scoring.

Pipeline:
  resume_text → AI extraction → JSON parse → Pydantic validation
              → skill deduplication → return ImportedResume
"""

import json
import logging
import re
from typing import Any, Dict, List

from app.config import settings
from app.models.schemas import ImportedResume
from app.utils.import_prompts import RESUME_IMPORT_PROMPT

logger = logging.getLogger(__name__)

# ─── System prompt ──────────────────────────────────────────────────────────────

IMPORT_SYSTEM_PROMPT = (
    "You are a precise resume parsing engine. Your sole task is to extract "
    "structured information EXACTLY as it appears in the provided resume text. "
    "You must NEVER invent, infer, or fabricate any information. "
    "Return only valid JSON with the schema provided. "
    "If a field is absent from the resume, set its value to null. "
    "Preserve the candidate's exact wording — do not rephrase, improve, or summarize."
)


# ─── AI provider calls ──────────────────────────────────────────────────────────

async def _call_groq(prompt: str) -> str:
    """Send the import extraction prompt to Groq and return raw JSON string."""
    from groq import Groq

    client = Groq(api_key=settings.groq_api_key)
    logger.info(f"[IMPORT] Sending to Groq model: {settings.groq_model}")

    response = client.chat.completions.create(
        model=settings.groq_model,
        messages=[
            {"role": "system", "content": IMPORT_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        temperature=0,
        max_tokens=8192,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content
    logger.info(f"[IMPORT] Groq response received ({len(raw)} chars)")
    return raw


async def _call_ollama(prompt: str) -> str:
    """Send the import extraction prompt to local Ollama and return raw JSON string."""
    import ollama

    logger.info(f"[IMPORT] Sending to Ollama model: {settings.ollama_model}")

    response = ollama.chat(
        model=settings.ollama_model,
        messages=[
            {"role": "system", "content": IMPORT_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        format=ImportedResume.model_json_schema(),
        options={
            "temperature": 0,
            "num_ctx": 8192,
        },
    )

    raw = response.message.content
    logger.info(f"[IMPORT] Ollama response received ({len(raw)} chars)")
    return raw


# ─── Normalization helpers ──────────────────────────────────────────────────────

def _normalize_skill(skill: str) -> str:
    """Normalize a skill string for deduplication comparison.
    
    Returns a lowercase, stripped version suitable for set-based dedup.
    The original casing is kept in the output — we only use this for comparison.
    """
    return skill.strip().lower()


def _dedup_skills(skills: List[str]) -> List[str]:
    """Remove duplicate skills (case-insensitive) while preserving first occurrence casing.
    
    Examples:
        ['Python', 'python', 'PYTHON'] → ['Python']
        ['React', 'reactjs', 'React.js'] → ['React', 'reactjs', 'React.js']  (distinct)
    """
    seen: set = set()
    result: List[str] = []
    for skill in skills:
        normalized = _normalize_skill(skill)
        if normalized not in seen:
            seen.add(normalized)
            result.append(skill.strip())
    return result


def _safe_list(raw: Any) -> List[str]:
    """Safely coerce a value to a list of strings, filtering out nulls/empties."""
    if raw is None:
        return []
    if isinstance(raw, list):
        return [str(item).strip() for item in raw if item and str(item).strip()]
    if isinstance(raw, str) and raw.strip():
        return [raw.strip()]
    return []


def _extract_json_from_response(raw: str) -> Dict:
    """Extract and parse JSON from AI response, handling markdown code fences."""
    # Strip markdown code fences if present
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    
    return json.loads(cleaned)


def _normalize_imported_resume(data: Dict, resume_text: str, filename: str) -> Dict:
    """Apply post-processing normalization to extracted resume data.
    
    - Deduplicates skills across all categories
    - Ensures list fields are actually lists
    - Strips whitespace from string values
    - Adds extraction metadata
    """
    # Deduplicate skills in all skill categories
    skills = data.get("skills", {})
    for category in ("technical", "soft", "tools", "languages"):
        cat_data = skills.get(category, {})
        if isinstance(cat_data, dict) and isinstance(cat_data.get("value"), list):
            cat_data["value"] = _dedup_skills(_safe_list(cat_data["value"]))

    # Deduplicate certifications
    certs = data.get("certifications", {})
    if isinstance(certs, dict) and isinstance(certs.get("value"), list):
        certs["value"] = _dedup_skills(_safe_list(certs["value"]))

    # Add metadata
    data["extracted_text_length"] = len(resume_text)
    data["filename"] = filename

    return data


# ─── Main extraction function ───────────────────────────────────────────────────

async def extract_and_parse(
    resume_text: str,
    filename: str = "",
) -> ImportedResume:
    """Extract structured resume data from plain text using the configured AI provider.
    
    Args:
        resume_text: Clean plain text extracted from a PDF or DOCX file.
        filename:    Original filename (used for metadata only).
    
    Returns:
        Validated ImportedResume object with per-field confidence scores.
    
    Raises:
        ValueError:   If the resume text is empty.
        RuntimeError: If the AI provider fails or returns unparseable JSON.
    """
    if not resume_text.strip():
        raise ValueError("Resume text is empty. Could not extract any content from the file.")

    prompt = RESUME_IMPORT_PROMPT.format(resume_text=resume_text)

    provider = settings.ai_provider
    try:
        if provider == "groq":
            raw_content = await _call_groq(prompt)
        else:
            raw_content = await _call_ollama(prompt)
    except Exception as e:
        logger.error(f"[IMPORT] AI provider error ({provider}): {e}")
        if provider == "groq":
            error_lower = str(e).lower()
            if "authentication" in error_lower or "api_key" in error_lower:
                raise RuntimeError("Groq API key is invalid. Check PROFILEX_AI_GROQ_API_KEY.") from e
            if "rate_limit" in error_lower:
                raise RuntimeError("Groq rate limit exceeded. Please wait a moment and try again.") from e
        raise RuntimeError(f"AI extraction failed: {e}") from e

    # Parse JSON
    try:
        data = _extract_json_from_response(raw_content)
    except (json.JSONDecodeError, ValueError) as e:
        logger.error(f"[IMPORT] JSON parse failed: {e}")
        logger.error(f"[IMPORT] Raw response (first 500 chars): {raw_content[:500]}")
        raise RuntimeError(
            "AI returned invalid JSON during extraction. Please try again."
        ) from e

    # Post-process normalization
    try:
        data = _normalize_imported_resume(data, resume_text, filename)
    except Exception as e:
        logger.warning(f"[IMPORT] Normalization warning: {e}")
        # Non-fatal — proceed with raw data

    # Validate with Pydantic (lenient — unknown fields are ignored)
    try:
        result = ImportedResume.model_validate(data)
    except Exception as e:
        logger.error(f"[IMPORT] Pydantic validation failed: {e}")
        logger.error(f"[IMPORT] Data dump: {json.dumps(data, default=str)[:1000]}")
        raise RuntimeError(
            "Extracted data did not match the expected schema. Please try again."
        ) from e

    logger.info(
        f"[IMPORT] Extraction complete for '{filename}': "
        f"{len(result.education)} education, {len(result.experience)} experience, "
        f"{len(result.projects)} projects"
    )
    return result
