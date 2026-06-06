import { motion } from 'framer-motion';
import { Briefcase, Code2, Crown, GraduationCap, Check } from 'lucide-react';

const MODES = [
  {
    id: 'professional',
    label: 'Professional',
    subtitle: 'Corporate & ATS',
    description: 'Clean, polished corporate language with powerful action verbs and quantified results.',
    icon: Briefcase,
    gradient: 'bg-primary text-primary-foreground',
    glow: 'shadow-primary/5',
    border: 'border-primary/30',
    bg: 'bg-primary/5 dark:bg-primary/10',
    tag: 'Most Popular',
    tagColor: 'bg-primary/10 text-primary border-primary/20',
    perks: ['Strong action verbs', 'Quantified achievements', 'ATS keyword optimization'],
  },
  {
    id: 'technical',
    label: 'Technical',
    subtitle: 'Engineering & Data',
    description: 'Highlights technical depth, system scale, tooling, and engineering impact.',
    icon: Code2,
    gradient: 'bg-blue-600 text-white',
    glow: 'shadow-blue-600/5',
    border: 'border-blue-600/30',
    bg: 'bg-blue-600/5 dark:bg-blue-600/10',
    tag: 'For Engineers',
    tagColor: 'bg-blue-600/10 text-blue-600 dark:text-blue-400 border-blue-600/20',
    perks: ['System scale metrics', 'Tech stack specificity', 'Architecture language'],
  },
  {
    id: 'executive',
    label: 'Executive',
    subtitle: 'Leadership & Strategy',
    description: 'Board-level language focused on business outcomes, P&L impact, and strategic leadership.',
    icon: Crown,
    gradient: 'bg-slate-700 text-white dark:bg-slate-800',
    glow: 'shadow-slate-700/5',
    border: 'border-slate-700/30 dark:border-slate-600/30',
    bg: 'bg-slate-700/5 dark:bg-slate-700/10',
    tag: 'Leadership Roles',
    tagColor: 'bg-slate-700/10 text-slate-700 dark:text-slate-400 border-slate-700/20',
    perks: ['Business outcome focus', 'P&L and ROI language', 'Stakeholder framing'],
  },
  {
    id: 'fresher',
    label: 'Fresher',
    subtitle: 'Students & Entry-Level',
    description: 'Maximizes project impact, internships, and academic achievements for fresh graduates.',
    icon: GraduationCap,
    gradient: 'bg-emerald-600 text-white',
    glow: 'shadow-emerald-600/5',
    border: 'border-emerald-600/30',
    bg: 'bg-emerald-600/5 dark:bg-emerald-600/10',
    tag: 'Campus Placement',
    tagColor: 'bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border-emerald-600/20',
    perks: ['Project enhancement', 'Transferable skills', 'Confident language'],
  },
];

export default function ModeSelector({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {MODES.map((mode, idx) => {
        const Icon = mode.icon;
        const isSelected = selected === mode.id;

        return (
          <motion.button
            key={mode.id}
            onClick={() => onSelect(mode.id)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.07, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`relative text-left p-5 rounded-2xl border transition-all duration-300
              ${isSelected
                ? `${mode.bg} ${mode.border} shadow-xl ${mode.glow}`
                : 'bg-white/3 border-white/8 hover:border-white/16 hover:bg-white/5'
              }`}
            id={`mode-${mode.id}`}
          >
            {/* Selection indicator */}
            {isSelected && (
              <motion.div
                layoutId="mode-check"
                className={`absolute top-3 right-3 w-6 h-6 rounded-full ${mode.gradient} flex items-center justify-center shadow-lg`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
              </motion.div>
            )}

            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl ${mode.gradient} flex items-center justify-center shadow-md flex-shrink-0`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <h3 className="font-heading font-bold text-sm text-foreground">{mode.label}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${mode.tagColor}`}>
                    {mode.tag}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{mode.subtitle}</p>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              {mode.description}
            </p>

            {/* Perks list */}
            <ul className="space-y-1.5">
              {mode.perks.map((perk) => (
                <li key={perk} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <div className={`w-1.5 h-1.5 rounded-full ${mode.gradient.split(' ')[0]} flex-shrink-0`} />
                  {perk}
                </li>
              ))}
            </ul>

            {/* Active glow border pulse */}
            {isSelected && (
              <motion.div
                className={`absolute inset-0 rounded-2xl pointer-events-none border-2 bg-transparent
                  ${mode.id === 'professional' ? 'border-primary/30' : ''}
                  ${mode.id === 'technical' ? 'border-blue-600/30' : ''}
                  ${mode.id === 'executive' ? 'border-slate-700/30' : ''}
                  ${mode.id === 'fresher' ? 'border-emerald-600/30' : ''}`}
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
