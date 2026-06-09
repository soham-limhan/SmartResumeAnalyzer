import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import Logo from '@/components/shared/Logo';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  LogIn,
  User,
  ClipboardList,
  LayoutDashboard,
  FileText,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, batchResults } = useAuth();

  const navItems = [
    { to: '/dashboard', icon: Upload, label: 'Analyze', description: 'Upload & analyze resume' },
    { to: '/resume-builder', icon: FileText, label: 'Resume Builder', description: 'Create a new resume' },
    ...(batchResults ? [{ to: '/batch-results', icon: ClipboardList, label: 'Batch Results', description: 'Multi-resume results' }] : []),
    { to: '/history', icon: History, label: 'History', description: 'Past analyses' },
    { to: '/settings', icon: Settings, label: 'Settings', description: 'Preferences' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Get user initials for avatar
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'G';

  return (
    <motion.aside
      className="hidden md:flex flex-col h-screen sticky top-0 z-40 border-r border-border"
      style={{ background: 'var(--sidebar)' }}
      animate={{ width: collapsed ? 72 : 248 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {/* ── Logo ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border flex-shrink-0">
        <button
          onClick={() => navigate('/')}
          className="flex-shrink-0 hover:scale-105 transition-transform"
        >
          <Logo size={collapsed ? 26 : 30} showText={!collapsed} />
        </button>
      </div>

      {/* ── Navigation ───────────────────────────────────────── */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {/* Section label */}
        <AnimatePresence>
          {!collapsed && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50"
            >
              Menu
            </motion.p>
          )}
        </AnimatePresence>

        {navItems.map(({ to, icon: Icon, label, description }) => {
          const isActive = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to));
          return (
            <NavLink key={to} to={to} title={collapsed ? label : undefined}>
              <motion.div
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group
                  ${isActive
                    ? 'text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                whileHover={{ x: isActive ? 0 : 2 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Active background */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-xl bg-primary shadow-sm"
                    layoutId="sidebar-active"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}

                {/* Active left indicator */}
                {isActive && (
                  <motion.div
                    className="absolute left-0 top-1/4 bottom-1/4 w-0.5 rounded-full bg-white/60"
                    layoutId="sidebar-indicator"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}

                <Icon className="w-4.5 h-4.5 flex-shrink-0 relative z-10" />

                <AnimatePresence>
                  {!collapsed && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="overflow-hidden whitespace-nowrap relative z-10 flex-1"
                    >
                      <span className="block">{label}</span>
                      {!isActive && (
                        <span className="block text-[10px] text-muted-foreground/60 font-normal group-hover:text-muted-foreground/80 transition-colors -mt-0.5">
                          {description}
                        </span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </NavLink>
          );
        })}
      </nav>

      {/* ── User section ──────────────────────────────────────── */}
      <div className="p-3 border-t border-border space-y-2 flex-shrink-0">

        {/* User card */}
        {user && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-secondary transition-colors">
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="w-8 h-8 rounded-full flex-shrink-0 ring-1 ring-border"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-sm">
                {initials}
              </div>
            )}
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden flex-1 min-w-0"
                >
                  <p className="text-xs font-semibold truncate leading-snug">{user.name || 'User'}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Auth button */}
        {user ? (
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-muted-foreground hover:text-red-400 hover:bg-red-500/8 transition-colors"
            title={collapsed ? 'Sign Out' : undefined}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden whitespace-nowrap font-medium"
                >
                  Sign Out
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
            title={collapsed ? 'Sign In' : undefined}
          >
            <LogIn className="w-4 h-4 flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden whitespace-nowrap font-medium"
                >
                  Sign In
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-xl text-muted-foreground/50 hover:text-muted-foreground hover:bg-secondary transition-colors"
        >
          <motion.div animate={{ rotate: collapsed ? 0 : 180 }} transition={{ duration: 0.3 }}>
            <ChevronRight className="w-4 h-4" />
          </motion.div>
        </button>
      </div>
    </motion.aside>
  );
}
