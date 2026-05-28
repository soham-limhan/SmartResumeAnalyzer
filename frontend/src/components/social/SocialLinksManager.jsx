import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Link, Trash2, Plus, GripVertical, CheckCircle2, AlertCircle, Eye, EyeOff,
  Sparkles, Code, Trophy, BarChart3, HelpCircle, Loader2, RefreshCw, ChevronUp, ChevronDown, Check, TrendingUp
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import GlassCard from '@/components/shared/GlassCard';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

// API instance
const API_URL = import.meta.env.VITE_API_URL || '/api';

// Beautiful Custom SVG Brand Icons to avoid lucide-react version mismatch issues
export function BrandedIcon({ platform, className = "w-5 h-5" }) {
  if (platform === 'linkedin') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
      </svg>
    );
  }
  if (platform === 'github') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
      </svg>
    );
  }
  if (platform === 'twitter') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    );
  }
  if (platform === 'youtube') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 00-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 002.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 002.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    );
  }
  if (platform === 'instagram') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
      </svg>
    );
  }
  return null;
}

export const PLATFORM_CONFIGS = {
  linkedin: { label: 'LinkedIn', icon: 'linkedin', color: 'text-[#0077b5]', bg: 'bg-[#0077b5]/10', border: 'border-[#0077b5]/20', placeholder: 'linkedin.com/in/username' },
  github: { label: 'GitHub', icon: 'github', color: 'text-foreground', bg: 'bg-white/10', border: 'border-white/20', placeholder: 'github.com/username' },
  portfolio: { label: 'Portfolio Website', icon: Globe, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', placeholder: 'yourwebsite.com' },
  twitter: { label: 'Twitter / X', icon: 'twitter', color: 'text-sky-400', bg: 'bg-[#1da1f2]/10', border: 'border-[#1da1f2]/20', placeholder: 'x.com/username' },
  leetcode: { label: 'LeetCode', icon: Code, color: 'text-[#ffa116]', bg: 'bg-[#ffa116]/10', border: 'border-[#ffa116]/20', placeholder: 'leetcode.com/username' },
  hackerrank: { label: 'HackerRank', icon: Trophy, color: 'text-[#2ec866]', bg: 'bg-[#2ec866]/10', border: 'border-[#2ec866]/20', placeholder: 'hackerrank.com/username' },
  kaggle: { label: 'Kaggle', icon: BarChart3, color: 'text-[#20beff]', bg: 'bg-[#20beff]/10', border: 'border-[#20beff]/20', placeholder: 'kaggle.com/username' },
  behance: { label: 'Behance', icon: Globe, color: 'text-[#0057ff]', bg: 'bg-[#0057ff]/10', border: 'border-[#0057ff]/20', placeholder: 'behance.net/username' },
  dribbble: { label: 'Dribbble', icon: Globe, color: 'text-[#ea4c89]', bg: 'bg-[#ea4c89]/10', border: 'border-[#ea4c89]/20', placeholder: 'dribbble.com/username' },
  medium: { label: 'Medium', icon: Link, color: 'text-[#00ab6c]', bg: 'bg-[#00ab6c]/10', border: 'border-[#00ab6c]/20', placeholder: 'medium.com/@username' },
  stackoverflow: { label: 'Stack Overflow', icon: HelpCircle, color: 'text-[#f48024]', bg: 'bg-[#f48024]/10', border: 'border-[#f48024]/20', placeholder: 'stackoverflow.com/users/username' },
  youtube: { label: 'YouTube', icon: 'youtube', color: 'text-[#ff0000]', bg: 'bg-[#ff0000]/10', border: 'border-[#ff0000]/20', placeholder: 'youtube.com/@channel' },
  instagram: { label: 'Instagram', icon: 'instagram', color: 'text-[#e1306c]', bg: 'bg-[#e1306c]/10', border: 'border-[#e1306c]/20', placeholder: 'instagram.com/username' },
  custom: { label: 'Custom Link', icon: Link, color: 'text-muted-foreground', bg: 'bg-white/5', border: 'border-white/8', placeholder: 'linkurl.com' },
};

// URL Normalisation
export function normalizeUrl(url) {
  let cleaned = url.trim();
  if (!cleaned) return '';
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = 'https://' + cleaned;
  }
  try {
    cleaned = cleaned.split('?')[0]; // Remove queries
    if (cleaned.endsWith('/') && cleaned.split('/').length > 4) {
      cleaned = cleaned.replace(/\/$/, ''); // Remove trailing slash
    }
  } catch (e) {
    // Ignore URL errors
  }
  return cleaned;
}

// Auto platform detector
export function detectPlatform(url) {
  const normalized = normalizeUrl(url).toLowerCase();
  
  if (normalized.includes('linkedin.com')) return 'linkedin';
  if (normalized.includes('github.com')) return 'github';
  if (normalized.includes('twitter.com') || normalized.includes('x.com')) return 'twitter';
  if (normalized.includes('leetcode.com')) return 'leetcode';
  if (normalized.includes('hackerrank.com')) return 'hackerrank';
  if (normalized.includes('kaggle.com')) return 'kaggle';
  if (normalized.includes('behance.net')) return 'behance';
  if (normalized.includes('dribbble.com')) return 'dribbble';
  if (normalized.includes('medium.com')) return 'medium';
  if (normalized.includes('stackoverflow.com')) return 'stackoverflow';
  if (normalized.includes('youtube.com') || normalized.includes('youtu.be')) return 'youtube';
  if (normalized.includes('instagram.com')) return 'instagram';
  
  if (normalized.includes('portfolio') || normalized.includes('website') || normalized.includes('blog')) return 'portfolio';
  return 'custom';
}

export default function SocialLinksManager({ onChange }) {
  const { user, getToken } = useAuth();
  const [links, setLinks] = useState([]);
  const [displayMode, setDisplayMode] = useState('compact');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Load social links
  useEffect(() => {
    const fetchLinks = async () => {
      setLoading(true);
      setError(null);
      
      // Try local storage first
      const cached = localStorage.getItem('smartresume-social-links');
      const cachedMode = localStorage.getItem('smartresume-social-mode');
      if (cachedMode) setDisplayMode(cachedMode);

      if (user) {
        try {
          const token = await getToken() || localStorage.getItem('firebase-token');
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const res = await axios.get(`${API_URL}/social-links`, { headers });
          if (res.data.links) {
            const sorted = (res.data.links || []).sort((a, b) => a.order - b.order);
            setLinks(sorted);
            setDisplayMode(res.data.display_mode || 'compact');
            localStorage.setItem('smartresume-social-links', JSON.stringify(sorted));
            localStorage.setItem('smartresume-social-mode', res.data.display_mode || 'compact');
          } else if (cached) {
            setLinks(JSON.parse(cached));
          }
        } catch (err) {
          console.error('Failed to fetch social links from Firestore', err);
          if (cached) setLinks(JSON.parse(cached));
        }
      } else if (cached) {
        setLinks(JSON.parse(cached));
      }
      setLoading(false);
    };

    fetchLinks();
  }, [user]);

  // Sync to parent component
  useEffect(() => {
    if (onChange) {
      onChange(links, displayMode);
    }
  }, [links, displayMode, onChange]);

  // Listen to external add triggers (e.g. from AI widget)
  useEffect(() => {
    const handleAdd = (e) => {
      const platform = e.detail.platform;
      // Prevent duplicates
      if (links.some(l => l.platform === platform)) return;
      
      const newLink = {
        id: Math.random().toString(36).substring(2, 9),
        platform,
        url: '',
        label: '',
        is_enabled: true,
        order: links.length,
        is_verified: true
      };
      setLinks(prev => [...prev, newLink]);
    };
    window.addEventListener('add-social-platform', handleAdd);
    return () => window.removeEventListener('add-social-platform', handleAdd);
  }, [links]);

  // Add new link row
  const addLinkRow = () => {
    const newLink = {
      id: Math.random().toString(36).substring(2, 9),
      platform: 'detect',
      url: '',
      label: '',
      is_enabled: true,
      order: links.length,
      is_verified: true
    };
    setLinks([...links, newLink]);
  };

  // Delete link row
  const deleteLinkRow = (id) => {
    const filtered = links.filter(l => l.id !== id).map((l, i) => ({ ...l, order: i }));
    setLinks(filtered);
  };

  // Update link field
  const updateLink = (id, field, value) => {
    const updated = links.map(link => {
      if (link.id === id) {
        const newLink = { ...link, [field]: value };
        
        // Auto platform detection on URL change
        if (field === 'url') {
          const detected = detectPlatform(value);
          if (detected && detected !== 'custom') {
            newLink.platform = detected;
          }
          // Validate structure
          newLink.is_verified = value.trim() === '' || /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i.test(value);
        }
        return newLink;
      }
      return link;
    });
    setLinks(updated);
  };

  // Reordering moves
  const moveLink = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === links.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...links];
    
    // Swap
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;
    
    // Adjust orders
    const finalized = reordered.map((l, i) => ({ ...l, order: i }));
    setLinks(finalized);
  };

  // Save changes to backend/localstorage
  const saveSocialProfiles = async () => {
    setSaving(true);
    setSuccess(false);
    setError(null);

    // Save to local storage
    localStorage.setItem('smartresume-social-links', JSON.stringify(links));
    localStorage.setItem('smartresume-social-mode', displayMode);

    if (user) {
      try {
        const token = await getToken() || localStorage.getItem('firebase-token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const payload = {
          display_mode: displayMode,
          links: links
        };
        await axios.post(`${API_URL}/social-links`, payload, { headers });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } catch (err) {
        setError(err.response?.data?.detail || err.message || 'Failed to save changes.');
      }
    } else {
      // Guest mode success feedback
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
    setSaving(false);
  };

  // Check duplicates
  const getDuplicateWarning = (platform, index) => {
    if (platform === 'custom' || platform === 'portfolio' || platform === 'detect') return false;
    return links.some((l, idx) => l.platform === platform && idx < index);
  };

  // Calculate completeness score
  const activeLinks = links.filter(l => l.is_enabled && l.url);
  const completenessScore = Math.min(100, activeLinks.length * 25);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground animate-pulse gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm">Loading social profiles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Settings HUD header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-heading font-bold text-base text-foreground">Social Connections</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Integrate your professional online presence into exports.</p>
        </div>
        
        {/* Completeness HUD badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/4 border border-white/8">
          <TrendingUp className="w-4 h-4 text-indigo-400" />
          <span className="text-xs text-muted-foreground">Profile Completeness:</span>
          <span className={`text-xs font-bold ${completenessScore >= 75 ? 'text-emerald-400' : completenessScore >= 50 ? 'text-amber-400' : 'text-indigo-400'}`}>
            {completenessScore}%
          </span>
        </div>
      </div>

      {/* Render Mode Settings Card */}
      <GlassCard hover={false} className="border-indigo-500/10">
        <div className="flex items-center gap-2.5 mb-4">
          <Globe className="w-4.5 h-4.5 text-indigo-400" />
          <Label className="text-sm font-heading font-bold">Resume Export Mode</Label>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { id: 'compact', label: 'Compact Mode', desc: 'Branded square badges' },
            { id: 'expanded', label: 'Expanded Mode', desc: 'Side-by-side card grid' },
            { id: 'icon_only', label: 'Icon Only', desc: 'Clean circular row' },
            { id: 'ats_safe', label: 'ATS-Safe Text', desc: 'No graphics, plain url' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setDisplayMode(mode.id)}
              className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between min-h-[64px]
                ${displayMode === mode.id
                  ? 'border-indigo-500/30 bg-indigo-500/5 text-foreground shadow-lg shadow-indigo-500/5'
                  : 'border-white/8 bg-white/2 text-muted-foreground hover:border-white/16 hover:bg-white/4'}`}
            >
              <span className="text-xs font-bold block">{mode.label}</span>
              <span className="text-[10px] text-muted-foreground/60 leading-tight mt-1">{mode.desc}</span>
              {displayMode === mode.id && (
                <Check className="w-3.5 h-3.5 text-indigo-400 absolute top-2 right-2" />
              )}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Links List Cards */}
      <div className="space-y-3">
        {links.length === 0 ? (
          <GlassCard hover={false} className="py-12 border-dashed border-white/8 flex flex-col items-center justify-center text-center">
            <Globe className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No links added yet.</p>
            <p className="text-xs text-muted-foreground/60 mt-1 max-w-[280px]">Add your LinkedIn, GitHub, or Portfolio links below to increase your visibility.</p>
            <Button onClick={addLinkRow} variant="outline" className="mt-4 rounded-xl gap-1.5 text-xs py-1.5 h-auto">
              <Plus className="w-3.5 h-3.5" /> Add Link
            </Button>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {links.map((link, idx) => {
                const config = PLATFORM_CONFIGS[link.platform] || PLATFORM_CONFIGS.custom;
                const IconComponent = config.icon;
                const hasDuplicate = getDuplicateWarning(link.platform, idx);
                const isInvalid = !link.is_verified;

                return (
                  <motion.div
                    key={link.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className={`flex flex-col md:flex-row items-stretch md:items-center gap-3 p-4 rounded-2xl border bg-white/2 hover:bg-white/4 transition-colors
                      ${isInvalid ? 'border-red-500/20' : hasDuplicate ? 'border-amber-500/20' : 'border-white/8'}`}
                  >
                    {/* Grip & Reorder arrows */}
                    <div className="flex md:flex-col items-center justify-between md:justify-center gap-1.5 md:mr-1">
                      <div className="flex items-center gap-1 md:flex-col">
                        <button
                          onClick={() => moveLink(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-white/5 disabled:opacity-20"
                          title="Move Link Up"
                        >
                          <ChevronUp className="w-4.5 h-4.5" />
                        </button>
                        <button
                          onClick={() => moveLink(idx, 'down')}
                          disabled={idx === links.length - 1}
                          className="p-1 rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-white/5 disabled:opacity-20"
                          title="Move Link Down"
                        >
                          <ChevronDown className="w-4.5 h-4.5" />
                        </button>
                      </div>
                      <GripVertical className="w-4 h-4 text-muted-foreground/20 hidden md:block cursor-grab" />
                    </div>

                    {/* Platform Branded Icon circle */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bg} border ${config.border}`}>
                      {typeof IconComponent === 'string' ? (
                        <BrandedIcon platform={IconComponent} className={`w-5 h-5 ${config.color}`} />
                      ) : (
                        <IconComponent className={`w-5 h-5 ${config.color}`} />
                      )}
                    </div>

                    {/* Form elements */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3">
                      {/* Platform Select */}
                      <div className="sm:col-span-4">
                        <select
                          value={link.platform}
                          onChange={(e) => updateLink(link.id, 'platform', e.target.value)}
                          className="w-full bg-white/3 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground focus:border-indigo-500/40 focus:ring-0"
                        >
                          <option value="detect" disabled>Auto-Detect Platform</option>
                          {Object.entries(PLATFORM_CONFIGS).map(([key, val]) => (
                            <option key={key} value={key}>{val.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* URL input */}
                      <div className="sm:col-span-8 relative">
                        <Input
                          placeholder={config.placeholder}
                          value={link.url}
                          onChange={(e) => updateLink(link.id, 'url', e.target.value)}
                          className={`w-full bg-white/3 border rounded-xl focus:border-indigo-500/40 text-sm placeholder:text-muted-foreground/30
                            ${isInvalid ? 'border-red-500/40 focus:border-red-500' : 'border-white/10'}`}
                        />
                        {isInvalid && (
                          <div className="absolute right-3 top-2.5 flex items-center gap-1 text-[10px] text-red-400 font-semibold animate-pulse">
                            <AlertCircle className="w-3.5 h-3.5" /> Invalid URL
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Custom optional Label input (visible only for custom portfolio links) */}
                    {(link.platform === 'custom' || link.platform === 'portfolio') && (
                      <div className="flex-shrink-0 w-full md:w-[110px]">
                        <Input
                          placeholder="Label (e.g. Website)"
                          value={link.label || ''}
                          onChange={(e) => updateLink(link.id, 'label', e.target.value)}
                          className="w-full bg-white/3 border border-white/10 rounded-xl text-xs py-1.5 h-9"
                        />
                      </div>
                    )}

                    {/* Actions and toggle visibility */}
                    <div className="flex items-center justify-between md:justify-end gap-3 flex-shrink-0 pt-2 md:pt-0 border-t border-white/6 md:border-t-0">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={link.is_enabled}
                          onCheckedChange={(checked) => updateLink(link.id, 'is_enabled', checked)}
                          id={`visible-${link.id}`}
                        />
                        <Label htmlFor={`visible-${link.id}`} className="text-xs text-muted-foreground font-medium flex items-center gap-1 cursor-pointer">
                          {link.is_enabled ? (
                            <><Eye className="w-3.5 h-3.5 text-emerald-400" /> Export</>
                          ) : (
                            <><EyeOff className="w-3.5 h-3.5 text-muted-foreground/50" /> Hidden</>
                          )}
                        </Label>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteLinkRow(link.id)}
                        className="rounded-xl w-8 h-8 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </Button>
                    </div>

                    {/* Alert states overlay */}
                    {hasDuplicate && (
                      <div className="w-full text-[10px] text-amber-400 flex items-center gap-1 mt-1 sm:ml-12 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" /> Duplicate {config.label} account detected. Only the first active link will export.
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            <div className="flex items-center justify-start gap-2 pt-2">
              <Button onClick={addLinkRow} variant="outline" className="rounded-xl gap-1.5 text-xs py-2 px-4 h-auto border-white/10 bg-white/3">
                <Plus className="w-3.5 h-3.5" /> Add Profile Link
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Save Action Panel */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-white/6">
        <span className="text-[10.5px] text-muted-foreground/60 leading-normal max-w-sm">
          {!user ? 'Guest mode: Profiles are temporarily saved in local storage.' : 'All changes are secure and saved directly in your personal Cloud profile.'}
        </span>
        <div className="flex items-center gap-2">
          {error && (
            <span className="text-xs text-red-400 font-medium flex items-center gap-1 mr-2">
              <AlertCircle className="w-3.5 h-3.5" /> Save failed
            </span>
          )}
          <AnimatePresence>
            {success && (
              <motion.span
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs text-emerald-400 font-semibold flex items-center gap-1 mr-2"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Changes Synced!
              </motion.span>
            )}
          </AnimatePresence>
          <Button
            onClick={saveSocialProfiles}
            disabled={saving || links.some(l => !l.is_verified)}
            className="rounded-xl gap-1.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 py-2 h-auto px-5 font-bold"
          >
            {saving ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Syncing...</>
            ) : (
              <><RefreshCw className="w-3.5 h-3.5" /> Save Connections</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
