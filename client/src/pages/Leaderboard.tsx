import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Trophy, TrendingUp, ChevronUp, Star, BarChart2 } from 'lucide-react';
import { leaderboardService } from '../services/leaderboardService';
import { LeaderboardData, LeaderboardEntry, BADGE_DEFINITIONS, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

const ROLE_PILL: Record<UserRole, string> = {
  admin:   'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  agent:   'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
  citizen: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
};

const MEDAL_COLORS = {
  1: { bg: 'from-yellow-400 to-amber-500',  ring: 'ring-yellow-400/50', text: 'text-amber-500',  glow: 'rgba(251,191,36,0.2)',  label: '1st' },
  2: { bg: 'from-slate-300 to-slate-400',   ring: 'ring-slate-300/50',  text: 'text-slate-400',  glow: 'rgba(148,163,184,0.15)', label: '2nd' },
  3: { bg: 'from-orange-300 to-amber-400',  ring: 'ring-orange-400/50', text: 'text-orange-500', glow: 'rgba(249,115,22,0.15)',  label: '3rd' },
} as Record<number, { bg: string; ring: string; text: string; glow: string; label: string }>;

function BadgePill({ id }: { id: string }) {
  const def = BADGE_DEFINITIONS[id];
  if (!def) return null;
  return (
    <span
      title={def.label}
      className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gradient-to-r ${def.color} text-white`}
    >
      {def.label}
    </span>
  );
}

function Avatar({ name, size = 10, rank }: { name: string; size?: number; rank?: number }) {
  const gradient = rank === 1
    ? 'linear-gradient(135deg,#f59e0b,#d97706)'
    : rank === 2
    ? 'linear-gradient(135deg,#94a3b8,#64748b)'
    : rank === 3
    ? 'linear-gradient(135deg,#f97316,#d97706)'
    : 'linear-gradient(135deg,#16a34a,#0d9144)';
  const dim = size <= 9 ? 'w-9 h-9' : size <= 11 ? 'w-11 h-11' : 'w-14 h-14';
  const fontSize = size <= 9 ? 'text-sm' : size <= 11 ? 'text-base' : 'text-xl';
  return (
    <div
      className={`${dim} rounded-2xl flex items-center justify-center text-white font-bold shrink-0 ${fontSize}`}
      style={{ background: gradient }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

/* ── Top-3 hero card ──────────────────────────────────────────── */
function HeroCard({ entry, period, isSelf }: { entry: LeaderboardEntry; period: 'alltime' | 'monthly'; isSelf: boolean }) {
  const med = MEDAL_COLORS[entry.rank] ?? MEDAL_COLORS[3];
  const isGold = entry.rank === 1;
  const value = period === 'alltime' ? entry.greenScore : entry.reportCount;
  const unit  = period === 'alltime' ? 'pts' : 'reports';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: entry.rank * 0.07, duration: 0.5, ease }}
      className={`relative flex flex-col items-center text-center p-6 rounded-2xl border
        bg-white dark:bg-slate-900 transition-shadow hover:shadow-lg
        ${isGold ? 'border-yellow-200/80 dark:border-yellow-700/30' : 'border-slate-200/80 dark:border-slate-700/60'}
        ${isSelf ? 'ring-2 ring-primary-400/40' : ''}
        ${isGold ? `shadow-[0_4px_32px_${med.glow}]` : 'shadow-sm'}
      `}
    >
      {/* Gold ambient glow */}
      {isGold && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 50% 0%, ${med.glow} 0%, transparent 65%)` }} />
      )}

      {/* Medal */}
      <div className={`relative mb-4 inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br ${med.bg} shrink-0`}>
        <span className="text-white text-[10px] font-black">{entry.rank}</span>
      </div>

      {/* Avatar */}
      <div className={`ring-2 ${med.ring} rounded-2xl mb-3`}>
        <Avatar name={entry.name} size={isGold ? 14 : 11} rank={entry.rank} />
      </div>

      <p className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight truncate w-full px-1">
        {entry.name}
        {isSelf && <span className="text-primary-500 text-[10px] ml-1">(you)</span>}
      </p>
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize mt-1.5 ${ROLE_PILL[entry.role]}`}>
        {entry.role}
      </span>

      <div className="mt-4">
        <p className={`font-black leading-none tabular-nums ${isGold ? 'text-3xl text-amber-500' : 'text-2xl text-slate-700 dark:text-slate-200'}`}>
          {value.toLocaleString()}
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">{unit}</p>
      </div>

      {entry.badges.length > 0 && (
        <div className="flex flex-wrap gap-1 justify-center mt-3">
          {entry.badges.slice(0, isGold ? 4 : 2).map(b => <BadgePill key={b} id={b} />)}
          {entry.badges.length > (isGold ? 4 : 2) && (
            <span className="text-[10px] text-slate-400 self-center">+{entry.badges.length - (isGold ? 4 : 2)}</span>
          )}
        </div>
      )}
    </motion.div>
  );
}

/* ── Table row for rank 4+ ────────────────────────────────────── */
function TableRow({
  entry, period, isSelf, index, maxScore,
}: {
  entry: LeaderboardEntry; period: 'alltime' | 'monthly'; isSelf: boolean; index: number; maxScore: number;
}) {
  const value    = period === 'alltime' ? entry.greenScore : entry.reportCount;
  const barPct   = maxScore > 0 ? (value / maxScore) * 100 : 0;
  const barColor = isSelf ? '#22c55e' : '#3b82f6';

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.08 + index * 0.03, duration: 0.35, ease }}
      className={`grid items-center gap-4 px-5 py-3.5 rounded-xl transition-colors group
        ${isSelf
          ? 'bg-primary-50 dark:bg-primary-900/15 border border-primary-200/60 dark:border-primary-700/40'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
        }`}
      style={{ gridTemplateColumns: '52px 1fr auto minmax(140px,2fr) 64px' }}
    >
      {/* Rank */}
      <div className="flex items-center justify-center">
        <span className="text-sm font-black text-slate-400 dark:text-slate-500 tabular-nums">#{entry.rank}</span>
      </div>

      {/* User */}
      <div className="flex items-center gap-3 min-w-0">
        <Avatar name={entry.name} size={9} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-sm font-bold truncate ${isSelf ? 'text-primary-700 dark:text-primary-300' : 'text-slate-800 dark:text-slate-100'}`}>
              {entry.name}
              {isSelf && <span className="text-[10px] text-primary-400 ml-1">you</span>}
            </span>
          </div>
          {entry.badges.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-0.5">
              {entry.badges.slice(0, 2).map(b => <BadgePill key={b} id={b} />)}
              {entry.badges.length > 2 && (
                <span className="text-[10px] text-slate-400">+{entry.badges.length - 2}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Role */}
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize shrink-0 ${ROLE_PILL[entry.role]}`}>
        {entry.role}
      </span>

      {/* Score bar + value */}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden min-w-0">
          <motion.div
            className="h-1.5 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${barPct}%` }}
            transition={{ duration: 0.9, delay: 0.1 + index * 0.03, ease: [0.16, 1, 0.3, 1] }}
            style={{ background: `linear-gradient(90deg, ${barColor}88, ${barColor})` }}
          />
        </div>
        <span className={`text-sm font-black tabular-nums shrink-0 ${isSelf ? 'text-primary-600 dark:text-primary-400' : 'text-slate-800 dark:text-slate-100'}`}>
          {value.toLocaleString()}
        </span>
      </div>

      {/* Reports count */}
      <div className="text-right">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
          {entry.reportCount}
          <span className="text-[10px] text-slate-400 ml-0.5">rpts</span>
        </span>
      </div>
    </motion.div>
  );
}

/* ── Page ─────────────────────────────────────────────────────── */
const Leaderboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [period, setPeriod] = useState<'alltime' | 'monthly'>('alltime');
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    leaderboardService.get(period)
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, [period]);

  const top3 = data ? [
    data.entries.find(e => e.rank === 2),
    data.entries.find(e => e.rank === 1),
    data.entries.find(e => e.rank === 3),
  ].filter(Boolean) as LeaderboardEntry[] : [];

  const rest = data?.entries.filter(e => e.rank > 3) ?? [];
  const cu = data?.currentUser;

  const maxScore = period === 'alltime'
    ? Math.max(...(data?.entries.map(e => e.greenScore) ?? [1]), 1)
    : Math.max(...(data?.entries.map(e => e.reportCount) ?? [1]), 1);

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            {t('leaderboard.title')}
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">{t('leaderboard.subtitle')}</p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          {(['alltime', 'monthly'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                period === p
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {t(`leaderboard.${p}`)}
            </button>
          ))}
        </div>
      </div>

      {/* My rank card */}
      {cu && user && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease }}
          className="card border border-slate-200/80 dark:border-slate-700/60 !py-3.5"
        >
          <div className="flex items-center gap-4">
            <Avatar name={user.name} size={9} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{user.name}</p>
              {cu.badges.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {cu.badges.slice(0, 5).map(b => <BadgePill key={b} id={b} />)}
                  {cu.badges.length > 5 && <span className="text-[10px] text-slate-400">+{cu.badges.length - 5}</span>}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 mt-0.5">Submit reports to earn badges & climb the ranks</p>
              )}
            </div>
            <div className="flex items-center gap-6 shrink-0">
              <div className="text-center">
                <p className="text-xl font-black text-primary-600 dark:text-primary-400">
                  {cu.rank != null ? `#${cu.rank}` : '—'}
                </p>
                <p className="text-[10px] text-slate-400">Rank</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-black text-slate-800 dark:text-slate-100">
                  {(period === 'alltime' ? cu.greenScore : cu.reportCount).toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-400">
                  {period === 'alltime' ? 'pts' : 'reports'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-56">
          <motion.div
            className="w-8 h-8 rounded-full border-[3px] border-primary-600 border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.85, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      ) : data && data.entries.length === 0 ? (
        <div className="card text-center py-20">
          <Trophy className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">{t('leaderboard.empty')}</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={period}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="space-y-6"
          >
            {/* Top 3 — podium grid: 2nd | 1st | 3rd */}
            {top3.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                {top3.map(entry => (
                  <HeroCard
                    key={entry.userId.toString()}
                    entry={entry}
                    period={period}
                    isSelf={user?.id === entry.userId.toString()}
                  />
                ))}
              </div>
            )}

            {/* Full-width rankings table */}
            {rest.length > 0 && (
              <div className="card !p-4">
                {/* Table header */}
                <div className="grid items-center gap-4 px-5 pb-3 border-b border-slate-100 dark:border-slate-800 mb-1"
                  style={{ gridTemplateColumns: '52px 1fr auto minmax(140px,2fr) 64px' }}>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rank</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contributor</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</span>
                  <div className="flex items-center gap-1.5">
                    <BarChart2 className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {period === 'alltime' ? 'Green Score' : 'Reports'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reports</span>
                  </div>
                </div>

                <div className="space-y-0.5">
                  {rest.map((entry, i) => (
                    <TableRow
                      key={entry.userId.toString()}
                      entry={entry}
                      period={period}
                      isSelf={user?.id === entry.userId.toString()}
                      index={i}
                      maxScore={maxScore}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* XP info footer */}
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/40 px-6 py-5">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <ChevronUp className="w-3.5 h-3.5" /> How to earn Green pts
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex justify-between"><span>Wildfire report</span><span className="font-bold text-green-600">+30 pts</span></div>
                <div className="flex justify-between"><span>Report verified</span><span className="font-bold text-amber-600">+20 pts</span></div>
                <div className="flex justify-between"><span>Illegal logging</span><span className="font-bold text-green-600">+20 pts</span></div>
                <div className="flex justify-between"><span>Report resolved</span><span className="font-bold text-blue-600">+10 pts</span></div>
                <div className="flex justify-between"><span>Water leak</span><span className="font-bold text-green-600">+15 pts</span></div>
                <div className="flex justify-between"><span>Eco Warrior badge</span><span className="font-bold text-violet-600">10 reports</span></div>
                <div className="flex justify-between"><span>Pollution report</span><span className="font-bold text-green-600">+10 pts</span></div>
                <div className="flex justify-between"><span>Top Ranger badge</span><span className="font-bold text-amber-600">100+ pts</span></div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default Leaderboard;
