import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const langs = [
  { code: 'en',     label: 'English', short: 'EN' },
  { code: 'ar',     label: 'العربية', short: 'AR' },
  { code: 'darija', label: 'الدارجة', short: 'MA' },
];

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = langs.find(l => l.code === i18n.language) || langs[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl text-xs font-semibold
                   text-slate-500 dark:text-slate-400
                   hover:text-slate-700 dark:hover:text-slate-200
                   hover:bg-slate-100 dark:hover:bg-slate-800
                   transition-all duration-200"
      >
        <Globe className="w-3.5 h-3.5" />
        <span>{current.short}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-36 bg-white dark:bg-slate-900
                        border border-slate-100 dark:border-slate-700
                        rounded-xl shadow-card-md overflow-hidden z-50 animate-fadeIn">
          {langs.map(lang => (
            <button
              key={lang.code}
              onClick={() => { i18n.changeLanguage(lang.code); setOpen(false); }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm transition-colors
                ${lang.code === i18n.language
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
            >
              <span>{lang.label}</span>
              <span className="text-xs text-slate-400">{lang.short}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
