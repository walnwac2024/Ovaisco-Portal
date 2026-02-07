import React from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = () => {
    const { darkMode, toggleDarkMode } = useTheme();

    return (
        <button
            onClick={toggleDarkMode}
            className={`fixed right-6 bottom-24 z-[9999] flex items-center gap-3 px-4 py-2 rounded-full shadow-2xl transition-all duration-500 hover:scale-105 active:scale-95 group backdrop-blur-md border 
        ${darkMode
                    ? 'bg-slate-900/90 text-yellow-400 border-slate-700/50'
                    : 'bg-white/90 text-slate-700 border-slate-200'
                }`}
            aria-label="Toggle Night Mode"
        >
            <div className="relative w-10 h-6 flex items-center bg-slate-200 dark:bg-slate-700 rounded-full p-1 transition-colors duration-300">
                <div
                    className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-500 flex items-center justify-center
            ${darkMode ? 'translate-x-4' : 'translate-x-0'}`}
                >
                    {darkMode ? <FaMoon size={10} className="text-slate-900" /> : <FaSun size={10} className="text-yellow-500" />}
                </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none">
                {darkMode ? 'Night' : 'Light'} Mode
            </span>
        </button>
    );
};

export default ThemeToggle;
