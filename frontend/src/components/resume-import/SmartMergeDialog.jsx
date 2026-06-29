import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitMerge, Check, X, ChevronRight, Layers } from 'lucide-react';

/**
 * SmartMergeDialog
 *
 * Shown when the Resume Builder already has data and the imported resume
 * has conflicting values in personal info fields.
 *
 * For each conflict the user picks:
 *   • Keep Current  — retain existing builder data
 *   • Replace       — use the imported value
 *
 * "Apply Decision to All" applies the same choice to every unresolved conflict.
 *
 * Props:
 *   isOpen      {boolean}
 *   conflicts   {Array}    — from detectConflicts()
 *   onResolve   {(decisions: Object) => void}  — called with { 'section.field': 'keep'|'replace' }
 *   onCancel    {() => void}
 */
export default function SmartMergeDialog({ isOpen, conflicts = [], onResolve, onCancel }) {
  const [decisions, setDecisions] = useState({});

  const setDecision = (key, action) => {
    setDecisions(prev => ({ ...prev, [key]: action }));
  };

  const applyToAll = (action) => {
    const all = {};
    conflicts.forEach(c => { all[`${c.section}.${c.field}`] = action; });
    setDecisions(all);
  };

  const allResolved = conflicts.every(
    c => decisions[`${c.section}.${c.field}`] !== undefined
  );

  const handleConfirm = () => {
    // Any unresolved defaults to 'keep'
    const final = {};
    conflicts.forEach(c => {
      const key = `${c.section}.${c.field}`;
      final[key] = decisions[key] || 'keep';
    });
    onResolve(final);
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
          style={{ backdropFilter: 'blur(14px)', backgroundColor: 'rgba(0,0,0,0.72)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.90, y: 28 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.90, y: 28 }}
            transition={{ type: 'spring', stiffness: 290, damping: 24 }}
            className="relative w-full max-w-2xl max-h-[90vh] flex flex-col"
          >
            {/* Glow */}
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent blur-xl opacity-60 pointer-events-none" />

            <div
              className="relative rounded-2xl border border-border/60 shadow-2xl overflow-hidden flex flex-col"
              style={{ background: 'var(--color-card)' }}
            >
              {/* Header */}
              <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-border/40 shrink-0">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <GitMerge className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">Smart Merge</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Your resume already has data. Choose which version to keep for each conflicting field.
                    </p>
                  </div>
                </div>
                <button
                  onClick={onCancel}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Apply to all buttons */}
              <div className="px-6 py-3 border-b border-border/30 flex items-center gap-2 bg-muted/20 shrink-0">
                <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Apply to all conflicts:</span>
                <button
                  onClick={() => applyToAll('keep')}
                  className="px-2.5 py-1 rounded-md text-xs font-semibold bg-muted/60 hover:bg-muted text-foreground transition-colors"
                >
                  Keep All Current
                </button>
                <button
                  onClick={() => applyToAll('replace')}
                  className="px-2.5 py-1 rounded-md text-xs font-semibold bg-primary/15 hover:bg-primary/25 text-primary transition-colors"
                >
                  Replace All with Imported
                </button>
              </div>

              {/* Conflict list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {conflicts.map((conflict) => {
                  const key = `${conflict.section}.${conflict.field}`;
                  const decision = decisions[key];

                  return (
                    <motion.div
                      key={key}
                      layout
                      className={`rounded-xl border p-4 transition-colors ${
                        decision
                          ? 'border-emerald-500/30 bg-emerald-500/4'
                          : 'border-border/50 bg-card'
                      }`}
                    >
                      {/* Field label */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          {conflict.label}
                        </span>
                        {decision && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            decision === 'keep'
                              ? 'bg-muted text-muted-foreground'
                              : 'bg-primary/15 text-primary'
                          }`}>
                            {decision === 'keep' ? 'Keeping current' : 'Using imported'}
                          </span>
                        )}
                      </div>

                      {/* Side-by-side comparison */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Current */}
                        <button
                          onClick={() => setDecision(key, 'keep')}
                          className={`group relative flex flex-col gap-1.5 p-3 rounded-lg border text-left transition-all ${
                            decision === 'keep'
                              ? 'border-emerald-500 bg-emerald-500/8 ring-1 ring-emerald-500/30'
                              : 'border-border/60 hover:border-border hover:bg-muted/30'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                              Current Resume
                            </span>
                            {decision === 'keep' && (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            )}
                          </div>
                          <p className="text-sm text-foreground font-medium leading-snug break-words">
                            {conflict.current}
                          </p>
                        </button>

                        {/* Imported */}
                        <button
                          onClick={() => setDecision(key, 'replace')}
                          className={`group relative flex flex-col gap-1.5 p-3 rounded-lg border text-left transition-all ${
                            decision === 'replace'
                              ? 'border-primary bg-primary/8 ring-1 ring-primary/30'
                              : 'border-border/60 hover:border-border hover:bg-muted/30'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                              Imported Resume
                            </span>
                            {decision === 'replace' && (
                              <Check className="w-3.5 h-3.5 text-primary" />
                            )}
                          </div>
                          <p className="text-sm text-foreground font-medium leading-snug break-words">
                            {conflict.imported}
                          </p>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-border/40 flex items-center gap-3 shrink-0">
                <div className="flex-1 text-xs text-muted-foreground/60">
                  {allResolved
                    ? '✓ All conflicts resolved'
                    : `${Object.keys(decisions).length}/${conflicts.length} resolved`}
                </div>
                <button
                  onClick={onCancel}
                  className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                >
                  Cancel Import
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-md shadow-primary/25"
                >
                  Apply & Review
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
