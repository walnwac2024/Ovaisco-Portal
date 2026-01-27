import React from 'react';
import { FaRocket, FaTools, FaClock } from 'react-icons/fa';

const ComingSoon = ({ title }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center animate-fade-in bg-slate-50/30 rounded-[40px] border border-slate-100/50 backdrop-blur-sm mx-4 my-8">
            <div className="relative mb-10">
                <div className="absolute -inset-10 bg-gradient-to-tr from-customRed/20 to-red-300/20 rounded-full blur-3xl animate-pulse" />
                <div className="relative bg-white p-8 rounded-[40px] border border-slate-200 shadow-2xl flex items-center justify-center">
                    <FaTools className="text-6xl text-customRed animate-bounce" />
                </div>
            </div>

            <div className="space-y-4 mb-8">
                <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter sm:text-5xl">
                    {title} <span className="text-transparent bg-clip-text bg-gradient-to-r from-customRed to-[#f2727d]">Coming Soon</span>
                </h1>
                <p className="text-lg font-bold text-slate-400 uppercase tracking-[0.2em]">Under Development</p>
            </div>

            <p className="text-slate-500 max-w-xl mx-auto mb-12 leading-relaxed font-medium text-lg">
                Our engineers are crafting a world-class {title.toLowerCase()} experience.
                This module is scheduled for release in our next major update.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
                <div className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-100 shadow-sm rounded-2xl">
                    <FaClock className="text-customRed text-xl opacity-80" />
                    <div className="text-left">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status</p>
                        <p className="text-xs font-black text-slate-800 uppercase tracking-wider leading-none">In Production</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-100 shadow-sm rounded-2xl">
                    <FaRocket className="text-customRed text-xl" />
                    <div className="text-left">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">ETA</p>
                        <p className="text-xs font-black text-slate-800 uppercase tracking-wider leading-none">Q1 2026</p>
                    </div>
                </div>
            </div>

            <div className="w-80 h-2.5 bg-slate-200/50 rounded-full overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-customRed via-red-400 to-customRed animate-[shimmer_3s_infinite] w-[75%] rounded-full shadow-[0_0_15px_rgba(221,4,28,0.3)]" />
            </div>
            <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Progress: 75%</p>
        </div>
    );
};

export default ComingSoon;
