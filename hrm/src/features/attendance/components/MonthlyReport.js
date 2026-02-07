import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { getMonthlyAttendanceReport } from '../services/attendanceService';
import { WORKSHEET_YEARS, WORKSHEET_MONTHS } from '../constants';
import SharedDropdown from '../../../components/common/SharedDropdown';
import StatusBadge from './StatusBadge';
import EmployeeAutocomplete from '../../reports/components/EmployeeAutocomplete';
import { FaFileDownload, FaPrint } from 'react-icons/fa';

export default function MonthlyReport({ employeeId, initialYear, initialMonth, onBack }) {
    const { user } = useAuth();
    // removed isAdmin logic since this is now controlled by ReportsPage

    const currentYear = new Date().getFullYear().toString();
    const currentMonthIdx = new Date().getMonth() + 1;
    const currentMonth = WORKSHEET_MONTHS[currentMonthIdx];

    const [filters, setFilters] = useState({
        employee_id: employeeId || user?.id || '',
        year: initialYear || currentYear,
        month: initialMonth || (currentMonth === '--ALL--' ? 'January' : currentMonth)
    });

    const [report, setReport] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const monthsMap = {
        'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
        'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
    };

    const fetchReport = async () => {
        if (!filters.employee_id) return;
        setLoading(true);
        setError('');
        try {
            const monthNum = monthsMap[filters.month];
            const data = await getMonthlyAttendanceReport({
                employee_id: filters.employee_id,
                year: filters.year,
                month: monthNum
            });
            setReport(data.report || []);
        } catch (err) {
            console.error('Failed to fetch report', err);
            setError('Failed to load report data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.year, filters.month, filters.employee_id]);

    const handlePrint = () => {
        window.print();
    };

    const handleExport = () => {
        if (!report || report.length === 0) return;

        const headers = ["Date", "Shift", "First In", "Last Out", "Worked Minutes", "Late Minutes", "Status"];
        const csvRows = [headers.join(",")];

        report.forEach(row => {
            const values = [
                new Date(row.attendance_date).toLocaleDateString('en-GB'),
                row.shift_name || "",
                row.first_in ? new Date(row.first_in).toLocaleTimeString() : "",
                row.last_out ? new Date(row.last_out).toLocaleTimeString() : "",
                row.worked_minutes || "0",
                row.late_minutes || "0",
                row.status
            ];
            csvRows.push(values.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
        });

        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Attendance_Report_${filters.year}_${filters.month}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            {/* Removed overflow-hidden to allow dropdown to show */}
            <div className="card">
                <div className="card-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="p-2 -ml-2 text-slate-400 hover:text-customRed hover:bg-red-50 rounded-xl transition-all"
                                title="Back to list"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                            </button>
                        )}
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                Attendance Report
                                {onBack && <span className="px-2 py-0.5 rounded text-[10px] bg-blue-50 text-blue-600 font-bold uppercase tracking-wider">Employee View</span>}
                            </h3>
                            <p className="text-[11px] font-medium text-slate-500">
                                Detailed monthly attendance and leave record
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {(user?.features || []).includes('reports_print') && (
                            <button
                                onClick={handlePrint}
                                className="btn-outline !h-10 px-4 sm:px-5 flex-1 sm:flex-none"
                            >
                                <FaPrint className="opacity-70 text-sm mr-2" /> <span className="hidden xs:inline">Print</span>
                            </button>
                        )}
                        {(user?.features || []).includes('reports_export') && (
                            <button
                                onClick={handleExport}
                                className="btn-primary !h-10 px-4 sm:px-5 flex-1 sm:flex-none shadow-lg shadow-red-500/15"
                            >
                                <FaFileDownload className="opacity-70 text-sm mr-2" /> <span className="hidden xs:inline">Export</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 items-end gap-6">
                        <div className="lg:col-span-6">
                            {!onBack ? (
                                <div>
                                    <label className="form-label">Employee Profile</label>
                                    <input className="input bg-slate-50 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200" value={user?.name || ''} readOnly />
                                </div>
                            ) : (
                                <div>
                                    <label className="form-label">Viewing Employee ID</label>
                                    <input className="input bg-slate-50 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200" value={filters.employee_id} readOnly />
                                </div>
                            )}
                        </div>

                        <SharedDropdown
                            className="lg:col-span-3"
                            label="Reporting Year"
                            value={filters.year}
                            onChange={(val) => setFilters(prev => ({ ...prev, year: val }))}
                            options={WORKSHEET_YEARS.filter(y => y !== '--ALL--')}
                        />

                        <SharedDropdown
                            className="lg:col-span-3"
                            label="Reporting Month"
                            value={filters.month}
                            onChange={(val) => setFilters(prev => ({ ...prev, month: val }))}
                            options={WORKSHEET_MONTHS.filter(m => m !== '--ALL--')}
                        />
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="table-scroll">
                    <table className="min-w-[1000px] w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/80">
                            <tr>
                                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-tight">Reporting<br /><span className="text-[9px] opacity-70">Date</span></th>
                                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-tight">Assigned<br /><span className="text-[9px] opacity-70">Shift</span></th>
                                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-tight">Access<br /><span className="text-[9px] opacity-70">Check In</span></th>
                                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-tight">Access<br /><span className="text-[9px] opacity-70">Check Out</span></th>
                                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-tight">Work<br /><span className="text-[9px] opacity-70">Duration</span></th>
                                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-tight">Late<br /><span className="text-[9px] opacity-70">Arrivals</span></th>
                                <th className="px-6 py-4 text-center text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-tight">Attendance<br /><span className="text-[9px] opacity-70">Status</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-transparent divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="h-8 w-8 border-4 border-customRed border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-sm text-slate-500 font-medium">Generating report...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-rose-500 font-medium">{error}</td>
                                </tr>
                            ) : report.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400 italic text-sm">
                                        No records found for the selected period.
                                    </td>
                                </tr>
                            ) : (
                                report.map((row) => (
                                    <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-semibold">
                                            {new Date(row.attendance_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md">
                                                {row.shift_name || 'NO SHIFT'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {row.first_in ? new Date(row.first_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {row.last_out ? new Date(row.last_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {row.worked_minutes ? (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-bold text-slate-700">{Math.floor(row.worked_minutes / 60)}h</span>
                                                    <span className="text-slate-400">{row.worked_minutes % 60}m</span>
                                                </div>
                                            ) : '—'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {row.late_minutes ? (
                                                <span className="text-rose-600 font-bold text-sm bg-rose-50 px-2 py-0.5 rounded">
                                                    {row.late_minutes}m
                                                </span>
                                            ) : (
                                                <span className="text-emerald-500 text-sm">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <StatusBadge status={row.status} />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
