/**
 * resumeImportUtils.js
 * 
 * Pure utility functions for the Resume Import feature.
 * No React dependencies — safe to use in any context.
 */

// ─── Schema Mapping ────────────────────────────────────────────────────────────

/**
 * Extract a plain value from a ConfidenceField object.
 * @param {Object|null} field  - { value, confidence } or null
 * @param {*} fallback         - Default value when field is absent/null
 */
export function cfValue(field, fallback = '') {
  if (!field || field.value === null || field.value === undefined) return fallback;
  return field.value;
}

/**
 * Extract confidence score from a ConfidenceField (0-100).
 */
export function cfConfidence(field) {
  if (!field) return 0;
  return field.confidence ?? 0;
}

/**
 * Returns true if a ConfidenceField has a non-empty value.
 */
export function cfHasValue(field) {
  const v = cfValue(field, null);
  if (v === null || v === undefined) return false;
  if (typeof v === 'string') return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'boolean') return true;
  return Boolean(v);
}

/**
 * Map an ImportedResume (from the backend) to the ResumeBuilderPage state shape.
 *
 * The builder uses:
 *  {
 *    personalInfo: { fullName, professionalTitle, email, phone, location,
 *                    linkedin, github, portfolioWebsite, professionalSummary },
 *    education:    [{ id, degree, institution, startDate, endDate, gpa, description }],
 *    experience:   [{ id, jobTitle, company, location, startDate, endDate, current,
 *                     responsibilities, achievements }],
 *    skills:       { technical, soft, languages, certifications },
 *    projects:     [{ id, projectName, description, technologies, githubLink, liveDemoLink }],
 *    designTemplate: 'modern_professional'
 *  }
 *
 * @param {Object} imported - ImportedResume from /api/resumes/import
 * @returns {Object}        - Builder-compatible resume state
 */
export function mapImportedToBuilderSchema(imported) {
  const p = imported.personal || {};

  const personalInfo = {
    fullName:            cfValue(p.fullName, ''),
    professionalTitle:   cfValue(p.professionalTitle, ''),
    email:               cfValue(p.email, ''),
    phone:               cfValue(p.phone, ''),
    location:            cfValue(p.location, ''),
    linkedin:            cfValue(p.linkedin, ''),
    github:              cfValue(p.github, ''),
    portfolioWebsite:    cfValue(p.portfolioWebsite, ''),
    professionalSummary: cfValue(imported.summary, ''),
  };

  const education = (imported.education || []).map((edu, idx) => ({
    id:          `imp-edu-${idx}-${Date.now()}`,
    degree:      cfValue(edu.degree, ''),
    institution: cfValue(edu.institution, ''),
    startDate:   cfValue(edu.startDate, ''),
    endDate:     cfValue(edu.endDate, ''),
    gpa:         cfValue(edu.gpa, ''),
    description: cfValue(edu.description, ''),
  }));

  const experience = (imported.experience || []).map((exp, idx) => ({
    id:               `imp-exp-${idx}-${Date.now()}`,
    jobTitle:         cfValue(exp.jobTitle, ''),
    company:          cfValue(exp.company, ''),
    location:         cfValue(exp.location, ''),
    startDate:        cfValue(exp.startDate, ''),
    endDate:          cfValue(exp.endDate, ''),
    current:          cfValue(exp.current, false) === true,
    responsibilities: cfValue(exp.responsibilities, ''),
    achievements:     cfValue(exp.achievements, ''),
  }));

  const projects = (imported.projects || []).map((proj, idx) => ({
    id:           `imp-proj-${idx}-${Date.now()}`,
    projectName:  cfValue(proj.projectName, ''),
    description:  cfValue(proj.description, ''),
    technologies: Array.isArray(cfValue(proj.technologies, []))
                    ? cfValue(proj.technologies, [])
                    : [],
    githubLink:   cfValue(proj.githubLink, ''),
    liveDemoLink: cfValue(proj.liveLink, ''),
  }));

  // Merge tools into technical (builder has no separate "tools" category)
  const rawTechnical = Array.isArray(cfValue(imported.skills?.technical, []))
    ? cfValue(imported.skills.technical, []) : [];
  const rawTools = Array.isArray(cfValue(imported.skills?.tools, []))
    ? cfValue(imported.skills.tools, []) : [];
  const rawSoft = Array.isArray(cfValue(imported.skills?.soft, []))
    ? cfValue(imported.skills.soft, []) : [];
  const rawLangs = Array.isArray(cfValue(imported.skills?.languages, []))
    ? cfValue(imported.skills.languages, []) : [];
  const rawCerts = Array.isArray(cfValue(imported.certifications, []))
    ? cfValue(imported.certifications, []) : [];

  const skills = {
    technical:      normalizeSkills([...rawTechnical, ...rawTools]),
    soft:           normalizeSkills(rawSoft),
    languages:      normalizeSkills(rawLangs),
    certifications: normalizeSkills(rawCerts),
  };

  return {
    designTemplate: 'modern_professional',
    personalInfo,
    education,
    experience,
    skills,
    projects,
  };
}


// ─── Skill Normalization ───────────────────────────────────────────────────────

/**
 * Deduplicate a list of skills (case-insensitive), preserving first occurrence casing.
 *
 * Examples:
 *   ['Python', 'python', 'PYTHON']  → ['Python']
 *   ['React', 'Vue', 'react']       → ['React', 'Vue']
 *
 * @param {string[]} skills
 * @returns {string[]}
 */
export function normalizeSkills(skills) {
  if (!Array.isArray(skills)) return [];
  const seen = new Set();
  return skills
    .map(s => (typeof s === 'string' ? s.trim() : String(s).trim()))
    .filter(s => s.length > 0)
    .filter(s => {
      const key = s.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}


// ─── Conflict Detection ────────────────────────────────────────────────────────

/**
 * Compare a builder resume state against imported data and find fields with
 * differing non-empty values.
 *
 * Returns an array of conflict descriptors:
 * [
 *   {
 *     section: 'personalInfo',
 *     field:   'phone',
 *     label:   'Phone Number',
 *     current: '9876543210',
 *     imported:'9999999999',
 *   },
 *   ...
 * ]
 *
 * @param {Object} builderData  - Current ResumeBuilderPage state
 * @param {Object} importedData - Mapped builder-schema data from import
 * @returns {Array}
 */
export function detectConflicts(builderData, importedData) {
  const conflicts = [];

  const PERSONAL_LABELS = {
    fullName:            'Full Name',
    professionalTitle:   'Professional Title',
    email:               'Email',
    phone:               'Phone Number',
    location:            'Location',
    linkedin:            'LinkedIn',
    github:              'GitHub',
    portfolioWebsite:    'Portfolio Website',
    professionalSummary: 'Professional Summary',
  };

  // Check personalInfo fields
  const currentPersonal  = builderData.personalInfo  || {};
  const importedPersonal = importedData.personalInfo || {};

  for (const [field, label] of Object.entries(PERSONAL_LABELS)) {
    const current  = (currentPersonal[field]  || '').trim();
    const imported = (importedPersonal[field] || '').trim();

    if (current && imported && current !== imported) {
      conflicts.push({ section: 'personalInfo', field, label, current, imported });
    }
  }

  return conflicts;
}


// ─── Merge Engine ──────────────────────────────────────────────────────────────

/**
 * Apply per-field merge decisions to produce the final merged state.
 *
 * @param {Object} builderData  - Current builder state
 * @param {Object} importedData - Imported mapped state
 * @param {Object} decisions    - { 'personalInfo.phone': 'replace' | 'keep', ... }
 * @returns {Object}            - Merged builder state
 */
export function applyMergeDecisions(builderData, importedData, decisions) {
  const result = structuredClone(builderData);

  for (const [key, action] of Object.entries(decisions)) {
    const [section, field] = key.split('.');
    if (action === 'replace' && importedData[section]) {
      if (result[section] && field in result[section]) {
        result[section][field] = importedData[section][field];
      }
    }
    // 'keep' = no change; 'replace' = use imported value
  }

  return result;
}


// ─── Confidence helpers ────────────────────────────────────────────────────────

/** Confidence threshold below which a field is flagged for user review. */
export const LOW_CONFIDENCE_THRESHOLD = 80;

/**
 * Returns true if the field confidence is below the review threshold.
 */
export function isLowConfidence(confidence) {
  return confidence < LOW_CONFIDENCE_THRESHOLD;
}

/**
 * Get all low-confidence field paths from an ImportedResume.
 * Used by the review UI to auto-highlight uncertain fields.
 *
 * @param {Object} imported - Raw ImportedResume from backend
 * @returns {Set<string>}   - Set of dot-paths like 'personal.phone', 'education.0.degree'
 */
export function getLowConfidenceFields(imported) {
  const lowFields = new Set();

  // Personal info
  const p = imported.personal || {};
  for (const [field, cf] of Object.entries(p)) {
    if (cfHasValue(cf) && isLowConfidence(cfConfidence(cf))) {
      lowFields.add(`personal.${field}`);
    }
  }

  // Summary
  if (cfHasValue(imported.summary) && isLowConfidence(cfConfidence(imported.summary))) {
    lowFields.add('summary');
  }

  // Education
  (imported.education || []).forEach((edu, i) => {
    for (const [field, cf] of Object.entries(edu)) {
      if (cfHasValue(cf) && isLowConfidence(cfConfidence(cf))) {
        lowFields.add(`education.${i}.${field}`);
      }
    }
  });

  // Experience
  (imported.experience || []).forEach((exp, i) => {
    for (const [field, cf] of Object.entries(exp)) {
      if (cfHasValue(cf) && isLowConfidence(cfConfidence(cf))) {
        lowFields.add(`experience.${i}.${field}`);
      }
    }
  });

  // Projects
  (imported.projects || []).forEach((proj, i) => {
    for (const [field, cf] of Object.entries(proj)) {
      if (cfHasValue(cf) && isLowConfidence(cfConfidence(cf))) {
        lowFields.add(`projects.${i}.${field}`);
      }
    }
  });

  // Skills
  const s = imported.skills || {};
  for (const [cat, cf] of Object.entries(s)) {
    if (cfHasValue(cf) && isLowConfidence(cfConfidence(cf))) {
      lowFields.add(`skills.${cat}`);
    }
  }

  return lowFields;
}

/**
 * Compute a summary confidence score for the overall import.
 * Used in the review header badge.
 *
 * @param {Object} imported - Raw ImportedResume
 * @returns {number}        - Average confidence 0-100
 */
export function computeOverallConfidence(imported) {
  const scores = [];

  const addScore = (cf) => {
    if (cf && cfHasValue(cf)) scores.push(cfConfidence(cf));
  };

  const p = imported.personal || {};
  Object.values(p).forEach(addScore);
  addScore(imported.summary);

  (imported.education || []).forEach(edu => Object.values(edu).forEach(addScore));
  (imported.experience || []).forEach(exp => Object.values(exp).forEach(addScore));
  (imported.projects || []).forEach(proj => Object.values(proj).forEach(addScore));

  const s = imported.skills || {};
  Object.values(s).forEach(addScore);

  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}
