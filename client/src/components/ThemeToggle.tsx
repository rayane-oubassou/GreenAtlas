import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun } from 'lucide-react';

const ThemeToggle: React.FC = () => {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="w-8 h-8 rounded-xl flex items-center justify-center
                 text-slate-500 dark:text-slate-400
                 hover:text-slate-700 dark:hover:text-slate-200
                 hover:bg-slate-100 dark:hover:bg-slate-800
                 transition-all duration-200"
    >
      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
};

export default ThemeToggle;
