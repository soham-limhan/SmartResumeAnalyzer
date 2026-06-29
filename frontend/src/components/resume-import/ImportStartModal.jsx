import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Upload, Sparkles, ArrowRight, Zap } from 'lucide-react';

/**
 * ImportStartModal
 * 
 * Entry modal shown at the top of the Resume Builder. Presents two options:
 *   1. Create Resume from Scratch (dismisses modal)
 *   2. Import Existing Resume    (triggers the upload flow)
 */
export default function ImportStartModal({ isOpen, onScratch, onImport }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(0,0,0,0.65)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="relative w-full max-w-2xl"
          >
            {/* Glow accent */}
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/30 via-violet-500/20 to-transparent blur-xl opacity-60 pointer-events-none" />

            <div
              className="relative rounded-2xl border border-border/60 shadow-2xl overflow-hidden"
              style={{ background: 'var(--color-card)' }}
            >
              {/* Header */}
              <div className="px-8 pt-8 pb-6 text-center border-b border-border/40">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold text-primary tracking-wide">Resume Builder</span>
                </div>
                <h2 className="text-2xl font-bold text-foreground leading-tight">
                  How would you like to start?
                </h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                  Start from scratch for full control, or import your existing resume to populate the builder instantly.
                </p>
              </div>

              {/* Options */}
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Option 1 — Scratch */}
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onScratch}
                  className="group relative flex flex-col items-start gap-3 p-5 rounded-xl border border-border/60 hover:border-border transition-all duration-200 text-left cursor-pointer"
                  style={{ background: 'var(--color-secondary)' }}
                >
                  <div className="w-11 h-11 rounded-xl bg-muted/60 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <FileText className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-sm">Create from Scratch</div>
                    <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Start with a blank template and fill in each section manually.
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground/60 mt-auto">
                    <span>Get started</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </motion.button>

                {/* Option 2 — Import */}
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onImport}
                  className="group relative flex flex-col items-start gap-3 p-5 rounded-xl border border-primary/40 hover:border-primary text-left cursor-pointer overflow-hidden transition-all duration-200"
                  style={{ background: 'color-mix(in srgb, var(--color-primary) 6%, var(--color-card))' }}
                >
                  {/* Subtle background shimmer */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                  <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
                    <Upload className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground text-sm">Import Existing Resume</span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                        <Zap className="w-2.5 h-2.5" />
                        AI
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Upload a PDF or DOCX. AI extracts and maps all your data automatically.
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-primary/70 mt-auto">
                    <span>Upload file</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </motion.button>
              </div>

              {/* Footer note */}
              <div className="px-6 pb-5 text-center">
                <p className="text-[11px] text-muted-foreground/50">
                  Your resume data is never shared. Import populates the form — you review everything before saving.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
