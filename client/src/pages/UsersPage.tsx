import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { userService } from '../services/userService';
import { reportService } from '../services/reportService';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';
import AnimatedSelect from '../components/AnimatedSelect';
import CountUp from '../components/CountUp';
import SpotlightCard from '../components/SpotlightCard';
import Tilt3D from '../components/Tilt3D';

const ease = [0.16, 1, 0.3, 1] as [number,number,number,number];

const roleConfig = {
  admin:   { label: 'Admin',   cls: 'badge-admin',   icon: '👑' },
  agent:   { label: 'Agent',   cls: 'badge-agent',   icon: '🛡️' },
  citizen: { label: 'Citizen', cls: 'badge-citizen', icon: '🌱' },
};

const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { t } = useTranslation();
  const isAdmin = currentUser?.role === 'admin';

  const [users, setUsers] = useState<User[]>([]);
  const [reportCounts, setReportCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deleteMsg, setDeleteMsg] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [usersRes, reportsRes] = await Promise.allSettled([
          userService.getAll(),
          reportService.getAll({ limit: 200 }),
        ]);
        if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data);
        if (reportsRes.status === 'fulfilled') {
          const counts: Record<string, number> = {};
          reportsRes.value.data.forEach(r => {
            const uid = typeof r.user === 'object' ? r.user.id : r.user as string;
            counts[uid] = (counts[uid] || 0) + 1;
          });
          setReportCounts(counts);
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() =>
    users.filter(u => {
      const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                         u.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = !roleFilter || u.role === roleFilter;
      return matchSearch && matchRole;
    }), [users, search, roleFilter]);

  const handleRoleChange = async (id: string, role: string) => {
    await userService.update(id, { role: role as User['role'] });
    setUsers(p => p.map(u => u.id === id ? { ...u, role: role as User['role'] } : u));
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await userService.delete(id);
      setUsers(p => p.filter(u => u.id !== id));
      setDeleteMsg(`User "${name}" deleted.`);
      setTimeout(() => setDeleteMsg(''), 3000);
    } catch { setDeleteMsg('Failed to delete user.'); }
  };

  const counts = { total: users.length, admin: users.filter(u=>u.role==='admin').length, agent: users.filter(u=>u.role==='agent').length, citizen: users.filter(u=>u.role==='citizen').length };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-[3px] border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 pb-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('users.title')}</h2>
        <p className="text-slate-400 text-sm mt-0.5">{t('users.subtitle')}</p>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('users.totalMembers'), value: counts.total,   emoji: '👥', color: 'from-slate-500 to-slate-600',     spotlight: 'rgba(100,116,139,0.12)' },
          { label: t('users.admins'),       value: counts.admin,   emoji: '👑', color: 'from-red-500 to-rose-600',       spotlight: 'rgba(239,68,68,0.12)' },
          { label: t('users.agents'),       value: counts.agent,   emoji: '🛡️', color: 'from-violet-500 to-purple-600', spotlight: 'rgba(139,92,246,0.12)' },
          { label: t('users.citizens'),     value: counts.citizen, emoji: '🌱', color: 'from-teal-500 to-emerald-600',   spotlight: 'rgba(20,184,166,0.12)' },
        ].map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.07, duration: 0.4, ease }}>
            <Tilt3D intensity={7}>
              <SpotlightCard className="card flex items-center gap-3" spotlightColor={s.spotlight}>
                <motion.div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-xl shrink-0`}
                  whileHover={{ rotate: [0, -8, 8, 0], scale: 1.1 }}
                  transition={{ duration: 0.4 }}
                >{s.emoji}</motion.div>
                <div>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                    <CountUp to={s.value} duration={1.2} />
                  </p>
                  <p className="text-xs text-slate-400">{s.label}</p>
                </div>
              </SpotlightCard>
            </Tilt3D>
          </motion.div>
        ))}
      </div>

      {deleteMsg && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-sm px-4 py-3 rounded-xl">{deleteMsg}</div>
      )}

      {/* Filters */}
      <div className="card py-3.5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="input-field pl-9 py-2 text-sm" placeholder={t('users.searchPlaceholder')} />
        </div>
        <div className="flex gap-1.5">
          {['', 'admin', 'agent', 'citizen'].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${roleFilter === r ? 'bg-primary-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
              {r === '' ? t('common.all') : r.charAt(0).toUpperCase() + r.slice(1) + 's'}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400 ml-auto">{filtered.length} of {users.length}</span>
      </div>

      {/* User grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence>
        {filtered.map((u, idx) => {
          const cfg = roleConfig[u.role];
          const rCount = reportCounts[u.id] || 0;
          const isSelf = u.id === currentUser?.id;
          const avatarGradient = u.role === 'admin' ? 'from-red-500 to-rose-600' : u.role === 'agent' ? 'from-violet-500 to-purple-600' : 'from-teal-500 to-emerald-600';

          return (
            <motion.div key={u.id}
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: idx * 0.05, duration: 0.38, ease }}
              layout
            >
            <Tilt3D intensity={7}>
            <div className="card">
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white text-lg font-bold shrink-0 shadow-sm`}>
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{u.name}</p>
                    {isSelf && <span className="text-[10px] bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800 px-1.5 py-0.5 rounded-full font-semibold">You</span>}
                  </div>
                  <p className="text-xs text-slate-400 truncate">{u.email}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={cfg.cls + ' shrink-0'}>{cfg.icon} {cfg.label}</span>
                    <span className="text-[11px] text-slate-400">{rCount} {t('common.report')}{rCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>

              {isAdmin && !isSelf && (
                <div className="flex gap-2 mt-4 pt-3 border-t border-slate-50 dark:border-slate-800">
                  <AnimatedSelect
                    value={u.role}
                    options={[
                      { value: 'citizen', label: 'Citizen', icon: '🌱' },
                      { value: 'agent',   label: 'Agent',   icon: '🛡️' },
                      { value: 'admin',   label: 'Admin',   icon: '👑' },
                    ]}
                    onChange={(v) => handleRoleChange(u.id, v)}
                    className="flex-1"
                  />
                  <button onClick={() => handleDelete(u.id, u.name)}
                    className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 text-xs font-semibold transition-colors shrink-0">
                    {t('users.remove')}
                  </button>
                </div>
              )}

              {!isAdmin && !isSelf && (
                <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-800 flex items-center gap-1.5">
                  <svg className="w-3 h-3 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="text-xs text-slate-300 dark:text-slate-600">{t('users.viewOnly')}</span>
                </div>
              )}
            </div>
            </Tilt3D>
            </motion.div>
          );
        })}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card text-center py-12">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-slate-500 dark:text-slate-400 font-medium">{t('users.noUsers')}</p>
          <button onClick={() => { setSearch(''); setRoleFilter(''); }} className="text-primary-600 dark:text-primary-400 text-sm font-semibold hover:underline mt-1">{t('users.clearFilters')}</button>
        </motion.div>
      )}
    </div>
  );
};

export default UsersPage;
