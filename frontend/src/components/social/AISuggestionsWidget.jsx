import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, Loader2, AlertTriangle, CheckCircle2, ArrowRight, Star, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import GlassCard from '@/components/shared/GlassCard';
import ScoreRing from '@/components/shared/ScoreRing';
import { PLATFORM_CONFIGS } from './SocialLinksManager';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function AISuggestionsWidget({ currentLinks = [], onAddPlatform }) {
  const [targetRole, setTargetRole] = useState(() => {
    const history = localStorage.getItem('profilex-ai-history');
    if (history) {
      try {
        const parsed = JSON.parse(history);
        if (parsed && parsed.length > 0) {
          const first = parsed[0];
          const industry = first.analysis?.industry_fit?.[0] || '';
          if (industry) {
            return industry + ' Developer';
          }
        }
      } catch {
        // Fallback
      }
    }
    return '';
  });
  const [analyzing, setAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState(null);

  const runPresenceAudit = useCallback(async () => {
    setAnalyzing(true);
    try {
      const payload = {
        current_links: currentLinks,
        target_role: targetRole.trim() || 'General Professional'
      };
      
      const res = await axios.post(`${API_URL}/social-links/ai-recommend`, payload);
      setRecommendations(res.data);
    } catch (err) {
      console.error('Presence audit failed:', err);
    } finally {
      setAnalyzing(false);
    }
  }, [currentLinks, targetRole]);

  // Auto audit on first load if links change
  useEffect(() => {
    let active = true;
    if (currentLinks.length > 0 && !recommendations && !analyzing) {
      Promise.resolve().then(() => {
        if (active) runPresenceAudit();
      });
    }
    return () => {
      active = false;
    };
  }, [currentLinks, recommendations, analyzing, runPresenceAudit]);

  const score = recommendations?.completeness_score || 0;
  const missing = recommendations?.missing_platforms || [];
  const suggestions = recommendations?.suggestions || [];
  const priority = recommendations?.priority_list || [];

  return (
    <GlassCard hover={false} className="border-border h-full flex flex-col">
      {/* Widget Header */}
      <div className="flex items-center gap-2.5 mb-4 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Sparkles className="w-4.5 h-4.5 text-primary" />
        </div>
        <div>
          <h4 className="font-heading font-bold text-sm text-foreground">AI Connections Assistant</h4>
          <p className="text-[10px] text-muted-foreground">Audit your online presence alignment for recruiters.</p>
        </div>
      </div>

      {/* Target Role input */}
      <div className="flex gap-2 mb-5 flex-shrink-0">
        <div className="relative flex-1">
          <Input
            placeholder="e.g. Senior Frontend Engineer, Product Designer"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runPresenceAudit()}
            className="w-full bg-white/3 border border-white/10 rounded-xl text-xs py-1.5 h-9 placeholder:text-muted-foreground/30 focus:border-primary/40"
          />
        </div>
        <Button
          onClick={runPresenceAudit}
          disabled={analyzing}
          className="rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 py-1 h-9 px-3 flex items-center gap-1 text-xs"
        >
          {analyzing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <><RefreshCw className="w-3.5 h-3.5" /> Analyze</>
          )}
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {analyzing ? (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center py-8 text-center text-muted-foreground/60 gap-3"
          >
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <div>
              <p className="text-xs font-bold text-foreground">Analyzing Profile Visibility</p>
              <p className="text-[10px] mt-0.5">Auditing profile relevance against job markets...</p>
            </div>
          </motion.div>
        ) : recommendations ? (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4 flex-1 overflow-y-auto"
          >
            {/* Score and meter */}
            <div className="flex items-center gap-5 p-3 rounded-2xl bg-white/3 border border-white/6">
              <div className="flex-shrink-0">
                <ScoreRing
                  score={score}
                  size={76}
                  strokeWidth={6}
                  label=""
                  sublabel=""
                />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-foreground">
                  {score >= 80 ? 'Elite Visibility!' : score >= 60 ? 'Strong Presence' : 'Incomplete Presence'}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                  Your social link structure is {score}% optimized for <span className="text-primary font-semibold">{targetRole || 'General Professional'}</span> roles.
                </p>
              </div>
            </div>

            {/* Missing platforms alerts */}
            {missing.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Critical Missing Profiles
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {missing.map((platform) => {
                    const cfg = PLATFORM_CONFIGS[platform] || PLATFORM_CONFIGS.custom;
                    return (
                      <button
                        key={platform}
                        onClick={() => onAddPlatform && onAddPlatform(platform)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/4 border border-white/8 text-[10px] text-foreground font-semibold hover:border-primary/30 hover:bg-primary/5 transition-all group"
                        title={`Click to add ${cfg.label}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        Add {cfg.label}
                        <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Profile Visibility Recommendations */}
            {suggestions.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1">
                  <Brain className="w-3.5 h-3.5 text-primary" /> Optimization Tips
                </p>
                <ul className="space-y-2">
                  {suggestions.slice(0, 3).map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-[11px] text-muted-foreground leading-relaxed">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommended visual order badge */}
            {priority.length > 0 && (
              <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/10">
                <span className="text-[9.5px] font-bold text-primary block mb-1">RECOMMENDED EXPORT PRIORITY</span>
                <span className="text-[10px] text-muted-foreground font-medium flex flex-wrap items-center gap-1 capitalize">
                  {priority.slice(0, 4).map((p, i) => (
                    <span key={p} className="flex items-center gap-1">
                      <span className="text-foreground">{p}</span>
                      {i < priority.slice(0, 4).length - 1 && <span className="text-muted-foreground/40">→</span>}
                    </span>
                  ))}
                </span>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-muted-foreground/50 gap-2">
            <Brain className="w-9 h-9 opacity-35" />
            <p className="text-xs">Provide a target role and links to receive custom recruiter optimization tips.</p>
          </div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}
