import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const getTitle = () => {
    if (location.pathname === '/dashboard') return 'Upload Resume';
    if (location.pathname.startsWith('/analysis')) return 'Analysis Results';
    if (location.pathname === '/history') return 'Resume History';
    if (location.pathname === '/settings') return 'Settings';
    return 'SmartResume';
  };

  return (
    <header className="sticky top-0 z-30 glass-strong border-b border-border/50">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Mobile logo + Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="md:hidden w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center"
          >
            <Sparkles className="w-4 h-4 text-white" />
          </button>
          <h1 className="text-lg font-heading font-semibold">{getTitle()}</h1>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <motion.button
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </motion.button>
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="md:hidden flex border-t border-border/50 px-2">
        {[
          { to: '/dashboard', label: 'Upload' },
          { to: '/history', label: 'History' },
          { to: '/settings', label: 'Settings' },
        ].map(({ to, label }) => {
          const isActive = location.pathname.startsWith(to);
          return (
            <button
              key={to}
              onClick={() => navigate(to)}
              className={`flex-1 py-2.5 text-xs font-medium text-center transition-colors relative
                ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
            >
              {label}
              {isActive && (
                <motion.div
                  className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full"
                  layoutId="mobile-nav-active"
                />
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
