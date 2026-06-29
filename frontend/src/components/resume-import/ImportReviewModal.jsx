import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, AlertTriangle, Edit3, Trash2, Plus, ChevronDown, ChevronUp,
  User, BookOpen, Briefcase, Wrench, FolderGit, Shield, Trophy, X, Check,
  Sparkles, FileCheck
} from 'lucide-react';
import {
  cfValue, cfConfidence, cfHasValue,
  isLowConfidence, computeOverallConfidence, mapImportedToBuilderSchema,
  normalizeSkills
} from '@/lib/resumeImportUtils';

const CONFIDENCE_THRESHOLD = 80;

// ─── Confidence badge ──────────────────────────────────────────────────────────

function ConfidenceBadge({ confidence }) {
  const isLow = confidence < CONFIDENCE_THRESHOLD;
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
      isLow
        ? 'bg-amber-500/15 text-amber-500 border border-amber-500/25'
        : 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/25'
    }`}>
      {isLow ? <AlertTriangle className="w-2.5 h-2.5" /> : <CheckCircle2 className="w-2.5 h-2.5" />}
      {confidence}%
    </span>
  );
}

// ─── Editable field ────────────────────────────────────────────────────────────

function EditableField({ label, cf, onEdit, placeholder = '—' }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const confidence = cfConfidence(cf);
  const value = cfValue(cf, '');
  const hasVal = cfHasValue(cf);
  const lowConf = hasVal && isLowConfidence(confidence);

  const startEdit = () => { setDraft(value || ''); setEditing(true); };
  const commitEdit = () => { onEdit(draft); setEditing(false); };
  const cancelEdit = () => setEditing(false);

  return (
    <div className={`rounded-lg p-3 border transition-colors ${
      lowConf
        ? 'border-amber-500/30 bg-amber-500/4'
        : 'border-border/40 bg-muted/20'
    }`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className="flex items-center gap-1.5">
          {hasVal && <ConfidenceBadge confidence={confidence} />}
          {!editing && (
            <button
              onClick={startEdit}
              className="w-5 h-5 flex items-center justify-center text-muted-foreground/50 hover:text-primary transition-colors rounded"
            >
              <Edit3 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="space-y-2">
          {value && value.length > 80 ? (
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              rows={4}
              autoFocus
              className="w-full text-xs bg-card border border-border rounded-md px-2.5 py-2 text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          ) : (
            <input
              type="text"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              autoFocus
              className="w-full text-xs bg-card border border-border rounded-md px-2.5 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          )}
          <div className="flex gap-1.5">
            <button
              onClick={commitEdit}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/15 text-primary text-[10px] font-bold hover:bg-primary/25 transition-colors"
            >
              <Check className="w-3 h-3" /> Save
            </button>
            <button
              onClick={cancelEdit}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-muted-foreground text-[10px] hover:text-foreground transition-colors"
            >
              <X className="w-3 h-3" /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className={`text-xs leading-relaxed break-words ${hasVal ? 'text-foreground' : 'text-muted-foreground/40 italic'}`}>
          {hasVal ? value : placeholder}
        </p>
      )}

      {lowConf && hasVal && (
        <p className="text-[10px] text-amber-500/80 mt-1.5 flex items-center gap-1">
          <AlertTriangle className="w-2.5 h-2.5" />
          Low confidence — please verify this field
        </p>
      )}
    </div>
  );
}

// ─── Section card wrapper ──────────────────────────────────────────────────────

function SectionCard({ title, icon: Icon, color = 'primary', isEmpty, children, extra }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/50 overflow-hidden"
      style={{ background: 'var(--color-card)' }}
    >
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-4 py-3.5 border-b border-border/30 hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center bg-${color}/15`}>
            <Icon className={`w-4 h-4 text-${color}`} />
          </div>
          <span className="text-sm font-semibold text-foreground">{title}</span>
          {isEmpty && (
            <span className="text-[10px] text-muted-foreground/50 px-1.5 py-0.5 rounded bg-muted/40">Not found</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {extra}
          {collapsed ? <ChevronDown className="w-4 h-4 text-muted-foreground/50" /> : <ChevronUp className="w-4 h-4 text-muted-foreground/50" />}
        </div>
      </button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="p-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Tag list (skills, certs etc.) ────────────────────────────────────────────

function TagList({ items, onRemove, onAdd }) {
  const [newTag, setNewTag] = useState('');
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {(items || []).map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/15"
          >
            {tag}
            <button onClick={() => onRemove(i)} className="hover:text-destructive transition-colors ml-0.5">
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
        {(!items || items.length === 0) && (
          <span className="text-xs text-muted-foreground/40 italic">No items extracted</span>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={newTag}
          onChange={e => setNewTag(e.target.value)}
          onKeyDown={e => {
            if ((e.key === 'Enter' || e.key === ',') && newTag.trim()) {
              e.preventDefault();
              onAdd(newTag.trim());
              setNewTag('');
            }
          }}
          placeholder="Add item and press Enter..."
          className="flex-1 text-xs bg-muted/30 border border-border/50 rounded-lg px-3 py-1.5 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
      </div>
    </div>
  );
}

// ─── Main Review Modal ─────────────────────────────────────────────────────────

/**
 * ImportReviewModal
 *
 * The full review screen showing all extracted sections. User can:
 *   • Edit any field inline
 *   • Remove items from lists
 *   • Add more items
 *   • Accept all and import
 *
 * Props:
 *   isOpen        {boolean}
 *   importedData  {Object}          — raw ImportedResume from backend
 *   onConfirm     {(builderData) => void}
 *   onCancel      {() => void}
 */
export default function ImportReviewModal({ isOpen, importedData, onConfirm, onCancel }) {
  // Local editable state — starts as a deep clone of importedData
  const [data, setData] = useState(null);

  // Initialize local state when data arrives
  React.useEffect(() => {
    if (importedData) {
      setData(JSON.parse(JSON.stringify(importedData)));
    }
  }, [importedData]);

  const updatePersonal = useCallback((field, value) => {
    setData(prev => ({
      ...prev,
      personal: {
        ...prev.personal,
        [field]: { ...prev.personal[field], value }
      }
    }));
  }, []);

  const updateSummary = useCallback((value) => {
    setData(prev => ({ ...prev, summary: { ...prev.summary, value } }));
  }, []);

  const updateEduField = useCallback((idx, field, value) => {
    setData(prev => {
      const edu = [...prev.education];
      edu[idx] = { ...edu[idx], [field]: { ...edu[idx][field], value } };
      return { ...prev, education: edu };
    });
  }, []);

  const removeEdu = useCallback((idx) => {
    setData(prev => ({ ...prev, education: prev.education.filter((_, i) => i !== idx) }));
  }, []);

  const updateExpField = useCallback((idx, field, value) => {
    setData(prev => {
      const exp = [...prev.experience];
      exp[idx] = { ...exp[idx], [field]: { ...exp[idx][field], value } };
      return { ...prev, experience: exp };
    });
  }, []);

  const removeExp = useCallback((idx) => {
    setData(prev => ({ ...prev, experience: prev.experience.filter((_, i) => i !== idx) }));
  }, []);

  const updateProjField = useCallback((idx, field, value) => {
    setData(prev => {
      const projs = [...prev.projects];
      projs[idx] = { ...projs[idx], [field]: { ...projs[idx][field], value } };
      return { ...prev, projects: projs };
    });
  }, []);

  const removeProj = useCallback((idx) => {
    setData(prev => ({ ...prev, projects: prev.projects.filter((_, i) => i !== idx) }));
  }, []);

  const updateSkillCategory = useCallback((category, items) => {
    setData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: { ...prev.skills[category], value: items }
      }
    }));
  }, []);

  const removeSkill = useCallback((category, idx) => {
    setData(prev => {
      const items = [...(cfValue(prev.skills[category], []) || [])];
      items.splice(idx, 1);
      return {
        ...prev,
        skills: { ...prev.skills, [category]: { ...prev.skills[category], value: items } }
      };
    });
  }, []);

  const addSkill = useCallback((category, tag) => {
    setData(prev => {
      const existing = cfValue(prev.skills[category], []) || [];
      const deduped = normalizeSkills([...existing, tag]);
      return {
        ...prev,
        skills: { ...prev.skills, [category]: { ...prev.skills[category], value: deduped } }
      };
    });
  }, []);

  const removeCert = useCallback((idx) => {
    setData(prev => {
      const items = [...(cfValue(prev.certifications, []) || [])];
      items.splice(idx, 1);
      return { ...prev, certifications: { ...prev.certifications, value: items } };
    });
  }, []);

  const addCert = useCallback((tag) => {
    setData(prev => {
      const existing = cfValue(prev.certifications, []) || [];
      return { ...prev, certifications: { ...prev.certifications, value: [...existing, tag] } };
    });
  }, []);

  const handleConfirm = () => {
    const builderData = mapImportedToBuilderSchema(data);
    onConfirm(builderData);
  };

  if (!isOpen || !data) return null;

  const overallConfidence = computeOverallConfidence(data);
  const personal = data.personal || {};

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
          style={{ backdropFilter: 'blur(10px)', backgroundColor: 'rgba(0,0,0,0.72)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            className="relative w-full max-w-3xl max-h-[95vh] flex flex-col"
          >
            {/* Glow */}
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/20 to-transparent blur-xl opacity-40 pointer-events-none" />

            <div
              className="relative rounded-2xl border border-border/60 shadow-2xl flex flex-col overflow-hidden"
              style={{ background: 'var(--color-card)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border/40 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
                    <FileCheck className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">Review Extracted Data</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-muted-foreground">
                        Edit, delete, or add fields before importing
                      </p>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        overallConfidence >= CONFIDENCE_THRESHOLD
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : 'bg-amber-500/15 text-amber-500'
                      }`}>
                        <Sparkles className="w-2.5 h-2.5" />
                        {overallConfidence}% avg confidence
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onCancel}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">

                {/* ── Personal Info ── */}
                <SectionCard title="Personal Information" icon={User} color="primary">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      ['fullName', 'Full Name'],
                      ['professionalTitle', 'Professional Title'],
                      ['email', 'Email'],
                      ['phone', 'Phone'],
                      ['location', 'Location'],
                      ['linkedin', 'LinkedIn'],
                      ['github', 'GitHub'],
                      ['portfolioWebsite', 'Portfolio Website'],
                    ].map(([field, label]) => (
                      <EditableField
                        key={field}
                        label={label}
                        cf={personal[field]}
                        onEdit={v => updatePersonal(field, v)}
                        placeholder="Not found"
                      />
                    ))}
                    <div className="sm:col-span-2">
                      <EditableField
                        label="Professional Summary"
                        cf={data.summary}
                        onEdit={updateSummary}
                        placeholder="Not found"
                      />
                    </div>
                  </div>
                </SectionCard>

                {/* ── Education ── */}
                <SectionCard
                  title="Education"
                  icon={BookOpen}
                  color="violet-500"
                  isEmpty={!data.education || data.education.length === 0}
                >
                  {(data.education || []).length === 0 ? (
                    <p className="text-xs text-muted-foreground/50 italic">No education entries were found.</p>
                  ) : (
                    <div className="space-y-4">
                      {data.education.map((edu, idx) => (
                        <div key={idx} className="space-y-2 pb-4 border-b border-border/30 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-foreground/60">Entry {idx + 1}</span>
                            <button
                              onClick={() => removeEdu(idx)}
                              className="flex items-center gap-1 text-[10px] text-destructive/60 hover:text-destructive transition-colors px-2 py-0.5 rounded hover:bg-destructive/8"
                            >
                              <Trash2 className="w-3 h-3" /> Remove
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              ['degree', 'Degree'],
                              ['institution', 'Institution'],
                              ['startDate', 'Start Date'],
                              ['endDate', 'End Date'],
                              ['gpa', 'GPA'],
                              ['location', 'Location'],
                            ].map(([field, label]) => (
                              <EditableField
                                key={field}
                                label={label}
                                cf={edu[field]}
                                onEdit={v => updateEduField(idx, field, v)}
                              />
                            ))}
                          </div>
                          {edu.description && (
                            <div className="col-span-2">
                              <EditableField
                                label="Description"
                                cf={edu.description}
                                onEdit={v => updateEduField(idx, 'description', v)}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>

                {/* ── Experience ── */}
                <SectionCard
                  title="Work Experience"
                  icon={Briefcase}
                  color="blue-500"
                  isEmpty={!data.experience || data.experience.length === 0}
                >
                  {(data.experience || []).length === 0 ? (
                    <p className="text-xs text-muted-foreground/50 italic">No experience entries were found.</p>
                  ) : (
                    <div className="space-y-4">
                      {data.experience.map((exp, idx) => (
                        <div key={idx} className="space-y-2 pb-4 border-b border-border/30 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-foreground/60">Entry {idx + 1}</span>
                            <button
                              onClick={() => removeExp(idx)}
                              className="flex items-center gap-1 text-[10px] text-destructive/60 hover:text-destructive transition-colors px-2 py-0.5 rounded hover:bg-destructive/8"
                            >
                              <Trash2 className="w-3 h-3" /> Remove
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              ['jobTitle', 'Job Title'],
                              ['company', 'Company'],
                              ['employmentType', 'Employment Type'],
                              ['location', 'Location'],
                              ['startDate', 'Start Date'],
                              ['endDate', 'End Date'],
                            ].map(([field, label]) => (
                              <EditableField
                                key={field}
                                label={label}
                                cf={exp[field]}
                                onEdit={v => updateExpField(idx, field, v)}
                              />
                            ))}
                          </div>
                          <EditableField
                            label="Responsibilities"
                            cf={exp.responsibilities}
                            onEdit={v => updateExpField(idx, 'responsibilities', v)}
                          />
                          <EditableField
                            label="Achievements"
                            cf={exp.achievements}
                            onEdit={v => updateExpField(idx, 'achievements', v)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>

                {/* ── Projects ── */}
                <SectionCard
                  title="Projects"
                  icon={FolderGit}
                  color="cyan-500"
                  isEmpty={!data.projects || data.projects.length === 0}
                >
                  {(data.projects || []).length === 0 ? (
                    <p className="text-xs text-muted-foreground/50 italic">No projects were found.</p>
                  ) : (
                    <div className="space-y-4">
                      {data.projects.map((proj, idx) => (
                        <div key={idx} className="space-y-2 pb-4 border-b border-border/30 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-foreground/60">Project {idx + 1}</span>
                            <button
                              onClick={() => removeProj(idx)}
                              className="flex items-center gap-1 text-[10px] text-destructive/60 hover:text-destructive transition-colors px-2 py-0.5 rounded hover:bg-destructive/8"
                            >
                              <Trash2 className="w-3 h-3" /> Remove
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              ['projectName', 'Project Name'],
                              ['githubLink', 'GitHub Link'],
                              ['liveLink', 'Live Link'],
                            ].map(([field, label]) => (
                              <EditableField
                                key={field}
                                label={label}
                                cf={proj[field]}
                                onEdit={v => updateProjField(idx, field, v)}
                              />
                            ))}
                          </div>
                          <EditableField
                            label="Description"
                            cf={proj.description}
                            onEdit={v => updateProjField(idx, 'description', v)}
                          />
                          {/* Technologies as tags */}
                          <div className="rounded-lg p-3 border border-border/40 bg-muted/20">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Technologies</span>
                            <div className="mt-2">
                              <TagList
                                items={cfValue(proj.technologies, [])}
                                onRemove={(i) => {
                                  const items = [...(cfValue(proj.technologies, []) || [])];
                                  items.splice(i, 1);
                                  updateProjField(idx, 'technologies', items);
                                }}
                                onAdd={(tag) => {
                                  const items = [...(cfValue(proj.technologies, []) || []), tag];
                                  updateProjField(idx, 'technologies', items);
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>

                {/* ── Skills ── */}
                <SectionCard title="Skills" icon={Wrench} color="emerald-500">
                  <div className="space-y-4">
                    {[
                      ['technical', 'Technical Skills'],
                      ['soft', 'Soft Skills'],
                      ['tools', 'Tools'],
                      ['languages', 'Programming Languages'],
                    ].map(([cat, label]) => {
                      const cf = data.skills?.[cat];
                      const items = cfValue(cf, []) || [];
                      return (
                        <div key={cat} className="rounded-lg p-3 border border-border/40 bg-muted/20">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
                            {cf && cfHasValue(cf) && <ConfidenceBadge confidence={cfConfidence(cf)} />}
                          </div>
                          <TagList
                            items={items}
                            onRemove={(i) => removeSkill(cat, i)}
                            onAdd={(tag) => addSkill(cat, tag)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </SectionCard>

                {/* ── Certifications ── */}
                <SectionCard
                  title="Certifications"
                  icon={Shield}
                  color="purple-500"
                  isEmpty={!cfHasValue(data.certifications)}
                >
                  <div className="rounded-lg p-3 border border-border/40 bg-muted/20">
                    {data.certifications && <div className="flex items-center gap-2 mb-2">
                      {cfHasValue(data.certifications) && <ConfidenceBadge confidence={cfConfidence(data.certifications)} />}
                    </div>}
                    <TagList
                      items={cfValue(data.certifications, [])}
                      onRemove={removeCert}
                      onAdd={addCert}
                    />
                  </div>
                </SectionCard>

                {/* ── Achievements ── */}
                {cfHasValue(data.achievements) && (
                  <SectionCard title="Achievements" icon={Trophy} color="amber-500">
                    <div className="space-y-1.5">
                      {(cfValue(data.achievements, []) || []).map((item, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-foreground">
                          <span className="text-primary mt-0.5 shrink-0">•</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-border/40 flex items-center gap-3 shrink-0 bg-card/80">
                <button
                  onClick={onCancel}
                  className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                >
                  Cancel
                </button>
                <div className="flex-1" />
                <p className="text-xs text-muted-foreground/50 hidden sm:block">
                  You can edit any field after importing
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleConfirm}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm & Import
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
