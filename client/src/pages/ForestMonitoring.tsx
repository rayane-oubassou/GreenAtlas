import React, { useEffect, useRef, useState } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { TreePine, Thermometer, Droplets, Wind, Gauge, CloudRain, AlertTriangle } from 'lucide-react';
import ForestDashboard from '../components/ForestDashboard';
import { forestService } from '../services/forestService';
import { weatherService } from '../services/weatherService';
import { ForestData, ForestSummary, WeatherData, FireRiskLevel, RISK_COLORS } from '../types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const riskOrder: FireRiskLevel[] = ['Low', 'Medium', 'High', 'Very High', 'Extreme'];
const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

/* ── Count-up hook ────────────────────────────────────────────── */
function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const startedRef = useRef(false);
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !startedRef.current) {
          startedRef.current = true;
          let startTime = 0;
          const animate = (ts: number) => {
            if (!startTime) startTime = ts;
            const progress = Math.min((ts - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(target * eased));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.4 }
    );
    if (divRef.current) observer.observe(divRef.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return { ref: divRef, count };
}

/* ── Animated stat card ───────────────────────────────────────── */
function StatCard({
  value, label, icon: Icon, color, suffix = '', delay = 0,
}: {
  value: number; label: string; icon: React.ElementType; color: string; suffix?: string; delay?: number;
}) {
  const { ref, count } = useCountUp(value);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="card"
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${color}18` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100 tabular-nums leading-none">
            {count.toLocaleString()}{suffix}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Weather metric tile ──────────────────────────────────────── */
function WeatherTile({ icon: Icon, value, label, color, delay }: {
  icon: React.ElementType; value: string; label: string; color: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4, ease }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="flex flex-col items-center text-center bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-100 dark:border-slate-700 cursor-default"
    >
      <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2"
        style={{ background: `${color}18` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <p className="font-black text-slate-800 dark:text-slate-100 text-sm">{value}</p>
      <p className="text-[10px] text-slate-400 mt-0.5">{label}</p>
    </motion.div>
  );
}

/* ── Main page ────────────────────────────────────────────────── */
const ForestMonitoring: React.FC = () => {
  const { t } = useTranslation();
  const [forestData, setForestData] = useState<ForestData[]>([]);
  const [summary, setSummary]       = useState<ForestSummary[]>([]);
  const [weather, setWeather]       = useState<WeatherData | null>(null);
  const [liveRisk, setLiveRisk]     = useState<FireRiskLevel>('Low');
  const [isLoading, setIsLoading]   = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [liveRes, weatherRes] = await Promise.allSettled([
          forestService.getLive(),
          weatherService.getWeather(),
        ]);
        if (liveRes.status === 'fulfilled') {
          setForestData(liveRes.value.data.forestData);
          setLiveRisk(liveRes.value.data.liveFireRisk);
        }
        if (weatherRes.status === 'fulfilled') setWeather(weatherRes.value.data);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    forestService.getAll().then(res => setSummary(res.summary)).catch(() => {});
  }, []);

  const sorted = [...forestData].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  ).slice(-20);

  const riskChartData = {
    labels: riskOrder,
    datasets: [{
      label: t('forest.daysAtRisk'),
      data: riskOrder.map(level => forestData.filter(d => d.fireRiskLevel === level).length),
      backgroundColor: riskOrder.map(level => RISK_COLORS[level] + 'CC'),
      borderColor: riskOrder.map(level => RISK_COLORS[level]),
      borderWidth: 1,
      borderRadius: 8,
      borderSkipped: false,
    }],
  };

  const trendChartData = {
    labels: sorted.map(d => new Date(d.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })),
    datasets: [
      {
        label: `${t('forest.temperature')} (°C)`,
        data: sorted.map(d => d.temperature),
        borderColor: '#f97316',
        backgroundColor: 'rgba(249,115,22,0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.42,
        pointRadius: 2,
      },
      {
        label: `${t('forest.humidity')} (%)`,
        data: sorted.map(d => d.humidity),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.06)',
        borderWidth: 2,
        fill: false,
        tension: 0.42,
        pointRadius: 2,
      },
    ],
  };

  const highRiskZones = summary.filter(s =>
    s.fireRiskLevel === 'High' || s.fireRiskLevel === 'Very High' || s.fireRiskLevel === 'Extreme'
  );
  const avgHealthIndex = summary.length
    ? summary.reduce((a, s) => a + s.healthIndex, 0) / summary.length
    : 0;
  const totalArea = summary.reduce((a, s) => a + s.area, 0);

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
          <TreePine className="w-5 h-5 text-emerald-600" />
          {t('forest.pageTitle')}
        </h2>
        <p className="text-slate-400 text-sm mt-0.5">{t('forest.pageSubtitle')}</p>
      </motion.div>

      {/* High-risk alert */}
      {highRiskZones.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-red-200 dark:border-red-800/50 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #fef2f2, #fee2e2)' }}
        >
          <div className="flex items-start gap-3 p-4">
            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="font-semibold text-red-800 text-sm">{t('forest.highRiskAlert')}</p>
              <div className="mt-1 space-y-0.5">
                {highRiskZones.map(z => (
                  <p key={z._id} className="text-xs text-red-700">
                    <strong>{z._id}</strong>: {z.fireRiskLevel} · {t('forest.colHealthIndex')}: {z.healthIndex.toFixed(0)}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Animated stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard value={Math.round(avgHealthIndex)} label={t('forest.avgHealthIndex')}    icon={TreePine}      color="#16a34a" delay={0}    />
        <StatCard value={highRiskZones.length}       label={t('forest.highRiskZones')}     icon={AlertTriangle} color="#ef4444" delay={0.06} />
        <StatCard value={totalArea}                  label={t('forest.hectaresMonitored')} icon={Gauge}         color="#8b5cf6" delay={0.12} />
        <StatCard value={summary.length}             label={t('forest.forestZones')}       icon={TreePine}      color="#0ea5e9" delay={0.18} />
      </div>

      {/* Fire risk gauge + health chart */}
      <ForestDashboard data={forestData} liveRisk={liveRisk} />

      {/* Live weather */}
      {weather && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease }}
          className="card"
        >
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm mb-4 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-slate-400" />
            {t('forest.liveWeather')}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <WeatherTile icon={Thermometer} value={`${weather.temperature}°C`} label={t('forest.temperature')} color="#f97316" delay={0.22} />
            <WeatherTile icon={Droplets}    value={`${weather.humidity}%`}      label={t('forest.humidity')}    color="#3b82f6" delay={0.26} />
            <WeatherTile icon={Wind}        value={`${weather.windSpeed} km/h`} label={t('forest.windSpeed')}   color="#8b5cf6" delay={0.30} />
            <WeatherTile icon={Gauge}       value={`${weather.pressure} hPa`}  label={t('forest.pressure')}    color="#64748b" delay={0.34} />
            <WeatherTile icon={CloudRain}   value={`${weather.rainfall} mm`}   label={t('forest.rainfall')}    color="#0ea5e9" delay={0.38} />
          </div>
        </motion.div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.5, ease }}
          className="card"
        >
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm mb-4">{t('forest.riskDistribution')}</h3>
          <div style={{ height: 220 }}>
            <Bar
              data={riskChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { ticks: { font: { size: 11 }, color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.08)' } },
                  x: { ticks: { font: { size: 11 }, color: '#94a3b8' }, grid: { display: false } },
                },
              }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.34, duration: 0.5, ease }}
          className="card"
        >
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm mb-4">{t('forest.tempHumidityTrends')}</h3>
          <div style={{ height: 220 }}>
            <Line
              data={trendChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top', labels: { font: { size: 11 }, boxWidth: 12 } } },
                scales: {
                  y: { ticks: { font: { size: 11 }, color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.08)' } },
                  x: { ticks: { font: { size: 11 }, color: '#94a3b8', maxTicksLimit: 8 }, grid: { display: false } },
                },
              }}
            />
          </div>
        </motion.div>
      </div>

      {/* Zone table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5, ease }}
        className="card overflow-hidden"
      >
        <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">{t('forest.zoneStatus')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                {[t('forest.colZone'), t('forest.colArea'), t('forest.colFireRisk'), t('forest.colHealthIndex'), t('forest.colUpdated')].map(h => (
                  <th key={h} className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-3 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {summary.map((zone, i) => {
                const riskColor   = RISK_COLORS[zone.fireRiskLevel];
                const healthColor = zone.healthIndex >= 75 ? '#22c55e' : zone.healthIndex >= 50 ? '#f59e0b' : '#ef4444';
                return (
                  <motion.tr
                    key={zone._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 pr-4 font-semibold text-slate-700 dark:text-slate-200 text-sm">{zone._id}</td>
                    <td className="py-3 pr-4 text-slate-500 text-xs tabular-nums">{zone.area.toLocaleString()}</td>
                    <td className="py-3 pr-4">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{ background: `${riskColor}20`, color: riskColor }}
                      >
                        {zone.fireRiskLevel}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <motion.div
                            className="h-1.5 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${zone.healthIndex}%` }}
                            transition={{ duration: 1, delay: i * 0.05, ease }}
                            style={{ background: healthColor }}
                          />
                        </div>
                        <span className="text-xs font-bold tabular-nums" style={{ color: healthColor }}>
                          {zone.healthIndex.toFixed(0)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-slate-400 text-xs">
                      {new Date(zone.lastUpdated).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
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

export default ForestMonitoring;
