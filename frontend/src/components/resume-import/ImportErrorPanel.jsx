import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw, Edit3, Download, X } from 'lucide-react';

/**
 * ImportErrorPanel
 *
 * Shown when the backend import fails or returns an extraction error.
 * Provides three recovery actions:
 *   1. Retry      — reopen the upload modal
 *   2. Manual Edit — dismiss import and go to the blank builder
 *   3. Download   — download any extracted raw text for manual use
 *
 * Props:
 *   isOpen      {boolean}
 *   errorMsg    {string}          — human-readable error message from backend
 *   rawText     {string|null}     — plain text extracted before AI failure (optional)
 *   onRetry     {() => void}
 *   onManualEdit {() => void}
 *   onClose     {() => void}
 */
export default function ImportErrorPanel({ isOpen, errorMsg, rawText, onRetry, onManualEdit, onClose }) {
  const handleDownloadText = () => {
    if (!rawText) return;
    const blob = new Blob([rawText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extracted_resume_text.txt';
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(0,0,0,0.70)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 24 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="relative w-full max-w-md"
          >
            {/* Red glow */}
            <div className="absolute -inset-px rounded-2xl bg-destructive/20 blur-xl opacity-50 pointer-events-none" />

            <div
              className="relative rounded-2xl border border-destructive/30 shadow-2xl overflow-hidden"
              style={{ background: 'var(--color-card)' }}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="p-8 space-y-6">
                {/* Icon + heading */}
                <div className="flex flex-col items-center gap-4 text-center">
                  <motion.div
                    animate={{ rotate: [0, -5, 5, -5, 0] }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center"
                  >
                    <AlertTriangle className="w-8 h-8 text-destructive" />
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Extraction Failed</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      We couldn't confidently extract your information.
                    </p>
                  </div>
                </div>

                {/* Error message box */}
                <div className="px-4 py-3 rounded-xl bg-destructive/8 border border-destructive/15">
                  <p className="text-xs text-destructive leading-relaxed">
                    {errorMsg || 'An unknown error occurred during extraction.'}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="space-y-2.5">
                  {/* Retry */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onRetry}
                    className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 shadow-md shadow-primary/25 transition-all"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </motion.button>

                  {/* Manual edit */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onManualEdit}
                    className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted/50 transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
                    Continue with Manual Entry
                  </motion.button>

                  {/* Download extracted text */}
                  {rawText && (
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleDownloadText}
                      className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl border border-border/50 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      Download Extracted Text
                    </motion.button>
                  )}
                </div>

                {/* Help tip */}
                <p className="text-[11px] text-muted-foreground/40 text-center">
                  If the file is scanned or image-based, try exporting it as a text-based PDF or DOCX first.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
