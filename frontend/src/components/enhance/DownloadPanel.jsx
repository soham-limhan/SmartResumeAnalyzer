import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, FileType, Copy, CheckCircle2, Loader2, Sparkles, Share2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { generateEnhancedPDF } from '@/lib/enhancedPdfExport';
import { downloadEnhancedDocx } from '@/lib/api';

export default function DownloadPanel({ enhancedResume, enhancementId, mode, candidateName }) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [docxLoading, setDocxLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pdfDone, setPdfDone] = useState(false);
  const [docxDone, setDocxDone] = useState(false);

  // New State for Social Links Integration on download
  const [exportMode, setExportMode] = useState('compact');
  const [socialLinks, setSocialLinks] = useState([]);

  const safeName = (candidateName || 'resume').replace(/\s+/g, '_').toLowerCase();

  // Load social links from cache
  useEffect(() => {
    const cachedLinks = localStorage.getItem('smartresume-social-links');
    const cachedMode = localStorage.getItem('smartresume-social-mode');
    if (cachedLinks) {
      try {
        setSocialLinks(JSON.parse(cachedLinks));
      } catch (e) {
        console.error('Failed to parse cached social links');
      }
    }
    if (cachedMode) {
      setExportMode(cachedMode);
    }
  }, []);

  const handlePdfDownload = async () => {
    setPdfLoading(true);
    try {
      generateEnhancedPDF(enhancedResume, `${safeName}_enhanced_${mode}.pdf`, socialLinks, exportMode);
      setPdfDone(true);
      setTimeout(() => setPdfDone(false), 3000);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDocxDownload = async () => {
    if (!enhancementId) return;
    setDocxLoading(true);
    try {
      await downloadEnhancedDocx(enhancementId, mode, socialLinks, exportMode);
      setDocxDone(true);
      setTimeout(() => setDocxDone(false), 3000);
    } catch (err) {
      console.error('DOCX download failed:', err);
    } finally {
      setDocxLoading(false);
    }
  };

  const handleCopyText = async () => {
    if (!enhancedResume) return;
    const lines = [];
    if (enhancedResume.candidate_name) lines.push(enhancedResume.candidate_name.toUpperCase(), '');
    if (enhancedResume.contact_info) lines.push(enhancedResume.contact_info, '');

    // Add active links to plain text
    const active = socialLinks.filter(l => l.is_enabled && l.url);
    if (active.length > 0) {
      const linksStr = active.map(l => `${l.platform.toUpperCase()}: ${l.url.replace(/^https?:\/\/(www\.)?/, '')}`).join('  ·  ');
      lines.push(linksStr, '');
    }

    const summary = enhancedResume.professional_summary?.enhanced;
    if (summary) { lines.push('PROFESSIONAL SUMMARY', '─'.repeat(40), summary, ''); }

    (enhancedResume.experience_sections || []).forEach((exp) => {
      lines.push(`${exp.title}  |  ${exp.company}  ·  ${exp.duration}`);
      (exp.enhanced_bullets || exp.original_bullets || []).forEach((b) => lines.push(`• ${b}`));
      lines.push('');
    });

    (enhancedResume.projects_sections || []).forEach((p) => {
      lines.push(`PROJECT: ${p.name}`);
      if (p.enhanced || p.original) lines.push(p.enhanced || p.original);
      lines.push('');
    });

    const skills = enhancedResume.skills_section?.enhanced || enhancedResume.skills_section?.original || [];
    if (skills.length) { lines.push('SKILLS', skills.join(' · '), ''); }

    await navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const modeLabels = {
    professional: 'Professional',
    technical: 'Technical',
    executive: 'Executive',
    fresher: 'Fresher',
  };

  const activeLinks = socialLinks.filter(l => l.is_enabled && l.url);

  return (
    <div className="space-y-5">
      {/* Header Panel */}
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg flex-shrink-0">
          <Download className="w-4.5 h-4.5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-heading font-bold text-foreground">Download Enhanced Resume</h3>
          <p className="text-xs text-muted-foreground">
            Mode: <span className="text-indigo-400 font-medium">{modeLabels[mode] || mode}</span>
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/12 border border-emerald-500/20">
          <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span className="text-[10px] font-semibold text-emerald-400">AI Enhanced</span>
        </div>
      </div>

      {/* Social Links on-the-fly export mode selector */}
      {activeLinks.length > 0 && (
        <div className="p-3 rounded-2xl bg-white/3 border border-white/6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
              <Share2 className="w-3.5 h-3.5 text-indigo-400" />
              Social Link Export Format
            </span>
            <Badge variant="secondary" className="text-[9.5px] font-semibold px-2 py-0.5 rounded-lg border-white/6 bg-white/5 text-indigo-400">
              {activeLinks.length} Links Active
            </Badge>
          </div>

          {/* visual buttons */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: 'compact', label: 'Compact' },
              { id: 'expanded', label: 'Expanded' },
              { id: 'icon_only', label: 'Icon Only' },
              { id: 'ats_safe', label: 'ATS Safe' }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => {
                  setExportMode(m.id);
                  localStorage.setItem('smartresume-social-mode', m.id);
                }}
                className={`py-1.5 px-2 rounded-lg border text-[10.5px] font-bold transition-all text-center
                  ${exportMode === m.id
                    ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400 shadow-md'
                    : 'border-white/6 bg-white/2 text-muted-foreground/60 hover:text-foreground'}`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Micro-visual mockups */}
          <div className="p-2 rounded-xl bg-black/20 border border-white/4 flex flex-col items-center justify-center min-h-[44px]">
            <span className="text-[9px] text-muted-foreground/40 font-bold uppercase tracking-wider block mb-1.5 flex items-center gap-1">
              <Eye className="w-3 h-3" /> Visual Placement Preview
            </span>

            {/* compact mockup */}
            {exportMode === 'compact' && (
              <div className="flex items-center gap-1.5 text-[8.5px] text-white/70 font-mono">
                <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-indigo-500/50 text-[6px] text-white font-bold">LI</span>
                <span>LinkedIn</span>
                <span className="text-white/20">|</span>
                <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-slate-800 text-[6px] text-white font-bold">GH</span>
                <span>GitHub</span>
              </div>
            )}

            {/* expanded mockup */}
            {exportMode === 'expanded' && (
              <div className="grid grid-cols-2 gap-1.5 w-full max-w-[240px]">
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/10 text-[7px] text-white/80 font-mono">
                  <span className="inline-flex items-center justify-center w-2.5 h-2.5 rounded-full bg-indigo-500/50 text-[5px] text-white font-bold">LI</span>
                  <span className="truncate">LI: linkedin.com/in/...</span>
                </div>
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/10 text-[7px] text-white/80 font-mono">
                  <span className="inline-flex items-center justify-center w-2.5 h-2.5 rounded-full bg-slate-800 text-[5px] text-white font-bold">GH</span>
                  <span className="truncate">GH: github.com/...</span>
                </div>
              </div>
            )}

            {/* icon_only mockup */}
            {exportMode === 'icon_only' && (
              <div className="flex items-center gap-2">
                <span className="w-4.5 h-4.5 rounded-full bg-[#0077b5] text-white text-[7px] font-bold flex items-center justify-center shadow">LI</span>
                <span className="w-4.5 h-4.5 rounded-full bg-[#24292e] text-white text-[7px] font-bold flex items-center justify-center shadow">GH</span>
                <span className="w-4.5 h-4.5 rounded-full bg-[#4f46e5] text-white text-[7px] font-bold flex items-center justify-center shadow">PT</span>
              </div>
            )}

            {/* ats_safe mockup */}
            {exportMode === 'ats_safe' && (
              <div className="text-[8px] text-muted-foreground font-mono truncate max-w-[260px]">
                linkedin.com/in/candidate  ·  github.com/candidate
              </div>
            )}
          </div>
        </div>
      )}

      {/* Download Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* PDF */}
        <motion.button
          id="download-pdf-btn"
          onClick={handlePdfDownload}
          disabled={pdfLoading}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.97 }}
          className="relative flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600
            text-white font-semibold text-sm shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40
            transition-all disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent
            -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />

          {pdfLoading ? (
            <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
          ) : pdfDone ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-300" />
            </motion.div>
          ) : (
            <FileText className="w-5 h-5 flex-shrink-0" />
          )}

          <div className="text-left">
            <p className="text-sm font-bold leading-none">
              {pdfDone ? 'Downloaded!' : pdfLoading ? 'Generating...' : 'Download PDF'}
            </p>
            <p className="text-xs text-white/70 mt-0.5">Styled · ATS-ready</p>
          </div>
        </motion.button>

        {/* DOCX */}
        <motion.button
          id="download-docx-btn"
          onClick={handleDocxDownload}
          disabled={docxLoading || !enhancementId}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.97 }}
          className="relative flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/12
            text-foreground font-semibold text-sm hover:border-indigo-500/30 hover:bg-indigo-500/5
            transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/4 to-transparent
            -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />

          {docxLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-indigo-400 flex-shrink-0" />
          ) : docxDone ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            </motion.div>
          ) : (
            <FileType className="w-5 h-5 text-indigo-400 flex-shrink-0" />
          )}

          <div className="text-left">
            <p className="text-sm font-bold leading-none">
              {docxDone ? 'Downloaded!' : docxLoading ? 'Generating...' : 'Download DOCX'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Editable Word format</p>
          </div>
        </motion.button>
      </div>

      {/* Copy Plain Text */}
      <button
        id="copy-text-btn"
        onClick={handleCopyText}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/8
          bg-white/2 hover:bg-white/5 hover:border-white/16 transition-all text-xs text-muted-foreground
          hover:text-foreground font-medium"
      >
        {copied ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400">Copied to clipboard!</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" />
            Copy plain text to clipboard
          </>
        )}
      </button>

      {/* Explanatory labels */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        {[
          { label: 'PDF', note: 'Branded links will be fully clickable in exported PDF', color: 'text-indigo-400' },
          { label: 'Word', note: 'Formatted hyperlinks will compile cleanly in DOCX layout', color: 'text-violet-400' },
        ].map((item) => (
          <div key={item.label} className="p-2.5 rounded-lg bg-white/2 border border-white/6">
            <p className={`text-[10px] font-bold ${item.color} mb-0.5`}>{item.label}</p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">{item.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
