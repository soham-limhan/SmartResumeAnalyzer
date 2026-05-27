/**
 * Enhanced Resume PDF Generator
 * Produces a beautifully styled, ATS-friendly PDF using jsPDF.
 */
import jsPDF from 'jspdf';

// ─── Color palette (RGB) ───────────────────────────────────────────────────────
const COLORS = {
  primary:    [79, 70, 229],   // indigo-600
  secondary:  [124, 58, 237],  // violet-600
  accent:     [16, 185, 129],  // emerald-500
  dark:       [17, 24, 39],    // gray-900
  mid:        [55, 65, 81],    // gray-700
  muted:      [107, 114, 128], // gray-500
  light:      [243, 244, 246], // gray-100
  white:      [255, 255, 255],
  divider:    [224, 231, 255], // indigo-100
};

const FONT_SIZES = {
  name:       22,
  contact:    9.5,
  sectionH:   11,
  jobTitle:   11,
  company:    10.5,
  body:       10,
  bullet:     10,
  footer:     8,
};

const PAGE_W  = 210; // A4 mm
const PAGE_H  = 297;
const MARGIN  = 18;
const COL_W   = PAGE_W - MARGIN * 2;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function setColor(doc, rgb, type = 'text') {
  if (type === 'text') doc.setTextColor(...rgb);
  else if (type === 'fill') doc.setFillColor(...rgb);
  else doc.setDrawColor(...rgb);
}

function wrapText(doc, text, maxWidth) {
  return doc.splitTextToSize(text, maxWidth);
}

function sectionHeader(doc, y, title) {
  // Background pill
  setColor(doc, [238, 242, 255], 'fill'); // indigo-50
  doc.roundedRect(MARGIN, y - 4, COL_W, 12, 2, 2, 'F');

  setColor(doc, COLORS.primary, 'text');
  doc.setFontSize(FONT_SIZES.sectionH);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), MARGIN + 4, y + 4);

  // Accent line
  setColor(doc, COLORS.primary, 'draw');
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y + 9, MARGIN + COL_W, y + 9);

  return y + 16;
}

function bulletPoint(doc, y, text, indent = 6) {
  const maxW = COL_W - indent - 6;
  const lines = wrapText(doc, text, maxW);

  // Bullet dot
  setColor(doc, COLORS.primary, 'fill');
  doc.circle(MARGIN + indent - 2, y + 1.2, 0.8, 'F');

  setColor(doc, COLORS.mid, 'text');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(FONT_SIZES.bullet);
  doc.text(lines, MARGIN + indent + 2, y);

  return y + lines.length * 5 + 2;
}

function checkPageBreak(doc, y, needed = 20) {
  if (y + needed > PAGE_H - 20) {
    doc.addPage();
    return 20;
  }
  return y;
}

// ─── Main export function ──────────────────────────────────────────────────────

export function generateEnhancedPDF(enhancedResume, filename = 'enhanced_resume.pdf') {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Register font fallback
  doc.setFont('helvetica');

  let y = 0;

  // ── Header Band ──────────────────────────────────────────────────────────────
  // Gradient-like header background
  setColor(doc, COLORS.primary, 'fill');
  doc.rect(0, 0, PAGE_W, 42, 'F');

  // Secondary accent stripe
  setColor(doc, COLORS.secondary, 'fill');
  doc.rect(0, 38, PAGE_W, 4, 'F');

  // Name
  const name = enhancedResume.candidate_name || 'Candidate';
  setColor(doc, COLORS.white, 'text');
  doc.setFontSize(FONT_SIZES.name);
  doc.setFont('helvetica', 'bold');
  const nameW = doc.getTextWidth(name);
  doc.text(name, (PAGE_W - nameW) / 2, 18);

  // Contact info
  if (enhancedResume.contact_info) {
    setColor(doc, [199, 210, 254], 'text'); // indigo-200
    doc.setFontSize(FONT_SIZES.contact);
    doc.setFont('helvetica', 'normal');
    const contactLines = wrapText(doc, enhancedResume.contact_info, COL_W);
    doc.text(contactLines, PAGE_W / 2, 27, { align: 'center' });
  }

  y = 52; // after header

  // ── Professional Summary ─────────────────────────────────────────────────────
  const summary = enhancedResume.professional_summary?.enhanced;
  if (summary) {
    y = sectionHeader(doc, y, 'Professional Summary');
    setColor(doc, COLORS.mid, 'text');
    doc.setFontSize(FONT_SIZES.body);
    doc.setFont('helvetica', 'normal');
    const lines = wrapText(doc, summary, COL_W - 4);
    doc.text(lines, MARGIN + 2, y);
    y += lines.length * 5 + 8;
  }

  // ── Work Experience ──────────────────────────────────────────────────────────
  const experiences = enhancedResume.experience_sections || [];
  if (experiences.length > 0) {
    y = checkPageBreak(doc, y, 30);
    y = sectionHeader(doc, y, 'Work Experience');

    experiences.forEach((exp) => {
      y = checkPageBreak(doc, y, 20);

      // Job title
      setColor(doc, COLORS.dark, 'text');
      doc.setFontSize(FONT_SIZES.jobTitle);
      doc.setFont('helvetica', 'bold');
      doc.text(exp.title || '', MARGIN, y);

      // Company + duration (right side)
      const rightText = [exp.company, exp.duration].filter(Boolean).join('  ·  ');
      if (rightText) {
        setColor(doc, COLORS.primary, 'text');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const rightW = doc.getTextWidth(rightText);
        doc.text(rightText, MARGIN + COL_W - rightW, y);
      }
      y += 6;

      // Bullets
      const bullets = exp.enhanced_bullets?.length ? exp.enhanced_bullets : exp.original_bullets || [];
      bullets.forEach((bullet) => {
        y = checkPageBreak(doc, y, 10);
        y = bulletPoint(doc, y, bullet);
      });
      y += 4;
    });
  }

  // ── Projects ────────────────────────────────────────────────────────────────
  const projects = enhancedResume.projects_sections || [];
  if (projects.length > 0) {
    y = checkPageBreak(doc, y, 30);
    y = sectionHeader(doc, y, 'Projects');

    projects.forEach((proj) => {
      y = checkPageBreak(doc, y, 14);

      setColor(doc, COLORS.dark, 'text');
      doc.setFontSize(FONT_SIZES.jobTitle);
      doc.setFont('helvetica', 'bold');
      doc.text(proj.name || 'Project', MARGIN, y);
      y += 5.5;

      const desc = proj.enhanced || proj.original || '';
      if (desc) {
        y = checkPageBreak(doc, y, 12);
        setColor(doc, COLORS.mid, 'text');
        doc.setFontSize(FONT_SIZES.body);
        doc.setFont('helvetica', 'normal');
        const lines = wrapText(doc, desc, COL_W - 8);
        doc.text(lines, MARGIN + 4, y);
        y += lines.length * 5 + 4;
      }
    });
  }

  // ── Education ───────────────────────────────────────────────────────────────
  const educations = enhancedResume.education_sections || [];
  if (educations.length > 0) {
    y = checkPageBreak(doc, y, 30);
    y = sectionHeader(doc, y, 'Education');

    educations.forEach((edu) => {
      y = checkPageBreak(doc, y, 16);

      setColor(doc, COLORS.dark, 'text');
      doc.setFontSize(FONT_SIZES.jobTitle);
      doc.setFont('helvetica', 'bold');
      doc.text(edu.degree || '', MARGIN, y);

      if (edu.year) {
        setColor(doc, COLORS.muted, 'text');
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'normal');
        const yrW = doc.getTextWidth(edu.year);
        doc.text(edu.year, MARGIN + COL_W - yrW, y);
      }
      y += 5.5;

      if (edu.institution) {
        setColor(doc, COLORS.primary, 'text');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(edu.institution, MARGIN, y);
        y += 5;
      }

      const extra = edu.enhanced || edu.original || '';
      if (extra && extra !== edu.degree && extra !== edu.institution) {
        setColor(doc, COLORS.muted, 'text');
        doc.setFontSize(9.5);
        const lines = wrapText(doc, extra, COL_W - 4);
        doc.text(lines, MARGIN + 2, y);
        y += lines.length * 4.5;
      }
      y += 4;
    });
  }

  // ── Skills ──────────────────────────────────────────────────────────────────
  const skills = enhancedResume.skills_section?.enhanced?.length
    ? enhancedResume.skills_section.enhanced
    : enhancedResume.skills_section?.original || [];

  if (skills.length > 0) {
    y = checkPageBreak(doc, y, 30);
    y = sectionHeader(doc, y, 'Skills');

    // Render skills as pill-chips in rows
    const chipH = 7;
    const chipPad = 3;
    let xOff = MARGIN;
    let rowY = y;

    setColor(doc, COLORS.primary, 'draw');
    doc.setFontSize(9.5);

    skills.forEach((skill) => {
      const sw = doc.getTextWidth(skill) + chipPad * 2 + 4;
      if (xOff + sw > MARGIN + COL_W) {
        xOff = MARGIN;
        rowY += chipH + 3;
        y = rowY + chipH;
      }
      // Chip background
      setColor(doc, [238, 242, 255], 'fill');
      doc.roundedRect(xOff, rowY - 4, sw, chipH, 1.5, 1.5, 'F');
      setColor(doc, COLORS.primary, 'draw');
      doc.setLineWidth(0.3);
      doc.roundedRect(xOff, rowY - 4, sw, chipH, 1.5, 1.5, 'S');
      // Text
      setColor(doc, COLORS.primary, 'text');
      doc.setFont('helvetica', 'normal');
      doc.text(skill, xOff + chipPad + 2, rowY + 1);
      xOff += sw + 3;
    });
    y = rowY + chipH + 8;
  }

  // ── Achievements ────────────────────────────────────────────────────────────
  const achievements = enhancedResume.achievements_section?.enhanced?.length
    ? enhancedResume.achievements_section.enhanced
    : enhancedResume.achievements_section?.original || [];

  if (achievements.length > 0) {
    y = checkPageBreak(doc, y, 30);
    y = sectionHeader(doc, y, 'Achievements');
    achievements.forEach((ach) => {
      y = checkPageBreak(doc, y, 10);
      y = bulletPoint(doc, y, ach);
    });
    y += 4;
  }

  // ── Footer on every page ─────────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    setColor(doc, COLORS.muted, 'text');
    doc.setFontSize(FONT_SIZES.footer);
    doc.setFont('helvetica', 'italic');
    doc.text(
      `Enhanced by Smart Resume Analyzer AI  ·  Page ${i} of ${pageCount}`,
      PAGE_W / 2,
      PAGE_H - 8,
      { align: 'center' }
    );
  }

  doc.save(filename);
}
