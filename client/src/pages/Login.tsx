import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Container, ISourceOptions } from '@tsparticles/engine';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, ArrowRight, Flame, Droplets, TreePine } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import LanguageSwitcher from '../components/LanguageSwitcher';

/* ── Starfield particles (subtle, no network) ─────────────────── */
const starsConfig: ISourceOptions = {
  background: { color: { value: 'transparent' } },
  fpsLimit: 40,
  particles: {
    color: { value: ['#ffffff', '#86efac', '#d1fae5'] },
    links: { enable: false },
    move: { enable: true, speed: 0.2, direction: 'none', random: true, outModes: { default: 'out' } },
    number: { value: 90, density: { enable: true } },
    opacity: { value: { min: 0.05, max: 0.45 }, animation: { enable: true, speed: 0.3, sync: false } },
    shape: { type: 'circle' },
    size: { value: { min: 0.5, max: 1.8 } },
  },
  detectRetina: true,
};

/* ── Radar visualization ──────────────────────────────────────── */
const Radar: React.FC = () => {
  const rings = [1, 0.72, 0.48, 0.26];
  const blips = [
    { angle: 42,  r: 0.6, label: 'Wildfire zone',    color: '#ef4444' },
    { angle: 145, r: 0.38, label: 'Water source',    color: '#38bdf8' },
    { angle: 240, r: 0.55, label: 'Forest patch',    color: '#22c55e' },
    { angle: 310, r: 0.3,  label: 'Logging alert',   color: '#f59e0b' },
    { angle: 78,  r: 0.82, label: 'Hotspot',         color: '#ef4444' },
  ];

  return (
    <div className="relative w-72 h-72 mx-auto select-none">
      {/* Rings */}
      {rings.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${s * 100}%`, height: `${s * 100}%`,
            top: `${(1 - s) * 50}%`, left: `${(1 - s) * 50}%`,
            border: `1px solid rgba(34,197,94,${0.08 + i * 0.05})`,
          }}
        />
      ))}

      {/* Cross-hairs */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-full h-px bg-primary-500/10" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-px h-full bg-primary-500/10" />
      </div>

      {/* Rotating scanner */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
      >
        <div className="absolute top-1/2 left-1/2 w-1/2 origin-left"
          style={{ height: '1px', background: 'linear-gradient(90deg, rgba(34,197,94,0.7), transparent)' }} />
      </motion.div>

      {/* Sweep gradient */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        style={{
          background: 'conic-gradient(from 0deg, rgba(34,197,94,0.12) 0deg, transparent 60deg)',
        }}
      />

      {/* Blips */}
      {blips.map((b, i) => {
        const rad = (b.angle * Math.PI) / 180;
        const x = 50 + b.r * 50 * Math.cos(rad);
        const y = 50 + b.r * 50 * Math.sin(rad);
        return (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${x}%`, top: `${y}%`, background: b.color, boxShadow: `0 0 6px ${b.color}` }}
            animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.3, 0.8] }}
            transition={{ duration: 2.5 + i * 0.7, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
          />
        );
      })}

      {/* Center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="w-3 h-3 rounded-full bg-primary-400"
          style={{ boxShadow: '0 0 12px rgba(34,197,94,0.8)' }}
          animate={{ scale: [1, 1.4, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </div>
  );
};

/* ── Main component ───────────────────────────────────────────── */
const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState('');
  const [isLoading, setIsLoading]       = useState(false);
  const [starsReady, setStarsReady]     = useState(false);

  useEffect(() => {
    initParticlesEngine(async e => { await loadSlim(e); }).then(() => setStarsReady(true));
  }, []);

  const onParticlesLoaded = useCallback(async (_c?: Container) => {}, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Invalid credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const demos = [
    { role: 'Admin',   email: 'admin@greenatlas.ma', pwd: 'Admin@123',   icon: '👑', color: '#f87171' },
    { role: 'Agent',   email: 'agent@greenatlas.ma', pwd: 'Agent@123',   icon: '🛡️', color: '#a78bfa' },
    { role: 'Citizen', email: 'karim@example.com',   pwd: 'Citizen@123', icon: '🌱', color: '#34d399' },
  ];

  /* ── Left panel aurora orbs ── */
  const orbs = [
    { w: 520, h: 420, x: -80,  y: -60,  color: 'rgba(22,163,74,0.22)',  dur: 18 },
    { w: 380, h: 380, x: 280,  y: 160,  color: 'rgba(16,185,129,0.16)', dur: 22 },
    { w: 460, h: 300, x: 60,   y: 380,  color: 'rgba(5,150,105,0.14)',  dur: 26 },
    { w: 300, h: 300, x: 420,  y: -80,  color: 'rgba(52,211,153,0.12)', dur: 20 },
  ];

  return (
    <div className="min-h-screen flex bg-[#060d09] overflow-hidden">

      {/* ════════════ LEFT — VISUAL PANEL ════════════ */}
      <div className="hidden lg:flex flex-col w-[58%] relative overflow-hidden">

        {/* Animated aurora blobs */}
        {orbs.map((o, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: o.w, height: o.h,
              left: o.x, top: o.y,
              background: `radial-gradient(ellipse, ${o.color}, transparent 70%)`,
              filter: 'blur(55px)',
            }}
            animate={{
              x: [0, 35, -20, 0],
              y: [0, -45, 25, 0],
              scale: [1, 1.08, 0.96, 1],
            }}
            transition={{ duration: o.dur, repeat: Infinity, ease: 'easeInOut', delay: i * 2.5 }}
          />
        ))}

        {/* Stars */}
        {starsReady && (
          <Particles id="tsparticles-left" particlesLoaded={onParticlesLoaded}
            options={starsConfig} className="absolute inset-0" />
        )}

        {/* Very subtle grid texture */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-14 py-12">

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#16a34a,#0d9144)', boxShadow: '0 0 16px rgba(22,163,74,0.5)' }}>
              <Logo size={20} withText={false} />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">GreenAtlas</span>
          </motion.div>

          {/* Radar + headline */}
          <div className="flex-1 flex flex-col items-center justify-center gap-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }}
            >
              <Radar />
            </motion.div>

            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.7 }}
            >
              <h1 className="text-4xl font-bold text-white leading-tight tracking-tight">
                Environmental<br />
                <span className="bg-gradient-to-r from-primary-400 to-emerald-300 bg-clip-text text-transparent">
                  Intelligence
                </span>
              </h1>
              <p className="text-slate-400 mt-3 text-base leading-relaxed max-w-xs mx-auto">
                Real-time monitoring of Ifrane Province's forests, water, and air quality.
              </p>
            </motion.div>

            {/* Feature chips */}
            <motion.div
              className="flex gap-3 flex-wrap justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {[
                { icon: <Flame className="w-3.5 h-3.5" />, label: 'Fire Monitoring',   color: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.25)',   text: '#fca5a5' },
                { icon: <Droplets className="w-3.5 h-3.5" />, label: 'Water Resources', color: 'rgba(56,189,248,0.15)', border: 'rgba(56,189,248,0.25)',  text: '#7dd3fc' },
                { icon: <TreePine className="w-3.5 h-3.5" />, label: 'Forest Health',  color: 'rgba(34,197,94,0.15)',  border: 'rgba(34,197,94,0.25)',   text: '#86efac' },
              ].map((f, i) => (
                <motion.div
                  key={f.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold"
                  style={{ background: f.color, border: `1px solid ${f.border}`, color: f.text }}
                >
                  {f.icon}
                  {f.label}
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-slate-600 text-xs"
          >
            Ifrane Province, Morocco 🇲🇦 · Cedar Forest Region
          </motion.p>
        </div>
      </div>

      {/* ════════════ RIGHT — FORM PANEL ════════════ */}
      <div className="flex-1 flex flex-col min-h-screen relative"
        style={{ background: '#080f0b', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>

        {/* Top bar */}
        <div className="flex items-center justify-between px-8 pt-6 shrink-0">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:opacity-0 lg:pointer-events-none">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#16a34a,#0d9144)' }}>
              <Logo size={16} withText={false} />
            </div>
            <span className="text-white font-bold text-sm">GreenAtlas</span>
          </div>
          <LanguageSwitcher />
        </div>

        {/* Form — vertically centered */}
        <div className="flex-1 flex items-center justify-center px-8 py-10">
          <motion.div
            className="w-full max-w-sm"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Heading */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-1.5">{t('auth.welcome')}</h2>
              <p className="text-slate-500 text-sm">{t('auth.signInSubtitle')}</p>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-2xl overflow-hidden"
                >
                  <span className="shrink-0 text-base">⚠️</span>
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {t('auth.email')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@greenatlas.ma"
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3.5 rounded-2xl text-sm text-white placeholder-slate-600
                             transition-all duration-200 outline-none
                             focus:ring-2 focus:ring-primary-500/40"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  onFocus={e => { e.currentTarget.style.border = '1px solid rgba(34,197,94,0.45)'; e.currentTarget.style.background = 'rgba(34,197,94,0.05)'; }}
                  onBlur={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full px-4 py-3.5 pr-12 rounded-2xl text-sm text-white placeholder-slate-600
                               transition-all duration-200 outline-none
                               focus:ring-2 focus:ring-primary-500/40"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                    onFocus={e => { e.currentTarget.style.border = '1px solid rgba(34,197,94,0.45)'; e.currentTarget.style.background = 'rgba(34,197,94,0.05)'; }}
                    onBlur={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                  />
                  <button type="button" onClick={() => setShowPassword(p => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 mt-2 rounded-2xl font-semibold text-sm text-white
                           flex items-center justify-center gap-2
                           disabled:opacity-50 disabled:cursor-not-allowed
                           focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                style={{
                  background: isLoading
                    ? 'rgba(22,163,74,0.4)'
                    : 'linear-gradient(135deg, #16a34a 0%, #0d9144 100%)',
                  boxShadow: isLoading ? 'none' : '0 0 24px rgba(22,163,74,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
                }}
                whileHover={!isLoading ? { scale: 1.015 } : {}}
                whileTap={!isLoading ? { scale: 0.985 } : {}}
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {t('auth.signIn')}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-xs text-slate-600 uppercase tracking-widest">demo</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            {/* Demo credentials */}
            <div className="flex gap-2">
              {demos.map((d, i) => (
                <motion.button
                  key={d.role}
                  type="button"
                  onClick={() => { setEmail(d.email); setPassword(d.pwd); }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  whileHover={{ scale: 1.04, y: -1 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl
                             transition-colors cursor-pointer"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${d.color}12`; (e.currentTarget as HTMLElement).style.borderColor = `${d.color}35`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}
                >
                  <span className="text-xl">{d.icon}</span>
                  <span className="text-xs font-semibold" style={{ color: d.color }}>{d.role}</span>
                </motion.button>
              ))}
            </div>
            <p className="text-center text-[11px] text-slate-700 mt-2.5">Click to auto-fill</p>

            {/* Register link */}
            <p className="text-center text-sm text-slate-600 mt-6">
              {t('auth.noAccount')}{' '}
              <Link to="/register"
                className="text-primary-500 hover:text-primary-400 font-semibold transition-colors">
                {t('auth.registerLink')}
              </Link>
            </p>
          </motion.div>
        </div>

        {/* Bottom bar */}
        <p className="text-center text-[11px] text-slate-800 pb-5 px-8">
          © 2024 GreenAtlas Ifrane · Environmental Monitoring Platform
        </p>
      </div>
    </div>
  );
};

export default Login;
