import { motion } from 'framer-motion';

/**
 * AIScanAnimation — visual AI scanning effect shown during file analysis.
 */
export default function AIScanAnimation({ label = 'AI is analyzing your resume...', sublabel = 'Processing resume content' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-8">
      {/* Pulsing rings */}
      <div className="relative w-24 h-24 flex items-center justify-center">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-primary/20"
            style={{ inset: `${i * -18}px` }}
            animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.15, 0.5] }}
            transition={{ duration: 2.4, delay: i * 0.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}

        {/* Core icon */}
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center relative overflow-hidden">
          {/* Scan line */}
          <motion.div
            className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/55 to-transparent"
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />

          {/* AI icon (SVG brain) */}
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-primary" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
          </svg>
        </div>
      </div>

      {/* Text */}
      <div className="text-center space-y-1">
        <motion.p
          className="text-sm font-semibold text-foreground"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {label}
        </motion.p>
        <p className="text-xs text-muted-foreground">{sublabel}</p>
      </div>

      {/* Animated dots */}
      <div className="flex items-center gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-primary"
            animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1.2, delay: i * 0.15, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* Stage labels */}
      <div className="flex items-center gap-2">
        {['Parsing', 'Analyzing', 'Scoring', 'Generating'].map((stage, i) => (
          <motion.div
            key={stage}
            className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 3, delay: i * 0.6, repeat: Infinity }}
          >
            <div className="w-1 h-1 rounded-full bg-current" />
            {stage}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
