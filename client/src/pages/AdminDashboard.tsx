import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import SpotlightCard from '../components/SpotlightCard';
import CountUp from '../components/CountUp';
import AnimatedSelect from '../components/AnimatedSelect';
import { reportService } from '../services/reportService';
import { userService } from '../services/userService';
import { Report, User, ReportStats, CATEGORY_LABELS, CATEGORY_COLORS, CATEGORY_ICONS } from '../types';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

type Tab = 'analytics' | 'reports' | 'users';

const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [tab, setTab] = useState<Tab>('analytics');
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchUser, setSearchUser] = useState('');
  const [searchReport, setSearchReport] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [reportsRes, usersRes, statsRes] = await Promise.allSettled([
          reportService.getAll({ limit: 100 }),
          userService.getAll(),
          reportService.getStats(),
        ]);
        if (reportsRes.status === 'fulfilled') setReports(reportsRes.value.data);
        if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data);
        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Delete this user and all their data?')) return;
    await userService.delete(id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const handleDeleteReport = async (id: string) => {
    if (!confirm('Delete this report?')) return;
    await reportService.delete(id);
    setReports((prev) => prev.filter((r) => r._id !== id));
  };

  const handleUpdateRole = async (id: string, role: string) => {
    await userService.update(id, { role: role as User['role'] });
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: role as User['role'] } : u)));
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    await reportService.update(id, { status: status as Report['status'] });
    setReports((prev) => prev.map((r) => (r._id === id ? { ...r, status: status as Report['status'] } : r)));
  };

  const chartTextColor = isDark ? '#94a3b8' : '#64748b';
  const chartGridColor = isDark ? '#1e293b' : '#f1f5f9';

  const categoryChartData = {
    labels: stats?.byCategory.map((c) => CATEGORY_LABELS[c._id as keyof typeof CATEGORY_LABELS] || c._id) || [],
    datasets: [{
      data: stats?.byCategory.map((c) => c.count) || [],
      backgroundColor: stats?.byCategory.map((c) => CATEGORY_COLORS[c._id as keyof typeof CATEGORY_COLORS] || '#94a3b8') || [],
      borderWidth: 0,
    }],
  };

  const statusChartData = {
    labels: stats?.byStatus.map((s) => s._id.charAt(0).toUpperCase() + s._id.slice(1)) || [],
    datasets: [{
      data: stats?.byStatus.map((s) => s.count) || [],
      backgroundColor: ['#f59e0b', '#3b82f6', '#22c55e'],
      borderWidth: 2,
      borderColor: isDark ? '#0f172a' : '#fff',
    }],
  };

  const recentBarData = {
    labels: (stats?.recent || []).slice(-14).map((r) => `${r._id.day}/${r._id.month}`),
    datasets: [{
      label: t('common.reports'),
      data: (stats?.recent || []).slice(-14).map((r) => r.count),
      backgroundColor: 'rgba(22,163,74,0.7)',
      borderColor: '#16a34a',
      borderWidth: 1,
      borderRadius: 4,
    }],
  };

  const chartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' as const, labels: { font: { size: 10 }, boxWidth: 10, color: chartTextColor } } },
  };

  const barOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { ticks: { font: { size: 10 }, color: chartTextColor }, grid: { color: chartGridColor } },
      x: { ticks: { font: { size: 10 }, color: chartTextColor }, grid: { display: false } },
    },
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.email.toLowerCase().includes(searchUser.toLowerCase())
  );

  const filteredReports = reports.filter((r) =>
    r.title.toLowerCase().includes(searchReport.toLowerCase())
  );

  const tabClass = (t: Tab) =>
    `px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
      tab === t
        ? 'border-primary-600 text-primary-600'
        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
    }`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('admin.title')}</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{t('admin.subtitle')}</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('admin.totalUsers'),   value: users.length,  color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300', spotlight: 'rgba(168,85,247,0.1)',  icon: '👥' },
          { label: t('admin.totalReports'), value: stats?.total ?? 0, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',    spotlight: 'rgba(59,130,246,0.1)',  icon: '📋' },
          { label: t('statuses.pending'),   value: stats?.byStatus.find(s => s._id === 'pending')?.count ?? 0,  color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300', spotlight: 'rgba(245,158,11,0.1)', icon: '⏳' },
          { label: t('statuses.resolved'),  value: stats?.byStatus.find(s => s._id === 'resolved')?.count ?? 0, color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300', spotlight: 'rgba(34,197,94,0.1)',  icon: '✅' },
        ].map((item) => (
          <SpotlightCard key={item.label} className="card flex items-center gap-3" spotlightColor={item.spotlight}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${item.color}`}>{item.icon}</div>
            <div>
              <p className="text-xl font-bold text-slate-800 dark:text-slate-100">
                <CountUp to={item.value} duration={1.2} />
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
            </div>
          </SpotlightCard>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <div className="flex gap-0">
          {(['analytics', 'reports', 'users'] as Tab[]).map((tb) => (
            <button key={tb} className={tabClass(tb)} onClick={() => setTab(tb)}>
              {tb === 'analytics' ? t('admin.analytics') : tb === 'reports' ? t('common.reports') : t('nav.users')}
            </button>
          ))}
        </div>
      </div>

      {/* Analytics Tab */}
      {tab === 'analytics' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card">
              <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm mb-4">{t('admin.byCategory')}</h3>
              <div style={{ height: '200px' }}>
                <Doughnut data={categoryChartData} options={chartOpts} />
              </div>
            </div>
            <div className="card">
              <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm mb-4">{t('admin.byStatus')}</h3>
              <div style={{ height: '200px' }}>
                <Doughnut data={statusChartData} options={chartOpts} />
              </div>
            </div>
            <div className="card">
              <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm mb-4">{t('admin.dailyReports')}</h3>
              <div style={{ height: '200px' }}>
                <Bar data={recentBarData} options={barOpts} />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm mb-4">{t('admin.usersByRole')}</h3>
            <div className="grid grid-cols-3 gap-4">
              {(['citizen', 'agent', 'admin'] as const).map((role) => {
                const count = users.filter((u) => u.role === role).length;
                const colors = { citizen: '#22c55e', agent: '#3b82f6', admin: '#ef4444' };
                return (
                  <div key={role} className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <p className="text-3xl font-bold" style={{ color: colors[role] }}>{count}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 capitalize mt-1">{role}s</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {tab === 'reports' && (
        <div className="animate-fadeIn">
          <div className="mb-4">
            <input
              type="text"
              placeholder={`${t('common.search')} ${t('common.reports').toLowerCase()}...`}
              value={searchReport}
              onChange={(e) => setSearchReport(e.target.value)}
              className="input-field max-w-xs"
            />
          </div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    {[t('report.incidentTitle'), t('common.category'), t('admin.reporter'), t('common.status'), t('common.date'), t('common.actions')].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide pb-3 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {filteredReports.map((r) => {
                    const reporter = typeof r.user === 'object' ? r.user.name : 'Unknown';
                    return (
                      <tr key={r._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                        <td className="py-3 pr-4 font-medium text-slate-700 dark:text-slate-200 text-xs max-w-[160px] truncate">{r.title}</td>
                        <td className="py-3 pr-4 text-xs">
                          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">{CATEGORY_ICONS[r.category]} {CATEGORY_LABELS[r.category]}</span>
                        </td>
                        <td className="py-3 pr-4 text-xs text-slate-500 dark:text-slate-400">{reporter}</td>
                        <td className="py-3 pr-4">
                          <AnimatedSelect
                            value={r.status}
                            options={[
                              { value: 'pending',  label: t('statuses.pending') },
                              { value: 'verified', label: t('statuses.verified') },
                              { value: 'resolved', label: t('statuses.resolved') },
                            ]}
                            onChange={(v) => handleUpdateStatus(r._id, v)}
                            className="w-28"
                          />
                        </td>
                        <td className="py-3 pr-4 text-xs text-slate-400">
                          {new Date(r.createdAt).toLocaleDateString('fr-MA', { day: 'numeric', month: 'short' })}
                        </td>
                        <td className="py-3">
                          <button
                            onClick={() => handleDeleteReport(r._id)}
                            className="text-xs text-red-500 hover:text-red-700 font-medium"
                          >
                            {t('common.delete')}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <div className="animate-fadeIn">
          <div className="mb-4">
            <input
              type="text"
              placeholder={`${t('common.search')} ${t('nav.users').toLowerCase()}...`}
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              className="input-field max-w-xs"
            />
          </div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    {['User', t('auth.email'), 'Role', 'Joined', t('common.actions')].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide pb-3 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-700 dark:text-slate-200 text-xs">{u.name}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-xs text-slate-500 dark:text-slate-400">{u.email}</td>
                      <td className="py-3 pr-4">
                        <AnimatedSelect
                          value={u.role}
                          options={[
                            { value: 'citizen', label: 'Citizen', icon: '🌱' },
                            { value: 'agent',   label: 'Agent',   icon: '🛡️' },
                            { value: 'admin',   label: 'Admin',   icon: '👑' },
                          ]}
                          onChange={(v) => handleUpdateRole(u.id, v)}
                          className="w-28"
                        />
                      </td>
                      <td className="py-3 pr-4 text-xs text-slate-400">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-MA', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                          {t('common.delete')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
