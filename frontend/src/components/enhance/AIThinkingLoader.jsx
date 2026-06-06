import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles, Zap, FileSearch, Wand2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const AI_MESSAGES = [
  { icon: FileSearch, text: 'Parsing resume structure and sections...' },
  { icon: Brain,      text: 'Analyzing content quality and impact...' },
  { icon: Sparkles,   text: 'Rewriting bullet points with action verbs...' },
  { icon: Zap,        text: 'Adding quantified metrics and context...' },
  { icon: Wand2,      text: 'Optimizing ATS keywords and phrases...' },
  { icon: Brain,      text: 'Enhancing professional tone and clarity...' },
  { icon: Sparkles,   text: 'Polishing final resume for maximum impact...' },
];

const PARTICLES = [
  { delay: 0.0, x: 25, y: 35 },
  { delay: 0.2, x: 70, y: 45 },
  { delay: 0.4, x: 45, y: 75 },
  { delay: 0.6, x: 85, y: 25 },
  { delay: 0.8, x: 15, y: 65 },
  { delay: 1.0, x: 60, y: 55 },
  { delay: 1.2, x: 30, y: 80 },
  { delay: 1.4, x: 50, y: 20 },
  { delay: 1.6, x: 90, y: 70 },
  { delay: 1.8, x: 10, y: 40 },
  { delay: 2.0, x: 75, y: 60 },
  { delay: 2.2, x: 35, y: 50 },
];

// Particle component for background shimmer
function Particle({ delay, x, y }) {
  return (
    <motion.div
      className="absolute w-1 h-1 rounded-full bg-indigo-400/30"
      style={{ left: `${x}%`, top: `${y}%` }}
      animate={{
        opacity: [0, 0.8, 0],
        scale: [0, 1.5, 0],
        y: [0, -30, -60],
      }}
      transition={{
        duration: 2.5,
        delay,
        repeat: Infinity,
        ease: 'easeOut',
      }}
    />
  );
}

// Orbiting ring element
function OrbitRing({ radius, duration, delay, color }) {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      animate={{ rotate: 360 }}
      transition={{ duration, delay, repeat: Infinity, ease: 'linear' }}
    >
      <div
        className="absolute rounded-full border"
        style={{
          width: radius * 2,
          height: radius * 2,
          borderColor: color,
          opacity: 0.2,
        }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 6,
          height: 6,
          background: color,
          top: `calc(50% - ${radius}px - 3px)`,
          left: 'calc(50% - 3px)',
          opacity: 0.7,
        }}
        animate={{ scale: [1, 1.5, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
    </motion.div>
  );
}

export default function AIThinkingLoader({ mode = 'professional' }) {
  const [msgIdx, setMsgIdx] = useState(0);

  const modeColors = {
    professional: { primary: '#818cf8', secondary: '#a78bfa', bg: 'from-indigo-900/40 to-violet-900/40' },
    technical:    { primary: '#22d3ee', secondary: '#38bdf8', bg: 'from-cyan-900/40 to-blue-900/40' },
    executive:    { primary: '#fbbf24', secondary: '#fb923c', bg: 'from-amber-900/40 to-orange-900/40' },
    fresher:      { primary: '#34d399', secondary: '#2dd4bf', bg: 'from-emerald-900/40 to-teal-900/40' },
  };
  const colors = modeColors[mode] || modeColors.professional;

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % AI_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = AI_MESSAGES[msgIdx].icon;

  return (
    <div className={`relative flex flex-col items-center justify-center py-16 px-6 overflow-hidden bg-gradient-to-br ${colors.bg} rounded-2xl`}>
      {/* Background particles */}
      {PARTICLES.map((p, i) => (
        <Particle key={i} delay={p.delay} x={p.x} y={p.y} />
      ))}

      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${colors.primary}15 0%, transparent 70%)`,
        }}
      />

      {/* Center icon with orbit rings */}
      <div className="relative w-28 h-28 mb-8">
        <OrbitRing radius={54} duration={6}  delay={0}   color={colors.primary} />
        <OrbitRing radius={40} duration={4}  delay={0.5} color={colors.secondary} />
        <OrbitRing radius={28} duration={3}  delay={1}   color={colors.primary} />

        {/* Core brain icon */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl"
            style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
          >
            <Brain className="w-8 h-8 text-white" />
          </div>
        </motion.div>
      </div>

      {/* Main label */}
      <motion.h3
        className="text-lg font-heading font-bold text-foreground mb-2 text-center"
        animate={{ opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        AI is enhancing your resume
      </motion.h3>

      {/* Cycling AI messages */}
      <div className="h-8 flex items-center justify-center mb-6 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={msgIdx}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <CurrentIcon className="w-4 h-4 flex-shrink-0" style={{ color: colors.primary }} />
            {AI_MESSAGES[msgIdx].text}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      <div className="w-64 h-1.5 bg-white/8 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})` }}
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <p className="text-[11px] text-muted-foreground/50 mt-4 text-center">
        This may take 30–60 seconds · Do not close this tab
      </p>
    </div>
  );
}
