import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, X, Sparkles, Loader2, CheckCircle2, AlertCircle,
  FileUp, Clock, Timer, Files, Trash2, Zap, Brain,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import GlassCard from '@/components/shared/GlassCard';
import AIScanAnimation from '@/components/shared/AIScanAnimation';
import { uploadResume, uploadBatchResumes } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const ESTIMATED_PER_RESUME_SECONDS = 30;
const MAX_FILES = 25;
const ALLOWED_EXTENSIONS = ['pdf', 'docx'];
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

function isFileAllowed(file) {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const hasValidExt = ALLOWED_EXTENSIONS.includes(ext);
  const hasValidMime = ALLOWED_MIME_TYPES.includes(file.type) || file.type === '';
  const parts = file.name.split('.');
  const hasDoubleExtTrick =
    parts.length > 2 && !parts.slice(1).every((p) => ALLOWED_EXTENSIONS.includes(p.toLowerCase()));
  return hasValidExt && hasValidMime && !hasDoubleExtTrick;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Analysis stages with richer labels
const STAGES = [
  { id: 'uploading', label: 'Uploading', sublabel: 'Sending files to server', icon: Upload },
  { id: 'analyzing', label: 'AI Analyzing', sublabel: 'Processing resume content', icon: Brain },
  { id: 'done', label: 'Complete', sublabel: 'Redirecting to results', icon: CheckCircle2 },
];

export default function UploadPage() {
  const navigate = useNavigate();
  const { user, addGuestAnalysis, saveBatchResults } = useAuth();
  const [files, setFiles] = useState([]);
  const [jobDescription, setJobDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [stage, setStage] = useState('idle');
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  const estimatedTotalSeconds = Math.ceil(files.length / 3) * ESTIMATED_PER_RESUME_SECONDS;

  useEffect(() => {
    if (stage === 'analyzing') {
      timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
    } else {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => clearInterval(timerRef.current);
  }, [stage]);

  const etaRemaining = Math.max(0, estimatedTotalSeconds - elapsed);

  const onDrop = useCallback((accepted, rejected) => {
    setError(null);
    const msgs = [];
    rejected.forEach((r) => {
      const ext = r.file.name.split('.').pop()?.toLowerCase() ?? '';
      msgs.push(!ALLOWED_EXTENSIONS.includes(ext)
        ? `"${r.file.name}" — only PDF and DOCX files are allowed.`
        : `"${r.file.name}" — ${r.errors.map((e) => e.message).join(', ')}`
      );
    });
    const safe = [];
    accepted.forEach((f) => {
      if (!isFileAllowed(f)) msgs.push(`"${f.name}" — suspicious or unsupported file type.`);
      else safe.push(f);
    });
    if (msgs.length) setError(msgs.join('\n'));
    if (safe.length) {
      setFiles((prev) => {
        const combined = [...prev, ...safe];
        if (combined.length > MAX_FILES) {
          setError((e) => [e, `Maximum ${MAX_FILES} files allowed.`].filter(Boolean).join('\n'));
          return combined.slice(0, MAX_FILES);
        }
        return combined;
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10 * 1024 * 1024,
    maxFiles: MAX_FILES,
    multiple: true,
  });

  const handleAnalyze = async () => {
    if (!files.length) return;
    const invalid = files.filter((f) => !isFileAllowed(f));
    if (invalid.length) {
      setError(`Blocked ${invalid.length} suspicious file(s). Only .pdf and .docx are allowed.`);
      return;
    }

    setUploading(true);
    setError(null);
    setStage('uploading');
    setProgress(0);
    setElapsed(0);

    try {
      const onProgress = (pct) => { setProgress(pct); if (pct >= 100) setStage('analyzing'); };

      if (files.length === 1) {
        const result = await uploadResume(files[0], jobDescription || null, onProgress);
        setStage('done');
        if (!user && result) {
          addGuestAnalysis({
            id: result.id,
            filename: result.filename || files[0].name,
            uploaded_at: result.uploaded_at || new Date().toISOString(),
            analysis: result.analysis,
          });
        }
        setTimeout(() => navigate(`/analysis/${result.id}`, { state: { analysis: result } }), 800);
      } else {
        const result = await uploadBatchResumes(files, jobDescription || null, onProgress);
        setStage('done');
        if (!user && result.results) {
          result.results.filter(r => r.success).forEach((r) => addGuestAnalysis({
            id: r.id, filename: r.filename, uploaded_at: r.uploaded_at || new Date().toISOString(), analysis: r.analysis,
          }));
        }
        saveBatchResults({ ...result, job_description: jobDescription || null });
        setTimeout(() => navigate('/batch-results'), 800);
      }
    } catch (err) {
      setStage('error');
      setError(err.response?.data?.detail || err.message || 'Analysis failed. Please try again.');
      setUploading(false);
    }
  };

  const removeFile = (i) => { setFiles((p) => p.filter((_, idx) => idx !== i)); setError(null); };
  const clearAll = () => { setFiles([]); setError(null); setStage('idle'); };
  const totalSize = files.reduce((a, f) => a + f.size, 0);

  const currentStageIndex = STAGES.findIndex(s => s.id === stage);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h2 className="text-xl font-heading font-bold text-foreground">
            Analyze Resume
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Upload up to {MAX_FILES} resumes for instant AI-powered ATS analysis
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          <Zap className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-xs font-semibold text-indigo-400">AI Ready</span>
        </div>
      </div>

      {/* ── Drop Zone ─────────────────────────────────────────── */}
      <div
        {...getRootProps()}
        className={`upload-zone cursor-pointer p-12 text-center transition-all
          ${isDragActive ? 'active border-indigo-400/70' : ''}
          ${files.length > 0 && !uploading ? 'border-indigo-400/40 bg-indigo-500/3' : ''}`}
      >
        <input {...getInputProps()} id="resume-upload" />

        <motion.div
          className="flex flex-col items-center gap-5"
          animate={{ scale: isDragActive ? 1.02 : 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          {/* Icon */}
          <div className="relative">
            <motion.div
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/25 flex items-center justify-center shadow-lg"
              animate={{ y: isDragActive ? -8 : 0 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <FileUp className="w-9 h-9 text-indigo-400" />
            </motion.div>
            {/* Floating file icons */}
            {!isDragActive && (
              <>
                <motion.div
                  className="absolute -top-3 -right-5 w-8 h-10 rounded-lg bg-red-500/15 border border-red-500/25 flex items-center justify-center"
                  animate={{ y: [0, -4, 0], rotate: [3, 6, 3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <span className="text-[8px] font-bold text-red-400">PDF</span>
                </motion.div>
                <motion.div
                  className="absolute -bottom-3 -left-5 w-8 h-10 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center"
                  animate={{ y: [0, 4, 0], rotate: [-3, -6, -3] }}
                  transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }}
                >
                  <span className="text-[8px] font-bold text-blue-400">DOC</span>
                </motion.div>
              </>
            )}
          </div>

          {/* Text */}
          <div>
            <p className="text-base font-semibold text-foreground mb-1">
              {isDragActive ? '✦ Drop your resumes here' : 'Drag & drop your resumes'}
            </p>
            <p className="text-sm text-muted-foreground">
              or <span className="text-indigo-400 font-medium">click to browse</span> · PDF & DOCX · Up to 10MB · {MAX_FILES} files max
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {['ATS Score', 'Keyword Analysis', 'AI Suggestions', 'Job Match'].map((feat) => (
              <span key={feat} className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 border border-white/8 text-muted-foreground font-medium">
                {feat}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Selected files ────────────────────────────────────── */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
          >
            <GlassCard hover={false}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Files className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-semibold font-heading">
                    {files.length} {files.length === 1 ? 'Resume' : 'Resumes'} Selected
                  </h3>
                  <span className="text-xs text-muted-foreground">({formatSize(totalSize)})</span>
                </div>
                <Button
                  variant="ghost" size="sm"
                  onClick={clearAll} disabled={uploading}
                  className="text-xs text-muted-foreground hover:text-destructive gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear All
                </Button>
              </div>

              <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                {files.map((file, idx) => (
                  <motion.div
                    key={`${file.name}-${idx}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: idx * 0.03 }}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/3 hover:bg-white/6 border border-white/5 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/12 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{file.name}</p>
                      <p className="text-[10px] text-muted-foreground">{formatSize(file.size)}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground/50 font-mono w-5 text-right flex-shrink-0">
                      #{idx + 1}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                      disabled={uploading}
                      className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all flex-shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </div>

              {files.length >= MAX_FILES && (
                <p className="text-xs text-amber-400 mt-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Maximum file limit reached ({MAX_FILES})
                </p>
              )}
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Job description ───────────────────────────────────── */}
      <GlassCard hover={false}>
        <Label htmlFor="job-desc" className="text-sm font-semibold mb-1 block">
          Job Description{' '}
          <span className="text-muted-foreground font-normal text-xs ml-1">
            optional — unlocks job match score
          </span>
        </Label>
        <Textarea
          id="job-desc"
          placeholder="Paste the job description here to get a match score and role-targeted suggestions..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          className="min-h-[110px] bg-white/3 border-white/10 resize-none text-sm focus:border-indigo-500/40 focus:ring-0 placeholder:text-muted-foreground/40"
          disabled={uploading}
        />
        {jobDescription.trim() && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-emerald-400 mt-2 flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Job match analysis enabled for {files.length <= 1 ? 'this resume' : `all ${files.length} resumes`}
          </motion.p>
        )}
      </GlassCard>

      {/* ── Error ─────────────────────────────────────────────── */}
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

      {/* ── Upload Progress / Scanning ────────────────────────── */}
      <AnimatePresence>
        {uploading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <GlassCard hover={false} className="overflow-hidden">
              {stage === 'analyzing' ? (
                <AIScanAnimation
                  label={`AI is analyzing ${files.length} ${files.length === 1 ? 'resume' : 'resumes'}...`}
                  sublabel={`Processing ${Math.min(3, files.length)} at a time · Est. ${formatTime(estimatedTotalSeconds)}`}
                />
              ) : stage === 'done' ? (
                <div className="flex flex-col items-center gap-3 py-6">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">Analysis Complete!</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Redirecting to results...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 py-2">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-indigo-400 animate-spin flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Uploading {files.length} {files.length === 1 ? 'resume' : 'resumes'}...</p>
                      <p className="text-xs text-muted-foreground">Preparing files for AI analysis</p>
                    </div>
                    <span className="text-sm font-bold text-indigo-400 tabular-nums">{Math.round(progress)}%</span>
                  </div>
                  {/* Progress bar */}
                  <div className="progress-bar">
                    <motion.div
                      className="progress-bar-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Stage indicators */}
              <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-white/8">
                {STAGES.slice(0, 2).map((s, i) => {
                  const isDone = currentStageIndex > i;
                  const isCurrent = currentStageIndex === i;
                  return (
                    <div key={s.id} className="flex items-center gap-1.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all
                        ${isDone ? 'bg-emerald-500/20 text-emerald-400' : isCurrent ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-muted-foreground/30'}`}>
                        {isDone ? <CheckCircle2 className="w-3 h-3" /> : <span className="text-[8px] font-bold">{i + 1}</span>}
                      </div>
                      <span className={`text-[10px] font-medium ${isCurrent ? 'text-indigo-400' : isDone ? 'text-emerald-400' : 'text-muted-foreground/40'}`}>
                        {s.label}
                      </span>
                      {i < 1 && <div className="w-6 h-px bg-white/8" />}
                    </div>
                  );
                })}

                {/* ETA on right */}
                {stage === 'analyzing' && (
                  <div className="ml-auto flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(elapsed)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs tabular-nums">
                      <Timer className="w-3 h-3 text-indigo-400" />
                      <span className="text-indigo-400 font-medium">
                        {etaRemaining > 0 ? `~${formatTime(etaRemaining)} left` : 'Almost done...'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Analyze Button ────────────────────────────────────── */}
      <motion.button
        onClick={handleAnalyze}
        disabled={files.length === 0 || uploading}
        className={`w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2.5 transition-all
          ${files.length === 0 || uploading
            ? 'bg-white/5 text-muted-foreground/40 cursor-not-allowed border border-white/8'
            : 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:from-indigo-600 hover:to-violet-700 glow-indigo'
          }`}
        whileHover={files.length > 0 && !uploading ? { scale: 1.02, y: -2 } : {}}
        whileTap={files.length > 0 && !uploading ? { scale: 0.98 } : {}}
      >
        {uploading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing {files.length} {files.length === 1 ? 'Resume' : 'Resumes'}...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            {files.length === 0
              ? 'Upload a resume to analyze'
              : files.length === 1
                ? 'Analyze Resume with AI'
                : `Analyze ${files.length} Resumes`
            }
          </>
        )}
      </motion.button>

      {/* Helper text below button */}
      {files.length === 0 && (
        <p className="text-center text-xs text-muted-foreground/50">
          Supports PDF and DOCX · Up to 10MB per file · Results in ~60 seconds
        </p>
      )}
    </div>
  );
}
