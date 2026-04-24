import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import MapView from '../components/MapView';
import FilterBar from '../components/FilterBar';
import { reportService } from '../services/reportService';
import { weatherService } from '../services/weatherService';
import { Report, FireHotspot, CATEGORY_LABELS, CATEGORY_ICONS } from '../types';

const MapPage: React.FC = () => {
  const { t } = useTranslation();
  const [reports, setReports] = useState<Report[]>([]);
  const [hotspots, setHotspots] = useState<FireHotspot[]>([]);
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setIsLoading(true);
    Promise.allSettled([
      reportService.getAll({ ...(category && { category }), ...(status && { status }), limit: 200 }),
      weatherService.getEnvironmentData(),
    ]).then(([r, e]) => {
      if (r.status === 'fulfilled') { setReports(r.value.data); setTotal(r.value.pagination.total); }
      if (e.status === 'fulfilled') setHotspots(e.value.data.fireHotspots);
      setIsLoading(false);
    });
  }, [category, status]);

  const catCounts = reports.reduce<Record<string, number>>((a, r) => ({ ...a, [r.category]: (a[r.category]||0)+1 }), {});

  return (
    <div className="flex flex-col gap-4" style={{ height: 'calc(100vh - 104px)' }}>
      {/* Filter bar */}
      <div className="card py-3 shrink-0">
        <FilterBar category={category} status={status} onCategoryChange={setCategory} onStatusChange={setStatus} />
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden min-h-0">
        {/* Map */}
        <div className="flex-1 rounded-2xl overflow-hidden relative border border-slate-100 dark:border-slate-800 shadow-card">
          {isLoading && (
            <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
              <div className="w-8 h-8 border-[3px] border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <MapView reports={reports} hotspots={showHotspots ? hotspots : []} height="100%" zoom={11} />
        </div>

        {/* Sidebar */}
        <div className="w-56 flex flex-col gap-3 overflow-y-auto shrink-0">

          {/* Legend */}
          <div className="card">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">{t('map.legend')}</p>
            <div className="space-y-2">
              {(['wildfire','illegal_logging','water_leak','pollution'] as const).map(c => (
                <div key={c} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base shrink-0">{CATEGORY_ICONS[c]}</span>
                    <span className="text-xs text-slate-600 dark:text-slate-300 truncate">{CATEGORY_LABELS[c]}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-400 shrink-0">{catCounts[c]||0}</span>
                </div>
              ))}
              <div className="border-t border-slate-100 dark:border-slate-700 pt-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500 shrink-0" style={{ boxShadow: '0 0 6px rgba(249,115,22,0.6)' }} />
                    <span className="text-xs text-slate-600 dark:text-slate-300">{t('map.nasaHotspot')}</span>
                  </div>
                  <span className="text-xs font-bold text-red-500 shrink-0">{hotspots.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Layers toggle */}
          <div className="card">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">{t('map.layers')}</p>
            <label className="flex items-center justify-between cursor-pointer gap-2">
              <span className="text-xs text-slate-600 dark:text-slate-300">{t('map.fireHotspots')}</span>
              <div className={`relative w-9 h-5 rounded-full transition-colors ${showHotspots ? 'bg-primary-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                onClick={() => setShowHotspots(p => !p)}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${showHotspots ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
            </label>
          </div>

          {/* Stats */}
          <div className="card">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">{t('map.stats')}</p>
            <div className="space-y-2">
              {[
                { l: t('map.totalIncidents'), v: total, c: 'text-slate-700 dark:text-slate-200' },
                { l: t('map.showing'),        v: reports.length, c: 'text-slate-700 dark:text-slate-200' },
                { l: t('map.fireHotspots'),   v: hotspots.length, c: 'text-red-500' },
              ].map(s => (
                <div key={s.l} className="flex justify-between text-xs">
                  <span className="text-slate-400 truncate">{s.l}</span>
                  <span className={`font-bold ${s.c} shrink-0 ml-1`}>{s.v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent list */}
          <div className="card flex-1 overflow-hidden">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">{t('map.recent')}</p>
            <div className="space-y-2 overflow-y-auto" style={{ maxHeight: '200px' }}>
              {reports.slice(0,10).map(r => (
                <div key={r._id} className="flex items-start gap-2">
                  <span className="text-sm shrink-0 mt-0.5">{CATEGORY_ICONS[r.category]}</span>
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-700 dark:text-slate-200 font-medium truncate leading-snug">{r.title}</p>
                    <p className="text-[10px] text-slate-400">{new Date(r.createdAt).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
