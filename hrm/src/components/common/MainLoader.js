import React from 'react';

const MainLoader = ({ message = "Loading..." }) => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50/30 backdrop-blur-sm">
    <div className="text-center">
      <div className="relative mb-4">
        <div className="h-12 w-12 border-4 border-slate-100 border-t-customRed rounded-full animate-spin mx-auto"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-2 w-2 bg-customRed rounded-full animate-pulse"></div>
        </div>
      </div>
      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">
        {message}
      </p>
    </div>
  </div>
);

export default MainLoader;
