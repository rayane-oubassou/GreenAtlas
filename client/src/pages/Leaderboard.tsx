import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Trophy, TrendingUp, Star, ChevronUp } from 'lucide-react';
import { leaderboardService } from '../services/leaderboardService';
import { LeaderboardData, LeaderboardEntry, BADGE_DEFINITIONS, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

const ROLE_PILL: Record<UserRole, string> = {
  admin:   'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  agent:   'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
  citizen: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
};

const RANK_STYLE = {
  1: { ring: 'ring-2 ring-yellow-400/60', bg: 'from-yellow-400 to-amber-500',  label: 'text-yellow-500' },
  2: { ring: 'ring-2 ring-slate-300/60',  bg: 'from-slate-300 to-slate-400',   label: 'text-slate-400'  },
  3: { ring: 'ring-2 ring-orange-400/60', bg: 'from-orange-300 to-amber-500',  label: 'text-orange-500' },
} as Record<number, { ring: string; bg: string; label: string }>;

const MEDAL = { 1: '1st', 2: '2nd', 3: '3rd' } as Record<number, string>;

function Badge({ id }: { id: string }) {
  const def = BADGE_DEFINITIONS[id];
  if (!def) return null;
  return (
    <span
      title={def.label}
      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r ${def.color} text-white shadow-sm`}
    >
      <span>{def.emoji}</span>
      <span className="hidden sm:inline">{def.label}</span>
    </span>
  );
}

function Avatar({ name, size = 10, gradient }: { name: string; size?: number; gradient?: string }) {
  const style = gradient
    ? { background: gradient }
    : { background: 'linear-gradient(135deg,#16a34a,#0d9144)' };
  const dim = `w-${size} h-${size}`;
  return (
    <div className={`${dim} rounded-2xl flex items-center justify-center text-white font-bold shrink-0`} style={style}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

/* ── Hero card for rank 1-3 ───────────────────────────────── */
function HeroCard({ entry, period, isSelf }: { entry: LeaderboardEntry; period: 'alltime' | 'monthly'; isSelf: boolean }) {
  const style = RANK_STYLE[entry.rank] ?? RANK_STYLE[3];
  const isGold = entry.rank === 1;
  const value = period === 'alltime' ? entry.greenScore : entry.reportCount;
  const unit = period === 'alltime' ? 'pts' : 'reports';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: entry.rank * 0.06, duration: 0.5, ease }}
      className={`relative flex flex-col items-center text-center p-5 rounded-2xl
        bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/60
        shadow-sm hover:shadow-md transition-shadow
        ${isGold ? 'ring-2 ring-yellow-400/30' : ''}
        ${isSelf ? 'ring-2 ring-primary-400/40' : ''}`}
    >
      {/* Rank label */}
      <span className={`text-[10px] font-black uppercase tracking-widest mb-3 ${style.label}`}>
        {MEDAL[entry.rank]}
      </span>

      {/* Avatar */}
      <div className={`${style.ring} rounded-2xl mb-3`}>
        <Avatar
          name={entry.name}
          size={isGold ? 14 : 11}
          gradient={`linear-gradient(135deg, ${entry.rank === 1 ? '#f59e0b,#d97706' : entry.rank === 2 ? '#94a3b8,#64748b' : '#f97316,#d97706'})`}
        />
      </div>

      <p className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight truncate w-full px-1">
        {entry.name}
        {isSelf && <span className="text-primary-500 text-[10px] ml-1">(you)</span>}
      </p>
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize mt-1 ${ROLE_PILL[entry.role]}`}>
        {entry.role}
      </span>

      {/* Score */}
      <div className="mt-3">
        <p className={`font-black leading-none ${isGold ? 'text-2xl text-amber-500' : 'text-xl text-slate-700 dark:text-slate-200'}`}>
          {value.toLocaleString()}
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">{unit}</p>
      </div>

      {/* Badges */}
      {entry.badges.length > 0 && (
        <div className="flex flex-wrap gap-1 justify-center mt-3">
          {entry.badges.slice(0, isGold ? 4 : 2).map(b => <Badge key={b} id={b} />)}
          {entry.badges.length > (isGold ? 4 : 2) && (
            <span className="text-[10px] text-slate-400 self-center">+{entry.badges.length - (isGold ? 4 : 2)}</span>
          )}
        </div>
      )}

      {/* Gold glow */}
      {isGold && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(251,191,36,0.08) 0%, transparent 70%)' }} />
      )}
    </motion.div>
  );
}

/* ── Table row for rank 4+ ────────────────────────────────── */
function TableRow({ entry, period, isSelf, index }: {
  entry: LeaderboardEntry; period: 'alltime' | 'monthly'; isSelf: boolean; index: number;
}) {
  const value = period === 'alltime' ? entry.greenScore : entry.reportCount;
  const unit  = period === 'alltime' ? 'pts' : 'reports';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.12 + index * 0.035, duration: 0.38, ease }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors
        ${isSelf
          ? 'bg-primary-50 dark:bg-primary-900/15 border border-primary-200/60 dark:border-primary-700/40'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
        }`}
    >
      <span className="w-7 text-center text-sm font-bold text-slate-400 shrink-0">
        #{entry.rank}
      </span>
      <Avatar name={entry.name} size={9} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-sm font-semibold truncate ${isSelf ? 'text-primary-700 dark:text-primary-300' : 'text-slate-800 dark:text-slate-100'}`}>
            {entry.name}
            {isSelf && <span className="text-[10px] text-primary-400 ml-1">you</span>}
          </span>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize ${ROLE_PILL[entry.role]}`}>
            {entry.role}
          </span>
        </div>
        {entry.badges.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {entry.badges.slice(0, 3).map(b => <Badge key={b} id={b} />)}
            {entry.badges.length > 3 && (
              <span className="text-[10px] text-slate-400">+{entry.badges.length - 3}</span>
            )}
          </div>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-black text-slate-800 dark:text-slate-100">{value.toLocaleString()}</p>
        <p className="text-[10px] text-slate-400">{unit}</p>
      </div>
    </motion.div>
  );
}

/* ── Main page ────────────────────────────────────────────── */
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

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            {t('leaderboard.title')}
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">{t('leaderboard.subtitle')}</p>
        </div>

        {/* Period toggle */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          {(['alltime', 'monthly'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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

      {/* Current user rank card */}
      {cu && user && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease }}
          className="card border border-slate-200/80 dark:border-slate-700/60 !py-3.5"
        >
          <div className="flex items-center gap-3">
            <Avatar name={user.name} size={10} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{user.name}</p>
              {cu.badges.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {cu.badges.slice(0, 4).map(b => <Badge key={b} id={b} />)}
                  {cu.badges.length > 4 && <span className="text-[10px] text-slate-400">+{cu.badges.length - 4}</span>}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 mt-0.5">Submit reports to earn badges</p>
              )}
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="text-center">
                <p className="text-lg font-black text-primary-600 dark:text-primary-400">
                  {cu.rank != null ? `#${cu.rank}` : '—'}
                </p>
                <p className="text-[10px] text-slate-400">{t('leaderboard.rank')}</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-black text-slate-800 dark:text-slate-100">
                  {(period === 'alltime' ? cu.greenScore : cu.reportCount).toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-400">
                  {period === 'alltime' ? t('leaderboard.pts') : t('leaderboard.reports')}
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
        <div className="card text-center py-16">
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
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {/* Top 3 hero grid */}
            {top3.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
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

            {/* Rest of rankings */}
            {rest.length > 0 && (
              <div className="card !p-2">
                <div className="flex items-center gap-2 px-3 py-2 mb-1">
                  <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    {t('leaderboard.rankings')}
                  </span>
                  <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-400">
                    <Star className="w-3 h-3" />
                    {period === 'alltime' ? t('leaderboard.sortedByScore') : t('leaderboard.sortedByReports')}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {rest.map((entry, i) => (
                    <TableRow
                      key={entry.userId.toString()}
                      entry={entry}
                      period={period}
                      isSelf={user?.id === entry.userId.toString()}
                      index={i}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* XP info footer */}
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/40 px-5 py-4">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <ChevronUp className="w-3.5 h-3.5" /> How to earn Green pts
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-600 dark:text-slate-300">
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
