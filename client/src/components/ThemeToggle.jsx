import React, { useState, useRef, useEffect } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { gsap } from 'gsap';

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Toggle animation
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      gsap.fromTo(dropdownRef.current, 
        { opacity: 0, y: -10, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: "power2.out" }
      );
    }
  }, [isOpen]);

  const icons = {
    light: <Sun className="w-5 h-5" />,
    dark: <Moon className="w-5 h-5" />,
    system: <Monitor className="w-5 h-5" />
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors border border-gray-200 dark:border-slate-700"
        aria-label="Toggle Theme"
      >
        {icons[theme]}
      </button>

      {isOpen && (
        <>
            <div 
                ref={dropdownRef}
                className="absolute right-0 mt-2 w-36 py-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 z-50 overflow-hidden"
            >
            {['light', 'dark', 'system'].map((mode) => (
                <button
                key={mode}
                onClick={() => {
                    setTheme(mode);
                    setIsOpen(false);
                }}
                className={`flex items-center w-full px-4 py-2 text-sm font-medium transition-colors
                    ${theme === mode 
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-slate-700/50' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                    }`}
                >
                <span className="mr-3">{icons[mode]}</span>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
            ))}
            </div>
            {/* Backdrop to close on click outside */}
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
        </>
      )}
    </div>
  );
};

export default ThemeToggle;