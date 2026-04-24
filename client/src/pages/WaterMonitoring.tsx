import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { waterService } from '../services/waterService';
import { WaterData, WaterSummary } from '../types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const statusConfig = {
  critical: { label: 'Critical', color: '#ef4444', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  low: { label: 'Low', color: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  normal: { label: 'Normal', color: '#3b82f6', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  high: { label: 'Good', color: '#22c55e', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
};

const WaterMonitoring: React.FC = () => {
  const [allData, setAllData] = useState<WaterData[]>([]);
  const [summary, setSummary] = useState<WaterSummary[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await waterService.getAll();
        setAllData(res.data);
        setSummary(res.summary);
        if (res.summary.length > 0) setSelectedSource(res.summary[0]._id);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const sourceData = allData
    .filter((d) => !selectedSource || d.source === selectedSource)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .slice(-30);

  const lineChartData = {
    labels: sourceData.map((d) =>
      new Date(d.timestamp).toLocaleDateString('fr-MA', { day: 'numeric', month: 'short' })
    ),
    datasets: [
      {
        label: selectedSource || 'Water Level (%)',
        data: sourceData.map((d) => d.level),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.08)',
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Critical Threshold (20%)',
        data: sourceData.map(() => 20),
        borderColor: '#ef4444',
        borderWidth: 1,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  const doughnutData = {
    labels: summary.map((s) => s._id),
    datasets: [{
      data: summary.map((s) => s.level),
      backgroundColor: summary.map((s) => statusConfig[s.status]?.color || '#94a3b8'),
      borderWidth: 2,
      borderColor: '#fff',
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        min: 0, max: 100,
        ticks: { callback: (v: unknown) => `${v}%`, font: { size: 11 }, color: '#94a3b8' },
        grid: { color: '#f1f5f9' },
      },
      x: {
        ticks: { font: { size: 11 }, color: '#94a3b8', maxTicksLimit: 10, maxRotation: 45 },
        grid: { display: false },
      },
    },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const criticalSources = summary.filter((s) => s.status === 'critical' || s.status === 'low');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Water Resource Monitoring</h2>
        <p className="text-slate-500 text-sm mt-0.5">Track water levels across Ifrane Province sources</p>
      </div>

      {/* Alerts */}
      {criticalSources.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-amber-600">⚠️</span>
            <h3 className="font-semibold text-amber-800 text-sm">Water Level Alerts</h3>
          </div>
          <div className="space-y-1">
            {criticalSources.map((s) => (
              <p key={s._id} className="text-xs text-amber-700">
                <strong>{s._id}</strong> is at {s.level.toFixed(1)}% — status: <strong>{s.status.toUpperCase()}</strong>
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Source cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summary.map((s) => {
          const cfg = statusConfig[s.status] || statusConfig.normal;
          return (
            <button
              key={s._id}
              onClick={() => setSelectedSource(s._id)}
              className={`card text-left transition-all hover:shadow-md border-2 ${
                selectedSource === s._id ? 'border-blue-400 shadow-md' : 'border-transparent'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-500 text-xl">💧</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                  {cfg.label}
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-800">{s.level.toFixed(0)}%</p>
              <p className="text-xs font-semibold text-slate-700 mt-0.5 truncate">{s._id}</p>
              <p className="text-xs text-slate-400">{s.location}</p>
              <div className="mt-2 bg-slate-100 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{ width: `${s.level}%`, background: cfg.color }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-700">Water Level Trends — 30 Days</h3>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="input-field py-1 text-xs w-44"
            >
              {summary.map((s) => <option key={s._id} value={s._id}>{s._id}</option>)}
            </select>
          </div>
          <div style={{ height: '240px' }}>
            <Line data={lineChartData} options={chartOptions} />
          </div>
        </div>

        <div className="card flex flex-col">
          <h3 className="font-semibold text-slate-700 mb-4">Current Levels</h3>
          <div style={{ height: '180px' }}>
            <Doughnut
              data={doughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom', labels: { font: { size: 10 }, boxWidth: 10 } },
                  tooltip: { callbacks: { label: (ctx) => ` ${(ctx.raw as number).toFixed(1)}%` } },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Data table */}
      <div className="card overflow-hidden">
        <h3 className="font-semibold text-slate-700 mb-4">Recent Measurements</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['Source', 'Location', 'Level', 'Status', 'Last Updated'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide pb-3 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {summary.map((s) => {
                const cfg = statusConfig[s.status] || statusConfig.normal;
                return (
                  <tr key={s._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 pr-4 font-medium text-slate-700">{s._id}</td>
                    <td className="py-3 pr-4 text-slate-500 text-xs">{s.location}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-100 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full" style={{ width: `${s.level}%`, background: cfg.color }} />
                        </div>
                        <span className="font-semibold text-slate-700">{s.level.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400 text-xs">
                      {new Date(s.lastUpdated).toLocaleDateString('fr-MA', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WaterMonitoring;
