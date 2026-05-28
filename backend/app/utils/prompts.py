"""AI prompt templates for resume analysis."""

RESUME_ANALYSIS_PROMPT = """Analyze the following resume text thoroughly and provide a complete structured analysis.

RESUME TEXT:
---
{resume_text}
---

Provide your analysis as a JSON object with the following structure:
- ats_score: integer 0-100, rate how well this resume would perform in ATS systems
- ai_confidence: float 0.0-1.0, your confidence in this analysis
- summary: string, a 2-3 sentence professional summary of the candidate
- strengths: array of strings, 4-6 key strengths found in the resume
- weaknesses: array of strings, 3-5 areas for improvement
- missing_skills: array of strings, critical skills missing for their apparent target role
- keyword_analysis: array of objects with {{keyword, count, relevance}} where relevance is "high", "medium", or "low"
- suggestions: array of strings, 5-8 specific actionable improvement recommendations
- interview_questions: array of objects with {{question, answer}}, where each object contains a targeted interview question and a highly detailed suggested answer tailored specifically to this candidate (based on their resume and the STAR method).
- recruiter_feedback: string, a paragraph of honest recruiter-perspective feedback
- skill_scores: array of objects with {{name, score (0-100), category}} for each detected skill
- experience_level: string, one of "junior", "mid", "senior", "executive"
- industry_fit: array of strings, top 3 industries this candidate fits best

Be specific, reference actual content from the resume, and be constructively honest.
Return ONLY valid JSON, no markdown formatting."""


RESUME_MATCH_PROMPT = """Analyze how well this resume matches the given job description.

RESUME TEXT:
---
{resume_text}
---

JOB DESCRIPTION:
---
{job_description}
---

Provide your analysis as a JSON object with the following structure:
- ats_score: integer 0-100, rate ATS compatibility specifically for this job
- ai_confidence: float 0.0-1.0, your confidence in this analysis
- summary: string, a 2-3 sentence assessment of the candidate's fit for this role
- strengths: array of strings, strengths that align with the job requirements
- weaknesses: array of strings, gaps between the resume and job requirements
- missing_skills: array of strings, skills from the job description missing in the resume
- keyword_analysis: array of objects with {{keyword, count, relevance}} — focus on job-relevant keywords
- suggestions: array of strings, specific recommendations to better match this job
- interview_questions: array of objects with {{question, answer}}, where each object contains a targeted interview question and a highly detailed suggested answer tailored specifically to this candidate (based on their resume and the STAR method).
- recruiter_feedback: string, assessment of the candidate from a recruiter reviewing for this role
- job_match_score: integer 0-100, overall match percentage between resume and job description
- skill_scores: array of objects with {{name, score (0-100), category}} for job-required skills
- experience_level: string, one of "junior", "mid", "senior", "executive"
- industry_fit: array of strings, industries this candidate fits best

Be specific about the match/mismatch between resume content and job requirements.
Return ONLY valid JSON, no markdown formatting."""
