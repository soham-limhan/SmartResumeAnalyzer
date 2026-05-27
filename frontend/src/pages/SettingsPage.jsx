import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings2, Palette, Server, Trash2, CheckCircle2, XCircle, Share2, Settings } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/shared/GlassCard';
import { useTheme } from '@/context/ThemeContext';
import { checkHealth } from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SocialLinksManager from '@/components/social/SocialLinksManager';
import AISuggestionsWidget from '@/components/social/AISuggestionsWidget';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [health, setHealth] = useState(null);
  const [checking, setChecking] = useState(true);
  const [activeTab, setActiveTab] = useState('social');
  const [socialLinks, setSocialLinks] = useState([]);

  useEffect(() => {
    setChecking(true);
    checkHealth()
      .then(setHealth)
      .catch(() => setHealth(null))
      .finally(() => setChecking(false));
  }, []);

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear all analysis history? This cannot be undone.')) {
      localStorage.removeItem('smartresume-history');
      window.location.reload();
    }
  };

  const handleSocialChange = (links, displayMode) => {
    setSocialLinks(links);
  };

  const handleAddPlatform = (platform) => {
    const event = new CustomEvent('add-social-platform', { detail: { platform } });
    window.dispatchEvent(event);
  };

  return (
    <div className={`${activeTab === 'social' ? 'max-w-5xl' : 'max-w-2xl'} mx-auto space-y-6 transition-all duration-300`}>
      
      {/* Settings Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="glass w-full justify-start gap-1 p-1.5 rounded-2xl border border-white/8 mb-6">
          <TabsTrigger value="social" className="rounded-xl text-xs font-semibold gap-1.5 flex-1 sm:flex-initial">
            <Share2 className="w-3.5 h-3.5 text-primary" />
            Social Connections
          </TabsTrigger>
          <TabsTrigger value="system" className="rounded-xl text-xs font-semibold gap-1.5 flex-1 sm:flex-initial">
            <Settings className="w-3.5 h-3.5 text-primary" />
            General Toggles
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Social Connections Dashboard ── */}
        <TabsContent value="social" className="space-y-6 focus-visible:outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Editor manager (Col 7) */}
            <div className="lg:col-span-7">
              <GlassCard hover={false} className="border-indigo-500/10">
                <SocialLinksManager onChange={handleSocialChange} />
              </GlassCard>
            </div>

            {/* AI Assistant Widget (Col 5) */}
            <div className="lg:col-span-5">
              <AISuggestionsWidget
                currentLinks={socialLinks}
                onAddPlatform={handleAddPlatform}
              />
            </div>
          </div>
        </TabsContent>

        {/* ── Tab 2: General System Settings ── */}
        <TabsContent value="system" className="space-y-6 focus-visible:outline-none">
          <div className="space-y-6">
            {/* Appearance */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <GlassCard hover={false}>
                <div className="flex items-center gap-2 mb-4">
                  <Palette className="w-4 h-4 text-primary" />
                  <h3 className="font-heading font-semibold text-sm">Appearance</h3>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Dark Mode</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Toggle between dark and light themes</p>
                  </div>
                  <Switch
                    checked={theme === 'dark'}
                    onCheckedChange={toggleTheme}
                  />
                </div>
              </GlassCard>
            </motion.div>

            {/* Ollama Status */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <GlassCard hover={false}>
                <div className="flex items-center gap-2 mb-4">
                  <Server className="w-4 h-4 text-primary" />
                  <h3 className="font-heading font-semibold text-sm">AI Engine Status</h3>
                </div>

                {checking ? (
                  <div className="text-sm text-muted-foreground animate-pulse">Checking connection...</div>
                ) : health ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Ollama Server</span>
                      <Badge variant={health.ollama?.status === 'connected' ? 'default' : 'destructive'} className="text-xs">
                        {health.ollama?.status === 'connected' ? (
                          <><CheckCircle2 className="w-3 h-3 mr-1" /> Connected</>
                        ) : (
                          <><XCircle className="w-3 h-3 mr-1" /> Disconnected</>
                        )}
                      </Badge>
                    </div>
                    <Separator className="bg-border/50" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Model</span>
                      <span className="text-sm text-muted-foreground font-mono">{health.ollama?.model}</span>
                    </div>
                    <Separator className="bg-border/50" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Model Available</span>
                      <Badge variant={health.ollama?.model_available ? 'default' : 'secondary'} className="text-xs">
                        {health.ollama?.model_available ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    {!health.ollama?.model_available && (
                      <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 mt-2 font-mono">
                        Run: ollama create resume-analyzer -f Modelfile
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <XCircle className="w-4 h-4" />
                    Backend server is not running
                  </div>
                )}
              </GlassCard>
            </motion.div>

            {/* Data Management */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <GlassCard hover={false}>
                <div className="flex items-center gap-2 mb-4">
                  <Settings2 className="w-4 h-4 text-primary" />
                  <h3 className="font-heading font-semibold text-sm">Data Management</h3>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Clear History</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Delete all past resume analyses</p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={clearHistory} className="rounded-xl">
                    <Trash2 className="w-4 h-4 mr-1" /> Clear
                  </Button>
                </div>
              </GlassCard>
            </motion.div>

            {/* About */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <GlassCard hover={false}>
                <div className="text-center text-sm text-muted-foreground">
                  <p className="font-heading font-semibold text-foreground mb-1">ResumePilot v1.0.0</p>
                  <p>AI-powered resume analysis platform</p>
                  <p className="text-xs mt-2">Built with React • FastAPI • Ollama</p>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
