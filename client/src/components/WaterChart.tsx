import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { WaterData } from '../types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

interface WaterChartProps {
  data: WaterData[];
  type?: 'line' | 'bar';
  title?: string;
  sourceName?: string;
}

const WaterChart: React.FC<WaterChartProps> = ({ data, type = 'line', title, sourceName }) => {
  const filtered = sourceName ? data.filter((d) => d.source === sourceName) : data;
  const sorted = [...filtered].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const labels = sorted.map((d) =>
    new Date(d.timestamp).toLocaleDateString('fr-MA', { day: 'numeric', month: 'short' })
  );
  const values = sorted.map((d) => d.level);

  const chartData = {
    labels,
    datasets: [
      {
        label: sourceName || 'Water Level (%)',
        data: values,
        borderColor: '#3b82f6',
        backgroundColor: type === 'line' ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.7)',
        borderWidth: 2,
        pointRadius: type === 'line' ? 3 : 0,
        pointHoverRadius: 5,
        fill: type === 'line',
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { raw: unknown }) => ` ${ctx.raw}%`,
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          callback: (v: unknown) => `${v}%`,
          font: { size: 11 },
          color: '#94a3b8',
        },
        grid: { color: '#f1f5f9' },
      },
      x: {
        ticks: {
          font: { size: 11 },
          color: '#94a3b8',
          maxRotation: 45,
          maxTicksLimit: 12,
        },
        grid: { display: false },
      },
    },
  };

  return (
    <div className="card">
      {title && <h3 className="font-semibold text-slate-700 mb-4 text-sm">{title}</h3>}
      <div style={{ height: '220px' }}>
        {type === 'line' ? (
          <Line data={chartData} options={options} />
        ) : (
          <Bar data={chartData} options={options} />
        )}
      </div>
    </div>
  );
};

export default WaterChart;
