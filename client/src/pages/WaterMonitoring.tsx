import React, { useEffect, useRef, useState } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { waterService } from '../services/waterService';
import { WaterData, WaterSummary } from '../types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const STATUS_CFG = {
  critical: { color: '#ef4444', bg: '#fef2f2', text: '#991b1b', pulse: 'bg-red-400'   },
  low:      { color: '#f59e0b', bg: '#fffbeb', text: '#92400e', pulse: 'bg-amber-400' },
  normal:   { color: '#3b82f6', bg: '#eff6ff', text: '#1e40af', pulse: 'bg-blue-400'  },
  high:     { color: '#22c55e', bg: '#f0fdf4', text: '#166534', pulse: 'bg-green-400' },
} as const;

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

/* ── Animated water fill circle ───────────────────────────────── */
function WaterFillCircle({ level, color, status }: { level: number; color: string; status: string }) {
  const cfg = STATUS_CFG[status as keyof typeof STATUS_CFG] ?? STATUS_CFG.normal;
  const fillRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative w-20 h-20 mx-auto select-none">
      {(status === 'critical' || status === 'low') && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ border: `2px solid ${color}` }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <div className="absolute inset-0 rounded-full overflow-hidden"
        style={{ background: `${color}12`, border: `2px solid ${color}30` }}>
        <motion.div
          ref={fillRef}
          className="absolute bottom-0 left-0 right-0"
          initial={{ height: '0%' }}
          animate={{ height: `${level}%` }}
          transition={{ duration: 1.4, delay: 0.15, ease }}
          style={{ background: `linear-gradient(to top, ${color}cc, ${color}55)` }}
        >
          <svg
            className="absolute w-full"
            style={{ top: '-6px', left: 0, width: '200%', marginLeft: '-25%' }}
            viewBox="0 0 200 12"
            preserveAspectRatio="none"
          >
            <motion.path
              d="M0,6 C25,0 50,12 75,6 C100,0 125,12 150,6 C175,0 200,12 200,6 L200,12 L0,12 Z"
              fill={`${color}99`}
              animate={{ x: ['0%', '-50%'] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
            />
          </svg>
        </motion.div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span
          className="text-xs font-black drop-shadow"
          style={{ color: level < 40 ? color : '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
        >
          {Math.round(level)}%
        </span>
      </div>

      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${cfg.pulse} border-2 border-white`} />
    </div>
  );
}

/* ── Source card ──────────────────────────────────────────────── */
function SourceCard({
  summary, selected, onClick, index, statusLabel,
}: {
  summary: WaterSummary; selected: boolean; onClick: () => void; index: number; statusLabel: string;
}) {
  const cfg = STATUS_CFG[summary.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.normal;

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4, ease }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`card text-left transition-all relative overflow-hidden
        ${selected ? 'ring-2 ring-blue-400/60 shadow-md' : 'hover:shadow-md'}
      `}
    >
      {selected && (
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `${cfg.color}07` }} />
      )}

      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{summary._id}</p>
          <p className="text-xs text-slate-400 mt-0.5 truncate">{summary.location}</p>
        </div>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
          style={{ background: `${cfg.color}18`, color: cfg.color }}
        >
          {statusLabel}
        </span>
      </div>

      <WaterFillCircle level={summary.level} color={cfg.color} status={summary.status} />

      <div className="mt-4 bg-slate-100 dark:bg-slate-800 rounded-full h-1">
        <motion.div
          className="h-1 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${summary.level}%` }}
          transition={{ duration: 1.2, delay: 0.2, ease }}
          style={{ background: cfg.color }}
        />
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] text-slate-400">Last: {new Date(summary.lastUpdated).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
        <Droplets className="w-3 h-3" style={{ color: cfg.color }} />
      </div>
    </motion.button>
  );
}

/* ── Main page ────────────────────────────────────────────────── */
const WaterMonitoring: React.FC = () => {
  const { t } = useTranslation();
  const [allData, setAllData]         = useState<WaterData[]>([]);
  const [summary, setSummary]         = useState<WaterSummary[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [isLoading, setIsLoading]     = useState(true);

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      critical: t('water.statusCritical'),
      low:      t('water.statusLow'),
      normal:   t('water.statusNormal'),
      high:     t('water.statusHealthy'),
    };
    return map[status] ?? status;
  };

  useEffect(() => {
    waterService.getAll().then(res => {
      setAllData(res.data);
      setSummary(res.summary);
      if (res.summary.length > 0) setSelectedSource(res.summary[0]._id);
    }).finally(() => setIsLoading(false));
  }, []);

  const sourceData = allData
    .filter(d => !selectedSource || d.source === selectedSource)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .slice(-30);

  const selectedSummary = summary.find(s => s._id === selectedSource);
  const cfg = STATUS_CFG[(selectedSummary?.status as keyof typeof STATUS_CFG) ?? 'normal'] ?? STATUS_CFG.normal;

  const buildGradient = (ctx: CanvasRenderingContext2D) => {
    const grad = ctx.createLinearGradient(0, 0, 0, 240);
    grad.addColorStop(0, `${cfg.color}55`);
    grad.addColorStop(1, `${cfg.color}00`);
    return grad;
  };

  const lineChartData = {
    labels: sourceData.map(d =>
      new Date(d.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    ),
    datasets: [
      {
        label: selectedSource || t('water.pageTitle'),
        data: sourceData.map(d => d.level),
        borderColor: cfg.color,
        backgroundColor: (ctx: { chart: { ctx: CanvasRenderingContext2D } }) => buildGradient(ctx.chart.ctx),
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: cfg.color,
        fill: true,
        tension: 0.45,
      },
      {
        label: t('water.criticalThreshold'),
        data: sourceData.map(() => 20),
        borderColor: '#ef4444',
        borderWidth: 1.5,
        borderDash: [6, 4],
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  const criticalSources = summary.filter(s => s.status === 'critical' || s.status === 'low');

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <motion.div
        className="w-8 h-8 rounded-full border-[3px] border-primary-600 border-t-transparent"
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Droplets className="w-5 h-5 text-blue-500" />
          {t('water.pageTitle')}
        </h2>
        <p className="text-slate-400 text-sm mt-0.5">{t('water.pageSubtitle')}</p>
      </motion.div>

      {/* Alert banner */}
      <AnimatePresence>
        {criticalSources.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-xl border border-amber-200 dark:border-amber-800/50 overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)' }}
          >
            <div className="flex items-start gap-3 p-4">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-800 text-sm">{t('water.alerts')}</p>
                <div className="mt-1 space-y-0.5">
                  {criticalSources.map(s => (
                    <p key={s._id} className="text-xs text-amber-700">
                      <strong>{s._id}</strong> — {s.level.toFixed(1)}% · {statusLabel(s.status).toUpperCase()}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: t('water.sourcesTracked'), value: summary.length, icon: Activity, color: '#3b82f6' },
          { label: t('water.criticalLow'), value: criticalSources.length, icon: AlertTriangle, color: '#ef4444' },
          { label: t('water.avgLevel'), value: `${(summary.reduce((a, s) => a + s.level, 0) / (summary.length || 1)).toFixed(0)}%`, icon: TrendingUp, color: '#22c55e' },
          { label: t('water.healthySources'), value: summary.filter(s => s.status === 'high' || s.status === 'normal').length, icon: Droplets, color: '#0ea5e9' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4, ease }}
            className="card"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${stat.color}18` }}>
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-xl font-black text-slate-800 dark:text-slate-100">{stat.value}</p>
                <p className="text-[10px] text-slate-400 leading-tight">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Source cards grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {summary.map((s, i) => (
          <SourceCard
            key={s._id}
            summary={s}
            selected={selectedSource === s._id}
            onClick={() => setSelectedSource(s._id)}
            index={i}
            statusLabel={statusLabel(s.status)}
          />
        ))}
      </div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5, ease }}
        className="card"
      >
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-200">{t('water.trendTitle')}</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {t('water.viewing')}: <strong style={{ color: cfg.color }}>{selectedSource}</strong>
            </p>
          </div>
          <select
            value={selectedSource}
            onChange={e => setSelectedSource(e.target.value)}
            className="input-field py-1 text-xs w-48"
          >
            {summary.map(s => <option key={s._id} value={s._id}>{s._id}</option>)}
          </select>
        </div>
        <div style={{ height: 260 }}>
          <Line
            data={lineChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: ctx => ` ${(ctx.raw as number).toFixed(1)}%` } },
              },
              scales: {
                y: {
                  min: 0, max: 100,
                  ticks: { callback: (v) => `${v}%`, font: { size: 11 }, color: '#94a3b8' },
                  grid: { color: 'rgba(148,163,184,0.08)' },
                },
                x: {
                  ticks: { font: { size: 11 }, color: '#94a3b8', maxTicksLimit: 10 },
                  grid: { display: false },
                },
              },
              animation: { duration: 600 },
            }}
          />
        </div>
      </motion.div>

      {/* Summary table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5, ease }}
        className="card overflow-hidden"
      >
        <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">{t('water.allSourcesStatus')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                {[t('water.colSource'), t('water.colLocation'), t('water.colLevel'), t('water.colStatus'), t('water.colUpdated')].map(h => (
                  <th key={h} className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-3 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {summary.map((s, i) => {
                const c = STATUS_CFG[s.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.normal;
                return (
                  <motion.tr
                    key={s._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    onClick={() => setSelectedSource(s._id)}
                  >
                    <td className="py-3 pr-4 font-semibold text-slate-700 dark:text-slate-200 text-sm">{s._id}</td>
                    <td className="py-3 pr-4 text-slate-500 text-xs">{s.location}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <motion.div
                            className="h-1.5 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${s.level}%` }}
                            transition={{ duration: 1, delay: i * 0.05, ease }}
                            style={{ background: c.color }}
                          />
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-200 text-xs tabular-nums">{s.level.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${c.pulse}`} />
                        <span className="text-xs font-semibold" style={{ color: c.color }}>{statusLabel(s.status)}</span>
                      </div>
                    </td>
                    <td className="py-3 text-slate-400 text-xs">
                      {new Date(s.lastUpdated).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default WaterMonitoring;
