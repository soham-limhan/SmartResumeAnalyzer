import jsPDF from 'jspdf';

const COLORS = {
  primary:    [37, 99, 235],   // Royal Blue (#2563eb)
  dark:       [17, 24, 39],    // Slate-900
  mid:        [55, 65, 81],    // Slate-700
  muted:      [107, 114, 128], // Gray-500
  light:      [243, 244, 246], // Gray-100
  white:      [255, 255, 255],
  divider:    [229, 231, 235], // Gray-200
};

const FONT_SIZES = {
  name:       20,
  title:      11,
  contact:    9,
  sectionH:   10,
  jobTitle:   10,
  company:    9.5,
  body:       9,
  bullet:     9,
  footer:     7.5,
};

const PAGE_W  = 210; // A4 mm
const PAGE_H  = 297;
const MARGIN  = 18;
const COL_W   = PAGE_W - MARGIN * 2;

function setColor(doc, rgb, type = 'text') {
  if (type === 'text') doc.setTextColor(...rgb);
  else if (type === 'fill') doc.setFillColor(...rgb);
  else doc.setDrawColor(...rgb);
}

function wrapText(doc, text, maxWidth) {
  if (!text) return [];
  return doc.splitTextToSize(text, maxWidth);
}

function sectionHeader(doc, y, title) {
  // Divider line above header
  setColor(doc, COLORS.divider, 'draw');
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, MARGIN + COL_W, y);
  
  y += 5;

  setColor(doc, COLORS.primary, 'text');
  doc.setFontSize(FONT_SIZES.sectionH);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), MARGIN, y);

  return y + 5;
}

function bulletPoint(doc, y, text, indent = 4) {
  const maxW = COL_W - indent - 4;
  const lines = wrapText(doc, text, maxW);

  // Bullet marker
  setColor(doc, COLORS.primary, 'fill');
  doc.circle(MARGIN + indent - 1.5, y + 1.2, 0.6, 'F');

  setColor(doc, COLORS.mid, 'text');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(FONT_SIZES.bullet);
  doc.text(lines, MARGIN + indent + 1.5, y);

  return y + lines.length * 4.5 + 1.5;
}

function checkPageBreak(doc, y, needed = 18) {
  if (y + needed > PAGE_H - 15) {
    doc.addPage();
    return 18;
  }
  return y;
}

export function exportBuilderResumePDF(resumeData, filename = 'resume.pdf') {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  doc.setFont('helvetica');

  const {
    personalInfo = {},
    education = [],
    experience = [],
    skills = { technical: [], soft: [], languages: [], certifications: [] },
    projects = [],
  } = resumeData;

  let y = 16;

  // ── Header Section ──────────────────────────────────────────────────────────
  setColor(doc, COLORS.dark, 'text');
  doc.setFontSize(FONT_SIZES.name);
  doc.setFont('helvetica', 'bold');
  const fullName = personalInfo.fullName || 'Candidate Name';
  const nameW = doc.getTextWidth(fullName);
  doc.text(fullName, (PAGE_W - nameW) / 2, y);
  y += 5.5;

  if (personalInfo.professionalTitle) {
    setColor(doc, COLORS.primary, 'text');
    doc.setFontSize(FONT_SIZES.title);
    doc.setFont('helvetica', 'normal');
    const titleW = doc.getTextWidth(personalInfo.professionalTitle);
    doc.text(personalInfo.professionalTitle, (PAGE_W - titleW) / 2, y);
    y += 5;
  }

  // Contacts
  const contactParts = [
    personalInfo.email,
    personalInfo.phone,
    personalInfo.location,
    personalInfo.linkedin && `linkedin.com/in/${personalInfo.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '')}`,
    personalInfo.github && `github.com/${personalInfo.github.replace(/^https?:\/\/(www\.)?github\.com\//, '')}`,
    personalInfo.portfolioWebsite && personalInfo.portfolioWebsite.replace(/^https?:\/\/(www\.)?/, ''),
  ].filter(Boolean);

  if (contactParts.length > 0) {
    setColor(doc, COLORS.muted, 'text');
    doc.setFontSize(FONT_SIZES.contact);
    doc.setFont('helvetica', 'normal');
    const contactStr = contactParts.join('   ·   ');
    const contactW = doc.getTextWidth(contactStr);
    
    // Support multi-line contact wrapping if too long
    if (contactW > COL_W) {
      const wrappedLines = wrapText(doc, contactStr, COL_W);
      wrappedLines.forEach(line => {
        const lineW = doc.getTextWidth(line);
        doc.text(line, (PAGE_W - lineW) / 2, y);
        y += 4;
      });
    } else {
      doc.text(contactStr, (PAGE_W - contactW) / 2, y);
      y += 4.5;
    }
  }
  y += 3;

  // ── Professional Summary ─────────────────────────────────────────────────────
  if (personalInfo.professionalSummary) {
    y = sectionHeader(doc, y, 'Professional Summary');
    setColor(doc, COLORS.mid, 'text');
    doc.setFontSize(FONT_SIZES.body);
    doc.setFont('helvetica', 'normal');
    const lines = wrapText(doc, personalInfo.professionalSummary, COL_W);
    doc.text(lines, MARGIN, y);
    y += lines.length * 4.5 + 6;
  }

  // ── Work Experience ──────────────────────────────────────────────────────────
  if (experience.length > 0) {
    y = checkPageBreak(doc, y, 22);
    y = sectionHeader(doc, y, 'Work Experience');

    experience.forEach((exp) => {
      y = checkPageBreak(doc, y, 16);

      // Title & Company
      setColor(doc, COLORS.dark, 'text');
      doc.setFontSize(FONT_SIZES.jobTitle);
      doc.setFont('helvetica', 'bold');
      const companyInfo = exp.company ? ` at ${exp.company}` : '';
      doc.text(`${exp.jobTitle}${companyInfo}`, MARGIN, y);

      // Date Range (right-aligned)
      const dateText = `${exp.startDate} – ${exp.endDate || (exp.current ? 'Present' : '')}`;
      setColor(doc, COLORS.muted, 'text');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const dateW = doc.getTextWidth(dateText);
      doc.text(dateText, MARGIN + COL_W - dateW, y);
      y += 4.5;

      // Location
      if (exp.location) {
        setColor(doc, COLORS.muted, 'text');
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'italic');
        doc.text(exp.location, MARGIN, y);
        y += 4;
      }

      // Responsibilities Bullets
      if (exp.responsibilities) {
        const bulletList = exp.responsibilities.split('\n').filter(line => line.trim().length > 0);
        bulletList.forEach((b) => {
          y = checkPageBreak(doc, y, 8);
          y = bulletPoint(doc, y, b);
        });
      }

      // Achievements
      if (exp.achievements) {
        y = checkPageBreak(doc, y, 8);
        setColor(doc, COLORS.mid, 'text');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(FONT_SIZES.bullet);
        doc.text('Key Achievement: ', MARGIN + 4, y);
        const achX = MARGIN + 4 + doc.getTextWidth('Key Achievement: ');
        
        doc.setFont('helvetica', 'oblique');
        const achLines = wrapText(doc, exp.achievements, COL_W - (achX - MARGIN));
        doc.text(achLines, achX, y);
        y += achLines.length * 4.5 + 1;
      }

      y += 3;
    });
    y += 3;
  }

  // ── Projects ────────────────────────────────────────────────────────────────
  if (projects.length > 0) {
    y = checkPageBreak(doc, y, 22);
    y = sectionHeader(doc, y, 'Projects');

    projects.forEach((proj) => {
      y = checkPageBreak(doc, y, 14);

      // Project Name
      setColor(doc, COLORS.dark, 'text');
      doc.setFontSize(FONT_SIZES.jobTitle);
      doc.setFont('helvetica', 'bold');
      doc.text(proj.projectName, MARGIN, y);

      // Demo/Git links (right-aligned)
      const linkParts = [
        proj.githubLink && 'GitHub',
        proj.liveDemoLink && 'Live Demo'
      ].filter(Boolean);
      if (linkParts.length > 0) {
        setColor(doc, COLORS.primary, 'text');
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        const linksStr = linkParts.join('  |  ');
        const linkW = doc.getTextWidth(linksStr);
        doc.text(linksStr, MARGIN + COL_W - linkW, y);
      }
      y += 4.5;

      // Tech Stack
      if (proj.technologies && proj.technologies.length > 0) {
        setColor(doc, COLORS.muted, 'text');
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        const techStr = `Technologies: ${proj.technologies.join(', ')}`;
        doc.text(techStr, MARGIN, y);
        y += 4;
      }

      // Description
      if (proj.description) {
        y = checkPageBreak(doc, y, 10);
        setColor(doc, COLORS.mid, 'text');
        doc.setFontSize(FONT_SIZES.body);
        const descLines = wrapText(doc, proj.description, COL_W);
        doc.text(descLines, MARGIN, y);
        y += descLines.length * 4.5;
      }
      y += 3;
    });
    y += 3;
  }

  // ── Education ───────────────────────────────────────────────────────────────
  if (education.length > 0) {
    y = checkPageBreak(doc, y, 22);
    y = sectionHeader(doc, y, 'Education');

    education.forEach((edu) => {
      y = checkPageBreak(doc, y, 12);

      setColor(doc, COLORS.dark, 'text');
      doc.setFontSize(FONT_SIZES.jobTitle);
      doc.setFont('helvetica', 'bold');
      doc.text(edu.degree, MARGIN, y);

      const eduDateText = `${edu.startDate} – ${edu.endDate}`;
      setColor(doc, COLORS.muted, 'text');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const dateW = doc.getTextWidth(eduDateText);
      doc.text(eduDateText, MARGIN + COL_W - dateW, y);
      y += 4.5;

      setColor(doc, COLORS.mid, 'text');
      doc.setFontSize(FONT_SIZES.body);
      const schoolGpa = `${edu.institution}${edu.gpa ? `  ·  GPA: ${edu.gpa}` : ''}`;
      doc.text(schoolGpa, MARGIN, y);
      y += 4;

      if (edu.description) {
        y = checkPageBreak(doc, y, 10);
        setColor(doc, COLORS.muted, 'text');
        doc.setFontSize(8.5);
        const descLines = wrapText(doc, edu.description, COL_W);
        doc.text(descLines, MARGIN, y);
        y += descLines.length * 4.5;
      }
      y += 3.5;
    });
    y += 2;
  }

  // ── Skills ──────────────────────────────────────────────────────────────────
  const skillCategories = [
    { label: 'Technical Skills', list: skills.technical },
    { label: 'Soft Skills', list: skills.soft },
    { label: 'Languages', list: skills.languages },
    { label: 'Certifications', list: skills.certifications },
  ].filter(cat => cat.list && cat.list.length > 0);

  if (skillCategories.length > 0) {
    y = checkPageBreak(doc, y, 22);
    y = sectionHeader(doc, y, 'Skills & Credentials');

    skillCategories.forEach((cat) => {
      y = checkPageBreak(doc, y, 10);
      setColor(doc, COLORS.dark, 'text');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(FONT_SIZES.body);
      doc.text(`${cat.label}: `, MARGIN, y);
      
      const labelW = doc.getTextWidth(`${cat.label}: `);
      setColor(doc, COLORS.mid, 'text');
      doc.setFont('helvetica', 'normal');
      const itemsStr = cat.list.join(', ');
      const valLines = wrapText(doc, itemsStr, COL_W - labelW);
      doc.text(valLines, MARGIN + labelW, y);
      y += valLines.length * 4.5 + 1.5;
    });
  }

  // Footer page counts
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    setColor(doc, COLORS.muted, 'text');
    doc.setFontSize(FONT_SIZES.footer);
    doc.setFont('helvetica', 'italic');
    doc.text(
      `Generated by SmartResume Builder  ·  Page ${i} of ${pageCount}`,
      PAGE_W / 2,
      PAGE_H - 10,
      { align: 'center' }
    );
  }

  doc.save(filename);
}
