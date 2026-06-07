import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const routeMeta = {
  '/dashboard': { title: 'Analyze Resume', breadcrumb: ['Dashboard', 'Analyze'] },
  '/resume-builder': { title: 'Resume Builder', breadcrumb: ['Dashboard', 'Resume Builder'] },
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
    <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between px-5 py-3 gap-4">
        {/* Left: Mobile logo + Breadcrumb */}
        <div className="flex items-center gap-3">
          {/* Mobile logo */}
          <button
            onClick={() => navigate('/')}
            className="md:hidden flex-shrink-0"
          >
            <img src="/logo.png" alt="Smart Resume Analyzer" className="h-7 w-auto" />
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
        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          {/* Theme toggle */}
          <motion.button
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </motion.button>

          {/* User avatar */}
          <motion.button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-muted transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {user?.picture ? (
              <img src={user.picture} alt={user.name} className="w-7 h-7 rounded-full ring-1 ring-border" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-[11px] font-bold shadow-sm">
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
      <nav className="md:hidden flex border-t border-border">
        {[
          { to: '/dashboard', label: 'Analyze' },
          { to: '/resume-builder', label: 'Builder' },
          { to: '/history', label: 'History' },
          { to: '/settings', label: 'Settings' },
        ].map(({ to, label }) => {
          const isActive = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to));
          return (
            <button
              key={to}
              onClick={() => navigate(to)}
              className={`flex-1 py-2.5 text-[11px] font-semibold text-center transition-colors relative ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
              {isActive && (
                <motion.div
                  className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full"
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
