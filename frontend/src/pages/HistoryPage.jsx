import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trash2, ExternalLink, FileText, Calendar, Search, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/shared/GlassCard';
import EmptyState from '@/components/shared/EmptyState';
import { CardSkeleton } from '@/components/shared/LoadingSkeleton';
import { getHistory, deleteAnalysis } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

function getScoreColor(score) {
  if (score >= 80) return 'bg-emerald-500/20 text-emerald-400';
  if (score >= 60) return 'bg-blue-500/20 text-blue-400';
  if (score >= 40) return 'bg-amber-500/20 text-amber-400';
  return 'bg-red-500/20 text-red-400';
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const { user, guestAnalyses } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchHistory = async () => {
    try {
      if (user) {
        // Authenticated → fetch from API (Firestore)
        const res = await getHistory();
        setItems(res.items || []);
      } else {
        // Guest → use in-memory context data
        setItems(guestAnalyses);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user, guestAnalyses]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await deleteAnalysis(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch { /* ignore */ }
  };

  const filtered = items.filter((item) =>
    (item.filename || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Guest banner */}
      {!user && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-4 flex items-center justify-between"
        >
          <div>
            <p className="text-sm font-medium text-amber-400">Guest Mode</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your history will be lost when you leave. Sign in to save permanently.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => navigate('/login')}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 rounded-xl"
          >
            <LogIn className="w-3.5 h-3.5 mr-1.5" /> Sign In
          </Button>
        </motion.div>
      )}

      {/* Search */}
      {items.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search resumes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-background/50 rounded-xl"
          />
        </div>
      )}

      {/* Empty State */}
      {filtered.length === 0 && !loading && (
        <EmptyState
          icon="history"
          title={search ? 'No results found' : 'No resume analyses yet'}
          description={search ? 'Try a different search term.' : 'Upload your first resume to get started with AI analysis.'}
          action={
            !search && (
              <Button
                onClick={() => navigate('/dashboard')}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 rounded-xl"
              >
                Upload Resume
              </Button>
            )
          }
        />
      )}

      {/* List */}
      <div className="space-y-3">
        {filtered.map((item, i) => {
          const analysis = item.analysis || {};
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <GlassCard
                className="cursor-pointer"
                onClick={() => navigate(`/analysis/${item.id}`)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.filename}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.uploaded_at).toLocaleDateString()}
                      </span>
                      {analysis.experience_level && (
                        <Badge variant="outline" className="text-xs capitalize">
                          {analysis.experience_level}
                        </Badge>
                      )}
                      {!user && (
                        <Badge variant="outline" className="text-xs text-amber-400 border-amber-500/30">
                          Guest
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className={`px-3 py-1.5 rounded-lg text-sm font-bold ${getScoreColor(analysis.ats_score || 0)}`}>
                    {analysis.ats_score || 0}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-lg h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={(e) => { e.stopPropagation(); navigate(`/analysis/${item.id}`); }}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-lg h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={(e) => handleDelete(item.id, e)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
