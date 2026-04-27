import React, { useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Map, AlertTriangle, Droplets, TreePine,
  Users2, Settings2, LogOut, User, Plus, ChevronLeft, ChevronRight, Trophy,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

interface NavItem {
  path: string;
  labelKey: string;
  Icon: React.ElementType;
  end?: boolean;
  roles?: string[];
}

const sections: { label: string | null; items: NavItem[]; roles?: string[] }[] = [
  {
    label: null,
    items: [
      { path: '/',             labelKey: 'nav.dashboard',     Icon: LayoutDashboard, end: true },
      { path: '/map',          labelKey: 'nav.liveMap',        Icon: Map },
      { path: '/leaderboard',  labelKey: 'nav.leaderboard',    Icon: Trophy },
    ],
  },
  {
    label: 'MONITORING',
    items: [
      { path: '/water',  labelKey: 'nav.waterResources', Icon: Droplets  },
      { path: '/forest', labelKey: 'nav.forestMonitor',  Icon: TreePine  },
    ],
  },
  {
    label: 'MANAGE',
    roles: ['admin', 'agent'],
    items: [
      { path: '/users', labelKey: 'nav.users',      Icon: Users2,   roles: ['admin', 'agent'] },
      { path: '/admin', labelKey: 'nav.adminPanel', Icon: Settings2, roles: ['admin'] },
    ],
  },
];

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);

  const roleColor: Record<string, string> = {
    admin:   'bg-red-500/20 text-red-300 border border-red-500/30',
    agent:   'bg-violet-500/20 text-violet-300 border border-violet-500/30',
    citizen: 'bg-teal-500/20 text-teal-300 border border-teal-500/30',
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 280 }}
      transition={{ duration: 0.35, ease }}
      className="relative flex flex-col shrink-0 overflow-hidden sidebar-gradient border-r"
      style={{ borderColor: 'rgba(34,197,94,0.08)' }}
    >
      {/* Top glow line */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(34,197,94,0.4), transparent)' }} />

      {/* Logo row */}
      <div className="flex items-center h-16 px-4 shrink-0 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <Link to="/" className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg,#16a34a,#0d9144)', boxShadow: '0 0 20px rgba(22,163,74,0.35)' }}>
            <Logo size={20} withText={false} />
          </div>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="text-white font-bold text-base tracking-tight overflow-hidden whitespace-nowrap"
              >GreenAtlas</motion.span>
            )}
          </AnimatePresence>
        </Link>

        <motion.button
          onClick={() => setCollapsed(p => !p)}
          className="ml-auto w-6 h-6 rounded-lg flex items-center justify-center text-white/25 hover:text-white/60 hover:bg-white/8 transition-all shrink-0"
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </motion.button>
      </div>

      {/* New Report CTA */}
      <div className="px-3 pt-4 pb-2 shrink-0">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          <Link to="/report/new"
            className="flex items-center justify-center gap-2.5 w-full py-2.5 rounded-xl font-semibold text-sm text-white overflow-hidden"
            style={{ background: 'linear-gradient(135deg,#16a34a,#0d9144)', boxShadow: '0 0 20px rgba(22,163,74,0.2), inset 0 1px 0 rgba(255,255,255,0.1)' }}
          >
            <Plus className="w-4 h-4 shrink-0" />
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden whitespace-nowrap"
                >New Report</motion.span>
              )}
            </AnimatePresence>
          </Link>
        </motion.div>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
        {sections.map((section, si) => {
          const items = section.roles
            ? section.items.filter(item => !item.roles || (user && item.roles.includes(user.role)))
            : section.items;

          const sectionVisible = !section.roles || (user && section.roles.some(r => r === user.role));
          if (!sectionVisible || items.length === 0) return null;

          return (
            <div key={si} className={si > 0 ? 'pt-3' : ''}>
              {/* Section label */}
              <AnimatePresence initial={false}>
                {!collapsed && section.label && (
                  <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="text-[10px] font-bold text-white/20 uppercase tracking-[0.12em] px-3 pb-1.5"
                  >{section.label}</motion.p>
                )}
              </AnimatePresence>

              {/* Items */}
              {items.map((item, ii) => (
                <motion.div key={item.path}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (si * 3 + ii) * 0.04, duration: 0.3, ease }}>
                  <NavLink to={item.path} end={item.end}
                    title={collapsed ? t(item.labelKey) : undefined}
                    className={({ isActive }) =>
                      `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 group
                       ${isActive
                         ? 'text-primary-300'
                         : 'text-white/40 hover:text-white/75 hover:bg-white/5'}`
                    }
                    style={({ isActive }) => isActive ? {
                      background: 'linear-gradient(90deg, rgba(22,163,74,0.18), rgba(22,163,74,0.06))',
                      boxShadow: 'inset 0 0 0 1px rgba(34,197,94,0.12)',
                    } : undefined}
                  >
                    {({ isActive }) => (
                      <>
                        {/* Active left glow bar */}
                        <AnimatePresence>
                          {isActive && (
                            <motion.div
                              layoutId="sidebar-active-bar"
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full"
                              style={{ background: 'linear-gradient(180deg, #4ade80, #16a34a)' }}
                              initial={{ opacity: 0, scaleY: 0 }}
                              animate={{ opacity: 1, scaleY: 1 }}
                              exit={{ opacity: 0, scaleY: 0 }}
                            />
                          )}
                        </AnimatePresence>

                        <motion.div
                          className={`shrink-0 transition-colors ${isActive ? 'text-primary-400' : 'text-white/30 group-hover:text-white/55'}`}
                          whileHover={{ scale: 1.12 }}
                        >
                          <item.Icon className="w-[17px] h-[17px]" />
                        </motion.div>

                        <AnimatePresence initial={false}>
                          {!collapsed && (
                            <motion.span
                              initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}
                              className="truncate overflow-hidden whitespace-nowrap"
                            >{t(item.labelKey)}</motion.span>
                          )}
                        </AnimatePresence>
                      </>
                    )}
                  </NavLink>
                </motion.div>
              ))}
            </div>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 h-px shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }} />

      {/* Profile section */}
      <div className="p-3 shrink-0 space-y-1">
        {user && (
          <NavLink to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer group
               ${isActive ? 'bg-white/8' : 'hover:bg-white/5'}`
            }
          >
            <motion.div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg,#16a34a,#0d9144)' }}
              whileHover={{ scale: 1.08 }}
            >
              {user.name.charAt(0).toUpperCase()}
            </motion.div>

            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden min-w-0 flex-1"
                >
                  <p className="text-xs font-semibold text-white/80 truncate">{user.name}</p>
                  <span className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize mt-0.5 ${roleColor[user.role]}`}>
                    {user.role}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </NavLink>
        )}

        <motion.button
          onClick={() => { logout(); navigate('/login'); }}
          title={collapsed ? 'Sign out' : undefined}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-white/25 hover:text-red-400 hover:bg-red-900/15 transition-all text-xs font-medium group"
          whileHover={{ x: 1 }} whileTap={{ scale: 0.97 }}
        >
          <LogOut className="w-4 h-4 shrink-0 group-hover:text-red-400 transition-colors" />
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden whitespace-nowrap"
              >{t('nav.signOut')}</motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
