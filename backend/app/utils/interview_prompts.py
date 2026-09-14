"""AI prompt templates for Mock Interview generation and multi-band evaluation."""

INTERVIEW_QUESTION_GEN_SYSTEM_PROMPT = (
    "You are a Principal Engineering Leader, Elite Technical Recruiter, and Executive "
    "Hiring Bar Raiser with 20+ years of experience conducting interviews at top tech companies.\n\n"
    "Your objective is to generate authentic, realistic, high-signal interview questions "
    "tailored precisely to the given topic and requested difficulty level."
)

INTERVIEW_QUESTION_GEN_PROMPT = """Generate a set of {count} realistic, high-signal interview questions for the topic: "{topic}".
Difficulty level: {difficulty} (options are easy, medium, hard, or adaptive).
{level_context}

{instructions}

Return your output as a JSON object matching this exact schema:
{{
  "topic": "{topic}",
  "difficulty": "{difficulty}",
  "questions": [
    {{
      "id": "q_1",
      "question": "The interview question text",
      "difficulty": "easy | medium | hard",
      "category": "Technical Architecture | System Design | Problem Solving | Behavioral / STAR | Coding & Algorithms | Fundamentals",
      "time_limit_seconds": 120,
      "key_points_expected": [
        "Key point 1 expected in candidate answer",
        "Key point 2 expected in candidate answer",
        "Key point 3 expected in candidate answer"
      ],
      "sample_ideal_answer": "A structured, concise model answer demonstrating best practices and domain depth."
    }}
  ]
}}

Ensure each question is clear, professional, and directly tests practical understanding rather than trivial trivia.
Return ONLY valid JSON. No markdown backticks, no explanations."""


INTERVIEW_EVALUATION_SYSTEM_PROMPT = (
    "You are an expert Bar Raiser Interview Evaluator and Executive Career Coach. "
    "You evaluate interview candidates across multiple dimensions: technical accuracy, "
    "communication clarity, problem solving framework (STAR method), delivery confidence, "
    "and practical domain depth.\n\n"
    "Be constructively honest, precise, and provide concrete feedback with actionable recommendations."
)

INTERVIEW_EVALUATION_PROMPT = """Evaluate the candidate's performance across the following mock interview session.

INTERVIEW TOPIC: {topic}
TARGET DIFFICULTY: {difficulty}

QUESTIONS & CANDIDATE SPOKEN ANSWERS:
{transcript_block}

Evaluate the candidate's answers against the expected key points and provide a comprehensive multi-band scorecard.

Return a JSON object matching this exact schema:
{{
  "overall_score": 82,
  "performance_band": "Strong Hire | Senior Ready | Hire | Needs Practice | Developing",
  "confidence_score": 85,
  "summary": "2-3 sentences summarizing the candidate's overall performance, core strengths, and main growth area.",
  "band_scores": [
    {{
      "band": "Technical Depth & Accuracy",
      "score": 84,
      "description": "Accuracy, precision of terminology, and conceptual depth."
    }},
    {{
      "band": "Communication & Articulation",
      "score": 88,
      "description": "Clarity, concise structure, and flow of ideas."
    }},
    {{
      "band": "Problem Solving & Structure",
      "score": 80,
      "description": "Logical framework, handling edge cases, and structured approach."
    }},
    {{
      "band": "Confidence & Delivery",
      "score": 85,
      "description": "Fluency, conviction, and pace of delivery."
    }},
    {{
      "band": "Topic Relevance & Application",
      "score": 82,
      "description": "Directly addressing the core question with real-world application."
    }}
  ],
  "communication_metrics": {{
    "fluency": "High | Moderate | Low",
    "clarity": "High | Moderate | Low",
    "conciseness": "Well Balanced | Overly Brief | Verbose",
    "tone": "Confident & Professional | Casual | Hesitant",
    "feedback": "Specific feedback on candidate's verbal delivery and speech patterns."
  }},
  "strengths": [
    "Key strength 1 observed across answers",
    "Key strength 2 observed across answers",
    "Key strength 3 observed across answers"
  ],
  "areas_for_improvement": [
    "Specific growth area 1 with advice",
    "Specific growth area 2 with advice",
    "Specific growth area 3 with advice"
  ],
  "question_evaluations": [
    {{
      "question_id": "q_1",
      "question": "Question text",
      "user_answer": "Candidate's transcript",
      "score": 85,
      "strengths": ["What was answered well"],
      "missing_points": ["Concepts or nuances that were skipped"],
      "ideal_answer": "Model reference answer",
      "specific_feedback": "Targeted feedback on how to improve this specific answer"
    }}
  ],
  "recruiter_verdict": "A comprehensive recruiter review paragraph detailing candidate readiness for real-world interviews.",
  "actionable_roadmap": [
    "Step 1: Immediate focus area",
    "Step 2: Key concept to study",
    "Step 3: Framework to practice",
    "Step 4: Practice tip for next mock interview"
  ]
}}

Scoring guidelines:
- 90-100: Exceptional / Bar Raiser / Staff Level
- 80-89: Strong Hire / Senior Level
- 70-79: Hire / Mid Level
- 50-69: Borderline / Needs Practice
- <50: Developing / Significant Gaps

Return ONLY valid JSON."""
