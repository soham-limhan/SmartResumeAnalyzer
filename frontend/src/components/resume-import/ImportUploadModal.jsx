import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, AlertCircle, CheckCircle2, Cloud } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * ImportUploadModal
 *
 * Full-screen upload interface with drag-and-drop.
 * Sends file to POST /api/resumes/import and shows upload progress.
 *
 * Props:
 *   isOpen         {boolean}
 *   onClose        {() => void}
 *   onUploadStart  {() => void}          — triggers the progress modal
 *   onSuccess      {(importedData) => void}
 *   onError        {(errorMsg, rawText) => void}
 *   token          {string|null}          — optional auth bearer token
 */
export default function ImportUploadModal({ isOpen, onClose, onUploadStart, onSuccess, onError, token }) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationError, setValidationError] = useState('');

  const validateFile = (file) => {
    if (!file) return 'No file selected.';
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx'].includes(ext)) {
      return `Unsupported file type ".${ext}". Only PDF and DOCX files are accepted.`;
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum size is 10 MB.`;
    }
    return null;
  };

  const onDrop = useCallback((accepted, rejected) => {
    setValidationError('');
    if (rejected && rejected.length > 0) {
      const err = rejected[0].errors?.[0]?.message || 'Invalid file.';
      setValidationError(err);
      return;
    }
    const file = accepted[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) {
      setValidationError(err);
      setSelectedFile(null);
    } else {
      setSelectedFile(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: MAX_SIZE_BYTES,
    multiple: false,
    disabled: uploading,
  });

  const handleUpload = async () => {
    if (!selectedFile) return;
    const err = validateFile(selectedFile);
    if (err) { setValidationError(err); return; }

    setUploading(true);
    setUploadProgress(0);
    onUploadStart();

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const headers = { 'Content-Type': 'multipart/form-data' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await axios.post(`${API_URL}/resumes/import`, formData, {
        headers,
        onUploadProgress: (evt) => {
          if (evt.total) {
            setUploadProgress(Math.round((evt.loaded / evt.total) * 100));
          }
        },
      });
      onSuccess(res.data);
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        'Upload failed. Please try again.';
      onError(msg, null);
    } finally {
      setUploading(false);
    }
  };

  const clearFile = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    setValidationError('');
    setUploadProgress(0);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(0,0,0,0.70)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="relative w-full max-w-xl"
          >
            {/* Glow */}
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/30 via-violet-500/20 to-transparent blur-xl opacity-50 pointer-events-none" />

            <div
              className="relative rounded-2xl border border-border/60 shadow-2xl overflow-hidden"
              style={{ background: 'var(--color-card)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/40">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <Cloud className="w-4 h-4 text-primary" />
                    <span className="text-sm font-bold text-foreground">Import Resume</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Supports PDF and DOCX · Max 10 MB
                  </p>
                </div>
                {!uploading && (
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                {/* Drop zone */}
                <div
                  {...getRootProps()}
                  className={`
                    relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed
                    min-h-[200px] cursor-pointer transition-all duration-200 select-none
                    ${isDragActive
                      ? 'border-primary bg-primary/8 scale-[1.01]'
                      : selectedFile
                      ? 'border-emerald-500/50 bg-emerald-500/5'
                      : 'border-border/50 hover:border-primary/40 hover:bg-muted/30'
                    }
                    ${uploading ? 'pointer-events-none opacity-60' : ''}
                  `}
                >
                  <input {...getInputProps()} />

                  <AnimatePresence mode="wait">
                    {selectedFile ? (
                      <motion.div
                        key="selected"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex flex-col items-center gap-2 text-center px-4"
                      >
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-foreground">{selectedFile.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                        <button
                          onClick={clearFile}
                          className="text-xs text-muted-foreground/60 hover:text-destructive flex items-center gap-1 mt-1 transition-colors"
                        >
                          <X className="w-3 h-3" /> Remove file
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center gap-3 text-center px-6"
                      >
                        <motion.div
                          animate={isDragActive
                            ? { scale: [1, 1.15, 1], rotate: [0, -8, 8, 0] }
                            : {}
                          }
                          transition={{ duration: 0.5, repeat: isDragActive ? Infinity : 0 }}
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                            isDragActive ? 'bg-primary/20' : 'bg-muted/60'
                          }`}
                        >
                          <Upload className={`w-7 h-7 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                        </motion.div>
                        <div>
                          <div className="text-sm font-semibold text-foreground">
                            {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume'}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            or <span className="text-primary font-medium underline underline-offset-2">browse files</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground/50">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" /> PDF
                          </span>
                          <span className="h-3 w-px bg-border" />
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" /> DOCX
                          </span>
                          <span className="h-3 w-px bg-border" />
                          <span>Max 10 MB</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Validation error */}
                <AnimatePresence>
                  {validationError && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20"
                    >
                      <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                      <span className="text-xs text-destructive">{validationError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Upload progress */}
                <AnimatePresence>
                  {uploading && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Uploading file...</span>
                        <span className="font-medium text-primary">{uploadProgress}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-primary rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="px-6 pb-6 flex gap-3">
                {!uploading && (
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                  className={`
                    flex-[2] px-4 py-2.5 rounded-lg text-sm font-semibold transition-all
                    flex items-center justify-center gap-2
                    ${!selectedFile || uploading
                      ? 'bg-primary/40 text-primary-foreground/60 cursor-not-allowed'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30'
                    }
                  `}
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Uploading...' : 'Import Resume'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
