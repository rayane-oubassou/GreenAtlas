import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowRight } from 'lucide-react';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';
import LanguageSwitcher from './LanguageSwitcher';
import { useAuth } from '../context/AuthContext';

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

const pageMeta: Record<string, { title: string; sub: string; emoji: string; color: string }> = {
  '/':             { title: 'Dashboard',        sub: 'Environmental overview',    emoji: '🌍', color: 'from-slate-500 to-slate-600' },
  '/map':          { title: 'Live Map',          sub: 'Real-time incidents',       emoji: '🗺️', color: 'from-blue-500 to-indigo-600' },
  '/report/new':   { title: 'Report Incident',   sub: 'Submit new report',         emoji: '⚠️', color: 'from-amber-500 to-orange-600' },
  '/water':        { title: 'Water Resources',   sub: 'Levels & availability',     emoji: '💧', color: 'from-cyan-500 to-blue-600' },
  '/forest':       { title: 'Forest Monitor',    sub: 'Fire risk & health',        emoji: '🌲', color: 'from-primary-500 to-emerald-600' },
  '/users':        { title: 'Users',             sub: 'Manage platform members',   emoji: '👥', color: 'from-violet-500 to-purple-600' },
  '/admin':        { title: 'Admin Panel',       sub: 'Analytics & management',    emoji: '⚙️', color: 'from-rose-500 to-red-600' },
  '/profile':      { title: 'My Profile',        sub: 'Account settings',          emoji: '👤', color: 'from-teal-500 to-emerald-600' },
  '/leaderboard':  { title: 'Leaderboard',       sub: 'Top contributors',          emoji: '🏆', color: 'from-yellow-500 to-amber-600' },
};

interface Page { path: string; label: string; emoji: string; roles?: string[] }
const allPages: Page[] = [
  { path: '/',           label: 'Dashboard',       emoji: '🌍' },
  { path: '/map',        label: 'Live Map',         emoji: '🗺️' },
  { path: '/report/new', label: 'New Report',       emoji: '⚠️' },
  { path: '/water',      label: 'Water Resources',  emoji: '💧' },
  { path: '/forest',     label: 'Forest Monitor',   emoji: '🌲' },
  { path: '/profile',    label: 'My Profile',        emoji: '👤' },
  { path: '/leaderboard', label: 'Leaderboard',       emoji: '🏆' },
  { path: '/users',       label: 'Users',             emoji: '👥', roles: ['admin','agent'] },
  { path: '/admin',       label: 'Admin Panel',       emoji: '⚙️', roles: ['admin'] },
];

const Navbar: React.FC = () => {
  const { pathname } = useLocation();
  const { user }     = useAuth();
  const { t }        = useTranslation();
  const navigate     = useNavigate();
  const meta         = pageMeta[pathname];

  const [searchOpen,  setSearchOpen]  = useState(false);
  const [query,       setQuery]       = useState('');
  const [activeIdx,   setActiveIdx]   = useState(0);
  const searchRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

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

  /* Keyboard shortcuts */
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

  /* Click outside to close */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) closeSearch();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [closeSearch]);

  /* Reset idx when results change */
  useEffect(() => { setActiveIdx(0); }, [query]);

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease }}
      className="h-[68px] shrink-0 sticky top-0 z-40 flex items-center gap-4 px-6
                 bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl
                 border-b border-slate-200/60 dark:border-slate-800/80
                 transition-colors duration-300"
    >
      {/* Subtle bottom glow line */}
      <div className="absolute bottom-0 left-1/4 right-1/4 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(34,197,94,0.2), transparent)' }} />

      {/* ── LEFT: Page context ────────────────────────────────── */}
      <div className="flex-1 flex items-center gap-3 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.28, ease }}
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 bg-gradient-to-br ${meta?.color ?? 'from-slate-400 to-slate-500'}`}
          >{meta?.emoji ?? '🌿'}</motion.div>
        </AnimatePresence>

        <div className="min-w-0">
          <AnimatePresence mode="wait">
            <motion.h1
              key={`h-${pathname}`}
              initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.22, ease }}
              className="text-[15px] font-bold text-slate-800 dark:text-slate-100 leading-tight truncate"
            >{meta?.title ?? 'GreenAtlas'}</motion.h1>
          </AnimatePresence>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight truncate">
            {meta?.sub ?? ''}
          </p>
        </div>
      </div>

      {/* ── CENTER: Search / Command palette ─────────────────── */}
      <div className="flex-1 flex justify-center">
        <div ref={searchRef} className="relative w-full max-w-[340px]">
          {/* Trigger bar */}
          <motion.button
            onClick={openSearch}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm
                       text-slate-400 dark:text-slate-500
                       bg-slate-100 dark:bg-slate-800/80
                       border border-slate-200 dark:border-slate-700/60
                       hover:border-primary-300 dark:hover:border-primary-600/40
                       transition-all duration-200 group"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <Search className="w-3.5 h-3.5 shrink-0 group-hover:text-primary-500 transition-colors" />
            <span className="flex-1 text-left text-xs truncate">Search or jump to…</span>
            <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] font-mono bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 px-1.5 py-0.5 rounded-md">
              <span className="text-[11px]">⌘</span>K
            </kbd>
          </motion.button>

          {/* Command palette dropdown */}
          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.2, ease }}
                className="absolute top-[calc(100%+8px)] left-0 right-0 z-50 rounded-2xl overflow-hidden
                           bg-white dark:bg-slate-900
                           border border-slate-200 dark:border-slate-700/60
                           shadow-2xl shadow-black/10 dark:shadow-black/40"
              >
                {/* Search input */}
                <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Type to search…"
                    className="flex-1 text-sm bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none"
                  />
                  {query && (
                    <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <kbd className="text-[10px] font-mono text-slate-300 dark:text-slate-600">ESC</kbd>
                </div>

                {/* Results */}
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
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                        >
                          <span className="text-base w-6 text-center shrink-0">{page.emoji}</span>
                          <span className="flex-1 font-medium truncate">{page.label}</span>
                          <ArrowRight className={`w-3.5 h-3.5 shrink-0 transition-opacity ${i === activeIdx ? 'opacity-100' : 'opacity-0'}`} />
                        </motion.button>
                      ))}
                    </>
                  )}
                </div>

                <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
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
      </div>

      {/* ── RIGHT: Actions ────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-end gap-1.5">
        <ThemeToggle />
        <LanguageSwitcher />
        <NotificationBell />

        {/* Avatar + role */}
        {user && (
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
            <Link to="/profile" className="flex items-center gap-2.5 pl-2">
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
