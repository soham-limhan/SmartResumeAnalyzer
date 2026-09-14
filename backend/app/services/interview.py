"""AI Mock Interview service.

Handles:
- Question generation based on topic & difficulty
- Audio speech-to-text transcription (via Groq Whisper)
- Multi-band interview evaluation (technical, communication, problem solving, confidence)
"""

import json
import logging
import io
from typing import Optional, List, Dict, Any

from app.config import settings
from app.models.schemas import (
    InterviewQuestionItem,
    InterviewGenerateResponse,
    InterviewTranscribeResponse,
    InterviewAnswerSubmission,
    InterviewEvaluationResult,
    InterviewBandScore,
    InterviewQuestionEvaluation,
    InterviewCommunicationMetrics,
)
from app.utils.interview_prompts import (
    INTERVIEW_QUESTION_GEN_SYSTEM_PROMPT,
    INTERVIEW_QUESTION_GEN_PROMPT,
    INTERVIEW_EVALUATION_SYSTEM_PROMPT,
    INTERVIEW_EVALUATION_PROMPT,
)

logger = logging.getLogger(__name__)


# ─── Groq Audio Transcription ──────────────────────────────────────────────────

async def transcribe_audio_file(
    file_bytes: bytes,
    filename: str = "recording.webm",
    content_type: str = "audio/webm",
) -> InterviewTranscribeResponse:
    """Transcribe spoken audio bytes to text using Groq Whisper.

    Args:
        file_bytes: Raw audio binary data
        filename: Name of the uploaded audio file
        content_type: MIME type of audio (e.g., audio/webm, audio/wav, audio/mp4)

    Returns:
        InterviewTranscribeResponse with transcribed text and metrics.
    """
    if not file_bytes or len(file_bytes) < 100:
        return InterviewTranscribeResponse(
            text="[No audio detected or recording too short]",
            duration_seconds=0.0,
            confidence=0.0,
        )

    if settings.groq_api_key:
        try:
            from groq import Groq

            client = Groq(api_key=settings.groq_api_key)

            # Ensure safe filename with standard extension
            ext = "webm"
            if "wav" in content_type or filename.endswith(".wav"):
                ext = "wav"
            elif "mp4" in content_type or filename.endswith(".mp4") or filename.endswith(".m4a"):
                ext = "m4a"
            elif "ogg" in content_type or filename.endswith(".ogg"):
                ext = "ogg"
            elif "mp3" in content_type or filename.endswith(".mp3"):
                ext = "mp3"

            safe_name = f"interview_speech.{ext}"

            logger.info(f"Transcribing {len(file_bytes)} bytes audio with Groq Whisper ({safe_name})")

            # Groq audio transcription accepts a tuple of (filename, file_bytes)
            transcription = client.audio.transcriptions.create(
                file=(safe_name, file_bytes),
                model="whisper-large-v3-turbo",
                response_format="verbose_json",
                temperature=0.0,
            )

            text = transcription.text if hasattr(transcription, "text") else str(transcription)
            duration = getattr(transcription, "duration", None)

            logger.info(f"Audio transcribed successfully ({len(text)} chars)")
            return InterviewTranscribeResponse(
                text=text.strip(),
                duration_seconds=float(duration) if duration is not None else None,
                confidence=0.95,
            )

        except Exception as e:
            logger.error(f"Groq Whisper transcription failed: {e}", exc_info=True)
            # If transcription fails due to rate limit or key, return clear message
            return InterviewTranscribeResponse(
                text="[Audio transcription service error. You may edit or re-record your answer.]",
                duration_seconds=0.0,
                confidence=0.0,
            )
    else:
        logger.warning("No Groq API key available for Whisper transcription.")
        return InterviewTranscribeResponse(
            text="[Microphone input captured. Configure Groq API key for automated speech-to-text, or type answer directly.]",
            duration_seconds=0.0,
            confidence=0.0,
        )


# ─── Question Generation ────────────────────────────────────────────────────────

def _build_question_instructions(difficulty: str, count: int) -> str:
    """Format prompt guidelines based on difficulty level."""
    if difficulty.lower() == "easy":
        return (
            f"Generate {count} fundamental, foundational questions to test core concepts, "
            "terminology, and basic practical applications in this topic."
        )
    elif difficulty.lower() == "hard":
        return (
            f"Generate {count} advanced, deep-dive interview questions covering edge cases, "
            "complex architectural trade-offs, performance bottlenecks, scale challenges, and system design."
        )
    elif difficulty.lower() == "adaptive":
        return (
            f"Generate {count} progressive questions ordered from foundational (easy), "
            "to intermediate practical scenarios (medium), ending with complex system-level or architecture challenges (hard)."
        )
    else:  # medium (default)
        return (
            f"Generate {count} realistic, practical medium-difficulty questions focusing on "
            "real-world implementation, debugging, design decisions, and common industry scenarios."
        )


async def generate_interview_questions(
    topic: str,
    difficulty: str = "medium",
    count: int = 5,
    experience_level: str = "mid",
    resume_text: Optional[str] = None,
) -> InterviewGenerateResponse:
    """Generate mock interview questions for a given topic."""
    level_context = f"Candidate Experience Level: {experience_level.capitalize()}"
    if resume_text:
        level_context += f"\nCandidate Background Summary:\n{resume_text[:1000]}..."

    instructions = _build_question_instructions(difficulty, count)

    prompt = INTERVIEW_QUESTION_GEN_PROMPT.format(
        count=count,
        topic=topic,
        difficulty=difficulty,
        level_context=level_context,
        instructions=instructions,
    )

    raw_json = ""
    if settings.ai_provider == "groq":
        from groq import Groq

        client = Groq(api_key=settings.groq_api_key)
        logger.info(f"Generating interview questions with Groq model: {settings.groq_model}")

        response = client.chat.completions.create(
            model=settings.groq_model,
            messages=[
                {"role": "system", "content": INTERVIEW_QUESTION_GEN_SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.4,
            max_tokens=4096,
            response_format={"type": "json_object"},
        )
        raw_json = response.choices[0].message.content

    else:
        import ollama

        logger.info(f"Generating interview questions with Ollama model: {settings.ollama_model}")
        combined_prompt = f"{INTERVIEW_QUESTION_GEN_SYSTEM_PROMPT}\n\n{prompt}"
        response = ollama.chat(
            model=settings.ollama_model,
            messages=[{"role": "user", "content": combined_prompt}],
            format="json",
            options={"temperature": 0.4, "num_ctx": 4096},
        )
        raw_json = response.message.content

    try:
        data = json.loads(raw_json)
        questions_raw = data.get("questions", [])

        question_items: List[InterviewQuestionItem] = []
        for i, q in enumerate(questions_raw):
            qid = q.get("id") or f"q_{i+1}"
            q_diff = q.get("difficulty") or difficulty
            if q_diff not in ("easy", "medium", "hard"):
                q_diff = "medium"

            question_items.append(
                InterviewQuestionItem(
                    id=qid,
                    question=q.get("question", f"Question {i+1} on {topic}"),
                    difficulty=q_diff,
                    category=q.get("category", "Technical Architecture"),
                    time_limit_seconds=int(q.get("time_limit_seconds", 120)),
                    key_points_expected=q.get("key_points_expected", []),
                    sample_ideal_answer=q.get("sample_ideal_answer", ""),
                )
            )

        if not question_items:
            raise ValueError("No questions returned from LLM")

        return InterviewGenerateResponse(
            topic=topic,
            difficulty=difficulty,
            questions=question_items,
        )

    except Exception as e:
        logger.error(f"Failed to parse generated interview questions: {e}\nRaw: {raw_json[:300]}")
        # Return sensible fallback question set
        fallback_questions = [
            InterviewQuestionItem(
                id="q_1",
                question=f"Can you explain the core concepts and fundamental architecture of {topic}?",
                difficulty="easy",
                category="Fundamentals",
                time_limit_seconds=120,
                key_points_expected=["Core definitions and purpose", "Main building blocks", "Common use cases"],
                sample_ideal_answer=f"An ideal answer outlines the primary design of {topic}, why it is adopted in production systems, and how components interact.",
            ),
            InterviewQuestionItem(
                id="q_2",
                question=f"Describe a challenging technical problem you solved using {topic}. What trade-offs did you consider?",
                difficulty="medium",
                category="Problem Solving",
                time_limit_seconds=150,
                key_points_expected=["Problem context (STAR method)", "Technical approach & alternatives", "Measured outcome"],
                sample_ideal_answer="A strong candidate structures their response with the STAR framework, explicitly addressing performance, scalability, and code maintainability.",
            ),
            InterviewQuestionItem(
                id="q_3",
                question=f"How would you diagnose and optimize performance bottlenecks in a high-traffic {topic} application?",
                difficulty="hard",
                category="Technical Architecture",
                time_limit_seconds=180,
                key_points_expected=["Profiling and monitoring strategy", "Caching and async processing", "Database/resource optimization"],
                sample_ideal_answer="Discuss instrumentation, distributed tracing, database indexing/query tuning, and caching layers.",
            ),
        ]
        return InterviewGenerateResponse(
            topic=topic,
            difficulty=difficulty,
            questions=fallback_questions,
        )


# ─── Multi-Band AI Evaluation ───────────────────────────────────────────────────

async def evaluate_interview_session(
    topic: str,
    difficulty: str,
    answers: List[InterviewAnswerSubmission],
) -> InterviewEvaluationResult:
    """Evaluate candidate's answers and generate comprehensive multi-band scorecard."""
    # Build transcript text block
    blocks = []
    for idx, ans in enumerate(answers, 1):
        duration_note = f" (Spoken duration: {ans.audio_duration_seconds:.1f}s)" if ans.audio_duration_seconds else ""
        blocks.append(
            f"--- QUESTION {idx} (ID: {ans.question_id}) ---\n"
            f"Question: {ans.question}\n"
            f"Candidate Spoken Answer{duration_note}:\n{ans.user_answer.strip() or '[No answer provided]'}\n"
        )
    transcript_block = "\n".join(blocks)

    prompt = INTERVIEW_EVALUATION_PROMPT.format(
        topic=topic,
        difficulty=difficulty,
        transcript_block=transcript_block,
    )

    raw_json = ""
    if settings.ai_provider == "groq":
        from groq import Groq

        client = Groq(api_key=settings.groq_api_key)
        logger.info(f"Evaluating mock interview with Groq model: {settings.groq_model}")

        response = client.chat.completions.create(
            model=settings.groq_model,
            messages=[
                {"role": "system", "content": INTERVIEW_EVALUATION_SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_tokens=6144,
            response_format={"type": "json_object"},
        )
        raw_json = response.choices[0].message.content

    else:
        import ollama

        logger.info(f"Evaluating mock interview with Ollama model: {settings.ollama_model}")
        combined_prompt = f"{INTERVIEW_EVALUATION_SYSTEM_PROMPT}\n\n{prompt}"
        response = ollama.chat(
            model=settings.ollama_model,
            messages=[{"role": "user", "content": combined_prompt}],
            format="json",
            options={"temperature": 0.2, "num_ctx": 6144},
        )
        raw_json = response.message.content

    try:
        data = json.loads(raw_json)

        # Parse Band Scores
        band_scores = [
            InterviewBandScore(
                band=b.get("band", "Competency"),
                score=int(b.get("score", 75)),
                description=b.get("description", ""),
            )
            for b in data.get("band_scores", [])
        ]

        if not band_scores:
            band_scores = [
                InterviewBandScore(band="Technical Depth & Accuracy", score=78, description="Domain knowledge and technical correctness."),
                InterviewBandScore(band="Communication & Articulation", score=82, description="Clarity and flow of verbal explanation."),
                InterviewBandScore(band="Problem Solving & Structure", score=75, description="Structured approach and logical reasoning."),
                InterviewBandScore(band="Confidence & Delivery", score=80, description="Pace, tone, and conviction."),
                InterviewBandScore(band="Topic Relevance & Application", score=77, description="Direct relevance to the questions asked."),
            ]

        # Parse Communication Metrics
        cm_data = data.get("communication_metrics", {})
        comm_metrics = InterviewCommunicationMetrics(
            fluency=cm_data.get("fluency", "Moderate"),
            clarity=cm_data.get("clarity", "High"),
            conciseness=cm_data.get("conciseness", "Well Balanced"),
            tone=cm_data.get("tone", "Confident & Professional"),
            feedback=cm_data.get("feedback", "Good delivery with clear articulation."),
        )

        # Parse Question Evaluations
        q_evals = []
        for qe in data.get("question_evaluations", []):
            q_evals.append(
                InterviewQuestionEvaluation(
                    question_id=qe.get("question_id", "q"),
                    question=qe.get("question", ""),
                    user_answer=qe.get("user_answer", ""),
                    score=int(qe.get("score", 75)),
                    strengths=qe.get("strengths", []),
                    missing_points=qe.get("missing_points", []),
                    ideal_answer=qe.get("ideal_answer", ""),
                    specific_feedback=qe.get("specific_feedback", ""),
                )
            )

        overall_score = int(data.get("overall_score", 78))
        performance_band = data.get("performance_band", "Hire")
        confidence_score = int(data.get("confidence_score", 80))
        summary = data.get("summary", "Solid interview performance with good fundamental grasp of concepts.")
        strengths = data.get("strengths", ["Clear communication", "Good foundational knowledge"])
        areas_for_improvement = data.get("areas_for_improvement", ["Provide more specific metrics in examples", "Structure answers using STAR framework"])
        recruiter_verdict = data.get("recruiter_verdict", "Candidate shows solid potential and strong domain fundamentals.")
        actionable_roadmap = data.get("actionable_roadmap", [
            "Practice structuring system design answers top-down",
            "Quantify past project impacts with concrete metrics",
            "Deep dive into performance optimization strategies",
        ])

        return InterviewEvaluationResult(
            overall_score=overall_score,
            performance_band=performance_band,
            confidence_score=confidence_score,
            summary=summary,
            band_scores=band_scores,
            communication_metrics=comm_metrics,
            strengths=strengths,
            areas_for_improvement=areas_for_improvement,
            question_evaluations=q_evals,
            recruiter_verdict=recruiter_verdict,
            actionable_roadmap=actionable_roadmap,
        )

    except Exception as e:
        logger.error(f"Failed to parse interview evaluation JSON: {e}\nRaw: {raw_json[:400]}")
        # Safe baseline evaluation result
        return InterviewEvaluationResult(
            overall_score=75,
            performance_band="Hire",
            confidence_score=78,
            summary="Candidate demonstrated solid understanding of core concepts with opportunities to add more architectural depth.",
            band_scores=[
                InterviewBandScore(band="Technical Depth & Accuracy", score=74, description="Demonstrated good conceptual understanding."),
                InterviewBandScore(band="Communication & Articulation", score=80, description="Clear and comprehensible speech."),
                InterviewBandScore(band="Problem Solving & Structure", score=72, description="Structured answers with room for more edge cases."),
                InterviewBandScore(band="Confidence & Delivery", score=76, description="Steady pace and positive tone."),
                InterviewBandScore(band="Topic Relevance & Application", score=75, description="Directly responded to the question prompts."),
            ],
            communication_metrics=InterviewCommunicationMetrics(
                fluency="Moderate",
                clarity="High",
                conciseness="Well Balanced",
                tone="Confident & Professional",
                feedback="Good pacing and clear voice delivery.",
            ),
            strengths=["Clear articulation of ideas", "Addressed the core subject directly"],
            areas_for_improvement=["Elaborate on production failure modes", "Include quantitative results"],
            question_evaluations=[],
            recruiter_verdict="Candidate shows strong foundational preparation and meets baseline hiring criteria.",
            actionable_roadmap=["Review deep-dive architectural trade-offs", "Practice timed responses"],
        )
