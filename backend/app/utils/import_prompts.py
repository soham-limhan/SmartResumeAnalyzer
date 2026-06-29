"""AI prompt template for structured resume data extraction with confidence scoring."""

RESUME_IMPORT_PROMPT = """You are an expert resume parser. Your only job is to extract information
that is EXPLICITLY present in the resume text below. 

CRITICAL RULES — you MUST follow these without exception:
1. NEVER invent, infer, guess, or fabricate any data.
2. If a field is not clearly present in the resume text, return null for that field.
3. Do NOT rewrite or paraphrase any content. Preserve the candidate's exact wording.
4. Do NOT generate, assume, or fill in missing dates, phone numbers, emails, job titles, 
   skills, degrees, certifications, project descriptions, or any other information.
5. Preserve original capitalization, punctuation, and bullet point text exactly.
6. For each extracted value, assign a confidence score (0-100):
   - 95-100: Explicitly stated, unambiguous
   - 80-94:  Clearly implied or partially formatted
   - 60-79:  Uncertain — text is ambiguous or fragmented
   - 0-59:   Very low confidence — should be flagged for manual review

RESUME TEXT:
---
{resume_text}
---

Return ONLY a valid JSON object matching this exact schema. Do not include markdown formatting.
Use null for any field not found. Use empty arrays [] for lists with no data found.

{{
  "personal": {{
    "fullName": {{"value": "<string or null>", "confidence": <0-100>}},
    "professionalTitle": {{"value": "<string or null>", "confidence": <0-100>}},
    "email": {{"value": "<string or null>", "confidence": <0-100>}},
    "phone": {{"value": "<string or null>", "confidence": <0-100>}},
    "location": {{"value": "<string or null>", "confidence": <0-100>}},
    "linkedin": {{"value": "<string or null>", "confidence": <0-100>}},
    "github": {{"value": "<string or null>", "confidence": <0-100>}},
    "portfolioWebsite": {{"value": "<string or null>", "confidence": <0-100>}}
  }},
  "summary": {{"value": "<string or null>", "confidence": <0-100>}},
  "education": [
    {{
      "degree": {{"value": "<string or null>", "confidence": <0-100>}},
      "institution": {{"value": "<string or null>", "confidence": <0-100>}},
      "startDate": {{"value": "<string or null>", "confidence": <0-100>}},
      "endDate": {{"value": "<string or null>", "confidence": <0-100>}},
      "gpa": {{"value": "<string or null>", "confidence": <0-100>}},
      "location": {{"value": "<string or null>", "confidence": <0-100>}},
      "description": {{"value": "<string or null>", "confidence": <0-100>}}
    }}
  ],
  "experience": [
    {{
      "jobTitle": {{"value": "<string or null>", "confidence": <0-100>}},
      "company": {{"value": "<string or null>", "confidence": <0-100>}},
      "employmentType": {{"value": "<string or null>", "confidence": <0-100>}},
      "location": {{"value": "<string or null>", "confidence": <0-100>}},
      "startDate": {{"value": "<string or null>", "confidence": <0-100>}},
      "endDate": {{"value": "<string or null>", "confidence": <0-100>}},
      "current": {{"value": <true or false>, "confidence": <0-100>}},
      "responsibilities": {{"value": "<string or null>", "confidence": <0-100>}},
      "achievements": {{"value": "<string or null>", "confidence": <0-100>}}
    }}
  ],
  "projects": [
    {{
      "projectName": {{"value": "<string or null>", "confidence": <0-100>}},
      "description": {{"value": "<string or null>", "confidence": <0-100>}},
      "technologies": {{"value": ["<string>"], "confidence": <0-100>}},
      "githubLink": {{"value": "<string or null>", "confidence": <0-100>}},
      "liveLink": {{"value": "<string or null>", "confidence": <0-100>}}
    }}
  ],
  "skills": {{
    "technical": {{"value": ["<string>"], "confidence": <0-100>}},
    "soft": {{"value": ["<string>"], "confidence": <0-100>}},
    "tools": {{"value": ["<string>"], "confidence": <0-100>}},
    "languages": {{"value": ["<string>"], "confidence": <0-100>}}
  }},
  "certifications": {{"value": ["<string>"], "confidence": <0-100>}},
  "achievements": {{"value": ["<string>"], "confidence": <0-100>}},
  "volunteer": {{"value": ["<string>"], "confidence": <0-100>}},
  "interests": {{"value": ["<string>"], "confidence": <0-100>}},
  "references": {{"value": ["<string>"], "confidence": <0-100>}}
}}

Important notes for specific fields:
- "current": set to true only if the resume explicitly says "Present", "Current", or similar. Otherwise false.
- "employmentType": extract only if explicitly stated (e.g., "Full-time", "Internship", "Contract"). Otherwise null.
- "technologies" in projects: extract only technologies explicitly listed for that project. Never add extras.
- For skills, only classify into categories if the resume itself labels them. If the resume lists all skills together, put them all in "technical". Never create soft skills that are not explicitly listed.
- Preserve exact text: if the resume says "B.Tech", do not change it to "Bachelor of Technology".

Return ONLY valid JSON. No markdown. No explanation. No preamble."""
