import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { ForestData, FireRiskLevel, RISK_COLORS } from '../types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface ForestDashboardProps {
  data: ForestData[];
  liveRisk?: FireRiskLevel;
}

const riskScore: Record<FireRiskLevel, number> = {
  Low: 10, Medium: 30, High: 55, 'Very High': 75, Extreme: 95,
};

const RiskGauge: React.FC<{ level: FireRiskLevel }> = ({ level }) => {
  const score = riskScore[level];
  const color = RISK_COLORS[level];
  const angle = (score / 100) * 180 - 90;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-36 h-20 overflow-hidden">
        <svg viewBox="0 0 120 60" className="w-full">
          {/* Background arc */}
          <path d="M10,60 A50,50 0 0,1 110,60" stroke="#e2e8f0" strokeWidth="10" fill="none" strokeLinecap="round" />
          {/* Colored arc based on score */}
          <path
            d="M10,60 A50,50 0 0,1 110,60"
            stroke={color}
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 157} 157`}
          />
          {/* Needle */}
          <line
            x1="60" y1="60"
            x2={60 + 38 * Math.cos((angle * Math.PI) / 180)}
            y2={60 + 38 * Math.sin((angle * Math.PI) / 180)}
            stroke="#334155"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="60" cy="60" r="4" fill="#334155" />
        </svg>
      </div>
      <div
        className="text-sm font-bold px-3 py-1 rounded-full"
        style={{ background: color + '20', color }}
      >
        {level}
      </div>
    </div>
  );
};

const ForestDashboard: React.FC<ForestDashboardProps> = ({ data, liveRisk }) => {
  const sorted = [...data]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .slice(-30);

  const chartData = {
    labels: sorted.map((d) =>
      new Date(d.timestamp).toLocaleDateString('fr-MA', { day: 'numeric', month: 'short' })
    ),
    datasets: [
      {
        label: 'Health Index',
        data: sorted.map((d) => d.healthIndex),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34,197,94,0.08)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        min: 0, max: 100,
        ticks: { font: { size: 11 }, color: '#94a3b8', callback: (v: unknown) => `${v}` },
        grid: { color: '#f1f5f9' },
      },
      x: {
        ticks: { font: { size: 11 }, color: '#94a3b8', maxTicksLimit: 10, maxRotation: 45 },
        grid: { display: false },
      },
    },
  };

  const latestData = data[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Fire Risk Gauge */}
      <div className="card flex flex-col items-center justify-center gap-2">
        <p className="text-sm font-semibold text-slate-600 mb-1">Live Fire Risk</p>
        <RiskGauge level={liveRisk || latestData?.fireRiskLevel || 'Low'} />
        {latestData && (
          <div className="grid grid-cols-3 gap-2 w-full mt-2 text-center">
            <div className="text-xs">
              <div className="text-slate-400">Temp</div>
              <div className="font-semibold text-slate-700">{latestData.temperature}°C</div>
            </div>
            <div className="text-xs">
              <div className="text-slate-400">Humidity</div>
              <div className="font-semibold text-slate-700">{latestData.humidity}%</div>
            </div>
            <div className="text-xs">
              <div className="text-slate-400">Wind</div>
              <div className="font-semibold text-slate-700">{latestData.windSpeed} km/h</div>
            </div>
          </div>
        )}
      </div>

      {/* Health Index Chart */}
      <div className="card lg:col-span-2">
        <p className="text-sm font-semibold text-slate-600 mb-3">Forest Health Index (30 days)</p>
        <div style={{ height: '180px' }}>
          <Line data={chartData} options={options} />
        </div>
      </div>
    </div>
  );
};

export default ForestDashboard;
