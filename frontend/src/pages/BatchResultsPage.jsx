import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowUpDown, CheckSquare, Square, Filter, Download,
  FileText, ChevronDown, ChevronUp, Users, AlertCircle,
  X, Eye, Briefcase, Target, CheckCircle2, XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import GlassCard from '@/components/shared/GlassCard';
import CircularScore from '@/components/shared/CircularScore';
import EmptyState from '@/components/shared/EmptyState';
import { useAuth } from '@/context/AuthContext';

function getScoreColor(score) {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-blue-400';
  if (score >= 40) return 'text-amber-400';
  return 'text-red-400';
}

function getScoreBg(score) {
  if (score >= 80) return 'bg-emerald-500/15 border-emerald-500/30';
  if (score >= 60) return 'bg-blue-500/15 border-blue-500/30';
  if (score >= 40) return 'bg-amber-500/15 border-amber-500/30';
  return 'bg-red-500/15 border-red-500/30';
}

function ScorePill({ score, label }) {
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${getScoreBg(score)} ${getScoreColor(score)}`}>
      {label && <span className="text-[10px] font-normal opacity-70">{label}</span>}
      {score}
    </div>
  );
}

export default function BatchResultsPage() {
  const navigate = useNavigate();
  const { batchResults } = useAuth();
  const [sortBy, setSortBy] = useState('ats_score');
  const [sortDir, setSortDir] = useState('desc');
  const [minScore, setMinScore] = useState(0);
  const [expFilter, setExpFilter] = useState('all');
  const [shortlisted, setShortlisted] = useState(new Set());
  const [expandedId, setExpandedId] = useState(null);
  const [compareIds, setCompareIds] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const [showShortlistOnly, setShowShortlistOnly] = useState(false);

  const successResults = useMemo(() => {
    if (!batchResults || !batchResults.results) return [];
    return batchResults.results.filter(r => r.success);
  }, [batchResults]);

  const failedResults = useMemo(() => {
    if (!batchResults || !batchResults.results) return [];
    return batchResults.results.filter(r => !r.success);
  }, [batchResults]);

  const toggleSort = (field) => {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('desc'); }
  };

  const toggleShortlist = (id) => {
    setShortlisted(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleCompare = (id) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const filtered = useMemo(() => {
    let items = [...successResults];
    if (minScore > 0) items = items.filter(r => (r.analysis?.ats_score || 0) >= minScore);
    if (expFilter !== 'all') items = items.filter(r => r.analysis?.experience_level === expFilter);
    if (showShortlistOnly) items = items.filter(r => shortlisted.has(r.id));
    items.sort((a, b) => {
      let va, vb;
      if (sortBy === 'ats_score') { va = a.analysis?.ats_score || 0; vb = b.analysis?.ats_score || 0; }
      else if (sortBy === 'job_match') { va = a.analysis?.job_match_score ?? -1; vb = b.analysis?.job_match_score ?? -1; }
      else { va = a.filename.toLowerCase(); vb = b.filename.toLowerCase(); }
      if (sortDir === 'asc') return va > vb ? 1 : -1;
      return va < vb ? 1 : -1;
    });
    return items;
  }, [successResults, sortBy, sortDir, minScore, expFilter, showShortlistOnly, shortlisted]);

  if (!batchResults || !batchResults.results) {
    return (
      <div className="max-w-5xl mx-auto">
        <EmptyState
          icon="history"
          title="No Batch Results"
          description="Upload multiple resumes to see batch analysis results here."
          action={<Button onClick={() => navigate('/dashboard')} className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 rounded-xl">Upload Resumes</Button>}
        />
      </div>
    );
  }

  const avgAts = successResults.length > 0
    ? Math.round(successResults.reduce((s, r) => s + (r.analysis?.ats_score || 0), 0) / successResults.length)
    : 0;
  const avgMatch = successResults.filter(r => r.analysis?.job_match_score != null).length > 0
    ? Math.round(successResults.filter(r => r.analysis?.job_match_score != null).reduce((s, r) => s + r.analysis.job_match_score, 0) / successResults.filter(r => r.analysis?.job_match_score != null).length)
    : null;

  const compareItems = compareIds.map(id => successResults.find(r => r.id === id)).filter(Boolean);

  const exportShortlist = () => {
    const items = successResults.filter(r => shortlisted.has(r.id));
    const lines = ['SHORTLISTED RESUMES', '='.repeat(50), ''];
    if (batchResults.job_description) lines.push(`Job Description: ${batchResults.job_description.slice(0, 200)}...`, '');
    items.forEach((r, i) => {
      const a = r.analysis;
      lines.push(`${i + 1}. ${r.filename}`);
      lines.push(`   ATS Score: ${a?.ats_score || 'N/A'}`);
      if (a?.job_match_score != null) lines.push(`   Job Match: ${a.job_match_score}%`);
      lines.push(`   Experience: ${a?.experience_level || 'N/A'}`);
      lines.push(`   Strengths: ${(a?.strengths || []).slice(0, 3).join('; ')}`);
      lines.push('');
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'shortlisted_resumes.txt'; link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="rounded-xl">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-lg font-heading font-semibold">Batch Analysis Results</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {batchResults.total} uploaded • {batchResults.successful} analyzed • {batchResults.failed} failed
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {shortlisted.size > 0 && (
            <Button variant="outline" size="sm" onClick={exportShortlist} className="rounded-xl glass text-xs">
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export Shortlist ({shortlisted.size})
            </Button>
          )}
          {compareIds.length >= 2 && (
            <Button size="sm" onClick={() => setShowCompare(true)} className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 text-xs">
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              Compare ({compareIds.length})
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Analyzed', value: batchResults.successful, icon: FileText, color: 'text-primary' },
          { label: 'Avg ATS Score', value: avgAts, icon: Target, color: getScoreColor(avgAts) },
          { label: 'Avg Job Match', value: avgMatch != null ? `${avgMatch}%` : 'N/A', icon: Briefcase, color: avgMatch ? getScoreColor(avgMatch) : 'text-muted-foreground' },
          { label: 'Shortlisted', value: shortlisted.size, icon: CheckSquare, color: 'text-emerald-400' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <GlassCard hover={false} className="text-center py-4">
              <stat.icon className={`w-5 h-5 mx-auto mb-1.5 ${stat.color}`} />
              <div className={`text-2xl font-heading font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Filters & Sort */}
      <GlassCard hover={false}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Filters:</span>
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-muted-foreground">Min ATS:</label>
            <Input type="number" min={0} max={100} value={minScore} onChange={e => setMinScore(Number(e.target.value) || 0)}
              className="w-16 h-7 text-xs bg-background/50 rounded-lg" />
          </div>
          <select value={expFilter} onChange={e => setExpFilter(e.target.value)}
            className="h-7 text-xs bg-background/50 border border-border/50 rounded-lg px-2 outline-none">
            <option value="all">All Levels</option>
            <option value="junior">Junior</option>
            <option value="mid">Mid</option>
            <option value="senior">Senior</option>
            <option value="executive">Executive</option>
          </select>
          <button onClick={() => setShowShortlistOnly(!showShortlistOnly)}
            className={`h-7 text-xs px-3 rounded-lg border transition-colors ${showShortlistOnly ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-background/50 border-border/50 text-muted-foreground hover:text-foreground'}`}>
            {showShortlistOnly ? '★ Shortlisted' : '☆ Show All'}
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Sort:</span>
          </div>
          {[
            { key: 'ats_score', label: 'ATS Score' },
            { key: 'job_match', label: 'Job Match' },
            { key: 'filename', label: 'Name' },
          ].map(opt => (
            <button key={opt.key} onClick={() => toggleSort(opt.key)}
              className={`h-7 text-xs px-3 rounded-lg border transition-colors ${sortBy === opt.key ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-background/50 border-border/50 text-muted-foreground hover:text-foreground'}`}>
              {opt.label} {sortBy === opt.key && (sortDir === 'desc' ? '↓' : '↑')}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Failed Files Warning */}
      {failedResults.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-destructive">{failedResults.length} file(s) failed:</p>
            <ul className="mt-1 space-y-0.5">
              {failedResults.map((r, i) => (
                <li key={i} className="text-xs text-destructive/80">• {r.filename}: {r.error}</li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}

      {/* Results List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <EmptyState icon="history" title="No resumes match filters" description="Try adjusting the filters above." />
        )}
        {filtered.map((item, i) => {
          const a = item.analysis;
          const isExpanded = expandedId === item.id;
          const isShortlisted = shortlisted.has(item.id);
          const isComparing = compareIds.includes(item.id);

          return (
            <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <GlassCard hover={false} className={`transition-all ${isShortlisted ? 'ring-1 ring-emerald-500/40' : ''}`}>
                <div className="flex items-center gap-3">
                  {/* Shortlist checkbox */}
                  <button onClick={() => toggleShortlist(item.id)} className="flex-shrink-0">
                    {isShortlisted
                      ? <CheckSquare className="w-5 h-5 text-emerald-400" />
                      : <Square className="w-5 h-5 text-muted-foreground/40 hover:text-muted-foreground" />
                    }
                  </button>

                  {/* File info */}
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.filename}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[10px] capitalize">{a?.experience_level || 'N/A'}</Badge>
                      {isShortlisted && <Badge className="text-[10px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Shortlisted</Badge>}
                    </div>
                  </div>

                  {/* Scores */}
                  <ScorePill score={a?.ats_score || 0} label="ATS" />
                  {a?.job_match_score != null && <ScorePill score={a.job_match_score} label="Match" />}

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleCompare(item.id)}
                      className={`p-1.5 rounded-lg text-xs transition-colors ${isComparing ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                      title={isComparing ? 'Remove from compare' : 'Add to compare'}>
                      <Users className="w-4 h-4" />
                    </button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg"
                      onClick={() => navigate(`/analysis/${item.id}`)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <button onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && a && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-border/30 space-y-3">
                      <p className="text-sm text-muted-foreground">{a.summary}</p>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <h4 className="text-xs font-semibold flex items-center gap-1 mb-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Strengths</h4>
                          <ul className="space-y-1">{(a.strengths || []).slice(0, 3).map((s, j) => <li key={j} className="text-xs text-muted-foreground">• {s}</li>)}</ul>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold flex items-center gap-1 mb-1.5"><XCircle className="w-3 h-3 text-amber-500" /> Weaknesses</h4>
                          <ul className="space-y-1">{(a.weaknesses || []).slice(0, 3).map((w, j) => <li key={j} className="text-xs text-muted-foreground">• {w}</li>)}</ul>
                        </div>
                      </div>
                      {(a.missing_skills || []).length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          <span className="text-xs text-muted-foreground">Missing:</span>
                          {a.missing_skills.slice(0, 5).map((s, j) => <Badge key={j} variant="destructive" className="text-[10px]">{s}</Badge>)}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* Comparison Modal */}
      <AnimatePresence>
        {showCompare && compareItems.length >= 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowCompare(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-strong rounded-2xl border border-border/50 max-w-5xl w-full max-h-[85vh] overflow-y-auto p-6"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-heading font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" /> Resume Comparison
                </h3>
                <button onClick={() => setShowCompare(false)} className="p-1.5 rounded-lg hover:bg-muted/50"><X className="w-5 h-5" /></button>
              </div>
              <div className={`grid gap-4 ${compareItems.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {compareItems.map((item) => {
                  const a = item.analysis;
                  return (
                    <div key={item.id} className="space-y-4">
                      <div className="text-center">
                        <p className="text-sm font-medium truncate">{item.filename}</p>
                        <Badge variant="outline" className="text-[10px] capitalize mt-1">{a?.experience_level}</Badge>
                      </div>
                      <div className="flex justify-center"><CircularScore score={a?.ats_score || 0} size={100} /></div>
                      {a?.job_match_score != null && (
                        <div className="text-center">
                          <span className="text-xs text-muted-foreground">Job Match</span>
                          <div className={`text-xl font-bold ${getScoreColor(a.job_match_score)}`}>{a.job_match_score}%</div>
                        </div>
                      )}
                      <div>
                        <h4 className="text-xs font-semibold mb-1.5 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" />Strengths</h4>
                        <ul className="space-y-1">{(a?.strengths || []).slice(0, 4).map((s, j) => <li key={j} className="text-[11px] text-muted-foreground">• {s}</li>)}</ul>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold mb-1.5 flex items-center gap-1"><XCircle className="w-3 h-3 text-amber-500" />Weaknesses</h4>
                        <ul className="space-y-1">{(a?.weaknesses || []).slice(0, 4).map((s, j) => <li key={j} className="text-[11px] text-muted-foreground">• {s}</li>)}</ul>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold mb-1.5">Missing Skills</h4>
                        <div className="flex flex-wrap gap-1">{(a?.missing_skills || []).slice(0, 5).map((s, j) => <Badge key={j} variant="destructive" className="text-[9px]">{s}</Badge>)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
