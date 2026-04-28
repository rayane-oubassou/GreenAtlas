import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import LanguageSwitcher from '../components/LanguageSwitcher';

/* ── Password strength ────────────────────────────── */
function getStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 6)            score++;
  if (pw.length >= 10)           score++;
  if (/[A-Z]/.test(pw))         score++;
  if (/\d/.test(pw))            score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { label: '',          color: 'transparent' },
    { label: 'Weak',      color: '#ef4444' },
    { label: 'Fair',      color: '#f59e0b' },
    { label: 'Good',      color: '#3b82f6' },
    { label: 'Strong',    color: '#22c55e' },
    { label: 'Excellent', color: '#10b981' },
  ];
  return { score, ...levels[score] };
}

/* ── Headline lines (BlurText style) ─────────────── */
const HEADLINE = ['Become part', 'of the', 'change.'];

const headlineVariants = {
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.4 } },
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
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};
const fieldVariants = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

/* ── Input style helpers ──────────────────────────── */
const inputBase = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
} as React.CSSProperties;

const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = '#22c55e';
  e.currentTarget.style.background  = 'rgba(34,197,94,0.04)';
};
const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
  e.currentTarget.style.background  = 'rgba(255,255,255,0.04)';
};

/* ── Component ────────────────────────────────────── */
const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate     = useNavigate();
  const { t }        = useTranslation();

  const [form, setForm]               = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPwd, setShowPwd]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]             = useState('');
  const [isLoading, setIsLoading]     = useState(false);

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

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT PANEL ─────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col w-[46%] relative overflow-hidden"
        style={{ background: '#0b1d12' }}
      >
        {/* Static glow blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div style={{
            position: 'absolute', top: -100, right: -100,
            width: 460, height: 460, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(22,163,74,0.2) 0%, transparent 70%)',
          }} />
          <div style={{
            position: 'absolute', bottom: -80, left: -60,
            width: 340, height: 340, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.13) 0%, transparent 70%)',
          }} />
        </div>

        {/* Diagonal line texture */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(-55deg, transparent, transparent 36px, rgba(255,255,255,0.018) 36px, rgba(255,255,255,0.018) 37px)',
        }} />

        {/* Beam sweep */}
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
            delay: 2,
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

          {/* Headline */}
          <div className="flex-1 flex flex-col justify-center">
            <motion.p
              className="text-emerald-500 text-xs font-semibold uppercase tracking-[0.15em] mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              Citizen reporting
            </motion.p>

            <motion.h1
              className="text-[3.25rem] font-bold text-white leading-[1.08] tracking-tight mb-6"
              initial="hidden"
              animate="show"
              variants={headlineVariants}
            >
              {HEADLINE.map((line) => (
                <motion.span key={line} className="block" variants={lineVariants}>
                  {line}
                </motion.span>
              ))}
            </motion.h1>

            <motion.p
              className="text-slate-400 text-base leading-relaxed max-w-xs mb-10"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.95, duration: 0.5 }}
            >
              Join hundreds of monitors protecting Ifrane's forests, water, and wildlife.
            </motion.p>

            {/* What you can do */}
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.5 }}
            >
              {[
                'Report environmental incidents',
                'Track forest and water conditions',
                'Contribute to local conservation',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-slate-400 text-sm">{item}</span>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.p
            className="text-slate-600 text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Ifrane Province, Morocco &middot; Cedar Forest Region
          </motion.p>
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
        <div className="flex-1 flex items-center justify-center px-8 py-8">
          <motion.div
            className="w-full max-w-[360px]"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-7">
              <h2 className="text-[1.6rem] font-bold text-white mb-1.5">Create account</h2>
              <p className="text-slate-500 text-sm">Register as a citizen reporter</p>
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
              className="space-y-4"
              variants={formVariants}
              initial="hidden"
              animate="show"
            >
              {/* Name */}
              <motion.div variants={fieldVariants}>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Full Name</label>
                <input
                  name="name" type="text" value={form.name} onChange={handleChange}
                  placeholder="Your full name" required autoComplete="name"
                  className="w-full px-3.5 py-3 rounded-lg text-sm text-white placeholder-slate-600 outline-none transition-colors duration-150"
                  style={inputBase} onFocus={onFocus} onBlur={onBlur}
                />
              </motion.div>

              {/* Email */}
              <motion.div variants={fieldVariants}>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">{t('auth.email')}</label>
                <input
                  name="email" type="email" value={form.email} onChange={handleChange}
                  placeholder="you@greenatlas.ma" required autoComplete="email"
                  className="w-full px-3.5 py-3 rounded-lg text-sm text-white placeholder-slate-600 outline-none transition-colors duration-150"
                  style={inputBase} onFocus={onFocus} onBlur={onBlur}
                />
              </motion.div>

              {/* Password */}
              <motion.div variants={fieldVariants}>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">{t('auth.password')}</label>
                <div className="relative">
                  <input
                    name="password" type={showPwd ? 'text' : 'password'}
                    value={form.password} onChange={handleChange}
                    placeholder="Min. 6 chars with a number" required autoComplete="new-password"
                    className="w-full px-3.5 py-3 pr-11 rounded-lg text-sm text-white placeholder-slate-600 outline-none transition-colors duration-150"
                    style={inputBase} onFocus={onFocus} onBlur={onBlur}
                  />
                  <button type="button" onClick={() => setShowPwd(p => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.password.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                          style={{ background: i <= strength.score ? strength.color : 'rgba(255,255,255,0.08)' }} />
                      ))}
                    </div>
                    <p className="text-xs" style={{ color: strength.color }}>{strength.label}</p>
                  </motion.div>
                )}
              </motion.div>

              {/* Confirm Password */}
              <motion.div variants={fieldVariants}>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input
                    name="confirmPassword" type={showConfirm ? 'text' : 'password'}
                    value={form.confirmPassword} onChange={handleChange}
                    placeholder="Repeat password" required autoComplete="new-password"
                    className="w-full px-3.5 py-3 pr-11 rounded-lg text-sm text-white placeholder-slate-600 outline-none transition-colors duration-150"
                    style={inputBase} onFocus={onFocus} onBlur={onBlur}
                  />
                  <button type="button" onClick={() => setShowConfirm(p => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {form.confirmPassword.length > 0 && (
                    <span className={`absolute right-10 top-1/2 -translate-y-1/2 text-sm font-medium
                      ${form.password === form.confirmPassword ? 'text-emerald-400' : 'text-red-400'}`}>
                      {form.password === form.confirmPassword ? '✓' : '✗'}
                    </span>
                  )}
                </div>
              </motion.div>

              {/* Note */}
              <motion.p className="text-xs text-slate-600 pt-1" variants={fieldVariants}>
                Registering as a{' '}
                <span className="text-emerald-500 font-medium">Citizen</span> reporter.
                Agent and admin accounts are created by administrators.
              </motion.p>

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
                    : 'Create Account'
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
              {t('auth.haveAccount')}{' '}
              <Link to="/login" className="text-emerald-500 hover:text-emerald-400 transition-colors font-medium">
                {t('auth.signInLink')}
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

export default Register;
