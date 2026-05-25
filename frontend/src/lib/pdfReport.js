/**
 * PDF Report Generator for ResumePilot
 * Uses jsPDF to programmatically draw a professional PDF — no DOM rendering.
 */
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Color Palette ──────────────────────────────────────────────────────────────
const COLORS = {
  bg: [15, 23, 42],          // #0f172a  slate-900
  card: [30, 41, 59],        // #1e293b  slate-800
  border: [51, 65, 85],      // #334155  slate-700
  text: [226, 232, 240],     // #e2e8f0  slate-200
  textMuted: [148, 163, 184],// #94a3b8  slate-400
  textDim: [100, 116, 139],  // #64748b  slate-500
  primary: [129, 140, 248],  // #818cf8  indigo-400
  purple: [192, 132, 252],   // #c084fc  purple-400
  green: [74, 222, 128],     // #4ade80  green-400
  amber: [251, 191, 36],     // #fbbf24  amber-400
  red: [252, 165, 165],      // #fca5a5  red-300
  white: [255, 255, 255],
};

function scoreColor(score) {
  if (score >= 80) return [34, 197, 94];    // green-500
  if (score >= 60) return [245, 158, 11];   // amber-500
  if (score >= 40) return [249, 115, 22];   // orange-500
  return [239, 68, 68];                     // red-500
}

function scoreGrade(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Very Good';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 50) return 'Needs Work';
  return 'Poor';
}

// ─── Drawing Helpers ────────────────────────────────────────────────────────────

function setColor(doc, rgb) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}

function fillRect(doc, x, y, w, h, rgb) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  doc.rect(x, y, w, h, 'F');
}

function drawRoundedRect(doc, x, y, w, h, r, rgb) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  doc.roundedRect(x, y, w, h, r, r, 'F');
}

/**
 * Ensure there's enough space on the page. If not, add a new page.
 * Returns the current Y position (unchanged or reset after page break).
 */
function ensureSpace(doc, y, needed, pageHeight, margin) {
  if (y + needed > pageHeight - margin) {
    doc.addPage();
    // Draw background on new page
    fillRect(doc, 0, 0, 210, 297, COLORS.bg);
    return margin;
  }
  return y;
}

/**
 * Draw a section title with an icon character and colored left accent.
 */
function drawSectionTitle(doc, title, y, accentColor = COLORS.primary) {
  // Accent bar
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(16, y, 3, 7, 'F');

  // Title text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  setColor(doc, accentColor);
  doc.text(title, 23, y + 5.5);

  return y + 14;
}

/**
 * Draw wrapped text and return the new Y position.
 */
function drawWrappedText(doc, text, x, y, maxWidth, lineHeight = 5, pageHeight = 277, margin = 16) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(text, maxWidth);
  for (const line of lines) {
    y = ensureSpace(doc, y, lineHeight, pageHeight, margin);
    doc.text(line, x, y);
    y += lineHeight;
  }
  return y;
}

// ─── Main PDF Generation ────────────────────────────────────────────────────────

/**
 * Generate and download a PDF report from analysis data.
 * @param {object} data - The full analysis response object
 * @param {string} [id] - Optional analysis ID for filename
 */
export async function generatePDFReport(data, id) {
  const analysis = data.analysis || data;
  const filename = data.filename || 'Resume';
  const uploadDate = data.uploaded_at
    ? new Date(data.uploaded_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      });

  const atsScore = analysis.ats_score ?? 0;
  const confidence = Math.round((analysis.ai_confidence ?? 0) * 100);
  const expLevel = (analysis.experience_level || 'N/A').charAt(0).toUpperCase() + (analysis.experience_level || 'N/A').slice(1);
  const jobMatch = analysis.job_match_score;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  // ═══════════════════════════════════════════════════════════════════════
  // BACKGROUND
  // ═══════════════════════════════════════════════════════════════════════
  fillRect(doc, 0, 0, pageWidth, pageHeight, COLORS.bg);

  // ═══════════════════════════════════════════════════════════════════════
  // HEADER BANNER
  // ═══════════════════════════════════════════════════════════════════════
  // Purple gradient band
  fillRect(doc, 0, 0, pageWidth, 52, [49, 46, 129]); // deep indigo
  fillRect(doc, 0, 0, pageWidth, 28, [88, 28, 135]);  // purple overlay (top)

  // Brand name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  setColor(doc, COLORS.white);
  doc.text('ResumePilot', margin, 18);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  setColor(doc, [196, 181, 253]); // purple-300
  doc.text('AI-Powered Resume Analysis Report', margin, 25);

  // Date (right-aligned)
  doc.setFontSize(9);
  setColor(doc, [165, 180, 252]); // indigo-300
  doc.text('Generated on', pageWidth - margin, 14, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  setColor(doc, COLORS.white);
  doc.text(uploadDate, pageWidth - margin, 20, { align: 'right' });

  // File info bar
  drawRoundedRect(doc, margin, 32, contentWidth, 16, 3, [255, 255, 255, 0.08]);
  fillRect(doc, margin, 32, contentWidth, 16, [30, 27, 75]); // darker purple

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  setColor(doc, [196, 181, 253]);
  doc.text('Resume File', margin + 6, 38);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  setColor(doc, COLORS.white);
  doc.text(filename, margin + 6, 44);

  // Meta badges
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  setColor(doc, [165, 180, 252]);
  const metaText = `Experience: ${expLevel}   |   AI Confidence: ${confidence}%`;
  doc.text(metaText, pageWidth - margin - 6, 41, { align: 'right' });

  y = 58;

  // ═══════════════════════════════════════════════════════════════════════
  // SCORE CARDS
  // ═══════════════════════════════════════════════════════════════════════
  const cardW = jobMatch != null ? (contentWidth - 6) / 2 : contentWidth;

  // ATS Score card
  drawRoundedRect(doc, margin, y, cardW, 34, 3, COLORS.card);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  setColor(doc, COLORS.textDim);
  doc.text('ATS SCORE', margin + cardW / 2, y + 8, { align: 'center' });

  doc.setFontSize(32);
  setColor(doc, scoreColor(atsScore));
  doc.text(String(atsScore), margin + cardW / 2, y + 24, { align: 'center' });

  doc.setFontSize(9);
  setColor(doc, COLORS.textMuted);
  doc.text(`/100 — ${scoreGrade(atsScore)}`, margin + cardW / 2, y + 30, { align: 'center' });

  // Job Match card (if applicable)
  if (jobMatch != null) {
    const x2 = margin + cardW + 6;
    drawRoundedRect(doc, x2, y, cardW, 34, 3, COLORS.card);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    setColor(doc, COLORS.textDim);
    doc.text('JOB MATCH', x2 + cardW / 2, y + 8, { align: 'center' });

    doc.setFontSize(32);
    setColor(doc, scoreColor(jobMatch));
    doc.text(String(jobMatch), x2 + cardW / 2, y + 24, { align: 'center' });

    doc.setFontSize(9);
    setColor(doc, COLORS.textMuted);
    doc.text(`/100 — ${scoreGrade(jobMatch)}`, x2 + cardW / 2, y + 30, { align: 'center' });
  }

  y += 40;

  // ═══════════════════════════════════════════════════════════════════════
  // PROFESSIONAL SUMMARY
  // ═══════════════════════════════════════════════════════════════════════
  y = ensureSpace(doc, y, 30, pageHeight, margin);
  y = drawSectionTitle(doc, 'Professional Summary', y, COLORS.primary);

  setColor(doc, COLORS.text);
  y = drawWrappedText(doc, analysis.summary || 'No summary available.', margin, y, contentWidth, 5, pageHeight, margin);

  // Industry fit
  if (analysis.industry_fit?.length) {
    y += 3;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    setColor(doc, COLORS.textDim);
    doc.text('Best Fit Industries:', margin, y);
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setColor(doc, COLORS.primary);
    doc.text(analysis.industry_fit.join('  /  '), margin, y);
    y += 4;
  }

  y += 6;

  // ═══════════════════════════════════════════════════════════════════════
  // STRENGTHS & WEAKNESSES — side by side
  // ═══════════════════════════════════════════════════════════════════════
  const strengths = analysis.strengths || [];
  const weaknesses = analysis.weaknesses || [];
  const maxItems = Math.max(strengths.length, weaknesses.length);
  const colW = (contentWidth - 6) / 2;

  y = ensureSpace(doc, y, 20 + maxItems * 7, pageHeight, margin);

  // Strengths column header
  y = drawSectionTitle(doc, 'Strengths', y, COLORS.green);
  const strengthsStartY = y;

  // Draw strengths
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  let leftY = y;
  for (const s of strengths) {
    leftY = ensureSpace(doc, leftY, 6, pageHeight, margin);
    setColor(doc, COLORS.green);
    doc.text('+', margin + 2, leftY);
    setColor(doc, COLORS.text);
    const lines = doc.splitTextToSize(s, colW - 12);
    doc.text(lines, margin + 9, leftY);
    leftY += lines.length * 4.5 + 2;
  }

  // Weaknesses — start from same Y as strengths
  const rightX = margin + colW + 6;
  let rightStartY = strengthsStartY;

  // Weaknesses column header (draw at the same level)
  doc.setFillColor(COLORS.amber[0], COLORS.amber[1], COLORS.amber[2]);
  doc.rect(rightX - 4, strengthsStartY - 14, 3, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  setColor(doc, COLORS.amber);
  doc.text('Areas to Improve', rightX, strengthsStartY - 8.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  let rightY = rightStartY;
  for (const w of weaknesses) {
    rightY = ensureSpace(doc, rightY, 6, pageHeight, margin);
    setColor(doc, COLORS.amber);
    doc.text('-', rightX + 2, rightY);
    setColor(doc, COLORS.text);
    const lines = doc.splitTextToSize(w, colW - 12);
    doc.text(lines, rightX + 9, rightY);
    rightY += lines.length * 4.5 + 2;
  }

  y = Math.max(leftY, rightY) + 6;

  // ═══════════════════════════════════════════════════════════════════════
  // MISSING SKILLS
  // ═══════════════════════════════════════════════════════════════════════
  const missingSkills = analysis.missing_skills || [];
  if (missingSkills.length) {
    y = ensureSpace(doc, y, 20, pageHeight, margin);
    y = drawSectionTitle(doc, 'Missing Skills', y, COLORS.red);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    setColor(doc, COLORS.red);
    let skillX = margin;
    for (const skill of missingSkills) {
      const textW = doc.getTextWidth(skill) + 8;
      if (skillX + textW > pageWidth - margin) {
        skillX = margin;
        y += 8;
        y = ensureSpace(doc, y, 8, pageHeight, margin);
      }
      // Badge background
      drawRoundedRect(doc, skillX, y - 4, textW, 7, 2, [239, 68, 68]);
      doc.setFontSize(8);
      setColor(doc, COLORS.white);
      doc.text(skill, skillX + 4, y);
      skillX += textW + 4;
    }
    y += 10;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SKILL PROFICIENCY BARS
  // ═══════════════════════════════════════════════════════════════════════
  const skills = analysis.skill_scores || [];
  if (skills.length) {
    y = ensureSpace(doc, y, 16 + skills.length * 10, pageHeight, margin);
    y = drawSectionTitle(doc, 'Skill Proficiency', y, COLORS.primary);

    for (const skill of skills) {
      y = ensureSpace(doc, y, 10, pageHeight, margin);

      // Label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      setColor(doc, COLORS.text);
      doc.text(skill.name, margin, y);

      // Score
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      setColor(doc, COLORS.textMuted);
      doc.text(`${skill.score}%`, pageWidth - margin, y, { align: 'right' });

      // Bar background
      y += 2;
      const barW = contentWidth - 4;
      drawRoundedRect(doc, margin, y, barW, 3.5, 1.5, COLORS.border);

      // Bar fill
      const fillW = (skill.score / 100) * barW;
      if (fillW > 0) {
        drawRoundedRect(doc, margin, y, fillW, 3.5, 1.5, COLORS.primary);
      }

      y += 8;
    }
    y += 2;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // KEYWORD ANALYSIS TABLE
  // ═══════════════════════════════════════════════════════════════════════
  const keywords = (analysis.keyword_analysis || []).slice(0, 12);
  if (keywords.length) {
    y = ensureSpace(doc, y, 30, pageHeight, margin);
    y = drawSectionTitle(doc, 'Keyword Analysis', y, COLORS.primary);

    const table = autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Keyword', 'Count', 'Relevance']],
      body: keywords.map((k) => [k.keyword, String(k.count), k.relevance.toUpperCase()]),
      styles: {
        fillColor: COLORS.card,
        textColor: COLORS.text,
        fontSize: 9,
        cellPadding: 3,
        lineColor: COLORS.border,
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: [20, 30, 50],
        textColor: COLORS.primary,
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'left',
      },
      alternateRowStyles: {
        fillColor: COLORS.bg,
      },
      columnStyles: {
        1: { halign: 'center', cellWidth: 20 },
        2: { halign: 'center', cellWidth: 28 },
      },
    });

    y = (table?.finalY ?? doc.lastAutoTable?.finalY ?? y) + 8;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SUGGESTIONS
  // ═══════════════════════════════════════════════════════════════════════
  const suggestions = analysis.suggestions || [];
  if (suggestions.length) {
    y = ensureSpace(doc, y, 20, pageHeight, margin);
    y = drawSectionTitle(doc, 'Improvement Suggestions', y, COLORS.amber);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    for (let i = 0; i < suggestions.length; i++) {
      y = ensureSpace(doc, y, 8, pageHeight, margin);
      setColor(doc, COLORS.primary);
      doc.setFont('helvetica', 'bold');
      doc.text(`${i + 1}.`, margin + 2, y);
      doc.setFont('helvetica', 'normal');
      setColor(doc, COLORS.text);
      const lines = doc.splitTextToSize(suggestions[i], contentWidth - 12);
      doc.text(lines, margin + 10, y);
      y += lines.length * 4.5 + 3;
    }
    y += 4;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // INTERVIEW QUESTIONS
  // ═══════════════════════════════════════════════════════════════════════
  const questions = analysis.interview_questions || [];
  if (questions.length) {
    y = ensureSpace(doc, y, 20, pageHeight, margin);
    y = drawSectionTitle(doc, 'Potential Interview Questions', y, COLORS.primary);

    for (let i = 0; i < questions.length; i++) {
      y = ensureSpace(doc, y, 14, pageHeight, margin);

      // Question card background
      const qLines = doc.splitTextToSize(questions[i], contentWidth - 20);
      const qHeight = qLines.length * 4.5 + 6;
      drawRoundedRect(doc, margin, y - 3, contentWidth, qHeight, 2, COLORS.card);

      // Left accent bar
      doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.rect(margin, y - 3, 2, qHeight, 'F');

      // Question number
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      setColor(doc, COLORS.primary);
      doc.text(`Q${i + 1}.`, margin + 6, y + 2);

      // Question text
      doc.setFont('helvetica', 'normal');
      setColor(doc, COLORS.text);
      doc.text(qLines, margin + 16, y + 2);

      y += qHeight + 3;
    }
    y += 4;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RECRUITER FEEDBACK
  // ═══════════════════════════════════════════════════════════════════════
  if (analysis.recruiter_feedback) {
    y = ensureSpace(doc, y, 25, pageHeight, margin);
    y = drawSectionTitle(doc, 'Recruiter Perspective', y, COLORS.purple);

    // Quote accent bar
    doc.setFillColor(COLORS.purple[0], COLORS.purple[1], COLORS.purple[2]);
    doc.rect(margin + 2, y - 2, 1.5, 0, 'F');

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9.5);
    setColor(doc, COLORS.text);

    const feedbackLines = doc.splitTextToSize('"' + analysis.recruiter_feedback + '"', contentWidth - 14);

    // Draw purple accent line alongside text
    const feedbackHeight = feedbackLines.length * 4.5;
    doc.setFillColor(COLORS.purple[0], COLORS.purple[1], COLORS.purple[2]);
    doc.rect(margin + 2, y - 1, 1.5, feedbackHeight + 2, 'F');

    doc.text(feedbackLines, margin + 8, y + 2);
    y += feedbackHeight + 8;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════════════════════════════════
  // Add footer to all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    // Separator line
    doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 16, pageWidth - margin, pageHeight - 16);

    // Footer text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    setColor(doc, COLORS.textDim);
    doc.text('Generated by ResumePilot AI - Powered by Ollama', pageWidth / 2, pageHeight - 11, { align: 'center' });
    doc.setFontSize(6);
    setColor(doc, COLORS.border);
    doc.text('This report is AI-generated. Review all findings and use professional judgment for hiring decisions.', pageWidth / 2, pageHeight - 7, { align: 'center' });

    // Page number
    doc.setFontSize(7);
    setColor(doc, COLORS.textDim);
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SAVE
  // ═══════════════════════════════════════════════════════════════════════
  const pdfFilename = `ResumePilot_Report_${id?.slice(0, 8) || 'analysis'}.pdf`;
  doc.save(pdfFilename);
}
