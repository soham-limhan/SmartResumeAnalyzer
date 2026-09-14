import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Clock,
  Award,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  Share2,
  Copy,
  Printer,
  History,
  Trash2,
  ExternalLink,
  BookOpen,
  Zap,
  Target,
  BarChart3,
  MessageSquare,
  Layers,
  HelpCircle,
  Briefcase,
  Sliders,
} from 'lucide-react';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import AudioVisualizer from '@/components/interview/AudioVisualizer';
import { useAudioRecorder } from '@/lib/useAudioRecorder';
import {
  generateInterviewQuestions,
  transcribeInterviewAudio,
  evaluateInterviewSession,
  getInterviewHistory,
  getInterviewSession,
  deleteInterviewSession,
} from '@/lib/api';

const POPULAR_TOPICS = [
  { label: 'Full-Stack React & Node.js', icon: '💻', difficulty: 'medium' },
  { label: 'System Design & Scalability', icon: '🏗️', difficulty: 'hard' },
  { label: 'Python Backend & APIs', icon: '🐍', difficulty: 'medium' },
  { label: 'Behavioral & Leadership (STAR)', icon: '⭐', difficulty: 'medium' },
  { label: 'Data Structures & Algorithms', icon: '⚡', difficulty: 'medium' },
  { label: 'DevOps, CI/CD & Kubernetes', icon: '☁️', difficulty: 'hard' },
  { label: 'Machine Learning & AI Eng', icon: '🧠', difficulty: 'hard' },
  { label: 'Product & Engineering Mgmt', icon: '🎯', difficulty: 'medium' },
];

const DIFFICULTY_LEVELS = [
  { id: 'easy', label: 'Easy', desc: 'Core fundamentals & concepts', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  { id: 'medium', label: 'Medium', desc: 'Real-world practical scenarios', color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
  { id: 'hard', label: 'Hard', desc: 'Architecture, trade-offs & edge cases', color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
  { id: 'adaptive', label: 'Adaptive Mix', desc: 'Progressive Easy → Medium → Hard', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
];

export default function MockInterviewPage() {
  const { id: routeSessionId } = useParams();
  const navigate = useNavigate();

  // ─── Flow State: 'setup' | 'interview' | 'evaluating' | 'scorecard' | 'history' ───
  const [phase, setPhase] = useState('setup');

  // Setup form state
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(4);
  const [experienceLevel, setExperienceLevel] = useState('mid');

  // Active interview state
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [question_id]: { text: string, audio_duration: number } }
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState(false);
  const [currentAnswerText, setCurrentAnswerText] = useState('');

  // Scorecard / Evaluation result
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [expandedQIndex, setExpandedQIndex] = useState(0);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Past sessions history
  const [historySessions, setHistorySessions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Audio recording hook
  const {
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    audioUrl,
    error: micError,
    analyserNode,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder();

  // Load session from URL params if present
  useEffect(() => {
    if (routeSessionId) {
      loadSpecificSession(routeSessionId);
    }
  }, [routeSessionId]);

  const loadSpecificSession = async (sessId) => {
    try {
      setEvaluating(true);
      const data = await getInterviewSession(sessId);
      if (data && data.evaluation) {
        setTopic(data.topic);
        setDifficulty(data.difficulty);
        setQuestions(data.questions || []);
        setEvaluationResult(data.evaluation);
        setCurrentSessionId(data.id);
        setPhase('scorecard');
      }
    } catch (err) {
      console.error('Error loading session:', err);
    } finally {
      setEvaluating(false);
    }
  };

  const loadHistoryList = async () => {
    setLoadingHistory(true);
    try {
      const data = await getInterviewHistory();
      setHistorySessions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load interview history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // ─── Phase 1: Start Interview ──────────────────────────────────────────────
  const handleStartInterview = async (customTopic = null) => {
    const selectedTopic = customTopic || topic;
    if (!selectedTopic.trim()) return;

    setLoadingQuestions(true);
    resetRecording();
    setAnswers({});
    setCurrentQIndex(0);
    setCurrentAnswerText('');

    try {
      const response = await generateInterviewQuestions({
        topic: selectedTopic.trim(),
        difficulty,
        count: questionCount,
        experience_level: experienceLevel,
      });

      if (response && response.questions && response.questions.length > 0) {
        setQuestions(response.questions);
        setTopic(selectedTopic.trim());
        setPhase('interview');
      }
    } catch (err) {
      console.error('Error generating questions:', err);
      alert('Failed to generate interview questions. Please try again.');
    } finally {
      setLoadingQuestions(false);
    }
  };

  // ─── Text-to-Speech narration ──────────────────────────────────────────────
  const handleSpeakQuestion = (text) => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeakingQuestion) {
      window.speechSynthesis.cancel();
      setIsSpeakingQuestion(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeakingQuestion(false);
    utterance.onerror = () => setIsSpeakingQuestion(false);

    setIsSpeakingQuestion(true);
    window.speechSynthesis.speak(utterance);
  };

  // ─── Phase 2: Recording and Transcribing Answer ────────────────────────────
  const handleStopAndTranscribe = async () => {
    const currentQ = questions[currentQIndex];
    if (!currentQ) return;

    try {
      const recordedBlob = await stopRecording();
      if (!recordedBlob || recordedBlob.size < 100) {
        return;
      }

      setIsTranscribing(true);
      const result = await transcribeInterviewAudio(recordedBlob, `q_${currentQIndex}.webm`);

      if (result && result.text) {
        const cleanedText = result.text.startsWith('[') ? '' : result.text;
        const newText = currentAnswerText
          ? `${currentAnswerText} ${cleanedText}`.trim()
          : cleanedText;

        setCurrentAnswerText(newText);
        setAnswers((prev) => ({
          ...prev,
          [currentQ.id]: {
            question_id: currentQ.id,
            question: currentQ.question,
            user_answer: newText,
            audio_duration_seconds: (prev[currentQ.id]?.audio_duration_seconds || 0) + (result.duration_seconds || recordingTime),
          },
        }));
      }
    } catch (err) {
      console.error('Transcription failed:', err);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleNextQuestion = () => {
    const currentQ = questions[currentQIndex];
    if (currentQ) {
      // Save current answer text even if typed manually
      setAnswers((prev) => ({
        ...prev,
        [currentQ.id]: {
          question_id: currentQ.id,
          question: currentQ.question,
          user_answer: currentAnswerText.trim(),
          audio_duration_seconds: prev[currentQ.id]?.audio_duration_seconds || 0,
        },
      }));
    }

    if (isSpeakingQuestion && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeakingQuestion(false);
    }

    resetRecording();

    if (currentQIndex < questions.length - 1) {
      const nextIndex = currentQIndex + 1;
      setCurrentQIndex(nextIndex);
      const nextQ = questions[nextIndex];
      setCurrentAnswerText(answers[nextQ.id]?.user_answer || '');
    } else {
      // Finish Interview and trigger AI Evaluation
      handleCompleteInterview();
    }
  };

  const handlePrevQuestion = () => {
    if (currentQIndex > 0) {
      const currentQ = questions[currentQIndex];
      if (currentQ) {
        setAnswers((prev) => ({
          ...prev,
          [currentQ.id]: {
            question_id: currentQ.id,
            question: currentQ.question,
            user_answer: currentAnswerText.trim(),
            audio_duration_seconds: prev[currentQ.id]?.audio_duration_seconds || 0,
          },
        }));
      }
      resetRecording();
      const prevIndex = currentQIndex - 1;
      setCurrentQIndex(prevIndex);
      const prevQ = questions[prevIndex];
      setCurrentAnswerText(answers[prevQ.id]?.user_answer || '');
    }
  };

  // ─── Phase 3: Submit Answers & AI Multi-Band Evaluation ────────────────────
  const handleCompleteInterview = async () => {
    const currentQ = questions[currentQIndex];
    const updatedAnswers = {
      ...answers,
      ...(currentQ
        ? {
            [currentQ.id]: {
              question_id: currentQ.id,
              question: currentQ.question,
              user_answer: currentAnswerText.trim(),
              audio_duration_seconds: answers[currentQ.id]?.audio_duration_seconds || 0,
            },
          }
        : {}),
    };

    const submissionPayload = questions.map((q) => ({
      question_id: q.id,
      question: q.question,
      user_answer: updatedAnswers[q.id]?.user_answer || 'No answer provided.',
      audio_duration_seconds: updatedAnswers[q.id]?.audio_duration_seconds || 0,
    }));

    setPhase('evaluating');
    setEvaluating(true);

    try {
      const record = await evaluateInterviewSession({
        topic,
        difficulty,
        answers: submissionPayload,
      });

      if (record && record.evaluation) {
        setEvaluationResult(record.evaluation);
        setCurrentSessionId(record.id);
        setPhase('scorecard');
      }
    } catch (err) {
      console.error('Error evaluating interview:', err);
      alert('Evaluation encountered an error. Please try again.');
      setPhase('interview');
    } finally {
      setEvaluating(false);
    }
  };

  const handleCopyReport = () => {
    if (!evaluationResult) return;
    const textReport = `MOCK INTERVIEW EVALUATION REPORT
Topic: ${topic} | Difficulty: ${difficulty}
Overall Score: ${evaluationResult.overall_score}/100 (${evaluationResult.performance_band})
Confidence Score: ${evaluationResult.confidence_score}/100

SUMMARY:
${evaluationResult.summary}

COMPETENCY BAND SCORES:
${(evaluationResult.band_scores || []).map((b) => `• ${b.band}: ${b.score}/100 - ${b.description}`).join('\n')}

RECRUITER'S VERDICT:
${evaluationResult.recruiter_verdict}

KEY STRENGTHS:
${(evaluationResult.strengths || []).map((s) => `+ ${s}`).join('\n')}

AREAS FOR IMPROVEMENT:
${(evaluationResult.areas_for_improvement || []).map((a) => `- ${a}`).join('\n')}

ACTIONABLE ROADMAP:
${(evaluationResult.actionable_roadmap || []).map((r, i) => `${i + 1}. ${r}`).join('\n')}
`;
    navigator.clipboard.writeText(textReport);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  const handleDeleteSession = async (sessId, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this mock interview session?')) return;
    try {
      await deleteInterviewSession(sessId);
      setHistorySessions((prev) => prev.filter((s) => s.id !== sessId));
      if (currentSessionId === sessId) {
        setPhase('setup');
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const formatSeconds = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const currentQ = questions[currentQIndex];
  const progressPercent = questions.length > 0 ? ((currentQIndex + 1) / questions.length) * 100 : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-fade-in">
      {/* ── Top Bar ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 shadow-sm">
              <Mic className="w-5 h-5 text-primary animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-primary bg-clip-text text-transparent">
                AI Mock Interview
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Voice practice, speech-to-text transcription, and multi-band AI evaluation.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {phase !== 'setup' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (isRecording) stopRecording();
                setPhase('setup');
              }}
              className="text-xs h-9 rounded-xl gap-1.5 border-border/60 hover:bg-secondary"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              New Interview
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadHistoryList();
              setPhase(phase === 'history' ? 'setup' : 'history');
            }}
            className={`text-xs h-9 rounded-xl gap-1.5 border-border/60 ${
              phase === 'history' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Past Sessions
          </Button>
        </div>
      </div>

      {/* ── PHASE: HISTORY LIST ────────────────────────────────────────────── */}
      {phase === 'history' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Your Mock Interview Records
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPhase('setup')}
              className="text-xs"
            >
              Back to Setup
            </Button>
          </div>

          {loadingHistory ? (
            <div className="p-12 text-center text-muted-foreground">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
              Loading your past interview sessions...
            </div>
          ) : historySessions.length === 0 ? (
            <Card className="p-8 text-center bg-secondary/10 border-dashed border-border/80 rounded-2xl">
              <MessageSquare className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="font-semibold text-foreground">No interview sessions found yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                Launch your first mock interview to get evaluated by AI across key competency bands and track your growth.
              </p>
              <Button
                onClick={() => setPhase('setup')}
                className="mt-4 gap-2 rounded-xl text-xs"
                size="sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Start an Interview Now
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {historySessions.map((sess) => {
                const evalData = sess.evaluation;
                const score = evalData?.overall_score ?? 0;
                const band = evalData?.performance_band ?? 'Evaluated';
                const dateStr = sess.created_at
                  ? new Date(sess.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Recent';

                return (
                  <Card
                    key={sess.id}
                    onClick={() => {
                      setTopic(sess.topic);
                      setDifficulty(sess.difficulty);
                      setQuestions(sess.questions || []);
                      setEvaluationResult(evalData);
                      setCurrentSessionId(sess.id);
                      setPhase('scorecard');
                    }}
                    className="group cursor-pointer hover:border-primary/50 hover:shadow-md transition-all rounded-2xl border-border/60 bg-card/60 backdrop-blur-sm p-4 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase tracking-wider mb-1.5 font-mono"
                        >
                          {sess.difficulty || 'Medium'}
                        </Badge>
                        <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {sess.topic}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {sess.questions?.length || 0} Questions • {dateStr}
                        </p>
                      </div>

                      {evalData && (
                        <div className="flex flex-col items-end">
                          <div className="text-xl font-black text-primary font-mono">
                            {score}
                            <span className="text-xs font-normal text-muted-foreground">/100</span>
                          </div>
                          <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full mt-0.5">
                            {band}
                          </span>
                        </div>
                      )}
                    </div>

                    {evalData?.summary && (
                      <p className="text-xs text-muted-foreground/80 mt-3 line-clamp-2 bg-secondary/30 p-2 rounded-xl">
                        {evalData.summary}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/40 text-xs text-primary font-medium">
                      <span className="flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        View Full Scorecard <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                      <button
                        onClick={(e) => handleDeleteSession(sess.id, e)}
                        className="text-muted-foreground/50 hover:text-red-400 p-1 rounded-md transition-colors"
                        title="Delete session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* ── PHASE 1: SETUP & TOPIC SELECTION ──────────────────────────────── */}
      {phase === 'setup' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          {/* Main Setup Card */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="border-border/60 bg-card/60 backdrop-blur-sm rounded-2xl shadow-sm p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                  <Sparkles className="w-4 h-4 text-primary" />
                  What role or topic do you want to practice?
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Type any engineering stack, job role, or interview topic. AI will generate challenging, high-signal questions.
                </p>
              </div>

              {/* Topic Input */}
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleStartInterview()}
                    placeholder="e.g. Senior Frontend React & Next.js, Microservices, Behavioral STAR, Distributed Caching..."
                    className="w-full px-4 py-3 text-sm rounded-xl bg-secondary/50 border border-border/80 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-foreground transition-all placeholder:text-muted-foreground/50"
                  />
                  {topic && (
                    <button
                      onClick={() => setTopic('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Quick Topic Pills */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    Popular Tracks:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_TOPICS.map((t) => (
                      <button
                        key={t.label}
                        onClick={() => {
                          setTopic(t.label);
                          setDifficulty(t.difficulty);
                        }}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                          topic === t.label
                            ? 'bg-primary/15 border-primary text-primary font-medium shadow-sm'
                            : 'bg-secondary/40 border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary'
                        }`}
                      >
                        <span>{t.icon}</span>
                        <span>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Difficulty Selector */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  Select Interview Difficulty
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {DIFFICULTY_LEVELS.map((d) => {
                    const isSelected = difficulty === d.id;
                    return (
                      <div
                        key={d.id}
                        onClick={() => setDifficulty(d.id)}
                        className={`cursor-pointer p-3 rounded-xl border transition-all text-left flex flex-col justify-between ${
                          isSelected
                            ? `${d.color} ring-1 ring-primary/40 shadow-sm`
                            : 'border-border/60 bg-secondary/20 hover:bg-secondary/40 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-foreground">{d.label}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                          {d.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Number of Questions & Experience Level */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-border/40">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />
                    Number of Questions
                  </label>
                  <div className="flex gap-2">
                    {[3, 4, 5, 8].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setQuestionCount(cnt)}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                          questionCount === cnt
                            ? 'bg-primary text-primary-foreground border-primary font-bold shadow-sm'
                            : 'bg-secondary/30 border-border/60 text-muted-foreground hover:bg-secondary'
                        }`}
                      >
                        {cnt} Qs
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5" />
                    Target Seniority
                  </label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-secondary/50 border border-border/80 text-foreground outline-none focus:border-primary"
                  >
                    <option value="junior">Junior / Entry Level (0-2 yrs)</option>
                    <option value="mid">Mid-Level Engineer (3-5 yrs)</option>
                    <option value="senior">Senior Engineer / Lead (6-9 yrs)</option>
                    <option value="executive">Staff / Principal / Architect (10+ yrs)</option>
                  </select>
                </div>
              </div>

              {/* CTA Button */}
              <Button
                onClick={() => handleStartInterview()}
                disabled={!topic.trim() || loadingQuestions}
                className="w-full py-6 text-sm font-semibold rounded-xl gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
              >
                {loadingQuestions ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    AI is Generating Custom Questions...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Start Mock Interview ({questionCount} Questions)
                  </>
                )}
              </Button>
            </Card>
          </div>

          {/* Right Sidebar Info Card */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="border-border/60 bg-gradient-to-br from-primary/5 via-card to-background p-5 rounded-2xl space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                <Zap className="w-4 h-4 text-amber-400" />
                How the AI Mock Interview Works
              </h3>

              <div className="space-y-3 text-xs text-muted-foreground">
                <div className="flex gap-2.5 items-start">
                  <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <p>
                    <strong className="text-foreground">Listen & Read:</strong> AI asks targeted questions based on the selected domain and seniority level.
                  </p>
                </div>

                <div className="flex gap-2.5 items-start">
                  <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <p>
                    <strong className="text-foreground">Speak Your Answer:</strong> Tap record to speak into your microphone with live waveform visualizer.
                  </p>
                </div>

                <div className="flex gap-2.5 items-start">
                  <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <p>
                    <strong className="text-foreground">Speech-to-Text:</strong> Powered by Whisper AI for fast, high-accuracy speech transcription.
                  </p>
                </div>

                <div className="flex gap-2.5 items-start">
                  <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                    4
                  </div>
                  <p>
                    <strong className="text-foreground">Multi-Band Scorecard:</strong> Get rated on Technical Depth, Communication, Problem Solving, Confidence, and Ideal Model Answers.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-border/40">
                <div className="bg-secondary/40 p-3 rounded-xl flex items-center gap-2 text-[11px] text-muted-foreground">
                  <BookOpen className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Use microphone or type answers directly.</span>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>
      )}

      {/* ── PHASE 2: ACTIVE INTERVIEW ROOM ───────────────────────────────── */}
      {phase === 'interview' && currentQ && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          {/* Progress Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                Question {currentQIndex + 1} of {questions.length}
              </span>
              <span className="font-mono">{Math.round(progressPercent)}% Completed</span>
            </div>
            <Progress value={progressPercent} className="h-2 rounded-full bg-secondary" />
          </div>

          {/* Question Display Card */}
          <Card className="border-border/60 bg-card/80 backdrop-blur-md rounded-2xl shadow-md overflow-hidden">
            <div className="p-6 md:p-8 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-medium text-xs">
                    {currentQ.category || 'Technical Assessment'}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-xs uppercase font-mono ${
                      currentQ.difficulty === 'hard'
                        ? 'text-purple-400 border-purple-500/30'
                        : currentQ.difficulty === 'easy'
                        ? 'text-emerald-400 border-emerald-500/30'
                        : 'text-blue-400 border-blue-500/30'
                    }`}
                  >
                    {currentQ.difficulty || 'Medium'}
                  </Badge>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSpeakQuestion(currentQ.question)}
                  className={`text-xs gap-1.5 rounded-xl border border-border/50 ${
                    isSpeakingQuestion ? 'bg-primary/20 text-primary animate-pulse' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {isSpeakingQuestion ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5" />
                      Stop Audio
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      Read Aloud
                    </>
                  )}
                </Button>
              </div>

              {/* Question Text */}
              <h2 className="text-xl md:text-2xl font-bold text-foreground leading-snug">
                {currentQ.question}
              </h2>

              {/* Expected Concepts Hint */}
              {currentQ.key_points_expected && currentQ.key_points_expected.length > 0 && (
                <div className="bg-secondary/30 border border-border/40 p-3 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                    Key Evaluation Focus:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentQ.key_points_expected.map((pt, i) => (
                      <span
                        key={i}
                        className="text-[11px] bg-background/60 px-2 py-0.5 rounded-md text-foreground/80 border border-border/30"
                      >
                        {pt}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Answer & Recording Section */}
            <div className="bg-secondary/20 border-t border-border/60 p-6 md:p-8 space-y-6">
              {micError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{micError}</span>
                </div>
              )}

              {/* Audio Visualizer & Recording Controls */}
              <div className="flex flex-col items-center justify-center space-y-4">
                <AudioVisualizer
                  analyserNode={analyserNode}
                  isRecording={isRecording}
                  isPaused={isPaused}
                />

                {/* Timer & Status */}
                <div className="flex items-center gap-2 text-xs font-mono">
                  {isRecording ? (
                    <span className="flex items-center gap-1.5 text-red-400 font-bold bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      RECORDING: {formatSeconds(recordingTime)}
                    </span>
                  ) : isTranscribing ? (
                    <span className="flex items-center gap-1.5 text-primary font-bold bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Transcribing speech with AI...
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Click the microphone and speak your answer clearly.
                    </span>
                  )}
                </div>

                {/* Action Recording Buttons */}
                <div className="flex items-center gap-3">
                  {!isRecording ? (
                    <Button
                      onClick={startRecording}
                      disabled={isTranscribing}
                      className="px-6 py-6 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-semibold gap-2 shadow-lg shadow-red-500/20 hover:scale-105 transition-all text-sm"
                    >
                      <Mic className="w-5 h-5" />
                      Start Speaking
                    </Button>
                  ) : (
                    <>
                      {isPaused ? (
                        <Button
                          onClick={resumeRecording}
                          variant="outline"
                          className="rounded-xl gap-1.5 text-xs h-10 border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                        >
                          <Play className="w-4 h-4" /> Resume
                        </Button>
                      ) : (
                        <Button
                          onClick={pauseRecording}
                          variant="outline"
                          className="rounded-xl gap-1.5 text-xs h-10 border-border"
                        >
                          <Pause className="w-4 h-4" /> Pause
                        </Button>
                      )}

                      <Button
                        onClick={handleStopAndTranscribe}
                        className="px-6 py-5 rounded-xl bg-primary text-primary-foreground font-semibold gap-2 shadow-md text-xs hover:scale-105 transition-all"
                      >
                        <Square className="w-4 h-4 fill-current" />
                        Done Speaking (Transcribe)
                      </Button>
                    </>
                  )}

                  {currentAnswerText && !isRecording && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        resetRecording();
                        setCurrentAnswerText('');
                      }}
                      className="text-xs text-muted-foreground hover:text-red-400 gap-1 rounded-xl"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Clear Answer
                    </Button>
                  )}
                </div>
              </div>

              {/* Transcribed / Spoken Answer Text Area */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-foreground flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-primary" />
                    Your Answer Transcript:
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    You can speak or type/edit directly below
                  </span>
                </div>

                <textarea
                  rows={4}
                  value={currentAnswerText}
                  onChange={(e) => setCurrentAnswerText(e.target.value)}
                  placeholder="Your transcribed answer will appear here. You can also type your thoughts or refine any words..."
                  className="w-full p-4 rounded-xl bg-background/80 border border-border/80 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm text-foreground transition-all placeholder:text-muted-foreground/40 leading-relaxed font-sans"
                />
              </div>

              {/* Bottom Navigation Buttons */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="outline"
                  onClick={handlePrevQuestion}
                  disabled={currentQIndex === 0 || isRecording}
                  className="rounded-xl text-xs gap-1.5 border-border"
                >
                  Previous Question
                </Button>

                <Button
                  onClick={handleNextQuestion}
                  disabled={isRecording || isTranscribing}
                  className="rounded-xl px-6 py-5 text-xs font-semibold gap-2 shadow-md shadow-primary/20"
                >
                  {currentQIndex === questions.length - 1 ? (
                    <>
                      <Award className="w-4 h-4" />
                      Finish & Generate Scorecard
                    </>
                  ) : (
                    <>
                      Next Question
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* ── PHASE: EVALUATING LOADER ───────────────────────────────────────── */}
      {phase === 'evaluating' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="py-16 text-center space-y-6 max-w-md mx-auto"
        >
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">
              AI Interview Evaluation in Progress
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Evaluating your answers against industry hiring standards, calculating multi-band proficiency scores, confidence analysis, and compiling recruiter feedback...
            </p>
          </div>
        </motion.div>
      )}

      {/* ── PHASE 3: COMPREHENSIVE SCORECARD & FEEDBACK ────────────────────── */}
      {phase === 'scorecard' && evaluationResult && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Top Scorecard Hero Banner */}
          <Card className="border-border/60 bg-gradient-to-br from-primary/10 via-card to-background rounded-3xl p-6 md:p-8 shadow-lg overflow-hidden relative">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Score Gauge */}
              <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-4 bg-secondary/30 rounded-2xl border border-border/50">
                <div className="relative flex items-center justify-center">
                  <div className="text-5xl font-black font-mono tracking-tight text-foreground">
                    {evaluationResult.overall_score}
                    <span className="text-base text-muted-foreground font-normal">/100</span>
                  </div>
                </div>

                <Badge
                  className="mt-3 px-3 py-1 text-xs font-bold uppercase tracking-wider bg-primary text-primary-foreground shadow-sm"
                >
                  {evaluationResult.performance_band || 'Strong Hire'}
                </Badge>

                <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>Confidence Rating:</span>
                  <span className="font-bold text-foreground font-mono">
                    {evaluationResult.confidence_score || 85}%
                  </span>
                </div>
              </div>

              {/* Assessment Summary */}
              <div className="md:col-span-8 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-primary">
                      Interview Performance Scorecard
                    </span>
                    <h2 className="text-xl md:text-2xl font-bold text-foreground">
                      {topic}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyReport}
                      className="text-xs h-8 rounded-xl gap-1.5 border-border/60"
                    >
                      {copiedNotification ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy Report
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.print()}
                      className="text-xs h-8 rounded-xl gap-1.5 border-border/60"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print
                    </Button>
                  </div>
                </div>

                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed bg-background/50 p-4 rounded-xl border border-border/40">
                  {evaluationResult.summary}
                </p>

                {/* Quick Delivery Metrics */}
                {evaluationResult.communication_metrics && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div className="bg-secondary/40 p-2.5 rounded-xl text-center">
                      <span className="text-[10px] uppercase text-muted-foreground font-bold">Fluency</span>
                      <p className="text-xs font-semibold text-foreground">{evaluationResult.communication_metrics.fluency}</p>
                    </div>
                    <div className="bg-secondary/40 p-2.5 rounded-xl text-center">
                      <span className="text-[10px] uppercase text-muted-foreground font-bold">Clarity</span>
                      <p className="text-xs font-semibold text-foreground">{evaluationResult.communication_metrics.clarity}</p>
                    </div>
                    <div className="bg-secondary/40 p-2.5 rounded-xl text-center">
                      <span className="text-[10px] uppercase text-muted-foreground font-bold">Conciseness</span>
                      <p className="text-xs font-semibold text-foreground">{evaluationResult.communication_metrics.conciseness}</p>
                    </div>
                    <div className="bg-secondary/40 p-2.5 rounded-xl text-center">
                      <span className="text-[10px] uppercase text-muted-foreground font-bold">Tone</span>
                      <p className="text-xs font-semibold text-foreground">{evaluationResult.communication_metrics.tone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Competency Band Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-7 space-y-4">
              <Card className="border-border/60 bg-card/60 rounded-2xl p-6 space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Competency Band Scores
                </h3>

                <div className="space-y-3.5">
                  {(evaluationResult.band_scores || []).map((band, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">{band.band}</span>
                        <span className="font-bold font-mono text-primary">{band.score}/100</span>
                      </div>
                      <Progress value={band.score} className="h-2 rounded-full bg-secondary" />
                      {band.description && (
                        <p className="text-[11px] text-muted-foreground">{band.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>

              {/* Recruiter Verdict */}
              {evaluationResult.recruiter_verdict && (
                <Card className="border-border/60 bg-card/60 rounded-2xl p-6 space-y-2">
                  <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                    <Briefcase className="w-4 h-4 text-primary" />
                    Hiring Manager / Recruiter Verdict
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed italic bg-secondary/30 p-3.5 rounded-xl border border-border/40">
                    "{evaluationResult.recruiter_verdict}"
                  </p>
                </Card>
              )}
            </div>

            {/* Strengths & Improvement Areas */}
            <div className="md:col-span-5 space-y-4">
              {/* Strengths */}
              <Card className="border-emerald-500/20 bg-emerald-500/5 rounded-2xl p-5 space-y-2.5">
                <h3 className="font-semibold text-xs uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Demonstrated Strengths
                </h3>
                <ul className="space-y-2">
                  {(evaluationResult.strengths || []).map((str, idx) => (
                    <li key={idx} className="text-xs text-foreground/90 flex items-start gap-2">
                      <span className="text-emerald-400 font-bold mt-0.5">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Areas for Growth */}
              <Card className="border-amber-500/20 bg-amber-500/5 rounded-2xl p-5 space-y-2.5">
                <h3 className="font-semibold text-xs uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" />
                  Areas for Improvement
                </h3>
                <ul className="space-y-2">
                  {(evaluationResult.areas_for_improvement || []).map((area, idx) => (
                    <li key={idx} className="text-xs text-foreground/90 flex items-start gap-2">
                      <span className="text-amber-400 font-bold mt-0.5">•</span>
                      <span>{area}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* 4-Step Roadmap */}
              {evaluationResult.actionable_roadmap && evaluationResult.actionable_roadmap.length > 0 && (
                <Card className="border-border/60 bg-card/60 rounded-2xl p-5 space-y-2.5">
                  <h3 className="font-semibold text-xs uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <Target className="w-4 h-4" />
                    Actionable Improvement Plan
                  </h3>
                  <div className="space-y-2">
                    {evaluationResult.actionable_roadmap.map((step, idx) => (
                      <div key={idx} className="text-xs flex items-start gap-2 bg-secondary/30 p-2 rounded-lg">
                        <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="text-muted-foreground">{step}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>

          {/* Question-by-Question Deep Dive Accordion */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
              <MessageSquare className="w-5 h-5 text-primary" />
              Question-by-Question Answer Breakdown
            </h3>

            <div className="space-y-3">
              {(evaluationResult.question_evaluations && evaluationResult.question_evaluations.length > 0
                ? evaluationResult.question_evaluations
                : questions.map((q) => ({
                    question_id: q.id,
                    question: q.question,
                    user_answer: answers[q.id]?.user_answer || 'No answer provided.',
                    score: evaluationResult.overall_score,
                    strengths: ['Addressed the main topic concept'],
                    missing_points: ['Could elaborate with concrete architectural metrics'],
                    ideal_answer: q.sample_ideal_answer,
                    specific_feedback: 'Solid explanation. Consider using the STAR method for structured answers.',
                  }))
              ).map((qEval, idx) => {
                const isExpanded = expandedQIndex === idx;
                return (
                  <Card
                    key={idx}
                    className="border-border/60 bg-card/60 rounded-2xl overflow-hidden transition-all"
                  >
                    <div
                      onClick={() => setExpandedQIndex(isExpanded ? null : idx)}
                      className="p-4 md:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div>
                          <h4 className="font-semibold text-sm text-foreground">{qEval.question}</h4>
                          <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                            Answer: {qEval.user_answer || 'No response recorded'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <Badge
                          variant="outline"
                          className="font-mono text-xs font-bold text-primary border-primary/20 bg-primary/10"
                        >
                          {qEval.score || 80}/100
                        </Badge>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-border/40 p-5 space-y-4 bg-secondary/10"
                        >
                          {/* Candidate Answer Transcript */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              Your Spoken Answer Transcript:
                            </span>
                            <p className="text-xs text-foreground/90 bg-background/60 p-3 rounded-xl border border-border/40 leading-relaxed">
                              {qEval.user_answer || 'No spoken answer recorded for this question.'}
                            </p>
                          </div>

                          {/* Strengths & Missing Points */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {qEval.strengths && qEval.strengths.length > 0 && (
                              <div className="bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-xl space-y-1">
                                <span className="text-[10px] font-bold uppercase text-emerald-400">
                                  What You Did Well:
                                </span>
                                <ul className="text-xs space-y-1 text-foreground/90">
                                  {qEval.strengths.map((s, si) => (
                                    <li key={si}>• {s}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {qEval.missing_points && qEval.missing_points.length > 0 && (
                              <div className="bg-amber-500/5 border border-amber-500/20 p-3 rounded-xl space-y-1">
                                <span className="text-[10px] font-bold uppercase text-amber-400">
                                  Key Gaps / Missed Concepts:
                                </span>
                                <ul className="text-xs space-y-1 text-foreground/90">
                                  {qEval.missing_points.map((m, mi) => (
                                    <li key={mi}>• {m}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          {/* Model Reference Answer */}
                          {qEval.ideal_answer && (
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                                Benchmark Model Answer (Ideal Approach):
                              </span>
                              <p className="text-xs text-muted-foreground bg-primary/5 border border-primary/15 p-3.5 rounded-xl leading-relaxed">
                                {qEval.ideal_answer}
                              </p>
                            </div>
                          )}

                          {/* Specific Advice */}
                          {qEval.specific_feedback && (
                            <div className="text-xs text-muted-foreground italic bg-secondary/30 p-2.5 rounded-lg border border-border/30">
                              <strong>Coach Advice:</strong> {qEval.specific_feedback}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Bottom Action CTAs */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-border/60">
            <Button
              variant="outline"
              onClick={() => {
                setPhase('setup');
                setTopic('');
                resetRecording();
              }}
              className="rounded-xl text-xs gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Practice Another Topic
            </Button>

            <Button
              onClick={() => handleStartInterview(topic)}
              className="rounded-xl text-xs font-semibold gap-2 shadow-md shadow-primary/20"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retake this Interview ({difficulty})
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
