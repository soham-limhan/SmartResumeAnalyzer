import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Download, Brain, CheckCircle2, XCircle, Lightbulb,
  MessageSquare, HelpCircle, Target, TrendingUp, Briefcase, Sparkles, Loader2
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
import CircularScore from '@/components/shared/CircularScore';
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
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  const analysis = data.analysis || data;
  const keywordData = (analysis.keyword_analysis || []).slice(0, 10).map((k) => ({
    name: k.keyword,
    count: k.count,
    relevance: k.relevance,
  }));
  const skillRadarData = (analysis.skill_scores || []).slice(0, 8).map((s) => ({
    skill: s.name,
    score: s.score,
  }));

  const handleExport = async () => {
    setExporting(true);
    try {
      await generatePDFReport(data, id);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-lg font-heading font-semibold">{data.filename || 'Resume Analysis'}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="secondary" className="text-xs">
                <Brain className="w-3 h-3 mr-1" />
                AI Confidence: {Math.round((analysis.ai_confidence || 0) * 100)}%
              </Badge>
              <Badge variant="outline" className="text-xs capitalize">
                {analysis.experience_level || 'N/A'}
              </Badge>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting} className="rounded-xl glass">
          {exporting ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
          ) : (
            <><Download className="w-4 h-4 mr-2" /> Export PDF</>
          )}
        </Button>
      </div>

      {/* Score + Summary Row */}
      <div className="grid md:grid-cols-3 gap-4">
        <motion.div custom={0} variants={fadeIn} initial="hidden" animate="visible">
          <GlassCard glow className="flex flex-col items-center justify-center py-8">
            <CircularScore score={analysis.ats_score || 0} />
            {analysis.job_match_score != null && (
              <div className="mt-4 text-center">
                <div className="text-xs text-muted-foreground mb-1">Job Match</div>
                <div className="text-2xl font-heading font-bold text-primary">{analysis.job_match_score}%</div>
              </div>
            )}
          </GlassCard>
        </motion.div>

        <motion.div custom={1} variants={fadeIn} initial="hidden" animate="visible" className="md:col-span-2">
          <GlassCard hover={false} className="h-full">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="font-heading font-semibold text-sm">AI Summary</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{analysis.summary}</p>
            {analysis.industry_fit?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                <span className="text-xs text-muted-foreground mr-1">Best fit:</span>
                {analysis.industry_fit.map((ind) => (
                  <Badge key={ind} variant="secondary" className="text-xs">{ind}</Badge>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="glass w-full justify-start gap-1 p-1 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg text-xs">Overview</TabsTrigger>
          <TabsTrigger value="skills" className="rounded-lg text-xs">Skills</TabsTrigger>
          <TabsTrigger value="keywords" className="rounded-lg text-xs">Keywords</TabsTrigger>
          <TabsTrigger value="interview" className="rounded-lg text-xs">Interview</TabsTrigger>
          <TabsTrigger value="recruiter" className="rounded-lg text-xs">Recruiter</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Strengths */}
            <motion.div custom={2} variants={fadeIn} initial="hidden" animate="visible">
              <GlassCard hover={false}>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <h3 className="font-heading font-semibold text-sm">Strengths</h3>
                </div>
                <ul className="space-y-2">
                  {(analysis.strengths || []).map((s, i) => (
                    <motion.li
                      key={i}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      {s}
                    </motion.li>
                  ))}
                </ul>
              </GlassCard>
            </motion.div>

            {/* Weaknesses */}
            <motion.div custom={3} variants={fadeIn} initial="hidden" animate="visible">
              <GlassCard hover={false}>
                <div className="flex items-center gap-2 mb-3">
                  <XCircle className="w-4 h-4 text-amber-500" />
                  <h3 className="font-heading font-semibold text-sm">Areas to Improve</h3>
                </div>
                <ul className="space-y-2">
                  {(analysis.weaknesses || []).map((w, i) => (
                    <motion.li
                      key={i}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                    >
                      <XCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                      {w}
                    </motion.li>
                  ))}
                </ul>
              </GlassCard>
            </motion.div>

            {/* Missing Skills */}
            <motion.div custom={4} variants={fadeIn} initial="hidden" animate="visible">
              <GlassCard hover={false}>
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-red-400" />
                  <h3 className="font-heading font-semibold text-sm">Missing Skills</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(analysis.missing_skills || []).map((s, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + i * 0.04 }}
                    >
                      <Badge variant="destructive" className="text-xs font-normal">
                        {s}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>

            {/* Suggestions */}
            <motion.div custom={5} variants={fadeIn} initial="hidden" animate="visible">
              <GlassCard hover={false}>
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                  <h3 className="font-heading font-semibold text-sm">Suggestions</h3>
                </div>
                <ol className="space-y-2">
                  {(analysis.suggestions || []).map((s, i) => (
                    <motion.li
                      key={i}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                    >
                      <span className="text-xs font-bold text-primary mt-0.5 w-4 flex-shrink-0">{i + 1}.</span>
                      {s}
                    </motion.li>
                  ))}
                </ol>
              </GlassCard>
            </motion.div>
          </div>
        </TabsContent>

        {/* Skills Tab */}
        <TabsContent value="skills" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <GlassCard hover={false}>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h3 className="font-heading font-semibold text-sm">Skill Proficiency</h3>
              </div>
              <SkillHeatmap skills={analysis.skill_scores || []} />
            </GlassCard>

            {skillRadarData.length > 0 && (
              <GlassCard hover={false}>
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-4 h-4 text-primary" />
                  <h3 className="font-heading font-semibold text-sm">Skill Radar</h3>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={skillRadarData}>
                    <PolarGrid stroke="oklch(0.5 0 270 / 20%)" />
                    <PolarAngleAxis
                      dataKey="skill"
                      tick={{ fill: 'oklch(0.6 0.03 270)', fontSize: 11 }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      tick={{ fill: 'oklch(0.5 0 270)', fontSize: 10 }}
                    />
                    <Radar
                      dataKey="score"
                      stroke="#818cf8"
                      fill="#818cf8"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </GlassCard>
            )}
          </div>
        </TabsContent>

        {/* Keywords Tab */}
        <TabsContent value="keywords">
          <GlassCard hover={false}>
            <div className="flex items-center gap-2 mb-4">
              <BarChart className="w-4 h-4 text-primary" />
              <h3 className="font-heading font-semibold text-sm">Keyword Frequency</h3>
            </div>
            {keywordData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={keywordData} layout="vertical" margin={{ left: 80 }}>
                  <XAxis type="number" tick={{ fill: 'oklch(0.6 0.03 270)', fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: 'oklch(0.7 0.03 270)', fontSize: 12 }}
                    width={80}
                  />
                  <RTooltip
                    contentStyle={{
                      background: 'oklch(0.15 0.02 270)',
                      border: '1px solid oklch(1 0 0 / 10%)',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={20}>
                    {keywordData.map((_, i) => (
                      <Cell key={i} fill={chartColors[i % chartColors.length]} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No keyword data available.</p>
            )}
          </GlassCard>
        </TabsContent>

        {/* Interview Tab */}
        <TabsContent value="interview">
          <GlassCard hover={false}>
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="w-4 h-4 text-primary" />
              <h3 className="font-heading font-semibold text-sm">Potential Interview Questions</h3>
            </div>
            <Accordion type="single" collapsible className="space-y-2">
              {(analysis.interview_questions || []).map((q, i) => (
                <AccordionItem key={i} value={`q-${i}`} className="border-border/30">
                  <AccordionTrigger className="text-sm hover:no-underline py-3">
                    <span className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </span>
                      {q}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pl-8">
                    Prepare a structured answer using the STAR method (Situation, Task, Action, Result) 
                    that draws from your relevant experience.
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </GlassCard>
        </TabsContent>

        {/* Recruiter Tab */}
        <TabsContent value="recruiter">
          <GlassCard hover={false}>
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="w-4 h-4 text-primary" />
              <h3 className="font-heading font-semibold text-sm">Recruiter Perspective</h3>
            </div>
            <div className="relative pl-4 border-l-2 border-primary/30">
              <MessageSquare className="w-4 h-4 text-primary absolute -left-[11px] top-0 bg-card" />
              <p className="text-sm text-muted-foreground leading-relaxed italic">
                "{analysis.recruiter_feedback}"
              </p>
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
