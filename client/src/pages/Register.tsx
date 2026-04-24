import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Container, ISourceOptions } from '@tsparticles/engine';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, ArrowRight, Leaf, ShieldCheck, BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import LanguageSwitcher from '../components/LanguageSwitcher';

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

/* ── Password strength ────────────────────────────────────────── */
function getStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 6)  score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw))    score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { label: '',         color: 'transparent' },
    { label: 'Weak',     color: '#ef4444' },
    { label: 'Fair',     color: '#f59e0b' },
    { label: 'Good',     color: '#3b82f6' },
    { label: 'Strong',   color: '#22c55e' },
    { label: 'Excellent',color: '#10b981' },
  ];
  return { score, ...levels[score] };
}

/* ── Impact stats (left panel) ────────────────────────────────── */
const stats = [
  { icon: '🌲', value: '12,400+', label: 'Hectares protected', x: '8%',  y: '22%', delay: 0.5 },
  { icon: '🛰️', value: '340',     label: 'Incidents resolved', x: '55%', y: '12%', delay: 0.7 },
  { icon: '👥', value: '1,200+',  label: 'Active monitors',    x: '62%', y: '68%', delay: 0.9 },
  { icon: '🔥', value: '28',      label: 'Wildfires tracked',  x: '4%',  y: '72%', delay: 1.1 },
];

/* ── Orbital visualization ────────────────────────────────────── */
const Orbitals: React.FC = () => {
  const orbits = [
    { r: 110, duration: 22, dotColor: '#86efac', dotCount: 3 },
    { r: 75,  duration: 15, dotColor: '#67e8f9', dotCount: 2 },
    { r: 45,  duration: 9,  dotColor: '#a78bfa', dotCount: 2 },
  ];

  return (
    <div className="relative w-72 h-72 mx-auto select-none">
      {/* Orbit rings */}
      {orbits.map((o, i) => (
        <div key={i} className="absolute rounded-full"
          style={{
            width: o.r * 2, height: o.r * 2,
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            border: `1px solid rgba(34,197,94,${0.12 + i * 0.04})`,
          }} />
      ))}

      {/* Rotating dots */}
      {orbits.map((o, oi) =>
        Array.from({ length: o.dotCount }).map((_, di) => (
          <motion.div key={`${oi}-${di}`}
            className="absolute"
            style={{ top: '50%', left: '50%', marginTop: -4, marginLeft: -4 }}
            animate={{ rotate: 360 }}
            transition={{ duration: o.duration, repeat: Infinity, ease: 'linear', delay: -(o.duration / o.dotCount) * di }}
          >
            <div style={{
              width: 8, height: 8,
              transform: `translateX(${o.r}px)`,
              borderRadius: '50%',
              background: o.dotColor,
              boxShadow: `0 0 8px ${o.dotColor}`,
            }} />
          </motion.div>
        ))
      )}

      {/* Center orb */}
      {[1.6, 1.3, 1].map((s, i) => (
        <motion.div key={i}
          className="absolute rounded-full"
          style={{
            width: 72, height: 72,
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            border: `1px solid rgba(34,197,94,${0.2 - i*0.05})`,
            scale: s,
          }}
          animate={{ scale: [s, s * 1.07, s] }}
          transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.6 }}
        />
      ))}
      <div className="absolute rounded-full flex items-center justify-center"
        style={{
          width: 72, height: 72, top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(22,163,74,0.35), rgba(5,46,22,0.8))',
          boxShadow: '0 0 32px rgba(34,197,94,0.3), inset 0 0 24px rgba(34,197,94,0.1)',
        }}>
        <Leaf className="w-7 h-7 text-primary-400" />
      </div>
    </div>
  );
};

/* ── Main ─────────────────────────────────────────────────────── */
const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [form, setForm]               = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPwd, setShowPwd]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]             = useState('');
  const [isLoading, setIsLoading]     = useState(false);
  const [starsReady, setStarsReady]   = useState(false);

  useEffect(() => {
    initParticlesEngine(async e => { await loadSlim(e); }).then(() => setStarsReady(true));
  }, []);

  const onParticlesLoaded = useCallback(async (_c?: Container) => {}, []);

  const strength = getStrength(form.password);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6)               { setError('Password must be at least 6 characters.'); return; }
    if (!/\d/.test(form.password))              { setError('Password must contain at least one number.'); return; }
    setIsLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const orbs = [
    { w: 500, h: 400, x: -100, y: -80,  color: 'rgba(22,163,74,0.20)',  dur: 20 },
    { w: 360, h: 360, x: 300,  y: 180,  color: 'rgba(16,185,129,0.14)', dur: 25 },
    { w: 420, h: 280, x: 80,   y: 360,  color: 'rgba(5,150,105,0.12)',  dur: 28 },
    { w: 280, h: 280, x: 440,  y: -60,  color: 'rgba(52,211,153,0.10)', dur: 18 },
  ];

  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
  } as React.CSSProperties;

  const focusStyle = { border: '1px solid rgba(34,197,94,0.45)', background: 'rgba(34,197,94,0.05)' };
  const blurStyle  = inputStyle;

  return (
    <div className="min-h-screen flex bg-[#060d09] overflow-hidden">

      {/* ══════════ LEFT — VISUAL PANEL ══════════ */}
      <div className="hidden lg:flex flex-col w-[56%] relative overflow-hidden">

        {/* Aurora orbs */}
        {orbs.map((o, i) => (
          <motion.div key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: o.w, height: o.h, left: o.x, top: o.y,
              background: `radial-gradient(ellipse, ${o.color}, transparent 70%)`,
              filter: 'blur(55px)',
            }}
            animate={{ x: [0, 30, -25, 0], y: [0, -40, 20, 0], scale: [1, 1.07, 0.97, 1] }}
            transition={{ duration: o.dur, repeat: Infinity, ease: 'easeInOut', delay: i * 3 }}
          />
        ))}

        {/* Stars */}
        {starsReady && (
          <Particles id="tsparticles-reg" particlesLoaded={onParticlesLoaded}
            options={starsConfig} className="absolute inset-0" />
        )}

        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-14 py-12">
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#16a34a,#0d9144)', boxShadow: '0 0 16px rgba(22,163,74,0.5)' }}>
              <Logo size={20} withText={false} />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">GreenAtlas</span>
          </motion.div>

          <div className="flex-1 flex flex-col items-center justify-center gap-10 relative">
            {/* Floating stats */}
            {stats.map((s) => (
              <motion.div key={s.label}
                className="absolute flex items-center gap-3 px-4 py-3 rounded-2xl backdrop-blur-sm"
                style={{ left: s.x, top: s.y, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
                initial={{ opacity: 0, scale: 0.8, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: [0, -7, 0] }}
                transition={{
                  opacity:    { delay: s.delay, duration: 0.6 },
                  scale:      { delay: s.delay, duration: 0.6, type: 'spring', stiffness: 280, damping: 22 },
                  y:          { delay: s.delay + 1.5, duration: 4 + Math.random() * 2, repeat: Infinity, ease: 'easeInOut' },
                }}
              >
                <span className="text-2xl">{s.icon}</span>
                <div>
                  <p className="text-white font-bold text-base leading-none">{s.value}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{s.label}</p>
                </div>
              </motion.div>
            ))}

            {/* Orbital visualization */}
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.9, ease: 'easeOut' }}>
              <Orbitals />
            </motion.div>

            <motion.div className="text-center"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7 }}>
              <h1 className="text-4xl font-bold text-white leading-tight tracking-tight">
                Become part<br />
                <span className="bg-gradient-to-r from-primary-400 to-emerald-300 bg-clip-text text-transparent">
                  of the change
                </span>
              </h1>
              <p className="text-slate-400 mt-3 text-base leading-relaxed max-w-xs mx-auto">
                Join hundreds of monitors protecting Ifrane's forests, water, and wildlife.
              </p>
            </motion.div>

            {/* Role chips */}
            <motion.div className="flex gap-3 flex-wrap justify-center"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
              {[
                { icon: <Leaf className="w-3.5 h-3.5" />, label: 'Report Incidents', color: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.25)', text: '#86efac' },
                { icon: <BarChart3 className="w-3.5 h-3.5" />, label: 'Track Progress', color: 'rgba(56,189,248,0.15)', border: 'rgba(56,189,248,0.25)', text: '#7dd3fc' },
                { icon: <ShieldCheck className="w-3.5 h-3.5" />, label: 'Protect Nature', color: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.25)', text: '#c4b5fd' },
              ].map((f, i) => (
                <motion.div key={f.label}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold"
                  style={{ background: f.color, border: `1px solid ${f.border}`, color: f.text }}>
                  {f.icon}{f.label}
                </motion.div>
              ))}
            </motion.div>
          </div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }} className="text-slate-600 text-xs">
            Ifrane Province, Morocco 🇲🇦 · Cedar Forest Region
          </motion.p>
        </div>
      </div>

      {/* ══════════ RIGHT — FORM PANEL ══════════ */}
      <div className="flex-1 flex flex-col min-h-screen relative"
        style={{ background: '#080f0b', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>

        {/* Top bar */}
        <div className="flex items-center justify-between px-8 pt-6 shrink-0">
          <div className="flex items-center gap-2 lg:opacity-0 lg:pointer-events-none">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#16a34a,#0d9144)' }}>
              <Logo size={16} withText={false} />
            </div>
            <span className="text-white font-bold text-sm">GreenAtlas</span>
          </div>
          <LanguageSwitcher />
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-8 py-8">
          <motion.div className="w-full max-w-sm"
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}>

            <div className="mb-7">
              <h2 className="text-2xl font-bold text-white mb-1.5">Create account</h2>
              <p className="text-slate-500 text-sm">Register as a citizen reporter</p>
            </div>

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

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input name="name" type="text" value={form.name} onChange={handleChange}
                  placeholder="Your full name" required autoComplete="name"
                  className="w-full px-4 py-3.5 rounded-2xl text-sm text-white placeholder-slate-600 transition-all duration-200 outline-none focus:ring-2 focus:ring-primary-500/40"
                  style={inputStyle}
                  onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                  onBlur={e  => Object.assign(e.currentTarget.style, blurStyle)} />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {t('auth.email')}
                </label>
                <input name="email" type="email" value={form.email} onChange={handleChange}
                  placeholder="you@greenatlas.ma" required autoComplete="email"
                  className="w-full px-4 py-3.5 rounded-2xl text-sm text-white placeholder-slate-600 transition-all duration-200 outline-none focus:ring-2 focus:ring-primary-500/40"
                  style={inputStyle}
                  onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                  onBlur={e  => Object.assign(e.currentTarget.style, blurStyle)} />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <input name="password" type={showPwd ? 'text' : 'password'}
                    value={form.password} onChange={handleChange}
                    placeholder="Min. 6 chars with a number" required autoComplete="new-password"
                    className="w-full px-4 py-3.5 pr-12 rounded-2xl text-sm text-white placeholder-slate-600 transition-all duration-200 outline-none focus:ring-2 focus:ring-primary-500/40"
                    style={inputStyle}
                    onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                    onBlur={e  => Object.assign(e.currentTarget.style, blurStyle)} />
                  <button type="button" onClick={() => setShowPwd(p => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Strength meter */}
                {form.password.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                          style={{ background: i <= strength.score ? strength.color : 'rgba(255,255,255,0.08)' }} />
                      ))}
                    </div>
                    <p className="text-xs" style={{ color: strength.color }}>{strength.label}</p>
                  </motion.div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input name="confirmPassword" type={showConfirm ? 'text' : 'password'}
                    value={form.confirmPassword} onChange={handleChange}
                    placeholder="Repeat password" required autoComplete="new-password"
                    className="w-full px-4 py-3.5 pr-12 rounded-2xl text-sm text-white placeholder-slate-600 transition-all duration-200 outline-none focus:ring-2 focus:ring-primary-500/40"
                    style={inputStyle}
                    onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                    onBlur={e  => Object.assign(e.currentTarget.style, blurStyle)} />
                  <button type="button" onClick={() => setShowConfirm(p => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {/* Match indicator */}
                  {form.confirmPassword.length > 0 && (
                    <div className="absolute right-10 top-1/2 -translate-y-1/2">
                      {form.password === form.confirmPassword
                        ? <span className="text-primary-400 text-sm">✓</span>
                        : <span className="text-red-400 text-sm">✗</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* Citizen note */}
              <div className="flex items-start gap-3 py-1">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <span className="text-sm">🌿</span>
                </div>
                <p className="text-xs text-slate-600 mt-1.5">
                  Registering as a <span className="text-primary-400 font-semibold">Citizen</span> reporter. Agent and admin accounts are created by administrators.
                </p>
              </div>

              {/* Submit */}
              <motion.button type="submit" disabled={isLoading}
                className="w-full py-3.5 mt-2 rounded-2xl font-semibold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                style={{
                  background: isLoading ? 'rgba(22,163,74,0.4)' : 'linear-gradient(135deg, #16a34a 0%, #0d9144 100%)',
                  boxShadow: isLoading ? 'none' : '0 0 24px rgba(22,163,74,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
                }}
                whileHover={!isLoading ? { scale: 1.015 } : {}}
                whileTap={!isLoading ? { scale: 0.985 } : {}}>
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Create Account<ArrowRight className="w-4 h-4" /></>
                )}
              </motion.button>
            </form>

            <p className="text-center text-sm text-slate-600 mt-6">
              {t('auth.haveAccount')}{' '}
              <Link to="/login" className="text-primary-500 hover:text-primary-400 font-semibold transition-colors">
                {t('auth.signInLink')}
              </Link>
            </p>
          </motion.div>
        </div>

        <p className="text-center text-[11px] text-slate-800 pb-5 px-8">
          © 2024 GreenAtlas Ifrane · Environmental Monitoring Platform
        </p>
      </div>
    </div>
  );
};

export default Register;
