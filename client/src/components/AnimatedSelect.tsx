import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  icon?: string;
}

interface AnimatedSelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const AnimatedSelect: React.FC<AnimatedSelectProps> = ({
  value,
  options,
  onChange,
  placeholder = 'Select…',
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false);
    if (e.key === 'Enter' || e.key === ' ') setOpen(p => !p);
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        onKeyDown={handleKey}
        className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5
                   bg-white dark:bg-slate-800
                   border border-slate-200 dark:border-slate-600
                   rounded-xl text-sm text-slate-700 dark:text-slate-200
                   hover:border-primary-400 dark:hover:border-primary-500
                   focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400
                   transition-all duration-150 cursor-pointer"
      >
        <span className="flex items-center gap-2 min-w-0">
          {selected?.icon && <span className="text-base shrink-0">{selected.icon}</span>}
          <span className="truncate">{selected ? selected.label : <span className="text-slate-400">{placeholder}</span>}</span>
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2, ease: 'easeInOut' }} className="shrink-0">
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-50 mt-1.5 w-full min-w-[160px]
                       bg-white dark:bg-slate-900
                       border border-slate-100 dark:border-slate-700
                       rounded-xl shadow-card-md overflow-hidden"
          >
            <div className="py-1 max-h-52 overflow-y-auto">
              {options.map((opt, i) => {
                const isSelected = opt.value === value;
                return (
                  <motion.button
                    key={opt.value}
                    type="button"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.12 }}
                    onClick={() => { onChange(opt.value); setOpen(false); }}
                    className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-sm text-left transition-colors
                      ${isSelected
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-semibold'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      {opt.icon && <span className="text-base shrink-0">{opt.icon}</span>}
                      <span className="truncate">{opt.label}</span>
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400 shrink-0" />}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnimatedSelect;
