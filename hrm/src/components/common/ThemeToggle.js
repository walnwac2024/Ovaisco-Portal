import React from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = () => {
    const { darkMode, toggleDarkMode } = useTheme();

    return (
        <button
            onClick={toggleDarkMode}
            className={`fixed right-6 bottom-24 z-[9999] flex items-center gap-4 px-5 py-3 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-500 hover:scale-105 active:scale-95 group backdrop-blur-xl border-2 
        ${darkMode
                    ? 'bg-slate-900/90 text-yellow-400 border-yellow-400/30'
                    : 'bg-white/95 text-slate-800 border-customRed/20'
                }`}
            aria-label="Toggle Night Mode"
        >
            <div className={`relative w-12 h-6 flex items-center rounded-full p-1 transition-all duration-500 shadow-inner
                ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}
            >
                <div
                    className={`w-4 h-4 rounded-full shadow-lg transform transition-all duration-500 flex items-center justify-center
                        ${darkMode
                            ? 'translate-x-6 bg-yellow-400 rotate-0'
                            : 'translate-x-0 bg-customRed -rotate-[360deg]'}`}
                >
                    {darkMode
                        ? <FaMoon size={10} className="text-slate-900" />
                        : <FaSun size={10} className="text-white" />}
                </div>
            </div>
            <div className="flex flex-col items-start leading-none">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-50">
                    Switch to
                </span>
                <span className="text-[11px] font-black uppercase tracking-[0.1em]">
                    {darkMode ? 'Light' : 'Night'} Mode
                </span>
            </div>
        </button>
    );
};

export default ThemeToggle;
