import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon, Sparkles, Bell, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const routeMeta = {
  '/dashboard': { title: 'Analyze Resume', breadcrumb: ['Dashboard', 'Analyze'] },
  '/analysis': { title: 'Analysis Results', breadcrumb: ['Dashboard', 'Results'] },
  '/batch-results': { title: 'Batch Results', breadcrumb: ['Dashboard', 'Batch'] },
  '/history': { title: 'History', breadcrumb: ['Dashboard', 'History'] },
  '/settings': { title: 'Settings', breadcrumb: ['Dashboard', 'Settings'] },
};

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const matchedKey = Object.keys(routeMeta).find(k =>
    k === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(k)
  );
  const meta = routeMeta[matchedKey] || { title: 'SmartResume', breadcrumb: ['Dashboard'] };
  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'G';

  return (
    <header className="sticky top-0 z-30 glass-strong border-b border-white/6">
      <div className="flex items-center justify-between px-5 py-3 gap-4">
        {/* Left: Mobile logo + Breadcrumb */}
        <div className="flex items-center gap-3">
          {/* Mobile logo */}
          <button
            onClick={() => navigate('/')}
            className="md:hidden w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-md"
          >
            <Sparkles className="w-4 h-4 text-white" />
          </button>

          {/* Breadcrumb (desktop) */}
          <nav className="hidden md:flex items-center gap-2">
            {meta.breadcrumb.map((crumb, i) => (
              <span key={crumb} className="flex items-center gap-2">
                {i > 0 && <span className="text-muted-foreground/30 text-sm">/</span>}
                <span className={`text-sm font-medium ${i === meta.breadcrumb.length - 1 ? 'text-foreground' : 'text-muted-foreground hover:text-foreground cursor-pointer transition-colors'}`}>
                  {crumb}
                </span>
              </span>
            ))}
          </nav>

          {/* Mobile title */}
          <h1 className="md:hidden text-sm font-heading font-semibold">{meta.title}</h1>
        </div>

        {/* Center: Search bar (desktop) */}
        <div className="hidden lg:flex flex-1 max-w-xs mx-4">
          <div className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/8 hover:bg-white/8 hover:border-white/12 transition-all cursor-text">
            <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-muted-foreground/60">Search history, analyses...</span>
            <div className="ml-auto flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/8 border border-white/8">
              <span className="text-[9px] text-muted-foreground font-mono">⌘K</span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          {/* Notification bell */}
          <motion.button
            className="relative p-2 rounded-xl hover:bg-white/8 text-muted-foreground hover:text-foreground transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Notifications"
          >
            <Bell className="w-4.5 h-4.5" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400" />
          </motion.button>

          {/* Theme toggle */}
          <motion.button
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-white/8 text-muted-foreground hover:text-foreground transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </motion.button>

          {/* User avatar */}
          <motion.button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-white/8 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {user?.picture ? (
              <img src={user.picture} alt={user.name} className="w-7 h-7 rounded-full ring-1 ring-white/15" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[11px] font-bold text-white shadow-sm">
                {initials}
              </div>
            )}
            <span className="hidden sm:block text-xs font-medium text-foreground/80 max-w-20 truncate">
              {user?.name?.split(' ')[0] || 'Guest'}
            </span>
          </motion.button>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden flex border-t border-white/6">
        {[
          { to: '/dashboard', label: 'Analyze' },
          { to: '/history', label: 'History' },
          { to: '/settings', label: 'Settings' },
        ].map(({ to, label }) => {
          const isActive = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to));
          return (
            <button
              key={to}
              onClick={() => navigate(to)}
              className={`flex-1 py-2.5 text-[11px] font-semibold text-center transition-colors relative ${
                isActive ? 'text-indigo-400' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
              {isActive && (
                <motion.div
                  className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                  layoutId="mobile-nav-active"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
