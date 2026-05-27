import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Sparkles, ArrowRight } from 'lucide-react';

function DiffBullet({ original, enhanced, index }) {
  const changed = original !== enhanced;
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="grid grid-cols-2 gap-3"
    >
      {/* Original */}
      <div className="flex items-start gap-2 p-2.5 rounded-xl bg-red-500/5 border border-red-500/12">
        <div className="w-1.5 h-1.5 rounded-full bg-red-400/60 flex-shrink-0 mt-1.5" />
        <p className="text-xs text-muted-foreground leading-relaxed line-through decoration-red-400/40">
          {original}
        </p>
      </div>
      {/* Enhanced */}
      <div className="flex items-start gap-2 p-2.5 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 mt-1.5" />
        <p className="text-xs text-foreground leading-relaxed font-medium">
          {enhanced}
        </p>
        {changed && (
          <Sparkles className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
        )}
      </div>
    </motion.div>
  );
}

function ImprovementNote({ note }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-400 font-medium">
      <Sparkles className="w-2.5 h-2.5" />
      {note}
    </span>
  );
}

// ─── Experience Section Card ──────────────────────────────────────────────────

export function ExperienceBeforeAfter({ section, index }) {
  const [expanded, setExpanded] = useState(index === 0);

  const originals = section.original_bullets || [];
  const enhanced = section.enhanced_bullets || originals;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="rounded-2xl border border-white/8 overflow-hidden bg-white/2"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/3 transition-colors text-left"
      >
        <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-indigo-400">{index + 1}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {section.title || 'Work Experience'}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {[section.company, section.duration].filter(Boolean).join('  ·  ')}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] bg-emerald-500/12 text-emerald-400 border border-emerald-500/20 rounded-full px-2 py-0.5 font-semibold">
            {enhanced.length} bullets
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-3">
              {/* Column headers */}
              <div className="grid grid-cols-2 gap-3 mb-1">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-red-400/70">
                  <div className="w-2 h-2 rounded-full bg-red-400/60" />
                  Original
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  AI Enhanced
                </div>
              </div>

              {enhanced.map((bullet, i) => (
                <DiffBullet
                  key={i}
                  index={i}
                  original={originals[i] || bullet}
                  enhanced={bullet}
                />
              ))}

              {/* Improvement notes */}
              {section.improvements?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/6">
                  {section.improvements.map((note, i) => (
                    <ImprovementNote key={i} note={note} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Summary Before/After ─────────────────────────────────────────────────────

export function SummaryBeforeAfter({ section }) {
  if (!section?.enhanced) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/8 overflow-hidden bg-white/2"
    >
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <ArrowRight className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-semibold">Professional Summary</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {section.original && (
            <div className="p-3.5 rounded-xl bg-red-500/5 border border-red-500/12">
              <p className="text-[10px] font-semibold text-red-400/70 mb-2 uppercase tracking-wide">Original</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{section.original}</p>
            </div>
          )}
          <div className="p-3.5 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
            <div className="flex items-center gap-1.5 mb-2">
              <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide">AI Enhanced</p>
              <Sparkles className="w-3 h-3 text-emerald-400" />
            </div>
            <p className="text-xs text-foreground leading-relaxed">{section.enhanced}</p>
          </div>
        </div>

        {section.improvements?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/6">
            {section.improvements.map((note, i) => (
              <ImprovementNote key={i} note={note} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Skills Before/After ─────────────────────────────────────────────────────

export function SkillsBeforeAfter({ section }) {
  if (!section) return null;
  const original = section.original || [];
  const enhanced = section.enhanced || original;
  const added = section.keywords_added || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/8 overflow-hidden bg-white/2 p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <ArrowRight className="w-4 h-4 text-indigo-400" />
        <span className="text-sm font-semibold">Skills</span>
        {added.length > 0 && (
          <span className="ml-auto text-[10px] bg-indigo-500/12 text-indigo-400 border border-indigo-500/20 rounded-full px-2 py-0.5 font-semibold">
            +{added.length} keywords added
          </span>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-[10px] font-semibold text-red-400/70 mb-2 uppercase tracking-wide">Original Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {original.map((s, i) => (
              <span key={i} className="px-2.5 py-1 rounded-lg bg-white/4 border border-white/8 text-[11px] text-muted-foreground">
                {s}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold text-emerald-400 mb-2 uppercase tracking-wide">AI Enhanced Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {enhanced.map((s, i) => {
              const isNew = !original.includes(s);
              return (
                <motion.span
                  key={i}
                  initial={isNew ? { opacity: 0, scale: 0.8 } : { opacity: 1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border
                    ${isNew
                      ? 'bg-indigo-500/12 border-indigo-500/25 text-indigo-400'
                      : 'bg-emerald-500/8 border-emerald-500/20 text-emerald-400'
                    }`}
                >
                  {isNew && '+ '}{s}
                </motion.span>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Project Before/After ─────────────────────────────────────────────────────

export function ProjectBeforeAfter({ section, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="rounded-2xl border border-white/8 overflow-hidden bg-white/2 p-5"
    >
      <p className="text-sm font-semibold mb-3 flex items-center gap-2">
        <span className="w-6 h-6 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center text-[10px] font-bold text-violet-400">
          {index + 1}
        </span>
        {section.name || `Project ${index + 1}`}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {section.original && (
          <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/12">
            <p className="text-[10px] font-semibold text-red-400/70 mb-1.5 uppercase tracking-wide">Original</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{section.original}</p>
          </div>
        )}
        <div className="p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
          <div className="flex items-center gap-1.5 mb-1.5">
            <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide">Enhanced</p>
            <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
          </div>
          <p className="text-xs text-foreground leading-relaxed">{section.enhanced || section.original}</p>
        </div>
      </div>
    </motion.div>
  );
}
