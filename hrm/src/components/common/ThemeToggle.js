import React from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = ({ className = "" }) => {
    const { darkMode, toggleDarkMode } = useTheme();

    return (
        <button
            onClick={toggleDarkMode}
            className={`flex items-center justify-center p-2 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 group 
                ${darkMode
                    ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700'
                    : 'bg-slate-50 text-slate-500 hover:text-customRed hover:bg-red-50'
                } ${className}`}
            aria-label="Toggle Night Mode"
            title={darkMode ? "Switch to Light Mode" : "Switch to Night Mode"}
        >
            <div className={`relative w-10 h-5 flex items-center rounded-full p-1 transition-all duration-300 shadow-inner
                ${darkMode ? 'bg-slate-900 border border-slate-700' : 'bg-slate-200'}`}
            >
                <div
                    className={`w-3.5 h-3.5 rounded-full shadow-lg transform transition-all duration-500 flex items-center justify-center
                        ${darkMode
                            ? 'translate-x-4.5 bg-yellow-400'
                            : 'translate-x-0 bg-white'}`}
                >
                    {darkMode
                        ? <FaMoon size={8} className="text-slate-900" />
                        : <FaSun size={8} className="text-amber-500" />}
                </div>
            </div>
        </button>
    );
};

export default ThemeToggle;
