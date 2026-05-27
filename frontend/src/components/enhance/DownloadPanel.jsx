import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, FileType2, Copy, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateEnhancedPDF } from '@/lib/enhancedPdfExport';
import { downloadEnhancedDocx } from '@/lib/api';

export default function DownloadPanel({ enhancedResume, enhancementId, mode, candidateName }) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [docxLoading, setDocxLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pdfDone, setPdfDone] = useState(false);
  const [docxDone, setDocxDone] = useState(false);

  const safeName = (candidateName || 'resume').replace(/\s+/g, '_').toLowerCase();

  const handlePdfDownload = async () => {
    setPdfLoading(true);
    try {
      generateEnhancedPDF(enhancedResume, `${safeName}_enhanced_${mode}.pdf`);
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
      await downloadEnhancedDocx(enhancementId, mode);
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
    // Build plain text version
    const lines = [];
    if (enhancedResume.candidate_name) lines.push(enhancedResume.candidate_name.toUpperCase(), '');
    if (enhancedResume.contact_info) lines.push(enhancedResume.contact_info, '');

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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
          <Download className="w-4.5 h-4.5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-heading font-bold text-foreground">Download Enhanced Resume</h3>
          <p className="text-xs text-muted-foreground">
            Mode: <span className="text-indigo-400 font-medium">{modeLabels[mode] || mode}</span>
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/12 border border-emerald-500/20">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] font-semibold text-emerald-400">AI Enhanced</span>
        </div>
      </div>

      {/* Download buttons */}
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
          {/* Shimmer sweep on hover */}
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
            <FileType2 className="w-5 h-5 text-indigo-400 flex-shrink-0" />
          )}

          <div className="text-left">
            <p className="text-sm font-bold leading-none">
              {docxDone ? 'Downloaded!' : docxLoading ? 'Generating...' : 'Download DOCX'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Editable Word format</p>
          </div>
        </motion.button>
      </div>

      {/* Copy to clipboard */}
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

      {/* Format notes */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        {[
          { label: 'PDF', note: 'Best for email attachments, portals', color: 'text-indigo-400' },
          { label: 'DOCX', note: 'Best for further editing in Word', color: 'text-violet-400' },
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
