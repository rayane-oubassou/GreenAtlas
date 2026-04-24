import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { CATEGORY_ICONS } from '../types';

const NotificationBell: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const typeIcon: Record<string, string> = {
    new_report: '📋',
    status_update: '🔄',
    alert: '⚠️',
    info: 'ℹ️',
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-lg border border-slate-100 z-50 animate-fadeIn overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="font-semibold text-slate-800 text-sm">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-primary-600 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                <p className="text-2xl mb-1">🔔</p>
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors ${
                    !n.read ? 'bg-primary-50' : ''
                  }`}
                  onClick={() => !n.read && markAsRead(n._id)}
                >
                  <span className="text-lg mt-0.5 shrink-0">{typeIcon[n.type] || '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-snug ${!n.read ? 'font-medium text-slate-800' : 'text-slate-600'}`}>
                      {n.message}
                    </p>
                    {n.report && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {CATEGORY_ICONS[n.report.category]} {n.report.title}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(n.createdAt).toLocaleDateString('fr-MA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNotification(n._id); }}
                    className="text-slate-300 hover:text-red-400 shrink-0"
                    aria-label="Delete"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
