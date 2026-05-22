import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Download, Brain, CheckCircle2, XCircle, Lightbulb,
  MessageSquare, HelpCircle, Target, TrendingUp, Briefcase, Sparkles, Loader2,
  BarChart3 as BarChartIcon, Star, Zap, FileText,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, Cell, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import GlassCard from '@/components/shared/GlassCard';
import ScoreRing from '@/components/shared/ScoreRing';
import SkillHeatmap from '@/components/shared/SkillHeatmap';
import { CardSkeleton, ScoreSkeleton } from '@/components/shared/LoadingSkeleton';
import { getAnalysis } from '@/lib/api';
import { generatePDFReport } from '@/lib/pdfReport';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

const chartColors = ['#818cf8', '#a78bfa', '#c084fc', '#e879f9', '#f472b6', '#fb7185', '#38bdf8', '#34d399'];

function MetricCard({ label, value, sublabel, color = 'text-indigo-400', bgColor = 'bg-indigo-500/10', borderColor = 'border-indigo-500/20', icon: Icon }) {
  return (
    <div className={`flex items-start gap-3.5 p-4 rounded-2xl border ${bgColor} ${borderColor} transition-all hover:scale-[1.02]`}>
      {Icon && (
        <div className={`w-9 h-9 rounded-xl ${bgColor} border ${borderColor} flex items-center justify-center flex-shrink-0 mt-0.5`}>
          <Icon className={`w-4.5 h-4.5 ${color}`} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground font-medium mb-0.5">{label}</p>
        <p className={`text-xl font-heading font-bold ${color} leading-none`}>{value}</p>
        {sublabel && <p className="text-[11px] text-muted-foreground mt-1">{sublabel}</p>}
      </div>
    </div>
  );
}

export default function AnalysisPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(location.state?.analysis || null);
  const [loading, setLoading] = useState(!data);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!data && id) {
      setLoading(true);
      getAnalysis(id)
        .then((res) => setData(res))
        .catch(() => navigate('/dashboard'))
        .finally(() => setLoading(false));
    }
  }, [id, data, navigate]);

  if (loading || !data) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <ScoreSkeleton />
        <div className="grid md:grid-cols-2 gap-4">
          <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      </div>
    );
  }

  const analysis = data.analysis || data;
  const keywordData = (analysis.keyword_analysis || []).slice(0, 10).map((k) => ({
    name: k.keyword, count: k.count, relevance: k.relevance,
  }));
  const skillRadarData = (analysis.skill_scores || []).slice(0, 8).map((s) => ({
    skill: s.name, score: s.score,
  }));

  const handleExport = async () => {
    setExporting(true);
    try { await generatePDFReport(data, id); }
    catch (err) { console.error('PDF export failed:', err); }
    finally { setExporting(false); }
  };

  const atsScore = analysis.ats_score || 0;
  const jobMatch = analysis.job_match_score;
  const aiConf = Math.round((analysis.ai_confidence || 0) * 100);
  const expLevel = analysis.experience_level || 'N/A';

  const scoreColor = atsScore >= 80 ? '#22c55e' : atsScore >= 60 ? '#f59e0b' : '#ef4444';
  const scoreLabel = atsScore >= 80 ? 'Excellent' : atsScore >= 60 ? 'Good' : 'Needs Work';

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ── Hero Score Banner ──────────────────────────────────── */}
      <motion.div
        className="relative card-premium rounded-3xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/8 via-transparent to-violet-500/8 pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6 p-6 md:p-8">
          {/* Back button + file info */}
          <div className="flex items-center gap-3 md:hidden">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl w-8 h-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>

          {/* Score ring */}
          <ScoreRing
            score={atsScore}
            size={140}
            label="ATS Score"
            sublabel={scoreLabel}
          />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="hidden md:flex items-center gap-2 mb-3">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="rounded-xl -ml-2 text-muted-foreground hover:text-foreground gap-1.5 text-xs">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </Button>
            </div>

            <div className="flex items-start gap-2 flex-wrap mb-2">
              <h2 className="text-lg font-heading font-bold text-foreground leading-snug">
                {data.filename || 'Resume Analysis'}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge variant="secondary" className="text-xs gap-1 rounded-lg">
                <Brain className="w-3 h-3" />
                AI Confidence: {aiConf}%
              </Badge>
              <Badge variant="outline" className="text-xs capitalize rounded-lg gap-1">
                <Star className="w-3 h-3" />
                {expLevel}
              </Badge>
              {analysis.industry_fit?.slice(0, 2).map((ind) => (
                <Badge key={ind} variant="secondary" className="text-xs rounded-lg">{ind}</Badge>
              ))}
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed max-w-xl line-clamp-3">
              {analysis.summary}
            </p>
          </div>

          {/* Export button */}
          <div className="flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={exporting}
              className="rounded-xl glass border-white/12 gap-2 hover:border-indigo-500/30 hover:bg-indigo-500/5"
            >
              {exporting ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</>
              ) : (
                <><Download className="w-3.5 h-3.5" /> Export PDF</>
              )}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ── Metric Cards Row ───────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <motion.div custom={0} variants={fadeIn} initial="hidden" animate="visible">
          <MetricCard
            label="ATS Score"
            value={`${atsScore}/100`}
            sublabel={scoreLabel}
            color={atsScore >= 80 ? 'text-emerald-400' : atsScore >= 60 ? 'text-amber-400' : 'text-red-400'}
            bgColor={atsScore >= 80 ? 'bg-emerald-500/8' : atsScore >= 60 ? 'bg-amber-500/8' : 'bg-red-500/8'}
            borderColor={atsScore >= 80 ? 'border-emerald-500/20' : atsScore >= 60 ? 'border-amber-500/20' : 'border-red-500/20'}
            icon={BarChartIcon}
          />
        </motion.div>

        <motion.div custom={1} variants={fadeIn} initial="hidden" animate="visible">
          <MetricCard
            label="Job Match"
            value={jobMatch != null ? `${jobMatch}%` : 'N/A'}
            sublabel={jobMatch != null ? 'vs job description' : 'Add job description'}
            color="text-indigo-400"
            bgColor="bg-indigo-500/8"
            borderColor="border-indigo-500/20"
            icon={Target}
          />
        </motion.div>

        <motion.div custom={2} variants={fadeIn} initial="hidden" animate="visible">
          <MetricCard
            label="AI Confidence"
            value={`${aiConf}%`}
            sublabel="Analysis reliability"
            color="text-violet-400"
            bgColor="bg-violet-500/8"
            borderColor="border-violet-500/20"
            icon={Sparkles}
          />
        </motion.div>

        <motion.div custom={3} variants={fadeIn} initial="hidden" animate="visible">
          <MetricCard
            label="Experience"
            value={expLevel}
            sublabel="Detected level"
            color="text-cyan-400"
            bgColor="bg-cyan-500/8"
            borderColor="border-cyan-500/20"
            icon={Zap}
          />
        </motion.div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────── */}
      <Tabs defaultValue="overview" className="space-y-5">
        <TabsList className="glass w-full justify-start gap-1 p-1.5 rounded-2xl border border-white/8 overflow-x-auto">
          {[
            { value: 'overview', label: 'Overview', icon: BarChartIcon },
            { value: 'skills', label: 'Skills', icon: TrendingUp },
            { value: 'keywords', label: 'Keywords', icon: Target },
            { value: 'interview', label: 'Interview', icon: HelpCircle },
            { value: 'recruiter', label: 'Recruiter', icon: Briefcase },
          ].map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="rounded-xl text-xs font-semibold gap-1.5 flex-shrink-0">
              <Icon className="w-3.5 h-3.5" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Overview ─────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Strengths */}
            <motion.div custom={0} variants={fadeIn} initial="hidden" animate="visible">
              <GlassCard hover={false} className="h-full">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <h3 className="font-heading font-bold text-sm">Strengths</h3>
                  <Badge className="ml-auto text-[10px] bg-emerald-500/12 text-emerald-400 border-emerald-500/20 rounded-lg">
                    {(analysis.strengths || []).length}
                  </Badge>
                </div>
                <ul className="space-y-2.5">
                  {(analysis.strengths || []).map((s, i) => (
                    <motion.li
                      key={i}
                      className="flex items-start gap-2.5 text-sm text-muted-foreground leading-relaxed"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.05 }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      {s}
                    </motion.li>
                  ))}
                </ul>
              </GlassCard>
            </motion.div>

            {/* Weaknesses */}
            <motion.div custom={1} variants={fadeIn} initial="hidden" animate="visible">
              <GlassCard hover={false} className="h-full">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
                    <XCircle className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <h3 className="font-heading font-bold text-sm">Areas to Improve</h3>
                  <Badge className="ml-auto text-[10px] bg-amber-500/12 text-amber-400 border-amber-500/20 rounded-lg">
                    {(analysis.weaknesses || []).length}
                  </Badge>
                </div>
                <ul className="space-y-2.5">
                  {(analysis.weaknesses || []).map((w, i) => (
                    <motion.li
                      key={i}
                      className="flex items-start gap-2.5 text-sm text-muted-foreground leading-relaxed"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.05 }}
                    >
                      <XCircle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                      {w}
                    </motion.li>
                  ))}
                </ul>
              </GlassCard>
            </motion.div>

            {/* Missing Skills */}
            <motion.div custom={2} variants={fadeIn} initial="hidden" animate="visible">
              <GlassCard hover={false} className="h-full">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-red-500/15 border border-red-500/25 flex items-center justify-center">
                    <Target className="w-3.5 h-3.5 text-red-400" />
                  </div>
                  <h3 className="font-heading font-bold text-sm">Missing Skills</h3>
                  <Badge className="ml-auto text-[10px] bg-red-500/12 text-red-400 border-red-500/20 rounded-lg">
                    {(analysis.missing_skills || []).length}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(analysis.missing_skills || []).map((s, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + i * 0.04 }}
                    >
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-medium">
                        + {s}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>

            {/* Suggestions */}
            <motion.div custom={3} variants={fadeIn} initial="hidden" animate="visible">
              <GlassCard hover={false} className="h-full">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-yellow-500/15 border border-yellow-500/25 flex items-center justify-center">
                    <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />
                  </div>
                  <h3 className="font-heading font-bold text-sm">AI Suggestions</h3>
                  <Badge className="ml-auto text-[10px] bg-yellow-500/12 text-yellow-400 border-yellow-500/20 rounded-lg">
                    {(analysis.suggestions || []).length}
                  </Badge>
                </div>
                <ol className="space-y-2.5">
                  {(analysis.suggestions || []).map((s, i) => (
                    <motion.li
                      key={i}
                      className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed p-2.5 rounded-xl bg-white/3 hover:bg-white/5 transition-colors"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.05 }}
                    >
                      <span className="w-5 h-5 rounded-lg bg-yellow-500/15 text-yellow-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {s}
                    </motion.li>
                  ))}
                </ol>
              </GlassCard>
            </motion.div>
          </div>
        </TabsContent>

        {/* ── Skills ───────────────────────────────────────────── */}
        <TabsContent value="skills" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <GlassCard hover={false}>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <h3 className="font-heading font-bold text-sm">Skill Proficiency</h3>
              </div>
              <SkillHeatmap skills={analysis.skill_scores || []} />
            </GlassCard>

            {skillRadarData.length > 0 && (
              <GlassCard hover={false}>
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-heading font-bold text-sm">Skill Radar</h3>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={skillRadarData}>
                    <PolarGrid stroke="oklch(0.5 0 270 / 15%)" />
                    <PolarAngleAxis dataKey="skill" tick={{ fill: 'oklch(0.6 0.03 270)', fontSize: 11, fontFamily: 'Inter' }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: 'oklch(0.5 0 270)', fontSize: 10 }} />
                    <Radar dataKey="score" stroke="#818cf8" fill="#818cf8" fillOpacity={0.18} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </GlassCard>
            )}
          </div>
        </TabsContent>

        {/* ── Keywords ─────────────────────────────────────────── */}
        <TabsContent value="keywords">
          <GlassCard hover={false}>
            <div className="flex items-center gap-2 mb-5">
              <BarChartIcon className="w-4 h-4 text-indigo-400" />
              <h3 className="font-heading font-bold text-sm">Keyword Frequency Analysis</h3>
              <span className="ml-auto text-xs text-muted-foreground">Top {keywordData.length} keywords</span>
            </div>
            {keywordData.length > 0 ? (
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={keywordData} layout="vertical" margin={{ left: 90, right: 20 }}>
                  <XAxis type="number" tick={{ fill: 'oklch(0.6 0.03 270)', fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: 'oklch(0.7 0.03 270)', fontSize: 12, fontFamily: 'Inter' }} width={90} />
                  <RTooltip
                    contentStyle={{
                      background: 'oklch(0.12 0.02 265)',
                      border: '1px solid oklch(1 0 0 / 10%)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontFamily: 'Inter',
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={22}>
                    {keywordData.map((_, i) => (
                      <Cell key={i} fill={chartColors[i % chartColors.length]} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
                <BarChartIcon className="w-8 h-8 opacity-30" />
                <p className="text-sm">No keyword data available.</p>
              </div>
            )}
          </GlassCard>
        </TabsContent>

        {/* ── Interview ─────────────────────────────────────────── */}
        <TabsContent value="interview">
          <GlassCard hover={false}>
            <div className="flex items-center gap-2 mb-5">
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              <h3 className="font-heading font-bold text-sm">Potential Interview Questions</h3>
              <span className="ml-auto text-xs text-muted-foreground">
                {(analysis.interview_questions || []).length} questions
              </span>
            </div>

            {/* STAR method callout */}
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-indigo-500/8 border border-indigo-500/20 mb-4">
              <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-semibold text-indigo-400">Tip:</span> Use the{' '}
                <span className="font-semibold text-foreground">STAR method</span>{' '}
                (Situation → Task → Action → Result) for structured, impactful answers.
              </p>
            </div>

            <Accordion type="single" collapsible className="space-y-2">
              {(analysis.interview_questions || []).map((q, i) => (
                <AccordionItem key={i} value={`q-${i}`} className="border-white/8 rounded-xl overflow-hidden">
                  <AccordionTrigger className="text-sm hover:no-underline py-3.5 px-4 hover:bg-white/3 transition-colors rounded-xl">
                    <span className="flex items-center gap-3 text-left">
                      <span className="w-6 h-6 rounded-lg bg-indigo-500/15 text-indigo-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </span>
                      {q}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pl-13 pr-4 pb-4 leading-relaxed">
                    <div className="pl-9 border-l border-indigo-500/20">
                      Prepare a structured STAR answer drawing from your most relevant experience.
                      Focus on quantified outcomes and your specific contribution.
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </GlassCard>
        </TabsContent>

        {/* ── Recruiter ─────────────────────────────────────────── */}
        <TabsContent value="recruiter">
          <GlassCard hover={false}>
            <div className="flex items-center gap-2 mb-5">
              <Briefcase className="w-4 h-4 text-indigo-400" />
              <h3 className="font-heading font-bold text-sm">Recruiter Perspective</h3>
            </div>

            <div className="flex items-start gap-4">
              {/* Recruiter avatar */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <p className="text-[10px] text-center text-muted-foreground mt-1.5 font-medium">Sr. Recruiter</p>
              </div>

              {/* Quote bubble */}
              <div className="flex-1 relative">
                <div className="absolute -left-2 top-4 w-2 h-2 bg-white/8 rotate-45 border-l border-t border-white/8" />
                <div className="p-4 rounded-2xl bg-white/4 border border-white/8">
                  <div className="flex items-center gap-2 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed italic">
                    "{analysis.recruiter_feedback}"
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
