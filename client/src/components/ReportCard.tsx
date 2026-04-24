import React from 'react';
import { motion } from 'framer-motion';
import { Report, CATEGORY_LABELS, CATEGORY_ICONS } from '../types';
import { useAuth } from '../context/AuthContext';
import { reportService } from '../services/reportService';
import SpotlightCard from './SpotlightCard';
import Tilt3D from './Tilt3D';

interface ReportCardProps {
  report: Report;
  onStatusChange?: (id: string, status: string) => void;
  onDelete?: (id: string) => void;
  index?: number;
}

const statusConfig = {
  pending:  { label: 'Pending',  cls: 'badge-pending' },
  verified: { label: 'Verified', cls: 'badge-verified' },
  resolved: { label: 'Resolved', cls: 'badge-resolved' },
};

const categoryColor: Record<string, string> = {
  wildfire:        'bg-red-50    dark:bg-red-950/40   border-red-100   dark:border-red-900/40',
  illegal_logging: 'bg-amber-50  dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/40',
  water_leak:      'bg-blue-50   dark:bg-blue-950/40  border-blue-100  dark:border-blue-900/40',
  pollution:       'bg-slate-50  dark:bg-slate-800    border-slate-100 dark:border-slate-700',
};

const categorySpotlight: Record<string, string> = {
  wildfire:        'rgba(239,68,68,0.1)',
  illegal_logging: 'rgba(245,158,11,0.1)',
  water_leak:      'rgba(59,130,246,0.1)',
  pollution:       'rgba(100,116,139,0.1)',
};

const ReportCard: React.FC<ReportCardProps> = ({ report, onStatusChange, onDelete, index = 0 }) => {
  const { user } = useAuth();
  const canModerate = user?.role === 'agent' || user?.role === 'admin';
  const canDelete   = user?.role === 'admin'  || user?.role === 'agent';
  const userName = typeof report.user === 'object' ? report.user.name : 'Unknown';
  const status = statusConfig[report.status];

  const handleStatus = async (s: string) => {
    try { await reportService.update(report._id, { status: s as Report['status'] }); onStatusChange?.(report._id, s); }
    catch { /* silent */ }
  };
  const handleDelete = async () => {
    if (!confirm('Delete this report permanently?')) return;
    try { await reportService.delete(report._id); onDelete?.(report._id); }
    catch { /* silent */ }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92, y: -8 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] }}
      layout
    >
      <Tilt3D intensity={6}>
        <SpotlightCard
          className="rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900"
          spotlightColor={categorySpotlight[report.category]}
        >
          {/* Category strip */}
          <div className={`px-4 py-2 border-b ${categoryColor[report.category]} flex items-center justify-between gap-2`}>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm shrink-0">{CATEGORY_ICONS[report.category]}</span>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                {CATEGORY_LABELS[report.category]}
              </span>
            </div>
            <span className={status.cls + ' shrink-0'}>{status.label}</span>
          </div>

          <div className="p-4">
            {report.imageUrl && (
              <div className="h-32 rounded-xl overflow-hidden mb-3 bg-slate-100 dark:bg-slate-800">
                <motion.img
                  src={report.imageUrl} alt={report.title}
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.4 }}
                  onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                />
              </div>
            )}

            <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm leading-snug mb-1 line-clamp-2">{report.title}</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2 leading-relaxed mb-3">{report.description}</p>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-50 dark:border-slate-800">
              <span className="flex items-center gap-1 truncate max-w-[60%]">
                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="truncate">{userName}</span>
              </span>
              <span className="shrink-0">
                {new Date(report.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </span>
            </div>

            {(canModerate || canDelete) && (
              <div className="flex gap-1.5 mt-3 pt-3 border-t border-slate-50 dark:border-slate-800">
                {canModerate && report.status !== 'verified' && (
                  <motion.button onClick={() => handleStatus('verified')}
                    className="flex-1 text-[11px] py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 font-semibold transition-colors"
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                    Verify
                  </motion.button>
                )}
                {canModerate && report.status !== 'resolved' && (
                  <motion.button onClick={() => handleStatus('resolved')}
                    className="flex-1 text-[11px] py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 font-semibold transition-colors"
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                    Resolve
                  </motion.button>
                )}
                {canDelete && (
                  <motion.button onClick={handleDelete}
                    className="text-[11px] py-1.5 px-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 font-semibold transition-colors shrink-0"
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                    Delete
                  </motion.button>
                )}
              </div>
            )}
          </div>
        </SpotlightCard>
      </Tilt3D>
    </motion.div>
  );
};

export default ReportCard;
