import React, { useState } from 'react';
import { BASE_URL } from '../../../utils/api';
import StatusBadge from './StatusBadge';
import { X, User, Calendar, Clock, Download } from 'lucide-react';

export default function AttendanceLogsTable({ rows, loading }) {
    const [selectedPhoto, setSelectedPhoto] = useState(null);

    if (loading) {
        return (
            <div className="card">
                <div className="p-12 text-center text-slate-400 italic">
                    Loading attendance logs...
                </div>
            </div>
        );
    }

    const getUrl = (path) => {
        if (!path) return null;
        return `${BASE_URL}/${path}`;
    };

    return (
        <div className="card !overflow-visible">
            <div className="table-scroll">
                <table className="min-w-full text-sm table-auto sm:table-fixed">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            <th className="px-4 py-3 w-12 hidden sm:table-cell">S#</th>
                            <th className="px-4 py-3 min-w-[200px]">Employee</th>
                            <th className="px-4 py-3 w-40">Department</th>
                            <th className="px-4 py-3 w-40">Designation</th>
                            <th className="px-4 py-3 w-32">Check In</th>
                            <th className="px-4 py-3 w-32">Check Out</th>
                            <th className="px-4 py-3 w-32 text-center">Status</th>
                            <th className="px-4 py-3 w-24 text-center">Late (min)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-outfit">
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-12 text-center text-slate-400 italic">
                                    No records found.
                                </td>
                            </tr>
                        ) : (
                            rows.map((row, idx) => (
                                <tr
                                    key={row.id}
                                    className={`hover:bg-slate-50/80 transition-colors border-b last:border-0 font-outfit ${row.status === 'NOT_MARKED' ? 'bg-red-50/30' : ''
                                        }`}
                                >
                                    <td className="px-4 py-4 align-top text-xs text-slate-400 hidden sm:table-cell font-mono">
                                        {idx + 1}
                                    </td>
                                    <td className="px-4 py-3 align-top">
                                        <div className="font-bold text-slate-800 leading-tight truncate text-[14px]">
                                            {row.employeeName || '—'}
                                        </div>
                                        <div className="mt-1 text-[11px] text-slate-500 font-medium">
                                            <span className="opacity-60">ID:</span> {row.employeeCode || '—'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 align-top text-slate-600">
                                        <div className="text-[13px] line-clamp-1">{row.department || '—'}</div>
                                    </td>
                                    <td className="px-4 py-4 align-top text-slate-600">
                                        <div className="text-[13px] line-clamp-1">{row.designation || '—'}</div>
                                    </td>
                                    <td className="px-4 py-4 align-top text-slate-600">
                                        <div className="font-medium text-[13px] flex items-center gap-2">
                                            {row.checkIn ? (
                                                <>
                                                    <span className="text-emerald-600">{row.checkIn}</span>
                                                    {row.photoIn && (
                                                        <div className="relative group/photo">
                                                            <img
                                                                src={getUrl(row.photoIn)}
                                                                className="w-7 h-7 rounded border border-slate-200 object-cover cursor-pointer hover:scale-[3] transition-transform origin-left z-[20] hover:shadow-lg active:scale-95"
                                                                alt="In"
                                                                onClick={() => setSelectedPhoto({ url: getUrl(row.photoIn), title: 'Check-In Photo', name: row.employeeName, time: row.checkIn, date: row.date })}
                                                            />
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-slate-400">—</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 align-top text-slate-600">
                                        <div className="font-medium text-[13px] flex items-center gap-2">
                                            {row.checkOut ? (
                                                <>
                                                    <span className="text-blue-600">{row.checkOut}</span>
                                                    {row.photoOut && (
                                                        <div className="relative group/photo">
                                                            <img
                                                                src={getUrl(row.photoOut)}
                                                                className="w-7 h-7 rounded border border-slate-200 object-cover cursor-pointer hover:scale-[3] transition-transform origin-right z-[20] hover:shadow-lg active:scale-95"
                                                                alt="Out"
                                                                onClick={() => setSelectedPhoto({ url: getUrl(row.photoOut), title: 'Check-Out Photo', name: row.employeeName, time: row.checkOut, date: row.date })}
                                                            />
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-slate-400">—</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 align-top">
                                        <div className="flex justify-center">
                                            <StatusBadge status={row.status} />
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 align-top text-center">
                                        <div className={`font-semibold text-[13px] ${row.lateMinutes > 0 ? 'text-red-600' : 'text-slate-400'
                                            }`}>
                                            {row.lateMinutes || 0}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Big View Photo Modal */}
            {selectedPhoto && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-fade-in" onClick={() => setSelectedPhoto(null)}>
                    <div
                        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative animate-scale-up flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="px-6 py-4 flex items-center justify-between border-b dark:border-slate-800">
                            <div>
                                <h3 className="font-black text-xl text-gray-800 dark:text-white uppercase tracking-tighter">
                                    {selectedPhoto.title}
                                </h3>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                                    Attendance Evidence
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedPhoto(null)}
                                className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-customRed rounded-full transition-all hover:rotate-90"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Image Body */}
                        <div className="p-2 flex-1 overflow-hidden">
                            <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3] group">
                                <img
                                    src={selectedPhoto.url}
                                    className="w-full h-full object-contain scale-x-[-1]"
                                    alt="Verification"
                                />

                                {/* Info Overlays */}
                                <div className="absolute bottom-6 left-6 right-6 flex flex-wrap gap-2 pointer-events-none">
                                    <div className="bg-black/60 backdrop-blur text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border border-white/20">
                                        <User size={14} className="text-emerald-400" />
                                        {selectedPhoto.name}
                                    </div>
                                    <div className="bg-black/60 backdrop-blur text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border border-white/20">
                                        <Calendar size={14} className="text-blue-400" />
                                        {new Date(selectedPhoto.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </div>
                                    <div className="bg-black/60 backdrop-blur text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border border-white/20">
                                        <Clock size={14} className="text-amber-400" />
                                        {selectedPhoto.time}
                                    </div>
                                </div>

                                <div className="absolute top-6 left-6">
                                    <div className="bg-emerald-500/90 backdrop-blur text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 animate-pulse">
                                        <div className="w-2 h-2 rounded-full bg-white" />
                                        Verified Live Capture
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="px-6 py-6 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                            <button
                                onClick={() => setSelectedPhoto(null)}
                                className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                            >
                                CLOSE
                            </button>
                            <a
                                href={selectedPhoto.url}
                                download={`attendance-${selectedPhoto.name}-${selectedPhoto.date}.jpg`}
                                className="bg-customRed text-white px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-red-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                            >
                                <Download size={18} />
                                DOWNLOAD PHOTO
                            </a>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scale-up {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 0.2s ease-out forwards;
                }
                .animate-scale-up {
                    animation: scale-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                }
            `}</style>
        </div>
    );
}
