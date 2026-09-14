import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  LayoutDashboard,
  ArrowLeft,
  FileText,
  History,
  Settings,
  Sparkles,
  Search,
  Compass,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/shared/Logo';
import Particles from '@/components/shared/Particles';
import { useAuth } from '@/context/AuthContext';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const quickLinks = [
    {
      title: 'Resume Scanner & ATS Score',
      description: 'Upload and evaluate your resume with deep AI insights.',
      path: '/dashboard',
      icon: LayoutDashboard,
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    },
    {
      title: 'AI Resume Builder',
      description: 'Craft ATS-optimized resumes with real-time feedback.',
      path: '/resume-builder',
      icon: Sparkles,
      color: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
    },
    {
      title: 'Analysis History',
      description: 'Review your previous evaluations and benchmark improvements.',
      path: '/history',
      icon: History,
      color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
    },
    {
      title: 'Account Settings',
      description: 'Configure your preferences, theme, and API options.',
      path: '/settings',
      icon: Settings,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    },
  ];

  return (
    <div className="min-h-screen gradient-bg flex flex-col justify-between p-4 sm:p-6 md:p-8 relative overflow-hidden">
      {/* Background ambient glow & particles */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Particles count={25} />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/15 rounded-full blur-3xl opacity-60 pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-violet-500/10 rounded-full blur-3xl opacity-50 pointer-events-none" />
      </div>

      {/* Top Navbar Header */}
      <header className="relative z-10 w-full max-w-5xl mx-auto flex items-center justify-between py-2">
        <Link to="/" className="inline-flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Logo size={36} />
        </Link>

        <div className="flex items-center gap-2">
          {user ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="glass-card hover:bg-accent text-xs font-medium cursor-pointer"
            >
              <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" />
              Dashboard
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/login')}
              className="glass-card hover:bg-accent text-xs font-medium cursor-pointer"
            >
              Sign In
            </Button>
          )}
        </div>
      </header>

      {/* Main Content Card */}
      <main className="relative z-10 w-full max-w-3xl mx-auto my-8 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full glass-strong rounded-3xl p-6 sm:p-10 md:p-12 border border-border/50 shadow-2xl relative overflow-hidden"
        >
          {/* Subtle top inner gradient highlight */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-violet-500 to-cyan-500" />

          {/* Badge */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-6 shadow-sm"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Error 404 • Page Not Found</span>
          </motion.div>

          {/* 404 Visual Hero */}
          <div className="relative mb-6">
            <motion.h1
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="text-7xl sm:text-8xl md:text-9xl font-heading font-black tracking-tighter bg-gradient-to-br from-primary via-violet-500 to-cyan-400 bg-clip-text text-transparent select-none drop-shadow-sm"
            >
              404
            </motion.h1>

            {/* Floating floating decorative badge */}
            <motion.div
              animate={{ y: [-4, 6, -4], rotate: [-2, 2, -2] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute -top-2 right-1/4 sm:right-1/3 bg-background/80 backdrop-blur-md border border-border rounded-xl px-2.5 py-1.5 shadow-lg flex items-center gap-1.5 text-xs text-muted-foreground hidden sm:flex"
            >
              <Search className="w-3.5 h-3.5 text-primary animate-pulse" />
              <span>Route missing</span>
            </motion.div>
          </div>

          {/* Heading and Description */}
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="text-2xl sm:text-3xl font-heading font-bold mb-3 text-foreground"
          >
            Lost in the ATS Space?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto mb-4"
          >
            The route you navigated to doesn't exist, was relocated, or might have been removed. Let's get you back to optimizing your career profile.
          </motion.p>

          {/* Path indicator pill */}
          {location.pathname && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="mb-8"
            >
              <span className="inline-block font-mono text-xs text-muted-foreground bg-muted/60 dark:bg-muted/40 px-3 py-1.5 rounded-lg border border-border/60 max-w-full truncate">
                Path: <code className="text-foreground font-semibold">{location.pathname}</code>
              </span>
            </motion.div>
          )}

          {/* Primary Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-3 mb-10"
          >
            <Button
              size="lg"
              onClick={() => navigate('/dashboard')}
              className="shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all font-semibold gap-2 cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4" />
              Go to Dashboard
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate(-1)}
              className="gap-2 cursor-pointer hover:bg-muted/80"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>

            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/')}
              className="gap-2 cursor-pointer hover:bg-secondary/80"
            >
              <Home className="w-4 h-4" />
              Home Page
            </Button>
          </motion.div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground font-medium flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" /> Popular Destinations
              </span>
            </div>
          </div>

          {/* Quick Links Grid */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2"
          >
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="group relative flex items-start gap-3 p-3.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/50 hover:border-primary/40 transition-all duration-200"
                >
                  <div className={`p-2 rounded-lg border ${item.color} shrink-0 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto text-center py-2 text-xs text-muted-foreground">
        <p>ProfileX AI • AI-Powered Resume Intelligence & ATS Optimization</p>
      </footer>
    </div>
  );
}
