import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, X, Sparkles, Loader2, CheckCircle2, AlertCircle,
  FileUp, Clock, Timer, Files, Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import GlassCard from '@/components/shared/GlassCard';
import { uploadResume, uploadBatchResumes } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

// Estimated analysis time per resume in seconds
const ESTIMATED_PER_RESUME_SECONDS = 30;
const MAX_FILES = 25;

// Allowed file types (defense-in-depth — also enforced by the backend)
const ALLOWED_EXTENSIONS = ['pdf', 'docx'];
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

function isFileAllowed(file) {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const hasValidExt = ALLOWED_EXTENSIONS.includes(ext);
  const hasValidMime = ALLOWED_MIME_TYPES.includes(file.type) || file.type === ''; // some OS don't set type
  // Reject double-extension tricks (e.g. resume.pdf.exe)
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

export default function UploadPage() {
  const navigate = useNavigate();
  const { user, addGuestAnalysis, saveBatchResults } = useAuth();
  const [files, setFiles] = useState([]);
  const [jobDescription, setJobDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [stage, setStage] = useState('idle'); // idle, uploading, analyzing, done, error
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  const estimatedTotalSeconds = Math.ceil(files.length / 3) * ESTIMATED_PER_RESUME_SECONDS;

  // ETA timer — starts when stage enters 'analyzing', stops on 'done' or 'error'
  useEffect(() => {
    if (stage === 'analyzing') {
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [stage]);

  const etaRemaining = Math.max(0, estimatedTotalSeconds - elapsed);
  const etaProgress = estimatedTotalSeconds > 0
    ? Math.min(100, (elapsed / estimatedTotalSeconds) * 100)
    : 0;

  const onDrop = useCallback((accepted, rejected) => {
    setError(null);

    // Collect rejection messages from react-dropzone
    const rejectionMessages = [];
    if (rejected.length) {
      rejected.forEach((r) => {
        const ext = r.file.name.split('.').pop()?.toLowerCase() ?? '';
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
          rejectionMessages.push(
            `"${r.file.name}" — only PDF and DOCX files are allowed.`
          );
        } else {
          rejectionMessages.push(
            `"${r.file.name}" — ${r.errors.map((e) => e.message).join(', ')}`
          );
        }
      });
    }

    // Secondary client-side check on accepted files (defense-in-depth)
    const safeFiles = [];
    accepted.forEach((file) => {
      if (!isFileAllowed(file)) {
        rejectionMessages.push(
          `"${file.name}" — suspicious or unsupported file type. Only .pdf and .docx are accepted.`
        );
      } else {
        safeFiles.push(file);
      }
    });

    if (rejectionMessages.length) {
      setError(rejectionMessages.join('\n'));
    }

    if (safeFiles.length) {
      setFiles((prev) => {
        const combined = [...prev, ...safeFiles];
        if (combined.length > MAX_FILES) {
          setError((e) =>
            [e, `Maximum ${MAX_FILES} files allowed. ${combined.length - MAX_FILES} file(s) were dropped.`]
              .filter(Boolean)
              .join('\n')
          );
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
    if (files.length === 0) return;

    // Final pre-flight validation before sending to server
    const invalid = files.filter((f) => !isFileAllowed(f));
    if (invalid.length) {
      setError(
        `Blocked ${invalid.length} suspicious file(s): ${invalid.map((f) => `"${f.name}"`).join(', ')}. ` +
        'Only .pdf and .docx files are allowed. Please remove them and try again.'
      );
      return;
    }

    setUploading(true);
    setError(null);
    setStage('uploading');
    setProgress(0);

    try {
      const onProgress = (pct) => {
        setProgress(pct);
        if (pct >= 100) setStage('analyzing');
      };

      if (files.length === 1) {
        // Single file — use original endpoint
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

        setTimeout(() => {
          navigate(`/analysis/${result.id}`, { state: { analysis: result } });
        }, 800);
      } else {
        // Batch upload
        const result = await uploadBatchResumes(files, jobDescription || null, onProgress);
        setStage('done');

        // Store guest analyses
        if (!user && result.results) {
          result.results.filter(r => r.success).forEach((r) => {
            addGuestAnalysis({
              id: r.id,
              filename: r.filename,
              uploaded_at: r.uploaded_at || new Date().toISOString(),
              analysis: r.analysis,
            });
          });
        }

        // Save batch results and navigate to batch results page
        saveBatchResults({
          ...result,
          job_description: jobDescription || null,
        });

        setTimeout(() => {
          navigate('/batch-results');
        }, 800);
      }
    } catch (err) {
      setStage('error');
      setError(err.response?.data?.detail || err.message || 'Analysis failed. Please try again.');
      setUploading(false);
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  };

  const clearAllFiles = () => {
    setFiles([]);
    setError(null);
    setStage('idle');
  };

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Drop Zone */}
      <GlassCard hover={false} className="relative overflow-hidden">
        <div
          {...getRootProps()}
          className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-300 p-12 text-center
            ${isDragActive
              ? 'border-primary bg-primary/5 scale-[1.01]'
              : 'border-border/50 hover:border-primary/50 hover:bg-muted/30'
            }
            ${files.length > 0 ? 'border-primary/30' : ''}`}
        >
          <input {...getInputProps()} id="resume-upload" />

          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center"
              animate={{ y: isDragActive ? -8 : 0 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <FileUp className="w-8 h-8 text-primary" />
            </motion.div>
            <div>
              <p className="text-base font-medium mb-1">
                {isDragActive ? 'Drop your resumes here' : 'Drag & drop resumes'}
              </p>
              <p className="text-sm text-muted-foreground">
                or click to browse • PDF, DOCX up to 10MB each • Up to {MAX_FILES} files
              </p>
            </div>
          </motion.div>
        </div>
      </GlassCard>

      {/* Selected Files List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <GlassCard hover={false}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Files className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold font-heading">
                    {files.length} {files.length === 1 ? 'Resume' : 'Resumes'} Selected
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    ({formatSize(totalSize)} total)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFiles}
                  disabled={uploading}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Clear All
                </Button>
              </div>

              <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                {files.map((file, idx) => (
                  <motion.div
                    key={`${file.name}-${idx}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: idx * 0.03 }}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{file.name}</p>
                      <p className="text-[10px] text-muted-foreground">{formatSize(file.size)}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground/60 font-mono w-5 text-right flex-shrink-0">
                      #{idx + 1}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                      disabled={uploading}
                      className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </div>

              {files.length >= MAX_FILES && (
                <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Maximum file limit reached ({MAX_FILES})
                </p>
              )}
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Job Description (optional) */}
      <GlassCard hover={false}>
        <Label htmlFor="job-desc" className="text-sm font-medium mb-2 block">
          Job Description <span className="text-muted-foreground font-normal">(optional — for match analysis)</span>
        </Label>
        <Textarea
          id="job-desc"
          placeholder="Paste the job description here to get a match score and targeted suggestions for each resume..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          className="min-h-[120px] bg-background/50 resize-none"
          disabled={uploading}
        />
        {jobDescription.trim() && (
          <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Job description will be used to calculate match scores for {files.length === 1 ? 'this resume' : `all ${files.length} resumes`}
          </p>
        )}
      </GlassCard>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm"
          >
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <span className="text-destructive">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Progress */}
      <AnimatePresence>
        {uploading && (
          <GlassCard hover={false}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-3">
                {stage === 'analyzing' ? (
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                  </div>
                ) : stage === 'done' ? (
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                ) : (
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {stage === 'uploading' && `Uploading ${files.length} ${files.length === 1 ? 'resume' : 'resumes'}...`}
                    {stage === 'analyzing' && `AI is analyzing ${files.length} ${files.length === 1 ? 'resume' : 'resumes'}...`}
                    {stage === 'done' && 'Analysis complete!'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stage === 'uploading' && 'Preparing files for analysis'}
                    {stage === 'analyzing' && `Processing ${Math.min(3, files.length)} at a time`}
                    {stage === 'done' && (files.length > 1 ? 'Redirecting to batch results...' : 'Redirecting to results...')}
                  </p>
                </div>

                {/* Live ETA counter — visible only during analyzing stage */}
                {stage === 'analyzing' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-3 ml-auto"
                  >
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatTime(elapsed)}</span>
                    </div>
                    <div className="h-4 w-px bg-border/50" />
                    <div className="flex items-center gap-1.5 text-xs tabular-nums">
                      <Timer className="w-3.5 h-3.5 text-primary" />
                      <span className="text-primary font-medium">
                        {etaRemaining > 0
                          ? `~${formatTime(etaRemaining)} left`
                          : 'Almost done...'
                        }
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Analyzing ETA details */}
              {stage === 'analyzing' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2"
                >
                  <div className="relative h-1.5 rounded-full bg-muted/50 overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                      initial={{ width: '0%' }}
                      animate={{ width: `${Math.min(etaProgress, 95)}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                    {/* Shimmer effect on the progress bar */}
                    <motion.div
                      className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{ x: ['-80px', '500px'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground/70 text-center">
                    AI is processing {files.length} {files.length === 1 ? 'resume' : 'resumes'} • Estimated: ~{formatTime(estimatedTotalSeconds)}
                  </p>
                </motion.div>
              )}

              {stage === 'uploading' && (
                <Progress value={progress} className="h-1.5" />
              )}
            </motion.div>
          </GlassCard>
        )}
      </AnimatePresence>

      {/* Analyze Button */}
      <Button
        size="lg"
        onClick={handleAnalyze}
        disabled={files.length === 0 || uploading}
        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 py-6 text-base rounded-xl glow-purple disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {uploading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing {files.length} {files.length === 1 ? 'Resume' : 'Resumes'}...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5 mr-2" />
            {files.length <= 1
              ? 'Analyze Resume'
              : `Analyze ${files.length} Resumes`
            }
          </>
        )}
      </Button>
    </div>
  );
}
