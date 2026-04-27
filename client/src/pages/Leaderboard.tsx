import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Trophy, Star, TrendingUp } from 'lucide-react';
import { leaderboardService } from '../services/leaderboardService';
import { LeaderboardData, LeaderboardEntry, BADGE_DEFINITIONS, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

const ROLE_COLORS: Record<UserRole, string> = {
  admin:   'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  agent:   'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
  citizen: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
};

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

const PODIUM_HEIGHTS: Record<number, string> = { 1: 'h-28', 2: 'h-20', 3: 'h-14' };
const PODIUM_GRADIENTS: Record<number, string> = {
  1: 'from-yellow-400 to-amber-500',
  2: 'from-slate-300 to-slate-400',
  3: 'from-orange-400 to-amber-600',
};

function BadgeChip({ id }: { id: string }) {
  const def = BADGE_DEFINITIONS[id];
  if (!def) return null;
  return (
    <span
      title={def.label}
      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gradient-to-r ${def.color} text-white`}
    >
      <span>{def.emoji}</span>
      <span className="hidden sm:inline truncate max-w-[64px]">{def.label}</span>
    </span>
  );
}

function PodiumCard({ entry, period }: { entry: LeaderboardEntry; period: 'alltime' | 'monthly' }) {
  const gradient = PODIUM_GRADIENTS[entry.rank];
  const topBadge = entry.badges[0];
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: entry.rank * 0.08, duration: 0.55, ease }}
      className="flex flex-col items-center gap-2 flex-1 min-w-0"
    >
      {/* Crown / medal */}
      <span className="text-2xl">{MEDAL[entry.rank]}</span>

      {/* Avatar */}
      <motion.div
        whileHover={{ scale: 1.08 }}
        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-lg bg-gradient-to-br ${gradient}`}
      >
        {entry.name.charAt(0).toUpperCase()}
      </motion.div>

      <div className="text-center min-w-0 w-full px-1">
        <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{entry.name}</p>
        <p className="text-[10px] text-slate-400 capitalize">{entry.role}</p>
        {topBadge && (
          <div className="flex justify-center mt-1">
            <BadgeChip id={topBadge} />
          </div>
        )}
      </div>

      {/* Podium base */}
      <div className={`w-full ${PODIUM_HEIGHTS[entry.rank]} rounded-t-xl bg-gradient-to-b ${gradient} opacity-90 flex flex-col items-center justify-end pb-2 shadow-inner`}>
        <p className="text-white font-black text-base leading-none">
          {period === 'alltime' ? `${entry.greenScore}` : `${entry.reportCount}`}
        </p>
        <p className="text-white/70 text-[10px]">
          {period === 'alltime' ? 'pts' : 'reports'}
        </p>
      </div>
    </motion.div>
  );
}

function TableRow({ entry, isSelf, period, index }: { entry: LeaderboardEntry; isSelf: boolean; period: 'alltime' | 'monthly'; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.15 + index * 0.04, duration: 0.4, ease }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors
        ${isSelf
          ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700/40'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
        }`}
    >
      {/* Rank */}
      <div className="w-8 text-center shrink-0">
        {entry.rank <= 3
          ? <span className="text-lg">{MEDAL[entry.rank]}</span>
          : <span className="text-sm font-bold text-slate-400">#{entry.rank}</span>
        }
      </div>

      {/* Avatar */}
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
        style={{ background: 'linear-gradient(135deg,#16a34a,#0d9144)' }}>
        {entry.name.charAt(0).toUpperCase()}
      </div>

      {/* Name + role */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-semibold truncate ${isSelf ? 'text-primary-700 dark:text-primary-300' : 'text-slate-800 dark:text-slate-100'}`}>
            {entry.name}
            {isSelf && <span className="text-[10px] text-primary-500 ml-1">(you)</span>}
          </span>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize ${ROLE_COLORS[entry.role]}`}>
            {entry.role}
          </span>
        </div>
        {entry.badges.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {entry.badges.slice(0, 3).map(b => <BadgeChip key={b} id={b} />)}
            {entry.badges.length > 3 && (
              <span className="text-[10px] text-slate-400">+{entry.badges.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Score */}
      <div className="text-right shrink-0">
        <p className="text-sm font-black text-slate-800 dark:text-slate-100">
          {period === 'alltime' ? entry.greenScore : entry.reportCount}
        </p>
        <p className="text-[10px] text-slate-400">
          {period === 'alltime' ? 'pts' : 'reports'}
        </p>
      </div>
    </motion.div>
  );
}

const Leaderboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [period, setPeriod] = useState<'alltime' | 'monthly'>('alltime');
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    leaderboardService.get(period)
      .then(res => setData(res.data))
      .finally(() => setIsLoading(false));
  }, [period]);

  const podiumOrder = data
    ? [
        data.entries.find(e => e.rank === 2),
        data.entries.find(e => e.rank === 1),
        data.entries.find(e => e.rank === 3),
      ].filter(Boolean) as LeaderboardEntry[]
    : [];

  const tableEntries = data?.entries.filter(e => e.rank > 3) ?? [];

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease }}
        className="relative rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0e2f1c 0%, #164427 50%, #16a34a 100%)' }}
      >
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <p className="text-primary-300 text-xs font-semibold uppercase tracking-widest">{t('leaderboard.title')}</p>
              <h2 className="text-lg font-bold text-white">{t('leaderboard.subtitle')}</h2>
            </div>
          </div>
          {/* Period toggle */}
          <div className="flex items-center gap-1 bg-white/10 rounded-xl p-1 shrink-0">
            {(['alltime', 'monthly'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  period === p
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                {t(`leaderboard.${p}`)}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Current user card */}
      {data && user && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4, ease }}
          className="card border border-primary-200 dark:border-primary-700/40 bg-primary-50/50 dark:bg-primary-900/10"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base shrink-0"
              style={{ background: 'linear-gradient(135deg,#16a34a,#0d9144)' }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{t('leaderboard.yourRank')}</p>
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                {data.currentUser.badges.slice(0, 4).map(b => <BadgeChip key={b} id={b} />)}
              </div>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="text-center">
                <p className="text-lg font-black text-primary-600 dark:text-primary-400">
                  {data.currentUser.rank != null ? `#${data.currentUser.rank}` : '—'}
                </p>
                <p className="text-[10px] text-slate-400">{t('leaderboard.rank')}</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-black text-slate-800 dark:text-slate-100">
                  {period === 'alltime' ? data.currentUser.greenScore : data.currentUser.reportCount}
                </p>
                <p className="text-[10px] text-slate-400">
                  {period === 'alltime' ? t('leaderboard.pts') : t('leaderboard.reports')}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <motion.div
            className="w-8 h-8 rounded-full border-[3px] border-primary-600 border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      ) : data && data.entries.length === 0 ? (
        <div className="card text-center py-14">
          <p className="text-4xl mb-3">🏆</p>
          <p className="text-slate-500 dark:text-slate-400 font-medium">{t('leaderboard.empty')}</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={period}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Podium */}
            {podiumOrder.length > 0 && (
              <div className="card">
                <div className="flex items-end justify-center gap-2 px-2 pt-2 pb-0">
                  {podiumOrder.map(entry => (
                    <PodiumCard key={entry.userId.toString()} entry={entry} period={period} />
                  ))}
                </div>
              </div>
            )}

            {/* Rest of leaderboard */}
            {tableEntries.length > 0 && (
              <div className="card divide-y divide-slate-100 dark:divide-slate-800 !p-2 space-y-0.5">
                <div className="flex items-center gap-2 px-4 py-2">
                  <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t('leaderboard.rankings')}</p>
                  <span className="ml-auto text-[10px] text-slate-400 flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    {period === 'alltime' ? t('leaderboard.sortedByScore') : t('leaderboard.sortedByReports')}
                  </span>
                </div>
                {tableEntries.map((entry, i) => (
                  <TableRow
                    key={entry.userId.toString()}
                    entry={entry}
                    isSelf={user?.id === entry.userId.toString()}
                    period={period}
                    index={i}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default Leaderboard;
