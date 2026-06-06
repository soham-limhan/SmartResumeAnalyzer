import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Sparkles, CheckCircle2, Wand2, Download, Target,
  TrendingUp, BarChart3, Zap, ChevronRight, RotateCcw, AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import GlassCard from '@/components/shared/GlassCard';
import ModeSelector from '@/components/enhance/ModeSelector';
import AIThinkingLoader from '@/components/enhance/AIThinkingLoader';
import DownloadPanel from '@/components/enhance/DownloadPanel';
import {
  ExperienceBeforeAfter,
  SummaryBeforeAfter,
  SkillsBeforeAfter,
  ProjectBeforeAfter,
} from '@/components/enhance/BeforeAfterCard';
import { enhanceResume } from '@/lib/api';
import { getAnalysis } from '@/lib/api';

// ─── Step Stepper ─────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Choose Mode' },
  { id: 2, label: 'AI Enhancement' },
  { id: 3, label: 'Preview Changes' },
  { id: 4, label: 'Download' },
];

function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, idx) => {
        const isDone    = currentStep > step.id;
        const isCurrent = currentStep === step.id;
        const isAfter   = currentStep < step.id;

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                  ${isDone    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : ''}
                  ${isCurrent ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30' : ''}
                  ${isAfter   ? 'bg-white/5 text-muted-foreground/40 border border-white/8' : ''}`}
                layout
              >
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : step.id}
              </motion.div>
              <span className={`text-[10px] font-medium whitespace-nowrap hidden sm:block
                ${isCurrent ? 'text-indigo-400' : isDone ? 'text-emerald-400' : 'text-muted-foreground/40'}`}>
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`w-12 sm:w-20 h-px mx-2 mb-5 sm:mb-4 transition-all
                ${isDone ? 'bg-emerald-500/40' : 'bg-white/8'}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Score Delta Badge ────────────────────────────────────────────────────────

function ScoreDelta({ from, to }) {
  const delta = to - from;
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-indigo-500/10 border border-emerald-500/20">
      {/* From */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground mb-0.5">Original ATS</p>
        <motion.p
          className="text-3xl font-heading font-bold text-amber-400"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          {from}
        </motion.p>
      </div>

      {/* Arrow */}
      <div className="flex flex-col items-center gap-1">
        <ChevronRight className="w-5 h-5 text-indigo-400" />
        <motion.span
          className="text-xs font-bold text-emerald-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          +{delta}
        </motion.span>
      </div>

      {/* To */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground mb-0.5">Enhanced ATS</p>
        <motion.p
          className="text-3xl font-heading font-bold text-emerald-400"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
        >
          {to}
        </motion.p>
      </div>
    </div>
  );
}

// ─── Improvement Stats ────────────────────────────────────────────────────────

function ImprovementStats({ enhanced }) {
  const stats = [
    {
      icon: Wand2, label: 'Total Improvements',
      value: enhanced.total_improvements || 0,
      color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20',
    },
    {
      icon: Zap, label: 'Action Verbs Added',
      value: enhanced.action_verbs_added || 0,
      color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20',
    },
    {
      icon: Target, label: 'Keywords Added',
      value: enhanced.keywords_added_count || (enhanced.skills_section?.keywords_added?.length || 0),
      color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20',
    },
    {
      icon: TrendingUp, label: 'Sections Enhanced',
      value: (enhanced.experience_sections?.length || 0) + (enhanced.projects_sections?.length || 0) + 2,
      color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className={`flex flex-col items-center gap-2 p-3.5 rounded-xl ${stat.bg} border ${stat.border} text-center`}
          >
            <Icon className={`w-4.5 h-4.5 ${stat.color}`} />
            <motion.span
              className={`text-2xl font-heading font-bold ${stat.color}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.08 }}
            >
              {stat.value}
            </motion.span>
            <p className="text-[10px] text-muted-foreground leading-tight">{stat.label}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EnhancePage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // State
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState('professional');
  const [jd, setJd] = useState('');

  const [error, setError] = useState(null);
  const [analysisData, setAnalysisData] = useState(location.state?.analysis || null);
  const [result, setResult] = useState(null); // EnhanceResponse

  // Fetch analysis if not in state
  useEffect(() => {
    if (!analysisData && id) {
      getAnalysis(id)
        .then((d) => setAnalysisData(d))
        .catch(() => navigate('/dashboard'));
    }
  }, [id, analysisData, navigate]);

  const handleEnhance = async () => {
    setError(null);

    setStep(2); // show AI loader

    try {
      const res = await enhanceResume(id, mode, jd.trim() || null);
      setResult(res);
      setStep(3); // show results
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.message ||
        'Enhancement failed. Please try again.'
      );
      setStep(1); // back to mode selection
    }
  };

  const handleReset = () => {
    setResult(null);
    setStep(1);
    setError(null);
  };

  const enhanced = result?.enhanced_resume;
  const filename = (analysisData?.filename || 'resume').replace(/\.[^.]+$/, '');

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* ── Hero Header ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative card-premium rounded-3xl overflow-hidden"
      >
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/8 via-transparent to-violet-500/10 pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

        <div className="relative px-6 py-5 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-xl w-9 h-9 flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-500/30 flex-shrink-0">
            <Sparkles className="w-5.5 h-5.5 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-heading font-bold text-foreground">
              AI Resume Enhancement
            </h1>
            <p className="text-xs text-muted-foreground truncate">
              {filename}{analysisData ? ' · Powered by Smart Resume AI' : ''}
            </p>
          </div>

          {step >= 3 && result && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="rounded-xl gap-1.5 text-xs text-muted-foreground hover:text-foreground flex-shrink-0"
              id="enhance-reset-btn"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Re-enhance
            </Button>
          )}
        </div>
      </motion.div>

      {/* ── Step Indicator ────────────────────────────────────── */}
      <StepIndicator currentStep={step} />

      {/* ── Error banner ──────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-3 p-4 rounded-xl bg-red-500/8 border border-red-500/20"
          >
            <AlertCircle className="w-4.5 h-4.5 text-red-400 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-400 leading-relaxed">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">

        {/* ╔══ STEP 1: Mode Selection ════════════════════════════╗ */}
        {step === 1 && (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.35 }}
            className="space-y-6"
          >
            {/* Mode cards */}
            <GlassCard hover={false}>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
                  <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <h2 className="text-sm font-heading font-bold">Select Enhancement Mode</h2>
                <span className="ml-auto text-[10px] text-muted-foreground">Choose one</span>
              </div>

              <ModeSelector selected={mode} onSelect={setMode} />
            </GlassCard>

            {/* Optional JD */}
            <GlassCard hover={false}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
                  <Target className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <h2 className="text-sm font-heading font-bold">Target Job Description</h2>
                <span className="ml-auto text-[10px] text-muted-foreground bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-full px-2 py-0.5 font-semibold">
                  Optional
                </span>
              </div>
              <Textarea
                id="enhance-jd-input"
                placeholder="Paste a job description to tailor the enhancement for this specific role — adds targeted keywords and highlights relevant experience..."
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                className="min-h-[90px] bg-white/3 border-white/10 resize-none text-sm focus:border-indigo-500/40 focus:ring-0 placeholder:text-muted-foreground/40"
              />
              {jd.trim() && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-emerald-400 mt-2 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Job-targeted enhancement enabled
                </motion.p>
              )}
            </GlassCard>

            {/* Enhance CTA */}
            <motion.button
              id="start-enhance-btn"
              onClick={handleEnhance}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2.5
                bg-gradient-to-r from-indigo-500 to-violet-600 text-white
                shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50
                hover:from-indigo-600 hover:to-violet-700 transition-all"
            >
              <Sparkles className="w-5 h-5" />
              Enhance Resume with AI
              <ChevronRight className="w-4 h-4" />
            </motion.button>

            <p className="text-center text-[11px] text-muted-foreground/50">
              Enhancement preserves all original facts · Only wording and impact are improved
            </p>
          </motion.div>
        )}

        {/* ╔══ STEP 2: AI Processing ═════════════════════════════╗ */}
        {step === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.35 }}
          >
            <AIThinkingLoader mode={mode} />
          </motion.div>
        )}

        {/* ╔══ STEP 3: Preview Results ════════════════════════════╗ */}
        {step === 3 && enhanced && (
          <motion.div
            key="step-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="space-y-5"
          >
            {/* Score delta + stats */}
            <GlassCard hover={false}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <h2 className="text-sm font-heading font-bold">Enhancement Results</h2>
                <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/12 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] font-semibold text-emerald-400">Complete</span>
                </div>
              </div>

              <div className="space-y-4">
                {/* ATS score improvement */}
                <ScoreDelta
                  from={enhanced.original_ats_score}
                  to={enhanced.estimated_new_ats_score}
                />

                {/* Stats grid */}
                <ImprovementStats enhanced={enhanced} />

                {/* Highlights */}
                {enhanced.enhancement_highlights?.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {enhanced.enhancement_highlights.map((highlight, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.06 }}
                        className="flex items-start gap-2.5 text-xs text-muted-foreground"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                        {highlight}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Professional Summary */}
            {enhanced.professional_summary?.enhanced && (
              <GlassCard hover={false}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <h2 className="text-sm font-heading font-bold">Professional Summary</h2>
                </div>
                <SummaryBeforeAfter section={enhanced.professional_summary} />
              </GlassCard>
            )}

            {/* Work Experience */}
            {enhanced.experience_sections?.length > 0 && (
              <GlassCard hover={false}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
                    <Zap className="w-3.5 h-3.5 text-violet-400" />
                  </div>
                  <h2 className="text-sm font-heading font-bold">Work Experience</h2>
                  <span className="ml-auto text-[10px] text-muted-foreground bg-white/5 border border-white/8 rounded-full px-2 py-0.5">
                    {enhanced.experience_sections.length} roles
                  </span>
                </div>
                <div className="space-y-3">
                  {enhanced.experience_sections.map((exp, i) => (
                    <ExperienceBeforeAfter key={i} section={exp} index={i} />
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Projects */}
            {enhanced.projects_sections?.length > 0 && (
              <GlassCard hover={false}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
                    <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <h2 className="text-sm font-heading font-bold">Projects</h2>
                </div>
                <div className="space-y-3">
                  {enhanced.projects_sections.map((proj, i) => (
                    <ProjectBeforeAfter key={i} section={proj} index={i} />
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Skills */}
            {(enhanced.skills_section?.enhanced?.length > 0 || enhanced.skills_section?.original?.length > 0) && (
              <GlassCard hover={false}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
                    <Target className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <h2 className="text-sm font-heading font-bold">Skills</h2>
                </div>
                <SkillsBeforeAfter section={enhanced.skills_section} />
              </GlassCard>
            )}

            {/* Download CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <GlassCard hover={false} className="border-indigo-500/20 bg-indigo-500/5">
                <DownloadPanel
                  enhancedResume={enhanced}
                  enhancementId={result?.id}
                  mode={mode}
                  candidateName={enhanced.candidate_name || filename}
                />
              </GlassCard>
            </motion.div>

            {/* Download sticky scroll-to button */}
            <div className="flex justify-center gap-3">
              <Button
                id="scroll-download-btn"
                onClick={() => setStep(4)}
                className="rounded-xl gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
              >
                <Download className="w-4 h-4" />
                Go to Downloads
              </Button>
              <Button
                variant="ghost"
                onClick={handleReset}
                className="rounded-xl gap-2 text-muted-foreground hover:text-foreground"
                id="try-another-mode-btn"
              >
                <RotateCcw className="w-4 h-4" />
                Try Another Mode
              </Button>
            </div>
          </motion.div>
        )}

        {/* ╔══ STEP 4: Download ══════════════════════════════════╗ */}
        {step === 4 && enhanced && (
          <motion.div
            key="step-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <GlassCard hover={false} className="border-indigo-500/20 bg-indigo-500/5">
              <DownloadPanel
                enhancedResume={enhanced}
                enhancementId={result?.id}
                mode={mode}
                candidateName={enhanced.candidate_name || filename}
              />
            </GlassCard>

            <div className="flex justify-center mt-4">
              <Button
                variant="ghost"
                onClick={() => setStep(3)}
                className="rounded-xl gap-2 text-muted-foreground hover:text-foreground text-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Preview
              </Button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
