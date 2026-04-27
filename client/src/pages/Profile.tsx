import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import api from '../services/api';
import { leaderboardService } from '../services/leaderboardService';
import { BADGE_DEFINITIONS } from '../types';

const Profile: React.FC = () => {
  const { user, login } = useAuth();
  const { t } = useTranslation();
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const [pwdForm, setPwdForm] = useState({ current: '', next: '', confirm: '' });
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  const [greenScore, setGreenScore] = useState(0);
  const [badges, setBadges] = useState<string[]>([]);
  const [rank, setRank] = useState<number | null>(null);

  useEffect(() => {
    leaderboardService.get('alltime').then(res => {
      const cu = res.data.currentUser;
      setGreenScore(cu.greenScore);
      setBadges(cu.badges);
      setRank(cu.rank);
    }).catch(() => {});
  }, []);

  if (!user) return null;

  const roleColor: Record<string, string> = {
    admin:   'from-red-500 to-rose-600',
    agent:   'from-violet-500 to-purple-600',
    citizen: 'from-teal-500 to-emerald-600',
  };

  const handleSave = async () => {
    setSaving(true); setSaveMsg('');
    try {
      await userService.update(user.id, { name, email });
      setSaveMsg(t('profile.saveSuccess'));
      setEditMode(false);
    } catch {
      setSaveMsg(t('profile.saveFail'));
    } finally {
      setSaving(false);
    }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(''); setPwdMsg('');
    if (pwdForm.next !== pwdForm.confirm) { setPwdError('New passwords do not match.'); return; }
    if (pwdForm.next.length < 6) { setPwdError('New password must be at least 6 characters.'); return; }
    setPwdLoading(true);
    try {
      await login(user.email, pwdForm.current);
      await api.put(`/users/${user.id}`, { password: pwdForm.next });
      setPwdMsg(t('profile.pwdSuccess'));
      setPwdForm({ current: '', next: '', confirm: '' });
    } catch {
      setPwdError(t('profile.pwdFail'));
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-6 animate-fadeIn">

      {/* Hero card */}
      <div className={`rounded-2xl bg-gradient-to-br ${roleColor[user.role]} p-px`}>
        <div className="rounded-[15px] bg-white dark:bg-slate-900 overflow-hidden">
          <div className={`bg-gradient-to-r ${roleColor[user.role]} px-6 py-8 flex items-center gap-5`}>
            <div className="w-20 h-20 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center text-3xl font-bold text-white shadow-lg shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">
                {user.role} account
              </p>
              <h2 className="text-2xl font-bold text-white truncate">{user.name}</h2>
              <p className="text-white/70 text-sm truncate">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile form */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">{t('profile.personalInfo')}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{t('profile.personalInfoSub')}</p>
          </div>
          {!editMode
            ? <button onClick={() => setEditMode(true)} className="btn-secondary text-xs py-2 px-4">{t('common.edit')}</button>
            : <button onClick={() => { setEditMode(false); setName(user.name); setEmail(user.email); }} className="btn-ghost text-xs">{t('common.cancel')}</button>
          }
        </div>

        {saveMsg && (
          <div className={`text-sm px-4 py-3 rounded-xl mb-4 ${
            saveMsg.includes('success') || saveMsg.includes('نجاح') || saveMsg.includes('بنجاح')
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}>
            {saveMsg}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">{t('profile.fullName')}</label>
            {editMode
              ? <input value={name} onChange={e => setName(e.target.value)} className="input-field" />
              : <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 py-2.5 px-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">{user.name}</p>
            }
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">{t('profile.emailAddress')}</label>
            {editMode
              ? <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" />
              : <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 py-2.5 px-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">{user.email}</p>
            }
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">{t('profile.role')}</label>
            <div className="flex items-center gap-2 py-2.5 px-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
              <span className={`badge badge-${user.role} capitalize`}>{user.role}</span>
              <span className="text-xs text-slate-400">{t('profile.roleNote')}</span>
            </div>
          </div>
        </div>

        {editMode && (
          <div className="flex justify-end mt-5 pt-4 border-t border-slate-100 dark:border-slate-700">
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving
                ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> {t('common.saving')}</>
                : `✓ ${t('common.save')}`
              }
            </button>
          </div>
        )}
      </div>

      {/* Change password */}
      <div className="card">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1">{t('profile.changePassword')}</h3>
        <p className="text-xs text-slate-400 mb-5">{t('profile.changePasswordSub')}</p>

        {pwdMsg && <div className="text-sm px-4 py-3 rounded-xl mb-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">{pwdMsg}</div>}
        {pwdError && <div className="text-sm px-4 py-3 rounded-xl mb-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">{pwdError}</div>}

        <form onSubmit={handlePassword} className="space-y-4">
          {[
            { key: 'current', label: t('profile.currentPassword'), placeholder: 'Your current password' },
            { key: 'next',    label: t('profile.newPassword'),     placeholder: 'At least 6 characters' },
            { key: 'confirm', label: t('profile.confirmNew'),      placeholder: 'Repeat new password' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">{f.label}</label>
              <input type="password"
                value={pwdForm[f.key as keyof typeof pwdForm]}
                onChange={e => setPwdForm(p => ({ ...p, [f.key]: e.target.value }))}
                className="input-field"
                placeholder={f.placeholder}
                required />
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={pwdLoading} className="btn-primary">
              {pwdLoading
                ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{t('profile.updating')}</>
                : t('profile.updatePassword')
              }
            </button>
          </div>
        </form>
      </div>

      {/* Green Score */}
      <div className="card border border-amber-200/60 dark:border-amber-700/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">🏆 {t('profile.greenScore')}</h3>
          <Link to="/leaderboard" className="text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline">
            {t('profile.viewLeaderboard')} →
          </Link>
        </div>
        <div className="flex items-center gap-6 mb-4">
          <div className="text-center">
            <p className="text-3xl font-black text-amber-500">{greenScore}</p>
            <p className="text-xs text-slate-400 mt-0.5">{t('leaderboard.pts')}</p>
          </div>
          {rank != null && (
            <div className="text-center">
              <p className="text-3xl font-black text-primary-500">#{rank}</p>
              <p className="text-xs text-slate-400 mt-0.5">{t('leaderboard.rank')}</p>
            </div>
          )}
        </div>
        {badges.length > 0 ? (
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t('profile.badges')}</p>
            <div className="flex flex-wrap gap-2">
              {badges.map(id => {
                const def = BADGE_DEFINITIONS[id];
                return def ? (
                  <span key={id} className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-gradient-to-r ${def.color} text-white shadow-sm`}>
                    <span>{def.emoji}</span>
                    <span>{def.label}</span>
                  </span>
                ) : null;
              })}
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400">{t('profile.noBadges')}</p>
        )}
      </div>

      {/* Account stats */}
      <div className="card">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">{t('profile.accountDetails')}</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: t('profile.accountType'), value: user.role.charAt(0).toUpperCase() + user.role.slice(1), emoji: '🏷️' },
            { label: t('profile.platform'), value: 'GreenAtlas Ifrane', emoji: '🌿' },
          ].map(item => (
            <div key={item.label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
              <p className="text-xl mb-2">{item.emoji}</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{item.value}</p>
              <p className="text-xs text-slate-400">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;
