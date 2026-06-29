import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, Brain } from 'lucide-react';

const PIPELINE_STEPS = [
  { id: 1, label: 'Reading document',      delay: 0    },
  { id: 2, label: 'Extracting text',       delay: 1200 },
  { id: 3, label: 'Identifying sections',  delay: 2600 },
  { id: 4, label: 'Mapping information',   delay: 4200 },
  { id: 5, label: 'Verifying extracted data', delay: 6000 },
];

/**
 * ImportProgressModal
 *
 * Animated pipeline display shown while the server is processing the resume.
 * Steps animate sequentially based on timeouts.
 * When `isDone` becomes true, all steps are shown as complete.
 *
 * Props:
 *   isOpen  {boolean}
 *   isDone  {boolean}  — set true when API response arrives
 */
export default function ImportProgressModal({ isOpen, isDone }) {
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCompletedSteps(new Set());
      setActiveStep(0);
      return;
    }

    const timers = PIPELINE_STEPS.map((step) =>
      setTimeout(() => {
        setCompletedSteps(prev => new Set([...prev, step.id]));
        setActiveStep(step.id + 1);
      }, step.delay)
    );

    return () => timers.forEach(clearTimeout);
  }, [isOpen]);

  // When done, immediately mark all steps complete
  useEffect(() => {
    if (isDone) {
      setCompletedSteps(new Set(PIPELINE_STEPS.map(s => s.id)));
      setActiveStep(PIPELINE_STEPS.length + 1);
    }
  }, [isDone]);

  if (!isOpen) return null;

  const progressPct = (completedSteps.size / PIPELINE_STEPS.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(0,0,0,0.75)' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 32 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
        className="relative w-full max-w-md"
      >
        {/* Glow rings */}
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -inset-6 rounded-full bg-primary/10 blur-2xl pointer-events-none"
        />

        <div
          className="relative rounded-2xl border border-border/60 shadow-2xl overflow-hidden p-8"
          style={{ background: 'var(--color-card)' }}
        >
          {/* Central brain icon with pulse */}
          <div className="flex flex-col items-center gap-5 mb-8">
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full bg-primary/20 blur-md"
              />
              <div className="relative w-16 h-16 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center">
                <Brain className="w-8 h-8 text-primary" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-foreground">Analyzing your resume</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Our AI is carefully extracting your information
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-violet-500 rounded-full"
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground/60">
              <span>Processing...</span>
              <span>{Math.round(progressPct)}%</span>
            </div>
          </div>

          {/* Pipeline steps */}
          <div className="space-y-2.5">
            {PIPELINE_STEPS.map((step) => {
              const isComplete = completedSteps.has(step.id);
              const isActive = activeStep === step.id && !isComplete;

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0.3 }}
                  animate={{ opacity: isComplete || isActive ? 1 : 0.35 }}
                  transition={{ duration: 0.4 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                    <AnimatePresence mode="wait">
                      {isComplete ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                        >
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        </motion.div>
                      ) : isActive ? (
                        <motion.div key="spin">
                          <Loader2 className="w-4 h-4 text-primary animate-spin" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="dot"
                          className="w-2 h-2 rounded-full bg-border mx-auto"
                        />
                      )}
                    </AnimatePresence>
                  </div>

                  <span
                    className={`text-sm transition-colors duration-300 ${
                      isComplete
                        ? 'text-foreground font-medium'
                        : isActive
                        ? 'text-primary font-medium'
                        : 'text-muted-foreground/50'
                    }`}
                  >
                    {step.label}
                  </span>

                  {isComplete && (
                    <motion.span
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="ml-auto text-[10px] font-semibold text-emerald-500"
                    >
                      Done
                    </motion.span>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Hint */}
          <p className="text-[11px] text-muted-foreground/40 text-center mt-6">
            This usually takes 5–10 seconds · Please don't close this window
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
