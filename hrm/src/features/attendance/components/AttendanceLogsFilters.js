import React, { useState } from 'react';
import { FileDown, RefreshCw } from 'lucide-react';

export default function AttendanceLogsFilters({
    date,
    onDateChange,
    onDownloadExcel,
    autoRefresh,
    onAutoRefreshChange,
    summary
}) {
    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Attendance Logs
                    </h3>

                    <div className="flex items-center gap-2">
                        {/* Summary Stats */}
                        <div className="hidden sm:flex items-center gap-4 text-xs font-medium mr-4">
                            <div className="flex items-center gap-1.5">
                                <span className="text-slate-500">Total:</span>
                                <span className="font-bold text-slate-700">{summary.total}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-slate-500">Present:</span>
                                <span className="font-bold text-emerald-600">{summary.present}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-slate-500">Late:</span>
                                <span className="font-bold text-orange-600">{summary.late}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-slate-500">Not Marked:</span>
                                <span className="font-bold text-red-600">{summary.notMarked}</span>
                            </div>
                        </div>

                        {/* Date Picker */}
                        <input
                            type="date"
                            value={date}
                            max={today}
                            onChange={(e) => onDateChange(e.target.value)}
                            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-customRed/20 focus:border-customRed"
                        />

                        {/* Auto-refresh Toggle */}
                        <button
                            onClick={() => onAutoRefreshChange(!autoRefresh)}
                            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${autoRefresh
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}
                            title={autoRefresh ? 'Auto-refresh ON (30s)' : 'Auto-refresh OFF'}
                        >
                            <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Auto</span>
                        </button>

                        {/* Download Excel */}
                        <button
                            onClick={onDownloadExcel}
                            className="flex items-center gap-2 px-4 py-2 bg-customRed text-white text-sm font-medium rounded-lg hover:bg-customRed/90 transition-colors"
                        >
                            <FileDown className="h-4 w-4" />
                            <span className="hidden sm:inline">Download</span>
                        </button>
                    </div>
                </div>

                {/* Mobile Summary */}
                <div className="sm:hidden mt-3 flex items-center gap-3 text-xs font-medium">
                    <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">Total:</span>
                        <span className="font-bold text-slate-700">{summary.total}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">Present:</span>
                        <span className="font-bold text-emerald-600">{summary.present}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">Late:</span>
                        <span className="font-bold text-orange-600">{summary.late}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">Not Marked:</span>
                        <span className="font-bold text-red-600">{summary.notMarked}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
