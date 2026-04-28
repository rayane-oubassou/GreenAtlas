import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import LanguageSwitcher from '../components/LanguageSwitcher';

/* ── Count-up hook ────────────────────────────────── */
function useCountUp(target: number, duration = 1500, delay = 600) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const p     = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setCount(Math.round(eased * target));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(t);
  }, [target, duration, delay]);
  return count;
}

/* ── Stats config ─────────────────────────────────── */
const STATS = [
  { target: 12400, label: 'Hectares protected', suffix: '+',
    fmt: (n: number) => n.toLocaleString() },
  { target: 340,   label: 'Incidents resolved', suffix: '',
    fmt: (n: number) => String(n) },
  { target: 1200,  label: 'Active monitors',    suffix: '+',
    fmt: (n: number) => n.toLocaleString() },
];

function StatItem({ target, label, suffix, fmt }: typeof STATS[0]) {
  const count = useCountUp(target);
  return (
    <div>
      <p className="text-white font-bold text-lg leading-none tabular-nums">
        {fmt(count)}{count > 0 ? suffix : ''}
      </p>
      <p className="text-slate-500 text-xs mt-1">{label}</p>
    </div>
  );
}

/* ── Headline lines (BlurText style) ─────────────── */
const HEADLINE = ['Monitoring', 'nature,', 'protecting', 'tomorrow.'];

const headlineVariants = {
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.5 } },
};
const lineVariants = {
  hidden: { opacity: 0, y: 28, filter: 'blur(6px)' },
  show:   {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

/* ── Form stagger ─────────────────────────────────── */
const formVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};
const fieldVariants = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

/* ── Component ────────────────────────────────────── */
const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { t }     = useTranslation();
  const from      = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState('');
  const [isLoading, setIsLoading]       = useState(false);

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

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT PANEL ─────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col w-[52%] relative overflow-hidden"
        style={{ background: '#0b1d12' }}
      >
        {/* Static glow blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div style={{
            position: 'absolute', top: -120, right: -80,
            width: 500, height: 500, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(22,163,74,0.2) 0%, transparent 70%)',
          }} />
          <div style={{
            position: 'absolute', bottom: -80, left: -60,
            width: 360, height: 360, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.13) 0%, transparent 70%)',
          }} />
        </div>

        {/* Diagonal line texture */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(-55deg, transparent, transparent 36px, rgba(255,255,255,0.018) 36px, rgba(255,255,255,0.018) 37px)',
        }} />

        {/* Beam sweep (framer-motion, repeating) */}
        <motion.div
          className="absolute top-0 bottom-0 pointer-events-none z-10"
          style={{
            width: 90,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.055), transparent)',
            skewX: -12,
          }}
          initial={{ x: '-100%' }}
          animate={{ x: '1300%' }}
          transition={{
            duration: 3.5,
            ease: [0.4, 0, 0.6, 1],
            repeat: Infinity,
            repeatDelay: 6,
            delay: 1.5,
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-12 py-10">

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Logo size={34} withText={true} textColor="text-white" animateHover={false} />
          </motion.div>

          {/* Headline area */}
          <div className="flex-1 flex flex-col justify-center">
            <motion.p
              className="text-emerald-500 text-xs font-semibold uppercase tracking-[0.15em] mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              Ifrane Province, Morocco
            </motion.p>

            {/* BlurText-style headline */}
            <motion.h1
              className="text-[3.25rem] font-bold text-white leading-[1.08] tracking-tight mb-6"
              initial="hidden"
              animate="show"
              variants={headlineVariants}
            >
              {HEADLINE.map((word) => (
                <motion.span key={word} className="block" variants={lineVariants}>
                  {word}
                </motion.span>
              ))}
            </motion.h1>

            <motion.p
              className="text-slate-400 text-base leading-relaxed max-w-xs"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.05, duration: 0.5 }}
            >
              Real-time environmental intelligence across Ifrane's forests, water, and air.
            </motion.p>
          </div>

          {/* Count-up stats */}
          <motion.div
            className="flex gap-10 pt-8"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            {STATS.map((s) => <StatItem key={s.label} {...s} />)}
          </motion.div>
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────── */}
      <div
        className="flex-1 flex flex-col"
        style={{ background: '#07100a', borderLeft: '1px solid rgba(255,255,255,0.05)' }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-8 pt-6 shrink-0">
          <div className="lg:opacity-0 lg:pointer-events-none">
            <Logo size={28} withText={true} textColor="text-white" animateHover={false} />
          </div>
          <LanguageSwitcher />
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-8 py-10">
          <motion.div
            className="w-full max-w-[360px]"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-8">
              <h2 className="text-[1.6rem] font-bold text-white mb-1.5">{t('auth.welcome')}</h2>
              <p className="text-slate-500 text-sm">{t('auth.signInSubtitle')}</p>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20
                             text-red-400 text-sm px-4 py-3 rounded-lg overflow-hidden"
                >
                  <span className="shrink-0">&#9888;</span>
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.form
              onSubmit={handleSubmit}
              className="space-y-5"
              variants={formVariants}
              initial="hidden"
              animate="show"
            >
              {/* Email */}
              <motion.div variants={fieldVariants}>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  {t('auth.email')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@greenatlas.ma"
                  required
                  autoComplete="email"
                  className="w-full px-3.5 py-3 rounded-lg text-sm text-white placeholder-slate-600
                             outline-none transition-colors duration-150"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#22c55e'; e.currentTarget.style.background = 'rgba(34,197,94,0.04)'; }}
                  onBlur={e  => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                />
              </motion.div>

              {/* Password */}
              <motion.div variants={fieldVariants}>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    className="w-full px-3.5 py-3 pr-11 rounded-lg text-sm text-white placeholder-slate-600
                               outline-none transition-colors duration-150"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#22c55e'; e.currentTarget.style.background = 'rgba(34,197,94,0.04)'; }}
                    onBlur={e  => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </motion.div>

              {/* Submit — shimmer button */}
              <motion.div variants={fieldVariants}>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-shimmer w-full py-3 rounded-lg font-semibold text-sm text-white
                             flex items-center justify-center gap-2
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : t('auth.signIn')
                  }
                </button>
              </motion.div>
            </motion.form>

            <motion.p
              className="text-center text-sm text-slate-600 mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {t('auth.noAccount')}{' '}
              <Link to="/register" className="text-emerald-500 hover:text-emerald-400 transition-colors font-medium">
                {t('auth.registerLink')}
              </Link>
            </motion.p>
          </motion.div>
        </div>

        <p className="text-center text-[11px] text-slate-800 pb-5">
          &copy; 2025 GreenAtlas &middot; Ifrane Province
        </p>
      </div>
    </div>
  );
};

export default Login;
