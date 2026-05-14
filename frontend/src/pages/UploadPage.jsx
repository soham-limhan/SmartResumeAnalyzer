import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, X, Sparkles, Loader2, CheckCircle2, AlertCircle, FileUp, Clock, Timer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import GlassCard from '@/components/shared/GlassCard';
import { uploadResume } from '@/lib/api';

// Estimated analysis time in seconds (adjust based on your Ollama model speed)
const ESTIMATED_ANALYSIS_SECONDS = 45;

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function UploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [stage, setStage] = useState('idle'); // idle, uploading, analyzing, done, error
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

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

  const etaRemaining = Math.max(0, ESTIMATED_ANALYSIS_SECONDS - elapsed);
  const etaProgress = Math.min(100, (elapsed / ESTIMATED_ANALYSIS_SECONDS) * 100);

  const onDrop = useCallback((accepted, rejected) => {
    setError(null);
    if (rejected.length) {
      setError('Invalid file. Only PDF and DOCX files under 10MB are accepted.');
      return;
    }
    if (accepted.length) {
      setFile(accepted[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 1,
    multiple: false,
  });

  const handleAnalyze = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setStage('uploading');
    setProgress(0);

    try {
      // Simulate upload progress then switch to analyzing
      const onProgress = (pct) => {
        setProgress(pct);
        if (pct >= 100) setStage('analyzing');
      };

      const result = await uploadResume(file, jobDescription || null, onProgress);
      setStage('done');

      // Navigate to results after brief success state
      setTimeout(() => {
        navigate(`/analysis/${result.id}`, { state: { analysis: result } });
      }, 800);
    } catch (err) {
      setStage('error');
      setError(err.response?.data?.detail || err.message || 'Analysis failed. Please try again.');
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setError(null);
    setStage('idle');
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

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
            ${file ? 'border-primary/30' : ''}`}
        >
          <input {...getInputProps()} id="resume-upload" />

          <AnimatePresence mode="wait">
            {!file ? (
              <motion.div
                key="dropzone"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4"
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
                    {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse • PDF, DOCX up to 10MB
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="file-preview"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(); }}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </GlassCard>

      {/* Job Description (optional) */}
      <GlassCard hover={false}>
        <Label htmlFor="job-desc" className="text-sm font-medium mb-2 block">
          Job Description <span className="text-muted-foreground font-normal">(optional — for match analysis)</span>
        </Label>
        <Textarea
          id="job-desc"
          placeholder="Paste the job description here to get a match score and targeted suggestions..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          className="min-h-[120px] bg-background/50 resize-none"
          disabled={uploading}
        />
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
                    {stage === 'uploading' && 'Uploading resume...'}
                    {stage === 'analyzing' && 'AI is analyzing your resume...'}
                    {stage === 'done' && 'Analysis complete!'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stage === 'uploading' && 'Preparing file for analysis'}
                    {stage === 'done' && 'Redirecting to results...'}
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
                    Ollama is processing your resume with AI • Estimated time: ~{formatTime(ESTIMATED_ANALYSIS_SECONDS)}
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
        disabled={!file || uploading}
        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 py-6 text-base rounded-xl glow-purple disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {uploading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5 mr-2" />
            Analyze Resume
          </>
        )}
      </Button>
    </div>
  );
}
