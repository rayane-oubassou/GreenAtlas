import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import ForestDashboard from '../components/ForestDashboard';
import { forestService } from '../services/forestService';
import { weatherService } from '../services/weatherService';
import { ForestData, ForestSummary, WeatherData, FireRiskLevel, RISK_COLORS } from '../types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const riskOrder: FireRiskLevel[] = ['Low', 'Medium', 'High', 'Very High', 'Extreme'];

const ForestMonitoring: React.FC = () => {
  const [forestData, setForestData] = useState<ForestData[]>([]);
  const [summary, setSummary] = useState<ForestSummary[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [liveRisk, setLiveRisk] = useState<FireRiskLevel>('Low');
  const [isLoading, setIsLoading] = useState(true);

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
    forestService.getAll().then((res) => setSummary(res.summary)).catch(() => {});
  }, []);

  const riskChartData = {
    labels: riskOrder,
    datasets: [{
      label: 'Days at risk level',
      data: riskOrder.map((level) => forestData.filter((d) => d.fireRiskLevel === level).length),
      backgroundColor: riskOrder.map((level) => RISK_COLORS[level] + 'CC'),
      borderColor: riskOrder.map((level) => RISK_COLORS[level]),
      borderWidth: 1,
      borderRadius: 6,
    }],
  };

  const trendChartData = {
    labels: [...forestData]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-20)
      .map((d) => new Date(d.timestamp).toLocaleDateString('fr-MA', { day: 'numeric', month: 'short' })),
    datasets: [{
      label: 'Temperature (°C)',
      data: [...forestData]
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .slice(-20)
        .map((d) => d.temperature),
      borderColor: '#f97316',
      backgroundColor: 'rgba(249,115,22,0.08)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 2,
    }, {
      label: 'Humidity (%)',
      data: [...forestData]
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .slice(-20)
        .map((d) => d.humidity),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59,130,246,0.08)',
      borderWidth: 2,
      fill: false,
      tension: 0.4,
      pointRadius: 2,
    }],
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const highRiskZones = summary.filter((s) =>
    s.fireRiskLevel === 'High' || s.fireRiskLevel === 'Very High' || s.fireRiskLevel === 'Extreme'
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Forest Monitoring</h2>
        <p className="text-slate-500 text-sm mt-0.5">Fire risk assessment and forest health indicators for Ifrane Province</p>
      </div>

      {/* High risk alert */}
      {highRiskZones.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <span>🔥</span>
            <h3 className="font-semibold text-red-800 text-sm">High Fire Risk Zones</h3>
          </div>
          {highRiskZones.map((z) => (
            <p key={z._id} className="text-xs text-red-700">
              <strong>{z._id}</strong>: {z.fireRiskLevel} risk · Health Index: {z.healthIndex.toFixed(0)}
            </p>
          ))}
        </div>
      )}

      {/* Fire risk gauge + health chart */}
      <ForestDashboard data={forestData} liveRisk={liveRisk} />

      {/* Live weather conditions */}
      {weather && (
        <div className="card">
          <h3 className="font-semibold text-slate-700 text-sm mb-4">Live Weather Conditions (Ifrane)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { icon: '🌡️', label: 'Temperature', value: `${weather.temperature}°C` },
              { icon: '💧', label: 'Humidity', value: `${weather.humidity}%` },
              { icon: '🌬️', label: 'Wind Speed', value: `${weather.windSpeed} km/h` },
              { icon: '📊', label: 'Pressure', value: `${weather.pressure} hPa` },
              { icon: '🌧️', label: 'Rainfall', value: `${weather.rainfall} mm` },
            ].map((item) => (
              <div key={item.label} className="text-center bg-slate-50 rounded-xl p-3">
                <span className="text-2xl">{item.icon}</span>
                <p className="font-bold text-slate-800 text-sm mt-1">{item.value}</p>
                <p className="text-xs text-slate-400">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-slate-700 text-sm mb-4">Risk Level Distribution</h3>
          <div style={{ height: '220px' }}>
            <Bar
              data={riskChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { ticks: { font: { size: 11 }, color: '#94a3b8' }, grid: { color: '#f1f5f9' } },
                  x: { ticks: { font: { size: 11 }, color: '#94a3b8' }, grid: { display: false } },
                },
              }}
            />
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-slate-700 text-sm mb-4">Temperature & Humidity Trends</h3>
          <div style={{ height: '220px' }}>
            <Line
              data={trendChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top', labels: { font: { size: 11 }, boxWidth: 12 } } },
                scales: {
                  y: { ticks: { font: { size: 11 }, color: '#94a3b8' }, grid: { color: '#f1f5f9' } },
                  x: { ticks: { font: { size: 11 }, color: '#94a3b8', maxTicksLimit: 8 }, grid: { display: false } },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Zone table */}
      <div className="card overflow-hidden">
        <h3 className="font-semibold text-slate-700 mb-4">Forest Zone Status</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['Zone', 'Area (ha)', 'Fire Risk', 'Health Index', 'Last Updated'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide pb-3 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {summary.map((zone) => {
                const riskColor = RISK_COLORS[zone.fireRiskLevel];
                const healthColor = zone.healthIndex >= 75 ? '#22c55e' : zone.healthIndex >= 50 ? '#f59e0b' : '#ef4444';
                return (
                  <tr key={zone._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 pr-4 font-medium text-slate-700 text-xs">{zone._id}</td>
                    <td className="py-3 pr-4 text-slate-500 text-xs">{zone.area.toLocaleString()}</td>
                    <td className="py-3 pr-4">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: riskColor + '20', color: riskColor }}
                      >
                        {zone.fireRiskLevel}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full" style={{ width: `${zone.healthIndex}%`, background: healthColor }} />
                        </div>
                        <span className="text-xs font-semibold" style={{ color: healthColor }}>{zone.healthIndex.toFixed(0)}</span>
                      </div>
                    </td>
                    <td className="py-3 text-slate-400 text-xs">
                      {new Date(zone.lastUpdated).toLocaleDateString('fr-MA', { day: 'numeric', month: 'short' })}
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

export default ForestMonitoring;
