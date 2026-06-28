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

const PLATFORM_META = {
  linkedin: { label: 'LinkedIn', initial: 'LI', color: [0, 119, 181] },
  github: { label: 'GitHub', initial: 'GH', color: [33, 37, 41] },
  portfolio: { label: 'Portfolio', initial: 'PT', color: [79, 70, 229] },
  twitter: { label: 'Twitter/X', initial: 'X', color: [29, 161, 242] },
  leetcode: { label: 'LeetCode', initial: 'LC', color: [239, 143, 23] },
  hackerrank: { label: 'HackerRank', initial: 'HR', color: [46, 200, 102] },
  kaggle: { label: 'Kaggle', initial: 'KG', color: [32, 190, 255] },
  behance: { label: 'Behance', initial: 'BH', color: [0, 87, 255] },
  dribbble: { label: 'Dribbble', initial: 'DR', color: [234, 76, 137] },
  medium: { label: 'Medium', initial: 'MD', color: [0, 171, 108] },
  stackoverflow: { label: 'StackOverflow', initial: 'SO', color: [244, 128, 36] },
  youtube: { label: 'YouTube', initial: 'YT', color: [255, 0, 0] },
  instagram: { label: 'Instagram', initial: 'IG', color: [225, 48, 108] },
  custom: { label: 'Link', initial: 'LN', color: [107, 114, 128] },
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

export function generateEnhancedPDF(enhancedResume, filename = 'enhanced_resume.pdf', socialLinks = [], displayMode = 'compact') {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Register font fallback
  doc.setFont('helvetica');

  let y = 0;

  // Filter out disabled social links
  const activeLinks = (socialLinks || []).filter(l => l.is_enabled);
  const hasLinks = activeLinks.length > 0;
  
  // Calculate dynamic header height based on presence of social links
  const isAts = displayMode === 'ats_safe';
  const headerHeight = hasLinks && !isAts ? 49 : 39;

  // ── Header Band ──────────────────────────────────────────────────────────────
  // Gradient-like header background
  setColor(doc, COLORS.primary, 'fill');
  doc.rect(0, 0, PAGE_W, headerHeight, 'F');

  // Secondary accent stripe
  setColor(doc, COLORS.secondary, 'fill');
  doc.rect(0, headerHeight - 4, PAGE_W, 4, 'F');

  // Name
  const name = enhancedResume.candidate_name || 'Candidate';
  setColor(doc, COLORS.white, 'text');
  doc.setFontSize(FONT_SIZES.name);
  doc.setFont('helvetica', 'bold');
  const nameW = doc.getTextWidth(name);
  doc.text(name, (PAGE_W - nameW) / 2, 16);

  // Contact info
  let nextY = 24;
  if (enhancedResume.contact_info) {
    setColor(doc, [199, 210, 254], 'text'); // indigo-200
    doc.setFontSize(FONT_SIZES.contact);
    doc.setFont('helvetica', 'normal');
    const contactLines = wrapText(doc, enhancedResume.contact_info, COL_W);
    doc.text(contactLines, PAGE_W / 2, nextY, { align: 'center' });
    nextY += contactLines.length * 4.2;
  }

  // Draw Social Links inside header band if not ATS mode
  if (hasLinks) {
    if (displayMode === 'compact') {
      let itemsText = [];
      activeLinks.forEach(l => {
        const meta = PLATFORM_META[l.platform] || PLATFORM_META.custom;
        const label = l.label || meta.label;
        const cleanUrl = l.url.replace(/^https?:\/\/(www\.)?/, '');
        itemsText.push({ text: `${label}: ${cleanUrl}`, url: l.url, platform: l.platform });
      });

      let totalW = 0;
      itemsText.forEach((item, idx) => {
        totalW += doc.getTextWidth(item.text) + 6.5;
        if (idx < itemsText.length - 1) {
          totalW += doc.getTextWidth('  |  ');
        }
      });

      let startX = (PAGE_W - totalW) / 2;
      itemsText.forEach((item, idx) => {
        const meta = PLATFORM_META[item.platform] || PLATFORM_META.custom;
        
        // Draw small colored circular badge
        setColor(doc, meta.color, 'fill');
        doc.circle(startX + 1.8, nextY - 0.8, 1.8, 'F');
        setColor(doc, [255, 255, 255], 'text');
        doc.setFontSize(5);
        doc.setFont('helvetica', 'bold');
        doc.text(meta.initial, startX + 1.8, nextY - 0.1, { align: 'center' });
        
        // Draw text link
        setColor(doc, [255, 255, 255], 'text');
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.text(item.text, startX + 4.5, nextY + 0.5);
        
        // Hyperlink bounding box
        const textW = doc.getTextWidth(item.text);
        doc.link(startX, nextY - 2.5, textW + 5, 4, { url: item.url });
        
        startX += textW + 6.5;
        
        if (idx < itemsText.length - 1) {
          setColor(doc, [199, 210, 254], 'text');
          doc.text('  |  ', startX, nextY + 0.5);
          startX += doc.getTextWidth('  |  ');
        }
      });
    } else if (displayMode === 'expanded') {
      const pillW = (COL_W - 8) / 2;
      activeLinks.slice(0, 4).forEach((l, idx) => {
        const meta = PLATFORM_META[l.platform] || PLATFORM_META.custom;
        const label = l.label || meta.label;
        const cleanUrl = l.url.replace(/^https?:\/\/(www\.)?/, '');
        const displayVal = `${label}: ${cleanUrl}`;
        
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        
        const x = MARGIN + col * (pillW + 8);
        const y = nextY + row * 5;
        
        // Draw semi-transparent background card
        setColor(doc, [255, 255, 255], 'fill');
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(x, y - 2.8, pillW, 4.2, 1, 1, 'F');
        
        // Circular icon indicator
        setColor(doc, meta.color, 'fill');
        doc.circle(x + 3.2, y - 0.7, 1.6, 'F');
        setColor(doc, [255, 255, 255], 'text');
        doc.setFontSize(4.5);
        doc.setFont('helvetica', 'bold');
        doc.text(meta.initial, x + 3.2, y - 0.1, { align: 'center' });
        
        // Link text
        setColor(doc, [255, 255, 255], 'text');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        
        let truncated = displayVal;
        if (doc.getTextWidth(truncated) > pillW - 7) {
          truncated = truncated.slice(0, 28) + '...';
        }
        doc.text(truncated, x + 5.8, y + 0.3);
        
        // Bounding link
        doc.link(x, y - 2.8, pillW, 4.2, { url: l.url });
      });
    } else if (displayMode === 'icon_only') {
      const iconR = 2.4;
      const iconSpacing = 8;
      const totalIconW = activeLinks.length * (iconR * 2) + (activeLinks.length - 1) * iconSpacing;
      let iconX = (PAGE_W - totalIconW) / 2 + iconR;

      activeLinks.forEach(l => {
        const meta = PLATFORM_META[l.platform] || PLATFORM_META.custom;
        
        setColor(doc, meta.color, 'fill');
        doc.circle(iconX, nextY + 0.5, iconR, 'F');
        
        setColor(doc, [255, 255, 255], 'text');
        doc.setFontSize(5);
        doc.setFont('helvetica', 'bold');
        doc.text(meta.initial, iconX, nextY + 1.2, { align: 'center' });
        
        doc.link(iconX - iconR, nextY - iconR + 0.5, iconR * 2, iconR * 2, { url: l.url });
        
        iconX += iconR * 2 + iconSpacing;
      });
    } else if (displayMode === 'ats_safe') {
      let totalW = 0;
      const textLinks = activeLinks.map(l => {
        const clean = l.url.replace(/^https?:\/\/(www\.)?/, '');
        return { text: clean, url: l.url };
      });
      
      textLinks.forEach((item, idx) => {
        totalW += doc.getTextWidth(item.text);
        if (idx < textLinks.length - 1) {
          totalW += doc.getTextWidth('  ·  ');
        }
      });
      
      let startX = (PAGE_W - totalW) / 2;
      textLinks.forEach((item, idx) => {
        setColor(doc, [226, 232, 240], 'text'); // slate-200
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.text(item.text, startX, nextY + 0.5);
        
        const w = doc.getTextWidth(item.text);
        doc.link(startX, nextY - 2.5, w, 4, { url: item.url });
        
        startX += w;
        if (idx < textLinks.length - 1) {
          setColor(doc, [199, 210, 254], 'text');
          doc.text('  ·  ', startX, nextY + 0.5);
          startX += doc.getTextWidth('  ·  ');
        }
      });
    }
  }

  y = headerHeight + 10; // offset for the main body


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
      `Enhanced by ProfileX AI Analyzer AI  ·  Page ${i} of ${pageCount}`,
      PAGE_W / 2,
      PAGE_H - 8,
      { align: 'center' }
    );
  }

  doc.save(filename);
}
