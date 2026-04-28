import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Activity, Droplets, TreePine, Flame, RefreshCw } from 'lucide-react';
import { waterService } from '../services/waterService';
import { forestService } from '../services/forestService';
import { weatherService } from '../services/weatherService';

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

/* ── Stress → color mapping ───────────────────────────────────── */
function stressColor(stress: number): string {
  if (stress < 0.3) return '#22c55e';
  if (stress < 0.6) return '#f59e0b';
  if (stress < 0.8) return '#f97316';
  return '#ef4444';
}

/* ── Live oscilloscope waveform ───────────────────────────────── */
function Waveform({ stress, color, speed }: { stress: number; color: string; speed: number }) {
  const svgRef    = useRef<SVGSVGElement>(null);
  const polyRef   = useRef<SVGPolylineElement>(null);
  const glowRef   = useRef<SVGPolylineElement>(null);
  const phaseRef  = useRef(0);
  const animIdRef = useRef<number>(0);

  useEffect(() => {
    const amplitude = 8 + stress * 38;
    const frequency = 0.06 + stress * 0.06;

    const tick = () => {
      phaseRef.current += 0.04 * speed;
      const W = 800, H = 80;
      const pts = Array.from({ length: 280 }, (_, i) => {
        const x = (i / 279) * W;
        const y = H / 2
          + Math.sin(i * frequency + phaseRef.current) * amplitude
          + Math.sin(i * frequency * 2.3 + phaseRef.current * 1.5) * (amplitude * 0.25)
          + Math.sin(i * frequency * 0.5 + phaseRef.current * 0.7) * (amplitude * 0.15);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ');

      polyRef.current?.setAttribute('points', pts);
      glowRef.current?.setAttribute('points', pts);
      animIdRef.current = requestAnimationFrame(tick);
    };
    animIdRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animIdRef.current);
  }, [stress, speed]);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 800 80"
      className="w-full"
      style={{ height: 80 }}
      preserveAspectRatio="none"
    >
      <defs>
        <filter id={`glow-${color.replace('#', '')}`}>
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor={color} stopOpacity="0" />
          <stop offset="15%"  stopColor={color} stopOpacity="1" />
          <stop offset="85%"  stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        ref={glowRef}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeOpacity="0.2"
        filter={`url(#glow-${color.replace('#', '')})`}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        ref={polyRef}
        fill="none"
        stroke={`url(#grad-${color.replace('#', '')})`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Channel card ─────────────────────────────────────────────── */
function Channel({
  title, subtitle, stress, label, value, unit, icon: Icon, speed, delay,
}: {
  title: string; subtitle: string; stress: number; label: string;
  value: string; unit: string; icon: React.ElementType; speed: number; delay: number;
}) {
  const color = stressColor(stress);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease }}
      className="rounded-2xl border overflow-hidden"
      style={{
        background: 'rgba(15,20,15,0.95)',
        borderColor: `${color}30`,
        boxShadow: `0 0 32px ${color}12`,
      }}
    >
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${color}20` }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <div>
            <p className="text-sm font-bold text-white">{title}</p>
            <p className="text-[11px]" style={{ color: `${color}99` }}>{subtitle}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black tabular-nums" style={{ color }}>{value}</p>
          <p className="text-[10px] text-slate-500">{unit}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 px-6 mb-3">
        <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <motion.div
            className="h-1 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${stress * 100}%` }}
            transition={{ duration: 1, delay: delay + 0.3, ease }}
            style={{ background: `linear-gradient(90deg, ${color}66, ${color})` }}
          />
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <motion.div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: color }}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-[10px] font-bold" style={{ color }}>{label}</span>
        </div>
      </div>

      <div className="px-2 pb-4" style={{ borderTop: `1px solid ${color}12` }}>
        <Waveform stress={stress} color={color} speed={speed} />
      </div>
    </motion.div>
  );
}

/* ── Main page ────────────────────────────────────────────────── */
const EcosystemPulse: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading]         = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [channels, setChannels] = useState({
    water:  { stress: 0, value: '—', unit: '' },
    forest: { stress: 0, value: '—', unit: '' },
    fire:   { stress: 0, value: '—', unit: '' },
  });

  const stressLabelT = (s: number) => {
    if (s < 0.3) return t('pulse.statusHealthy');
    if (s < 0.6) return t('pulse.statusModerate');
    if (s < 0.8) return t('pulse.statusElevated');
    return t('pulse.statusCritical');
  };

  const load = async () => {
    setLoading(true);
    try {
      const [waterRes, forestRes, weatherRes] = await Promise.allSettled([
        waterService.getAll(),
        forestService.getAll(),
        weatherService.getWeather(),
      ]);

      if (waterRes.status === 'fulfilled') {
        const avg = waterRes.value.summary.reduce((a: number, s: { level: number }) => a + s.level, 0)
          / (waterRes.value.summary.length || 1);
        const stress = Math.max(0, Math.min(1, 1 - avg / 100));
        setChannels(p => ({ ...p, water: { stress, value: `${avg.toFixed(0)}%`, unit: t('pulse.avgLevelUnit') } }));
      }

      if (forestRes.status === 'fulfilled') {
        const avg = forestRes.value.summary.reduce((a: number, s: { healthIndex: number }) => a + s.healthIndex, 0)
          / (forestRes.value.summary.length || 1);
        const stress = Math.max(0, Math.min(1, 1 - avg / 100));
        setChannels(p => ({ ...p, forest: { stress, value: avg.toFixed(0), unit: t('pulse.healthIdxUnit') } }));
      }

      if (weatherRes.status === 'fulfilled') {
        const score  = weatherRes.value.data.fireRiskScore ?? 0;
        const stress = Math.max(0, Math.min(1, score / 100));
        setChannels(p => ({ ...p, fire: { stress, value: score.toString(), unit: t('pulse.riskScoreUnit') } }));
      }
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  };

  useEffect(() => { load(); }, []);

  const overallStress = (channels.water.stress + channels.forest.stress + channels.fire.stress) / 3;
  const overallColor  = stressColor(overallStress);

  const legendItems = [
    { color: '#22c55e', label: t('pulse.statusHealthy'),  desc: t('pulse.legendHealthyDesc')  },
    { color: '#f59e0b', label: t('pulse.statusModerate'), desc: t('pulse.legendModerateDesc') },
    { color: '#f97316', label: t('pulse.statusElevated'), desc: t('pulse.legendElevatedDesc') },
    { color: '#ef4444', label: t('pulse.statusCritical'), desc: t('pulse.legendCriticalDesc') },
  ];

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="flex items-start justify-between gap-4 flex-wrap"
      >
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5" style={{ color: overallColor }} />
            {t('pulse.title')}
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">{t('pulse.subtitle')}</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400">
            {t('pulse.updated')} {lastRefresh.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <motion.button
            onClick={load}
            disabled={loading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <motion.div animate={loading ? { rotate: 360 } : { rotate: 0 }} transition={{ duration: 0.8, repeat: loading ? Infinity : 0, ease: 'linear' }}>
              <RefreshCw className="w-3.5 h-3.5" />
            </motion.div>
            {t('pulse.refresh')}
          </motion.button>
        </div>
      </motion.div>

      {/* Overall health summary */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease }}
        className="rounded-2xl border p-5"
        style={{
          background: 'linear-gradient(135deg, rgba(15,20,15,0.97), rgba(10,18,12,0.97))',
          borderColor: `${overallColor}30`,
          boxShadow: `0 0 48px ${overallColor}10`,
        }}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: `${overallColor}99` }}>
              {t('pulse.overallHealth')}
            </p>
            <p className="text-4xl font-black mt-1 tabular-nums" style={{ color: overallColor }}>
              {Math.round((1 - overallStress) * 100)}
              <span className="text-xl">/100</span>
            </p>
            <p className="text-sm font-semibold mt-1" style={{ color: overallColor }}>
              {stressLabelT(overallStress)}
            </p>
          </div>

          <div className="flex-1 min-w-48 max-w-sm">
            <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <motion.div
                className="h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(1 - overallStress) * 100}%` }}
                transition={{ duration: 1.2, delay: 0.3, ease }}
                style={{ background: `linear-gradient(90deg, ${overallColor}66, ${overallColor})` }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px]" style={{ color: `${overallColor}66` }}>{t('pulse.barCritical')}</span>
              <span className="text-[10px]" style={{ color: `${overallColor}66` }}>{t('pulse.barHealthy')}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.div
              className="w-3 h-3 rounded-full"
              style={{ background: overallColor, boxShadow: `0 0 12px ${overallColor}` }}
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <span className="text-xs font-semibold text-slate-400">{t('pulse.live')}</span>
          </div>
        </div>
      </motion.div>

      {/* Channel waveforms */}
      {loading ? (
        <div className="flex items-center justify-center h-56">
          <motion.div
            className="w-8 h-8 rounded-full border-[3px] border-primary-600 border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.85, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <Channel
            title={t('pulse.waterStress')}
            subtitle={t('pulse.waterStressSub')}
            stress={channels.water.stress}
            label={stressLabelT(channels.water.stress)}
            value={channels.water.value}
            unit={channels.water.unit}
            icon={Droplets}
            speed={0.85}
            delay={0.1}
          />
          <Channel
            title={t('pulse.forestHealth')}
            subtitle={t('pulse.forestHealthSub')}
            stress={channels.forest.stress}
            label={stressLabelT(channels.forest.stress)}
            value={channels.forest.value}
            unit={channels.forest.unit}
            icon={TreePine}
            speed={0.65}
            delay={0.18}
          />
          <Channel
            title={t('pulse.fireRisk')}
            subtitle={t('pulse.fireRiskSub')}
            stress={channels.fire.stress}
            label={stressLabelT(channels.fire.stress)}
            value={channels.fire.value}
            unit={channels.fire.unit}
            icon={Flame}
            speed={1.1}
            delay={0.26}
          />
        </div>
      )}

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="rounded-xl border border-slate-200/60 dark:border-slate-700/40 bg-slate-50 dark:bg-slate-800/40 px-5 py-4"
      >
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">{t('pulse.legendTitle')}</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-slate-500 dark:text-slate-400">
          {legendItems.map(({ color, label, desc }) => (
            <div key={label} className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full shrink-0 mt-0.5" style={{ background: color }} />
              <div>
                <p className="font-semibold" style={{ color }}>{label}</p>
                <p className="text-[10px] text-slate-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default EcosystemPulse;
