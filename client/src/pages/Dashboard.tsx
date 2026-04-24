import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import MapView from '../components/MapView';
import ReportCard from '../components/ReportCard';
import { reportService } from '../services/reportService';
import { weatherService } from '../services/weatherService';
import { Report, WeatherData, ReportStats, FireHotspot, RISK_COLORS } from '../types';

const ease = [0.16, 1, 0.3, 1] as [number,number,number,number];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.45, ease },
});

/* ── Animated weather metric tile ────────────────────────────── */
const WeatherTile = ({ icon, v, l, delay }: { icon: string; v: string; l: string; delay: number }) => (
  <motion.div
    {...fadeUp(delay)}
    whileHover={{ scale: 1.05, y: -2 }}
    className="bg-slate-50 dark:bg-slate-800 rounded-xl p-2 border border-slate-100 dark:border-slate-700 text-center cursor-default"
  >
    <span className="text-base">{icon}</span>
    <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1">{v}</p>
    <p className="text-[10px] text-slate-400">{l}</p>
  </motion.div>
);

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const heroRef = useRef<HTMLDivElement>(null);

  /* Parallax on hero */
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const bgX = useSpring(useTransform(mx, [0, 1], [-12, 12]), { stiffness: 120, damping: 30 });
  const bgY = useSpring(useTransform(my, [0, 1], [-8,  8]),  { stiffness: 120, damping: 30 });

  const onHeroMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroRef.current) return;
    const r = heroRef.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top)  / r.height);
  };
  const onHeroLeave = () => { mx.set(0.5); my.set(0.5); };

  const [reports, setReports] = useState<Report[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [stats,   setStats]   = useState<ReportStats | null>(null);
  const [hotspots, setHotspots] = useState<FireHotspot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [r, s, w, e] = await Promise.allSettled([
        reportService.getAll({ limit: 6 }),
        reportService.getStats(),
        weatherService.getWeather(),
        weatherService.getEnvironmentData(),
      ]);
      if (r.status === 'fulfilled') setReports(r.value.data);
      if (s.status === 'fulfilled') setStats(s.value.data);
      if (w.status === 'fulfilled') setWeather(w.value.data);
      if (e.status === 'fulfilled') setHotspots(e.value.data.fireHotspots);
      setIsLoading(false);
    })();
  }, []);

  const pending  = stats?.byStatus.find(s => s._id === 'pending')?.count  ?? 0;
  const verified = stats?.byStatus.find(s => s._id === 'verified')?.count ?? 0;
  const resolved = stats?.byStatus.find(s => s._id === 'resolved')?.count ?? 0;
  const riskColor = RISK_COLORS[(weather?.fireRiskLevel ?? 'Low') as keyof typeof RISK_COLORS] ?? '#22c55e';

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
    <div className="space-y-6 pb-6">

      {/* Hero banner with parallax */}
      <motion.div
        ref={heroRef}
        {...fadeUp(0)}
        onMouseMove={onHeroMouse}
        onMouseLeave={onHeroLeave}
        className="relative rounded-2xl overflow-hidden cursor-default"
        style={{ background: 'linear-gradient(135deg, #0e2f1c 0%, #164427 50%, #16a34a 100%)' }}
      >
        {/* Parallax radial glow */}
        <motion.div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 70% 50%, #4ade80 0%, transparent 60%)',
            x: bgX, y: bgY,
          }}
        />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-primary-300 text-xs font-semibold uppercase tracking-widest mb-1">{t('dashboard.title')}</p>
            <h2 className="text-xl font-bold text-white">
              {t('dashboard.welcome')}, {user?.name?.split(' ')[0]} 👋
            </h2>
            <p className="text-primary-200/70 text-sm mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
              <Link to="/map" className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors border border-white/10">
                🗺️ {t('nav.liveMap')}
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
              <Link to="/report/new"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 4px 16px rgba(34,197,94,0.4)' }}>
                <span className="text-white">+ {t('nav.reportIncident')}</span>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Stats row — staggered */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard delay={0.05} title={t('dashboard.totalReports')} value={stats?.total ?? 0}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
          gradient="bg-gradient-to-br from-slate-600 to-slate-700" />
        <StatCard delay={0.10} title={t('dashboard.pending')} value={pending} subtitle={t('dashboard.pendingSub')}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          gradient="bg-gradient-to-br from-amber-500 to-orange-500" />
        <StatCard delay={0.15} title={t('dashboard.verified')} value={verified} subtitle={t('dashboard.verifiedSub')}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          gradient="bg-gradient-to-br from-blue-500 to-indigo-500" />
        <StatCard delay={0.20} title={t('dashboard.resolved')} value={resolved} subtitle={t('dashboard.resolvedSub')}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
          gradient="bg-gradient-to-br from-primary-500 to-emerald-600" />
      </div>

      {/* Map + sidebar */}
      <motion.div {...fadeUp(0.25)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <motion.div
          className="lg:col-span-2 card p-0 overflow-hidden"
          style={{ height: 360 }}
          whileHover={{ boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}
          transition={{ duration: 0.25 }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">🗺️ {t('dashboard.liveMap')}</span>
            <motion.div whileHover={{ x: 2 }}>
              <Link to="/map" className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 font-semibold hover:underline">{t('dashboard.fullMap')}</Link>
            </motion.div>
          </div>
          <div style={{ height: 'calc(100% - 45px)' }}>
            <MapView reports={reports} hotspots={hotspots} zoom={10} />
          </div>
        </motion.div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Weather */}
          {weather ? (
            <motion.div {...fadeUp(0.3)} className="card" whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">☁️ {t('dashboard.weather')}</p>
                <span className="text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-100 dark:border-slate-700">Ifrane, MA</span>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <motion.img
                  src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} alt=""
                  className="w-14 h-14"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }}
                />
                <div>
                  <p className="text-4xl font-bold text-slate-800 dark:text-slate-100 leading-none">{weather.temperature}°</p>
                  <p className="text-xs text-slate-400 capitalize mt-1">{weather.description}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <WeatherTile delay={0.32} icon="💧" v={`${weather.humidity}%`} l="Humidity" />
                <WeatherTile delay={0.36} icon="🌬️" v={`${weather.windSpeed}`} l="km/h" />
                <WeatherTile delay={0.40} icon="🌧️" v={`${weather.rainfall}`} l="mm rain" />
              </div>
            </motion.div>
          ) : (
            <div className="card skeleton h-36" />
          )}

          {/* Fire risk */}
          {weather && (
            <motion.div {...fadeUp(0.35)} className="card overflow-hidden relative" whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
              <motion.div
                className="absolute inset-0 opacity-5 pointer-events-none"
                style={{ background: `radial-gradient(circle at 80% 50%, ${riskColor}, transparent)` }}
                animate={{ opacity: [0.05, 0.08, 0.05] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
              <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm mb-3">🔥 {t('dashboard.fireRisk')}</p>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <motion.div
                    className="h-2.5 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${weather.fireRiskScore}%` }}
                    transition={{ delay: 0.4, duration: 1, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] }}
                    style={{ background: `linear-gradient(90deg, ${riskColor}99, ${riskColor})` }}
                  />
                </div>
                <span className="text-sm font-bold tabular-nums" style={{ color: riskColor }}>{weather.fireRiskScore}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: riskColor+'18', color: riskColor }}>
                  {weather.fireRiskLevel}
                </span>
                <motion.div whileHover={{ x: 2 }}>
                  <Link to="/forest" className="text-xs text-primary-600 dark:text-primary-400 font-semibold hover:underline">Details →</Link>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* FIRMS hotspots */}
          <motion.div {...fadeUp(0.4)} className="card flex items-center gap-4" whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 flex items-center justify-center text-2xl shrink-0">🛰️</div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{hotspots.length}</p>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('dashboard.nasaHotspots')}</p>
              <p className="text-[11px] text-slate-400 truncate">{t('dashboard.nasaSub')}</p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Recent reports */}
      <motion.div {...fadeUp(0.45)}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">{t('dashboard.recentIncidents')}</h3>
          <motion.div whileHover={{ x: 2 }}>
            <Link to="/map" className="text-sm text-primary-600 dark:text-primary-400 font-semibold hover:underline">{t('dashboard.allReports')}</Link>
          </motion.div>
        </div>
        {reports.length === 0 ? (
          <motion.div {...fadeUp(0.5)} className="card text-center py-12">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-slate-500 dark:text-slate-400 font-medium">{t('dashboard.noIncidents')}</p>
            <Link to="/report/new" className="text-primary-600 dark:text-primary-400 text-sm font-semibold hover:underline mt-1 block">{t('dashboard.beFirst')}</Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {reports.map((r, i) => (
              <ReportCard key={r._id} report={r} index={i}
                onStatusChange={(id, s) => setReports(p => p.map(x => x._id===id ? {...x, status: s as Report['status']} : x))}
                onDelete={(id) => setReports(p => p.filter(x => x._id !== id))} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Dashboard;
