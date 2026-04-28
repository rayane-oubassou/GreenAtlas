import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, ArrowRight,
  LayoutDashboard, Map, AlertTriangle, Droplets, TreePine,
  Users2, Settings2, User, Trophy, Leaf,
} from 'lucide-react';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';
import LanguageSwitcher from './LanguageSwitcher';
import { useAuth } from '../context/AuthContext';

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

type PageIcon = React.ElementType;

const pageMeta: Record<string, { title: string; sub: string; Icon: PageIcon }> = {
  '/':             { title: 'Dashboard',       sub: 'Environmental overview',  Icon: LayoutDashboard },
  '/map':          { title: 'Live Map',         sub: 'Real-time incidents',     Icon: Map             },
  '/report/new':   { title: 'Report Incident',  sub: 'Submit new report',       Icon: AlertTriangle   },
  '/water':        { title: 'Water Resources',  sub: 'Levels & availability',   Icon: Droplets        },
  '/forest':       { title: 'Forest Monitor',   sub: 'Fire risk & health',      Icon: TreePine        },
  '/users':        { title: 'Users',            sub: 'Manage platform members', Icon: Users2          },
  '/admin':        { title: 'Admin Panel',      sub: 'Analytics & management',  Icon: Settings2       },
  '/profile':      { title: 'My Profile',       sub: 'Account settings',        Icon: User            },
  '/leaderboard':  { title: 'Leaderboard',      sub: 'Top contributors',        Icon: Trophy          },
};

interface Page { path: string; label: string; Icon: PageIcon; roles?: string[] }
const allPages: Page[] = [
  { path: '/',            label: 'Dashboard',      Icon: LayoutDashboard },
  { path: '/map',         label: 'Live Map',        Icon: Map             },
  { path: '/report/new',  label: 'New Report',      Icon: AlertTriangle   },
  { path: '/water',       label: 'Water Resources', Icon: Droplets        },
  { path: '/forest',      label: 'Forest Monitor',  Icon: TreePine        },
  { path: '/leaderboard', label: 'Leaderboard',     Icon: Trophy          },
  { path: '/profile',     label: 'My Profile',       Icon: User            },
  { path: '/users',       label: 'Users',            Icon: Users2,  roles: ['admin','agent'] },
  { path: '/admin',       label: 'Admin Panel',      Icon: Settings2, roles: ['admin'] },
];

const Navbar: React.FC = () => {
  const { pathname } = useLocation();
  const { user }     = useAuth();
  const { t }        = useTranslation();
  const navigate     = useNavigate();
  const meta         = pageMeta[pathname];

  const [searchOpen, setSearchOpen] = useState(false);
  const [query,      setQuery]      = useState('');
  const [activeIdx,  setActiveIdx]  = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  const pages = allPages.filter(p => !p.roles || (user && p.roles.includes(user.role)));
  const results = query.trim()
    ? pages.filter(p => p.label.toLowerCase().includes(query.toLowerCase()))
    : pages;

  const openSearch = useCallback(() => {
    setSearchOpen(true);
    setQuery('');
    setActiveIdx(0);
    setTimeout(() => inputRef.current?.focus(), 40);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setQuery('');
    setActiveIdx(0);
  }, []);

  const goTo = useCallback((path: string) => {
    navigate(path);
    closeSearch();
  }, [navigate, closeSearch]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
      if (e.key === 'Escape') closeSearch();
      if (!searchOpen) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
      if (e.key === 'Enter' && results[activeIdx]) goTo(results[activeIdx].path);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [searchOpen, results, activeIdx, openSearch, closeSearch, goTo]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) closeSearch();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [closeSearch]);

  useEffect(() => { setActiveIdx(0); }, [query]);

  const MetaIcon = meta?.Icon;

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease }}
      className="h-[60px] shrink-0 sticky top-0 z-40 flex items-center
                 bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl
                 border-b border-slate-200/70 dark:border-slate-800/80
                 transition-colors duration-300"
    >
      {/* Subtle bottom glow */}
      <div className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(34,197,94,0.15) 50%, transparent 90%)' }} />

      {/* ── LEFT: brand mark ────────────────────────────────────── */}
      <div className="w-14 flex items-center justify-center shrink-0">
        <Link to="/" className="w-8 h-8 rounded-xl flex items-center justify-center transition-opacity hover:opacity-80"
          style={{ background: 'linear-gradient(135deg,#16a34a,#0d9144)' }}>
          <Leaf className="w-4 h-4 text-white" />
        </Link>
      </div>

      {/* ── CENTER: page title ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center text-center min-w-0 px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2, ease }}
            className="flex items-center gap-2"
          >
            {MetaIcon && (
              <MetaIcon className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
            )}
            <span className="text-[15px] font-semibold text-slate-800 dark:text-slate-100 leading-tight">
              {meta?.title ?? 'GreenAtlas'}
            </span>
          </motion.div>
        </AnimatePresence>
        <AnimatePresence mode="wait">
          <motion.p
            key={`sub-${pathname}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease }}
            className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight"
          >
            {meta?.sub ?? ''}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* ── RIGHT: search + controls ─────────────────────────────── */}
      <div className="flex items-center gap-1 pr-3 shrink-0">

        {/* Search icon button + palette */}
        <div ref={searchRef} className="relative">
          <motion.button
            onClick={openSearch}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Search  ⌘K"
            className="w-8 h-8 rounded-xl flex items-center justify-center
                       text-slate-400 dark:text-slate-500
                       hover:bg-slate-100 dark:hover:bg-slate-800
                       hover:text-slate-600 dark:hover:text-slate-300
                       transition-all duration-150"
          >
            <Search className="w-4 h-4" />
          </motion.button>

          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.18, ease }}
                className="absolute top-[calc(100%+10px)] right-0 w-80 z-50 rounded-2xl overflow-hidden
                           bg-white dark:bg-slate-900
                           border border-slate-200 dark:border-slate-700/60
                           shadow-2xl shadow-black/10 dark:shadow-black/40"
              >
                <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search pages…"
                    className="flex-1 text-sm bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none"
                  />
                  {query && (
                    <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <kbd className="text-[10px] font-mono text-slate-300 dark:text-slate-600">ESC</kbd>
                </div>

                <div className="py-1.5 max-h-64 overflow-y-auto">
                  {results.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">No results</p>
                  ) : (
                    <>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 pb-1.5">
                        {query ? 'Results' : 'Jump to'}
                      </p>
                      {results.map((page, i) => (
                        <motion.button
                          key={page.path}
                          onClick={() => goTo(page.path)}
                          onMouseEnter={() => setActiveIdx(i)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors
                                     ${i === activeIdx
                                       ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                                       : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'}`}
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.025 }}
                        >
                          <page.Icon className="w-4 h-4 shrink-0 opacity-60" />
                          <span className="flex-1 font-medium truncate">{page.label}</span>
                          <ArrowRight className={`w-3.5 h-3.5 shrink-0 transition-opacity ${i === activeIdx ? 'opacity-100' : 'opacity-0'}`} />
                        </motion.button>
                      ))}
                    </>
                  )}
                </div>

                <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400">
                    <kbd className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px]">↑↓</kbd> navigate
                    <span className="mx-1.5">·</span>
                    <kbd className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px]">↵</kbd> open
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <ThemeToggle />
        <LanguageSwitcher />
        <NotificationBell />

        {user && (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
            <Link to="/profile" className="flex items-center gap-2 pl-1">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-tight">{user.name.split(' ')[0]}</span>
                <span className="text-[10px] capitalize text-slate-400 leading-tight">{user.role}</span>
              </div>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold ring-2 ring-primary-500/20"
                style={{ background: 'linear-gradient(135deg,#16a34a,#0d9144)' }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
            </Link>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
};

export default Navbar;
