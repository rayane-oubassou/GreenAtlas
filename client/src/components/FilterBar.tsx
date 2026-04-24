import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import AnimatedSelect from './AnimatedSelect';
import { ReportCategory, CATEGORY_LABELS, CATEGORY_ICONS } from '../types';

interface FilterBarProps {
  category: string;
  status: string;
  onCategoryChange: (c: string) => void;
  onStatusChange: (s: string) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ category, status, onCategoryChange, onStatusChange }) => {
  const { t } = useTranslation();

  const categories = [
    { value: '', label: t('common.all'), icon: '🗂️' },
    ...(['wildfire', 'illegal_logging', 'water_leak', 'pollution'] as ReportCategory[]).map(c => ({
      value: c,
      label: CATEGORY_LABELS[c],
      icon: CATEGORY_ICONS[c],
    })),
  ];

  const statuses = [
    { value: '', label: t('common.all') },
    { value: 'pending',  label: t('statuses.pending') },
    { value: 'verified', label: t('statuses.verified') },
    { value: 'resolved', label: t('statuses.resolved') },
  ];

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="flex flex-wrap gap-1.5">
        {categories.map((c, i) => (
          <motion.button
            key={c.value}
            onClick={() => onCategoryChange(c.value)}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              category === c.value
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-primary-300 dark:hover:border-primary-600 hover:text-primary-600 dark:hover:text-primary-400'
            }`}
          >
            <span>{c.icon}</span>
            <span>{c.label}</span>
          </motion.button>
        ))}
      </div>

      <div className="ml-auto">
        <AnimatedSelect
          value={status}
          options={statuses}
          onChange={onStatusChange}
          placeholder={t('common.status')}
          className="w-36"
        />
      </div>
    </div>
  );
};

export default FilterBar;
