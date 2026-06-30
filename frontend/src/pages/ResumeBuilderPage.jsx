import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, BookOpen, Briefcase, Award, FolderGit, Layout,
  Plus, Trash2, ArrowLeft, ArrowRight, Download, FileText,
  Sparkles, CheckCircle, AlertCircle, Printer, Wrench, Upload, RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import ResumeTemplates, { AutoSizedPreview } from '@/components/enhance/ResumeTemplates';
import { exportBuilderResumePDF } from '@/lib/builderPdfExport';
import axios from 'axios';

// Import flow components
import ImportStartModal from '@/components/resume-import/ImportStartModal';
import ImportUploadModal from '@/components/resume-import/ImportUploadModal';
import ImportProgressModal from '@/components/resume-import/ImportProgressModal';
import ImportReviewModal from '@/components/resume-import/ImportReviewModal';
import SmartMergeDialog from '@/components/resume-import/SmartMergeDialog';
import ImportErrorPanel from '@/components/resume-import/ImportErrorPanel';
import { detectConflicts, applyMergeDecisions, mapImportedToBuilderSchema } from '@/lib/resumeImportUtils';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const INITIAL_RESUME_STATE = {
  designTemplate: 'modern_professional',
  personalInfo: {
    fullName: '',
    professionalTitle: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    portfolioWebsite: '',
    professionalSummary: '',
  },
  education: [],
  experience: [],
  skills: {
    technical: [],
    soft: [],
    languages: [],
    certifications: [],
  },
  projects: [],
};

const STEPS = [
  { id: 1, label: 'Profile', icon: User },
  { id: 2, label: 'Education', icon: BookOpen },
  { id: 3, label: 'Experience', icon: Briefcase },
  { id: 4, label: 'Skills', icon: Wrench },
  { id: 5, label: 'Projects', icon: FolderGit },
  { id: 6, label: 'Design', icon: Layout },
];

// ── ProjectCard: expandable inline-edit card for each project ────────────────
function ProjectCard({ item, onRemove, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);

  const startEdit = (e) => {
    e.stopPropagation();
    setDraft({
      ...item,
      technologies: Array.isArray(item.technologies) ? item.technologies.join(', ') : (item.technologies || ''),
    });
    setExpanded(true);
    setEditing(true);
  };

  const saveEdit = () => {
    const techList = typeof draft.technologies === 'string'
      ? draft.technologies.split(',').map(t => t.trim()).filter(Boolean)
      : draft.technologies || [];
    onUpdate({ ...draft, technologies: techList });
    setEditing(false);
    setDraft(null);
  };

  const cancelEdit = () => { setEditing(false); setDraft(null); };

  const techDisplay = Array.isArray(item.technologies) ? item.technologies.join(', ') : '';

  return (
    <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
      {/* Header row — always visible */}
      <div className="flex justify-between items-center p-3">
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex-1 text-left group"
        >
          <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{item.projectName || 'Untitled Project'}</p>
          {techDisplay && (
            <p className="text-[10px] text-muted-foreground mt-0.5 font-mono truncate max-w-xs">Tech: {techDisplay}</p>
          )}
          {item.description && !expanded && (
            <p className="text-[10px] text-muted-foreground/60 mt-0.5 italic truncate max-w-xs">{item.description}</p>
          )}
        </button>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={startEdit} title="Edit project">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 hover:text-red-400" onClick={onRemove}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Expanded / editing body */}
      {expanded && !editing && item.description && (
        <div className="px-3 pb-3 border-t border-border/30 pt-2">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Description</p>
          <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-line">{item.description}</p>
        </div>
      )}

      {editing && draft && (
        <div className="px-3 pb-3 border-t border-border/30 pt-3 space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Project Name</label>
              <input
                className="w-full text-xs bg-background border border-border rounded-md px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                value={draft.projectName}
                onChange={e => setDraft(d => ({ ...d, projectName: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Technologies</label>
              <input
                className="w-full text-xs bg-background border border-border rounded-md px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                value={draft.technologies}
                onChange={e => setDraft(d => ({ ...d, technologies: e.target.value }))}
                placeholder="React, Node.js, ..."
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">GitHub Link</label>
              <input
                className="w-full text-xs bg-background border border-border rounded-md px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                value={draft.githubLink}
                onChange={e => setDraft(d => ({ ...d, githubLink: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Live Demo URL</label>
              <input
                className="w-full text-xs bg-background border border-border rounded-md px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                value={draft.liveDemoLink}
                onChange={e => setDraft(d => ({ ...d, liveDemoLink: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Project Description</label>
            <textarea
              rows={4}
              className="w-full text-xs bg-background border border-border rounded-md px-2.5 py-1.5 text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/40"
              value={draft.description}
              onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
              placeholder="Describe what this project does and your contributions..."
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={saveEdit} className="h-7 text-[11px] px-3 rounded-md gap-1">
              <CheckCircle className="w-3 h-3" /> Save
            </Button>
            <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-7 text-[11px] px-3 rounded-md text-muted-foreground">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResumeBuilderPage() {
  const { user, getToken } = useAuth();
  const [activeStep, setActiveStep] = useState(1);
  const [resumeData, setResumeData] = useState(INITIAL_RESUME_STATE);

  // Local states for list addition
  const [eduForm, setEduForm] = useState({ degree: '', institution: '', startDate: '', endDate: '', gpa: '', description: '' });
  const [expForm, setExpForm] = useState({ jobTitle: '', company: '', location: '', startDate: '', endDate: '', current: false, responsibilities: '', achievements: '' });
  const [projForm, setProjForm] = useState({ projectName: '', description: '', technologies: '', githubLink: '', liveDemoLink: '' });

  // Local state for tags input
  const [tagInputs, setTagInputs] = useState({ technical: '', soft: '', languages: '', certifications: '' });

  const [saving, setSaving] = useState(false);
  const [exportingDocx, setExportingDocx] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [pageBudget, setPageBudget] = useState(1);

  // ── Import flow state ─────────────────────────────────────────────────────
  // Show the start modal only once per session (not if user already has data)
  const [importFlow, setImportFlow] = useState('start'); // 'start'|'upload'|'progress'|'review'|'merge'|'error'|'done'
  const [showImportModals, setShowImportModals] = useState(false);
  const [importedRawData, setImportedRawData] = useState(null);   // raw ImportedResume from API
  const [importedMapped, setImportedMapped] = useState(null);     // builder-schema mapped data
  const [mergeConflicts, setMergeConflicts] = useState([]);
  const [importError, setImportError] = useState('');
  const [importDone, setImportDone] = useState(false);            // signals progress modal to complete
  const [importAuthToken, setImportAuthToken] = useState(null);

  // Determine if we should show the start modal on mount
  useEffect(() => {
    const seen = localStorage.getItem('profilex-import-seen');
    if (!seen) {
      setShowImportModals(true);
      setImportFlow('start');
    }
  }, []);

  // Cache the auth token for the upload request
  useEffect(() => {
    if (user) {
      getToken().then(t => setImportAuthToken(t || null));
    }
  }, [user, getToken]);

  // ── Import flow handlers ──────────────────────────────────────────────────

  const openImportFlow = useCallback(() => {
    setImportFlow('upload');
    setShowImportModals(true);
    setImportError('');
    setImportedRawData(null);
    setImportedMapped(null);
    setImportDone(false);
  }, []);

  const dismissAllImportModals = useCallback(() => {
    setShowImportModals(false);
    setImportFlow('done');
    localStorage.setItem('profilex-import-seen', '1');
  }, []);

  const handleImportStart = useCallback(() => {
    // Scratch — dismiss modal
    dismissAllImportModals();
  }, [dismissAllImportModals]);

  const handleImportChoose = useCallback(() => {
    // User chose to import
    setImportFlow('upload');
  }, []);

  const handleUploadStart = useCallback(() => {
    // File uploaded — show progress animation
    setImportFlow('progress');
    setImportDone(false);
  }, []);

  const handleUploadSuccess = useCallback((rawImported) => {
    // API responded — store raw data, signal progress to finish
    setImportedRawData(rawImported);
    setImportDone(true);

    // Brief pause so the final progress step animates before transitioning
    setTimeout(() => {
      // Check for conflicts with existing builder data
      const mapped = mapImportedToBuilderSchema(rawImported);
      setImportedMapped(mapped);

      const conflicts = detectConflicts(resumeData, mapped);
      if (conflicts.length > 0) {
        setMergeConflicts(conflicts);
        setImportFlow('merge');
      } else {
        setImportFlow('review');
      }
    }, 1200);
  }, [resumeData]);

  const handleUploadError = useCallback((errorMsg, rawText) => {
    setImportError(errorMsg || 'Import failed. Please try again.');
    setImportFlow('error');
  }, []);

  const handleMergeResolve = useCallback((decisions) => {
    // Apply merge decisions and proceed to review
    const merged = applyMergeDecisions(resumeData, importedMapped, decisions);
    setImportedMapped(merged);
    // Rebuild a pseudo-ImportedResume so the review modal can show it
    // (review modal gets the raw importedRawData)
    setImportFlow('review');
  }, [resumeData, importedMapped]);

  const handleImportComplete = useCallback((builderData) => {
    // Merge tools into the builder schema (keep existing designTemplate)
    const finalData = {
      ...builderData,
      designTemplate: resumeData.designTemplate,
      id: resumeData.id, // preserve existing resume ID if any
    };
    setResumeData(finalData);
    localStorage.setItem('profilex-ai-builder-data', JSON.stringify(finalData));
    if (user) syncToDatabase(finalData);
    dismissAllImportModals();
  }, [resumeData, user, dismissAllImportModals]);

  const handleImportRetry = useCallback(() => {
    setImportFlow('upload');
    setImportError('');
    setImportDone(false);
  }, []);

  const handleImportManualEdit = useCallback(() => {
    dismissAllImportModals();
  }, [dismissAllImportModals]);

  const handleClearResume = useCallback(() => {
    const confirmed = window.confirm(
      'Clear all resume fields? This will erase everything you have entered and cannot be undone.'
    );
    if (!confirmed) return;

    setResumeData(INITIAL_RESUME_STATE);
    setEduForm({ degree: '', institution: '', startDate: '', endDate: '', gpa: '', description: '' });
    setExpForm({ jobTitle: '', company: '', location: '', startDate: '', endDate: '', current: false, responsibilities: '', achievements: '' });
    setProjForm({ projectName: '', description: '', technologies: '', githubLink: '', liveDemoLink: '' });
    setTagInputs({ technical: '', soft: '', languages: '', certifications: '' });
    setActiveStep(1);
    setError(null);
    localStorage.removeItem('profilex-ai-builder-data');
  }, []);

  // Compute preview data containing in-progress input values
  const getPreviewResumeData = () => {
    const previewData = {
      ...resumeData,
      personalInfo: { ...resumeData.personalInfo },
      education: [...resumeData.education],
      experience: [...resumeData.experience],
      skills: {
        technical: [...(resumeData.skills?.technical || [])],
        soft: [...(resumeData.skills?.soft || [])],
        languages: [...(resumeData.skills?.languages || [])],
        certifications: [...(resumeData.skills?.certifications || [])],
      },
      projects: [...(resumeData.projects || [])],
    };

    // 1. Merge active education form if any field is being typed
    const hasEduDraft = eduForm.degree || eduForm.institution || eduForm.startDate || eduForm.endDate || eduForm.gpa || eduForm.description;
    if (hasEduDraft) {
      previewData.education = [...previewData.education, {
        id: 'draft-edu',
        degree: eduForm.degree || '',
        institution: eduForm.institution || '',
        startDate: eduForm.startDate || '',
        endDate: eduForm.endDate || '',
        gpa: eduForm.gpa || '',
        description: eduForm.description || '',
        isDraft: true
      }];
    }

    // 2. Merge active experience form if any field is being typed
    const hasExpDraft = expForm.jobTitle || expForm.company || expForm.location || expForm.startDate || expForm.endDate || expForm.responsibilities || expForm.achievements;
    if (hasExpDraft) {
      previewData.experience = [...previewData.experience, {
        id: 'draft-exp',
        jobTitle: expForm.jobTitle || '',
        company: expForm.company || '',
        location: expForm.location || '',
        startDate: expForm.startDate || '',
        endDate: expForm.endDate || (expForm.current ? 'Present' : ''),
        current: expForm.current,
        responsibilities: expForm.responsibilities || '',
        achievements: expForm.achievements || '',
        isDraft: true
      }];
    }

    // 3. Merge active project form if any field is being typed
    const hasProjDraft = projForm.projectName || projForm.description || projForm.technologies || projForm.githubLink || projForm.liveDemoLink;
    if (hasProjDraft) {
      const techList = projForm.technologies
        ? projForm.technologies.split(',').map(t => t.trim()).filter(Boolean)
        : [];
      previewData.projects = [...previewData.projects, {
        id: 'draft-proj',
        projectName: projForm.projectName || '',
        description: projForm.description || '',
        technologies: techList,
        githubLink: projForm.githubLink || '',
        liveDemoLink: projForm.liveDemoLink || '',
        isDraft: true
      }];
    }

    // 4. Merge active skill tag inputs
    if (tagInputs.technical?.trim()) {
      previewData.skills.technical = [...previewData.skills.technical, tagInputs.technical.trim() + ' (typing...)'];
    }
    if (tagInputs.soft?.trim()) {
      previewData.skills.soft = [...previewData.skills.soft, tagInputs.soft.trim() + ' (typing...)'];
    }
    if (tagInputs.languages?.trim()) {
      previewData.skills.languages = [...previewData.skills.languages, tagInputs.languages.trim() + ' (typing...)'];
    }
    if (tagInputs.certifications?.trim()) {
      previewData.skills.certifications = [...previewData.skills.certifications, tagInputs.certifications.trim() + ' (typing...)'];
    }

    return previewData;
  };

  const previewResumeData = getPreviewResumeData();

  // Load draft on mount
  useEffect(() => {
    const loadDraft = async () => {
      const cached = localStorage.getItem('profilex-ai-builder-data');
      if (cached) {
        try {
          setResumeData(JSON.parse(cached));
        } catch {
          console.error('Failed to parse cached resume draft');
        }
      }

      if (user) {
        try {
          const token = await getToken() || localStorage.getItem('firebase-token');
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const res = await axios.get(`${API_URL}/resumes`, { headers });
          if (res.data && res.data.length > 0) {
            // Take the most recent resume
            const dbResume = res.data[0];
            setResumeData(dbResume);
            localStorage.setItem('profilex-ai-builder-data', JSON.stringify(dbResume));
          }
        } catch (err) {
          console.error('Failed to fetch resume from database', err);
        }
      }
    };
    loadDraft();
  }, [user, getToken]);

  // Autosave to localStorage on state changes
  useEffect(() => {
    if (resumeData !== INITIAL_RESUME_STATE) {
      localStorage.setItem('profilex-ai-builder-data', JSON.stringify(resumeData));
    }
  }, [resumeData]);

  // Sync to database
  const syncToDatabase = async (updatedData = resumeData) => {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      const token = await getToken() || localStorage.getItem('firebase-token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(`${API_URL}/resumes`, updatedData, { headers });
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to sync resume draft.');
    } finally {
      setSaving(false);
    }
  };

  // Form input setters
  const handlePersonalInfoChange = (field, value) => {
    setResumeData(prev => {
      const updated = {
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          [field]: value
        }
      };
      return updated;
    });
  };

  // List adding helpers
  const addEducation = () => {
    if (!eduForm.degree || !eduForm.institution) return;
    setResumeData(prev => {
      const updated = {
        ...prev,
        education: [...prev.education, { ...eduForm, id: Math.random().toString(36).substring(2, 9) }]
      };
      syncToDatabase(updated);
      return updated;
    });
    setEduForm({ degree: '', institution: '', startDate: '', endDate: '', gpa: '', description: '' });
  };

  const removeEducation = (id) => {
    setResumeData(prev => {
      const updated = {
        ...prev,
        education: prev.education.filter(item => item.id !== id)
      };
      syncToDatabase(updated);
      return updated;
    });
  };

  const addExperience = () => {
    if (!expForm.jobTitle || !expForm.company) return;
    setResumeData(prev => {
      const updated = {
        ...prev,
        experience: [...prev.experience, { ...expForm, id: Math.random().toString(36).substring(2, 9) }]
      };
      syncToDatabase(updated);
      return updated;
    });
    setExpForm({ jobTitle: '', company: '', location: '', startDate: '', endDate: '', current: false, responsibilities: '', achievements: '' });
  };

  const removeExperience = (id) => {
    setResumeData(prev => {
      const updated = {
        ...prev,
        experience: prev.experience.filter(item => item.id !== id)
      };
      syncToDatabase(updated);
      return updated;
    });
  };

  const addProject = () => {
    if (!projForm.projectName || !projForm.description) return;

    // Parse comma-separated technologies to list
    const techList = projForm.technologies
      ? projForm.technologies.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    setResumeData(prev => {
      const updated = {
        ...prev,
        projects: [...prev.projects, {
          ...projForm,
          technologies: techList,
          id: Math.random().toString(36).substring(2, 9)
        }]
      };
      syncToDatabase(updated);
      return updated;
    });
    setProjForm({ projectName: '', description: '', technologies: '', githubLink: '', liveDemoLink: '' });
  };

  const removeProject = (id) => {
    setResumeData(prev => {
      const updated = {
        ...prev,
        projects: prev.projects.filter(item => item.id !== id)
      };
      syncToDatabase(updated);
      return updated;
    });
  };

  // Tag inputs keyboard handlers
  const handleTagKeyDown = (e, category) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInputs[category].trim();
      if (!val) return;

      // Prevent duplicates
      if (resumeData.skills[category].includes(val)) {
        setTagInputs(prev => ({ ...prev, [category]: '' }));
        return;
      }

      setResumeData(prev => {
        const updated = {
          ...prev,
          skills: {
            ...prev.skills,
            [category]: [...prev.skills[category], val]
          }
        };
        syncToDatabase(updated);
        return updated;
      });
      setTagInputs(prev => ({ ...prev, [category]: '' }));
    }
  };

  const removeTag = (tag, category) => {
    setResumeData(prev => {
      const updated = {
        ...prev,
        skills: {
          ...prev.skills,
          [category]: prev.skills[category].filter(t => t !== tag)
        }
      };
      syncToDatabase(updated);
      return updated;
    });
  };

  // Export actions
  const handleExportPdf = () => {
    const safeName = (resumeData.personalInfo.fullName || 'resume').replace(/\s+/g, '_').toLowerCase();
    exportBuilderResumePDF(resumeData, `${safeName}_resume.pdf`, { pageBudget });
  };

  const handleExportDocx = async () => {
    setExportingDocx(true);
    try {
      const response = await axios.post(`${API_URL}/resumes/export/docx`, resumeData, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      const safeName = (resumeData.personalInfo.fullName || 'resume').replace(/\s+/g, '_').toLowerCase();
      a.download = `${safeName}_resume_${resumeData.designTemplate}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('DOCX export failed', err);
      setError('DOCX download failed. Please try again.');
    } finally {
      setExportingDocx(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const resumeHTML = document.getElementById('resume-print-box')?.innerHTML || '';

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Resume</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              body { padding: 0; margin: 0; }
              @page { size: A4; margin: 0; }
            }
          </style>
        </head>
        <body class="bg-white py-8">
          <div class="max-w-[800px] mx-auto">
            ${resumeHTML}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const changeTemplate = (tplId) => {
    setResumeData(prev => {
      const updated = { ...prev, designTemplate: tplId };
      syncToDatabase(updated);
      return updated;
    });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-stretch max-w-7xl mx-auto">

      {/* ── Import flow modals ─────────────────────────────────────────────── */}
      {showImportModals && importFlow === 'start' && (
        <ImportStartModal
          isOpen
          onScratch={handleImportStart}
          onImport={handleImportChoose}
        />
      )}

      {showImportModals && importFlow === 'upload' && (
        <ImportUploadModal
          isOpen
          onClose={dismissAllImportModals}
          onUploadStart={handleUploadStart}
          onSuccess={handleUploadSuccess}
          onError={handleUploadError}
          token={importAuthToken}
        />
      )}

      {showImportModals && importFlow === 'progress' && (
        <ImportProgressModal
          isOpen
          isDone={importDone}
        />
      )}

      {showImportModals && importFlow === 'review' && importedRawData && (
        <ImportReviewModal
          isOpen
          importedData={importedRawData}
          onConfirm={handleImportComplete}
          onCancel={dismissAllImportModals}
        />
      )}

      {showImportModals && importFlow === 'merge' && (
        <SmartMergeDialog
          isOpen
          conflicts={mergeConflicts}
          onResolve={handleMergeResolve}
          onCancel={dismissAllImportModals}
        />
      )}

      {showImportModals && importFlow === 'error' && (
        <ImportErrorPanel
          isOpen
          errorMsg={importError}
          rawText={null}
          onRetry={handleImportRetry}
          onManualEdit={handleImportManualEdit}
          onClose={dismissAllImportModals}
        />
      )}
      {/* Left: Input Form Controls */}
      <div className="flex-1 space-y-6">
        {/* Step Indicator Header */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground">Build Your Professional Resume</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Draft saved automatically.</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Import resume button */}
              <button
                onClick={openImportFlow}
                className="flex items-center gap-1.5 text-[10.5px] font-semibold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 px-2.5 py-1 rounded-full transition-all"
              >
                <Upload className="w-3 h-3" />
                Import Resume
              </button>

              {/* Clear resume button */}
              <button
                onClick={handleClearResume}
                className="flex items-center gap-1.5 text-[10.5px] font-semibold text-destructive/70 bg-destructive/8 hover:bg-destructive/15 border border-destructive/20 px-2.5 py-1 rounded-full transition-all"
                title="Clear all resume fields"
              >
                <RotateCcw className="w-3 h-3" />
                Clear
              </button>

              {user && (
                <div className="flex items-center gap-1.5 text-[10.5px] font-semibold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                  {saving ? (
                    <span>Syncing...</span>
                  ) : syncSuccess ? (
                    <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Draft Saved</span>
                  ) : (
                    <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Sync Active</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
            {STEPS.map(s => {
              const StepIcon = s.icon;
              const isPassed = activeStep > s.id;
              const isCurrent = activeStep === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveStep(s.id)}
                  className={`flex flex-col items-center gap-1.5 min-w-[70px] transition-all
                    ${isCurrent ? 'text-primary' : isPassed ? 'text-foreground/80' : 'text-muted-foreground/40'}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border text-xs font-bold transition-all
                    ${isCurrent ? 'border-primary bg-primary/10' : isPassed ? 'border-primary/50 bg-primary/5' : 'border-border'}`}>
                    <StepIcon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold tracking-tight">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Contents */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm min-h-[420px] relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* STEP 1: Personal Info */}
              {activeStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold border-b border-border pb-1.5 uppercase tracking-wider text-muted-foreground">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground">Full Name</label>
                      <Input
                        placeholder="Your Name"
                        value={resumeData.personalInfo.fullName}
                        onChange={e => handlePersonalInfoChange('fullName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground">Professional Title</label>
                      <Input
                        placeholder="Your Title"
                        value={resumeData.personalInfo.professionalTitle}
                        onChange={e => handlePersonalInfoChange('professionalTitle', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground">Email Address</label>
                      <Input
                        type="email"
                        placeholder="Your email address"
                        value={resumeData.personalInfo.email}
                        onChange={e => handlePersonalInfoChange('email', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground">Phone Number</label>
                      <Input
                        placeholder="Your phone number"
                        value={resumeData.personalInfo.phone}
                        onChange={e => handlePersonalInfoChange('phone', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground">Location</label>
                      <Input
                        placeholder="Location"
                        value={resumeData.personalInfo.location}
                        onChange={e => handlePersonalInfoChange('location', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground">LinkedIn Username/Link</label>
                      <Input
                        placeholder="linkedin.com/in/"
                        value={resumeData.personalInfo.linkedin}
                        onChange={e => handlePersonalInfoChange('linkedin', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground">GitHub Username/Link</label>
                      <Input
                        placeholder="github.com/name"
                        value={resumeData.personalInfo.github}
                        onChange={e => handlePersonalInfoChange('github', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground">Portfolio Website</label>
                      <Input
                        placeholder="name.dev"
                        value={resumeData.personalInfo.portfolioWebsite}
                        onChange={e => handlePersonalInfoChange('portfolioWebsite', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Professional Summary</label>
                    <Textarea
                      rows={5}
                      placeholder="Briefly explain your background, core strengths, and what you aim to achieve..."
                      value={resumeData.personalInfo.professionalSummary}
                      onChange={e => handlePersonalInfoChange('professionalSummary', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: Education */}
              {activeStep === 2 && (
                <div className="space-y-5">
                  <h3 className="text-sm font-bold border-b border-border pb-1.5 uppercase tracking-wider text-muted-foreground">Education Credentials</h3>

                  {/* List of educations */}
                  {resumeData.education.length > 0 && (
                    <div className="space-y-2.5">
                      {resumeData.education.map(item => (
                        <div key={item.id} className="flex justify-between items-center p-3 rounded-xl border border-border bg-muted/30">
                          <div>
                            <p className="text-xs font-bold text-foreground">{item.degree} @ {item.institution}</p>
                            <p className="text-[10px] text-muted-foreground">{item.startDate} – {item.endDate} {item.gpa && `· GPA: ${item.gpa}`}</p>
                          </div>
                          <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-red-400" onClick={() => removeEducation(item.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add form */}
                  <div className="border border-border rounded-xl p-4 space-y-4 bg-muted/10">
                    <h4 className="text-xs font-bold uppercase tracking-wider">Add Education</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input placeholder="Degree (e.g. B.S. Computer Science)" value={eduForm.degree} onChange={e => setEduForm(prev => ({ ...prev, degree: e.target.value }))} />
                      <Input placeholder="Institution (e.g. Stanford University)" value={eduForm.institution} onChange={e => setEduForm(prev => ({ ...prev, institution: e.target.value }))} />
                      <Input placeholder="Start Date (e.g. Sept 2020)" value={eduForm.startDate} onChange={e => setEduForm(prev => ({ ...prev, startDate: e.target.value }))} />
                      <Input placeholder="End Date (e.g. June 2024)" value={eduForm.endDate} onChange={e => setEduForm(prev => ({ ...prev, endDate: e.target.value }))} />
                      <Input placeholder="CGPA / Percentage (e.g. 3.92 / 4.0)" value={eduForm.gpa} onChange={e => setEduForm(prev => ({ ...prev, gpa: e.target.value }))} />
                      <Input placeholder="Minor / Brief Description" value={eduForm.description} onChange={e => setEduForm(prev => ({ ...prev, description: e.target.value }))} />
                    </div>
                    <Button size="sm" onClick={addEducation} className="rounded-lg gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Education</Button>
                  </div>
                </div>
              )}

              {/* STEP 3: Experience */}
              {activeStep === 3 && (
                <div className="space-y-5">
                  <h3 className="text-sm font-bold border-b border-border pb-1.5 uppercase tracking-wider text-muted-foreground">Work Experience</h3>

                  {/* List of experiences */}
                  {resumeData.experience.length > 0 && (
                    <div className="space-y-2.5">
                      {resumeData.experience.map(item => (
                        <div key={item.id} className="flex justify-between items-center p-3 rounded-xl border border-border bg-muted/30">
                          <div>
                            <p className="text-xs font-bold text-foreground">{item.jobTitle} @ {item.company}</p>
                            <p className="text-[10px] text-muted-foreground">{item.startDate} – {item.endDate || (item.current ? 'Present' : '')} {item.location && `· ${item.location}`}</p>
                          </div>
                          <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-red-400" onClick={() => removeExperience(item.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add form */}
                  <div className="border border-border rounded-xl p-4 space-y-4 bg-muted/10">
                    <h4 className="text-xs font-bold uppercase tracking-wider">Add Experience</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input placeholder="Job Title (e.g. Frontend Engineer)" value={expForm.jobTitle} onChange={e => setExpForm(prev => ({ ...prev, jobTitle: e.target.value }))} />
                      <Input placeholder="Company (e.g. Netflix)" value={expForm.company} onChange={e => setExpForm(prev => ({ ...prev, company: e.target.value }))} />
                      <Input placeholder="Location (e.g. Los Gatos, CA)" value={expForm.location} onChange={e => setExpForm(prev => ({ ...prev, location: e.target.value }))} />
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Start (e.g. Jan 2022)" value={expForm.startDate} onChange={e => setExpForm(prev => ({ ...prev, startDate: e.target.value }))} />
                        <Input placeholder="End (e.g. Present)" disabled={expForm.current} value={expForm.endDate} onChange={e => setExpForm(prev => ({ ...prev, endDate: e.target.value }))} />
                      </div>
                      <div className="sm:col-span-2 flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="current-check"
                          checked={expForm.current}
                          onChange={e => setExpForm(prev => ({ ...prev, current: e.target.checked, endDate: e.target.checked ? '' : prev.endDate }))}
                          className="rounded text-primary border-border focus:ring-primary"
                        />
                        <label htmlFor="current-check" className="text-xs font-medium text-muted-foreground select-none cursor-pointer">I currently work here</label>
                      </div>
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Responsibilities (One bullet per line)</label>
                        <Textarea rows={4} placeholder="Designed and implemented critical user dashboard modules..." value={expForm.responsibilities} onChange={e => setExpForm(prev => ({ ...prev, responsibilities: e.target.value }))} />
                      </div>
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Key Achievement (Optional)</label>
                        <Input placeholder="Boosted conversion rate by 18% through performance audits." value={expForm.achievements} onChange={e => setExpForm(prev => ({ ...prev, achievements: e.target.value }))} />
                      </div>
                    </div>
                    <Button size="sm" onClick={addExperience} className="rounded-lg gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Experience</Button>
                  </div>
                </div>
              )}

              {/* STEP 4: Skills */}
              {activeStep === 4 && (
                <div className="space-y-6">
                  <h3 className="text-sm font-bold border-b border-border pb-1.5 uppercase tracking-wider text-muted-foreground">Skills & Languages</h3>

                  {[
                    { key: 'technical', label: 'Technical / Hard Skills', placeholder: 'React, Node.js, Python, PostgreSQL, AWS...' },
                    { key: 'soft', label: 'Soft Skills / Areas of Expertise', placeholder: 'Project Management, Public Speaking, Mentoring...' },
                    { key: 'languages', label: 'Languages', placeholder: 'English (Fluent), Spanish (Conversational)...' },
                    { key: 'certifications', label: 'Certifications', placeholder: 'AWS Certified Solutions Architect, PMP...' }
                  ].map(cat => (
                    <div key={cat.key} className="space-y-2.5">
                      <label className="text-xs font-bold text-foreground block">{cat.label}</label>

                      {/* Render tags */}
                      <div className="flex flex-wrap gap-1.5">
                        {resumeData.skills[cat.key]?.map(tag => (
                          <Badge key={tag} variant="secondary" className="gap-1 px-2.5 py-0.5 rounded-full border-border bg-secondary text-foreground text-[10px] font-semibold">
                            {tag}
                            <button onClick={() => removeTag(tag, cat.key)} className="text-muted-foreground/60 hover:text-foreground">×</button>
                          </Badge>
                        ))}
                      </div>

                      <Input
                        placeholder={`Type a skill and press Enter or Comma (e.g. ${cat.placeholder})`}
                        value={tagInputs[cat.key]}
                        onChange={e => setTagInputs(prev => ({ ...prev, [cat.key]: e.target.value }))}
                        onKeyDown={e => handleTagKeyDown(e, cat.key)}
                        className="bg-white/3"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* STEP 5: Projects */}
              {activeStep === 5 && (
                <div className="space-y-5">
                  <h3 className="text-sm font-bold border-b border-border pb-1.5 uppercase tracking-wider text-muted-foreground">Project Portfolio</h3>

                  {/* List of projects */}
                  {resumeData.projects.length > 0 && (
                    <div className="space-y-2.5">
                      {resumeData.projects.map(item => (
                        <ProjectCard
                          key={item.id}
                          item={item}
                          onRemove={() => removeProject(item.id)}
                          onUpdate={(updatedItem) => {
                            setResumeData(prev => {
                              const updated = {
                                ...prev,
                                projects: prev.projects.map(p => p.id === updatedItem.id ? updatedItem : p)
                              };
                              syncToDatabase(updated);
                              return updated;
                            });
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Add form */}
                  <div className="border border-border rounded-xl p-4 space-y-4 bg-muted/10">
                    <h4 className="text-xs font-bold uppercase tracking-wider">Add Project</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input placeholder="Project Name (e.g. E-Commerce Platform)" value={projForm.projectName} onChange={e => setProjForm(prev => ({ ...prev, projectName: e.target.value }))} />
                      <Input placeholder="Technologies (Comma separated: React, Redis, GCP)" value={projForm.technologies} onChange={e => setProjForm(prev => ({ ...prev, technologies: e.target.value }))} />
                      <Input placeholder="GitHub Link (e.g. github.com/username/project)" value={projForm.githubLink} onChange={e => setProjForm(prev => ({ ...prev, githubLink: e.target.value }))} />
                      <Input placeholder="Live Demo URL (e.g. project-live.com)" value={projForm.liveDemoLink} onChange={e => setProjForm(prev => ({ ...prev, liveDemoLink: e.target.value }))} />
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Project Description</label>
                        <Textarea rows={3} placeholder="Engineered a low-latency caching system..." value={projForm.description} onChange={e => setProjForm(prev => ({ ...prev, description: e.target.value }))} />
                      </div>
                    </div>
                    <Button size="sm" onClick={addProject} className="rounded-lg gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Project</Button>
                  </div>
                </div>
              )}

              {/* STEP 6: Design & Template Pick */}
              {activeStep === 6 && (
                <div className="space-y-6">
                  <h3 className="text-sm font-bold border-b border-border pb-1.5 uppercase tracking-wider text-muted-foreground">Select Resume Design Template</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { id: 'modern_professional', label: 'Modern Professional', desc: 'Clean sans-serif fonts with elegant blue headers' },
                      { id: 'ats_friendly', label: 'ATS Friendly', desc: 'Pure black-and-white layout optimized for parser readability' },
                      { id: 'minimal', label: 'Minimalist', desc: 'Delicate light weight typography with ample breathing room' },
                      { id: 'corporate', label: 'Executive Corporate', desc: 'Classic structural dividers matching corporate guidelines' },
                      { id: 'developer', label: 'Developer Monospaced', desc: 'Sleek dark command-line vibe optimized for technology stacks' },
                    ].map(tpl => (
                      <button
                        key={tpl.id}
                        onClick={() => changeTemplate(tpl.id)}
                        className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between min-h-[86px]
                          ${resumeData.designTemplate === tpl.id
                            ? 'border-primary bg-primary/5 shadow-sm text-foreground'
                            : 'border-border bg-white/2 text-muted-foreground hover:border-muted-foreground/30'}`}
                      >
                        <span className="text-xs font-bold block">{tpl.label}</span>
                        <span className="text-[10px] text-muted-foreground/70 leading-normal mt-1">{tpl.desc}</span>
                      </button>
                    ))}
                  </div>

                  {/* Actions summary */}
                  <div className="border-t border-border pt-5 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider">Export Actions</h4>

                    {error && (
                      <div className="text-xs text-red-500 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4" /> {error}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <Button onClick={handleExportPdf} className="rounded-xl gap-1.5 py-2.5 bg-primary hover:bg-primary/95 text-white">
                        <Download className="w-4 h-4" /> Download PDF
                      </Button>
                      <Button onClick={handleExportDocx} disabled={exportingDocx} variant="outline" className="rounded-xl gap-1.5 py-2.5">
                        <FileText className="w-4 h-4 text-primary" /> Download DOCX
                      </Button>
                      <Button onClick={handlePrint} variant="outline" className="rounded-xl gap-1.5 py-2.5">
                        <Printer className="w-4 h-4" /> Print Document
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Stepper Navigation Footer */}
          <div className="border-t border-border mt-8 pt-4 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              disabled={activeStep === 1}
              onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
              className="rounded-lg gap-1 text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Button>

            {activeStep < 6 ? (
              <Button
                size="sm"
                onClick={() => setActiveStep(prev => Math.min(6, prev + 1))}
                className="rounded-lg gap-1 text-xs"
              >
                Next <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <div className="text-[10px] text-muted-foreground">All steps completed</div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Live Preview Box */}
      <div className="lg:w-[480px] xl:w-[500px] flex flex-col gap-3 flex-shrink-0">
        <div className="flex items-center justify-between bg-card border border-border px-4 py-2 rounded-xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Live Preview</span>
            <Badge variant="secondary" className="text-[9px] px-2 py-0.5 rounded-md font-mono border-border bg-secondary">
              {resumeData.designTemplate}
            </Badge>
          </div>

          {/* Page Budget selector (1 Page Fit vs 2 Pages) */}
          <div className="flex items-center gap-1 bg-muted/65 p-0.5 rounded-lg border border-border">
            <button
              onClick={() => setPageBudget(1)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-all ${pageBudget === 1
                ? 'bg-background text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              1 Page Fit
            </button>
            <button
              onClick={() => setPageBudget(2)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-all ${pageBudget === 2
                ? 'bg-background text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              2 Pages
            </button>
          </div>
        </div>

        {/* Outer scrolling preview wrapper */}
        <div className="border border-border rounded-xl bg-muted/30 p-3 overflow-auto max-h-[720px] shadow-sm flex items-center justify-center">
          <AutoSizedPreview pageBudget={pageBudget}>
            <ResumeTemplates
              resumeData={previewResumeData}
              templateId={resumeData.designTemplate}
              isBuilderMode={true}
            />
          </AutoSizedPreview>
        </div>
      </div>

      {/* Hidden Container for Clean Print (No empty states or drafts) */}
      <div className="hidden">
        <div id="resume-print-box">
          <ResumeTemplates
            resumeData={resumeData}
            templateId={resumeData.designTemplate}
            isBuilderMode={false}
          />
        </div>
      </div>
    </div>
  );
}
