// src/features/employees/components/ActionsBar.js
import React from "react";

export default function ActionsBar({
  onApply,
  onClear,
  perPage,
  setPerPage,
  setOpenExport,
  onOpenUpload,
  onAddNew,
  total,
}) {
  return (
    <div className="mt-6 sm:mt-8 mb-8 sm:mb-10 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 bg-white border border-slate-200/60 rounded-3xl lg:rounded-[32px] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-5 lg:gap-6 shadow-xl shadow-slate-200/30 overflow-visible relative">
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 md:gap-6 flex-1 min-w-0">
        {/* Actions Group 1: Filter Controls */}
        <div className="grid grid-cols-2 gap-2.5 sm:flex sm:items-center">
          <button
            type="button"
            onClick={onApply}
            className="btn-primary h-11 px-3 sm:px-5 shadow-customRed/20 w-full sm:w-auto justify-center"
          >
            Apply Filters
          </button>
          <button
            type="button"
            onClick={onClear}
            className="btn-outline h-11 px-3 sm:px-5 w-full sm:w-auto justify-center"
          >
            Reset
          </button>
        </div>

        {/* Vertical Divider */}
        <div className="hidden md:block w-px h-8 bg-slate-200/50" />

        {/* Actions Group 2: Utilities */}
        <div className="grid grid-cols-3 gap-2.5 sm:flex sm:flex-row sm:items-center sm:gap-3 min-w-0">
          {/* Page Display */}
          <div className="flex items-center justify-center sm:justify-start px-2.5 sm:px-4 h-11 bg-white rounded-2xl border border-slate-200 shadow-sm transition-all focus-within:border-customRed/50 focus-within:ring-4 focus-within:ring-customRed/5 min-w-0">
            <span className="mr-2 sm:mr-3 text-slate-400 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.15em] pointer-events-none">Show</span>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="bg-transparent outline-none font-bold text-slate-900 cursor-pointer appearance-none pr-1 sm:pr-3 min-w-0"
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <svg className="w-4 h-4 text-slate-400 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>

          <button
            type="button"
            onClick={() => setOpenExport(true)}
            className="btn-utility h-11 px-2.5 sm:px-4 flex items-center justify-center gap-1.5 sm:gap-2 min-w-0"
            title="Export Data"
          >
            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            <span className="text-[9px] sm:text-[10px] font-extrabold tracking-wide sm:tracking-wider">EXPORT</span>
          </button>

          <button
            type="button"
            onClick={onOpenUpload}
            className="btn-utility h-11 px-2.5 sm:px-4 flex items-center justify-center gap-1.5 sm:gap-2 min-w-0"
            title="Import Excel"
          >
            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
            <span className="text-[9px] sm:text-[10px] font-extrabold tracking-wide sm:tracking-wider">IMPORT</span>
          </button>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="pt-5 lg:pt-0 lg:pl-6 border-t lg:border-t-0 lg:border-l border-slate-100 flex-none flex items-center justify-stretch sm:justify-end">
        <button
          type="button"
          onClick={onAddNew}
          className="btn-primary h-12 px-4 sm:px-6 shadow-2xl shadow-customRed/30 group w-full sm:w-auto justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mr-2 sm:mr-3 transition-transform group-hover:rotate-90"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          <span className="text-[11px] sm:text-xs">Add New Employee</span>
        </button>
      </div>
    </div>
  );
}
