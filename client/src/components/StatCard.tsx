import React from 'react';
import { motion } from 'framer-motion';
import SpotlightCard from './SpotlightCard';
import CountUp from './CountUp';
import Tilt3D from './Tilt3D';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  gradient: string;
  trend?: { value: number; label: string };
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, gradient, trend, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 24, scale: 0.96 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ delay, duration: 0.45, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] }}
  >
    <Tilt3D intensity={8}>
      <SpotlightCard
        className="card group overflow-hidden relative cursor-default"
        spotlightColor="rgba(34, 197, 94, 0.12)"
      >
        {/* Top accent bar */}
        <div className={`absolute top-0 left-0 right-0 h-0.5 ${gradient}`} />

        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 truncate">{title}</p>
            <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 leading-none">
              {typeof value === 'number'
                ? <CountUp to={value} duration={1.2} className="tabular-nums" />
                : value
              }
            </p>
            {subtitle && <p className="text-xs text-slate-400 mt-1.5 truncate">{subtitle}</p>}
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                <span className={`inline-flex items-center text-xs font-semibold px-1.5 py-0.5 rounded-md ${trend.value >= 0 ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                  {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
                </span>
                <span className="text-xs text-slate-400">{trend.label}</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-2xl ${gradient} opacity-90 group-hover:opacity-100 transition-opacity ml-3 shrink-0`}>
            <div className="text-white">{icon}</div>
          </div>
        </div>
      </SpotlightCard>
    </Tilt3D>
  </motion.div>
);

export default StatCard;
