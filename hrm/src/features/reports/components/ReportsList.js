import React, { useState } from 'react';
import useEmployees from '../../employees/hooks/useEmployees';
import SharedDropdown from '../../../components/common/SharedDropdown';
import { WORKSHEET_YEARS, WORKSHEET_MONTHS } from '../../attendance/constants';
import { FaEye, FaFileDownload, FaPrint } from 'react-icons/fa';
import api from '../../../utils/api';

const monthsMap = {
    'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
    'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
};

export default function ReportsList({ onView }) {
    // We can reuse useEmployees for the list, or just fetch lightweight list
    const {
        list,
        // filters,
        // setFilter,
        loading,
        // page, setPage, totalPages
    } = useEmployees();

    // Local state for Month/Year selection which applies to the ACTIONS (Export/Print)
    // defaulting to current
    const currentYear = new Date().getFullYear().toString();
    const currentMonthIdx = new Date().getMonth() + 1;
    const currentMonth = WORKSHEET_MONTHS[currentMonthIdx];

    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);

    // Filter list locally for now or add search? 
    // useEmployees already handles some state but it's bound to its own local state. 
    // Let's just use the `list` from it. Ideally we should pass search to it.
    // For simplicity, let's implement a simple client-side search here if useEmployees doesn't expose it easily 
    // (Actually useEmployees exposes `setFilter`, so let's use that if we want server search, or just filter `list` if it loads all)
    // Checked useEmployees: it loads based on `appliedFilters`. 
    // Let's rely on the fact that `useEmployees` loads data on mount. 
    // We might need to add a search input.

    const [search, setSearch] = useState("");

    const filteredList = list.filter(emp =>
        emp.employee_name.toLowerCase().includes(search.toLowerCase()) ||
        emp.employee_code.toLowerCase().includes(search.toLowerCase())
    );

    const handleExport = async (empId, empName) => {
        // We need to implement the export logic here similar to MonthlyReport.js
        // Or reuse a service. 
        // For now, let's replicate the CSV download logic since it's client-side in MonthlyReport.js? 
        // NO, MonthlyReport.js fetches specific report data then downloads it.
        // We need to fetch report data for that user, THEN download.

        try {
            const m = monthsMap[selectedMonth];
            const res = await api.get(`/attendance/report/monthly`, {
                params: {
                    employee_id: empId,
                    year: selectedYear,
                    month: m
                }
            });
            const report = res.data.report || [];

            // CSV Generation
            const headers = ["Date", "Shift", "Check In", "Check Out", "Work Duration", "Late Arrivals", "Status"];
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
            a.download = `${empName}_Report_${selectedYear}_${selectedMonth}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);

        } catch (err) {
            console.error(err);
            alert("Failed to export report");
        }
    };

    const handlePrint = (empId) => {
        // To print, we usually need to render the view. 
        // A simple "Quick Print" might be hard without rendering. 
        // The user can just click "View" then "Print". 
        // For "Print" button here, maybe we just open the view safely?
        // Let's just forward to View for now, or just show Alert "Please view to print".
        // Actually, let's make "Print" just open the view (same as View) but maybe passes a "autoPrint" flag?
        onView(empId, selectedYear, selectedMonth);
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 items-end gap-6 mb-8">
                    <div className="lg:col-span-5">
                        <label className="form-label">Search Employee Database</label>
                        <div className="relative">
                            <input
                                type="text"
                                className="input pl-10"
                                placeholder="Search by name or code..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <SharedDropdown
                        className="lg:col-span-2"
                        label="Report Year"
                        value={selectedYear}
                        onChange={setSelectedYear}
                        options={WORKSHEET_YEARS.filter(y => y !== '--ALL--')}
                    />
                    <SharedDropdown
                        className="lg:col-span-2"
                        label="Report Month"
                        value={selectedMonth}
                        onChange={setSelectedMonth}
                        options={WORKSHEET_MONTHS.filter(m => m !== '--ALL--')}
                    />
                    <div className="lg:col-span-3 sm:flex sm:items-end sm:justify-end">
                        <button
                            onClick={async () => {
                                if (!window.confirm(`Download full report for ${selectedMonth} ${selectedYear}?`)) return;
                                try {
                                    const m = monthsMap[selectedMonth];
                                    const res = await api.get("/attendance/report/monthly/all", {
                                        params: { year: selectedYear, month: m },
                                        responseType: 'blob'
                                    });
                                    const url = window.URL.createObjectURL(new Blob([res.data]));
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.setAttribute('download', `Monthly_Report_ALL_${selectedYear}_${selectedMonth}.xlsx`);
                                    document.body.appendChild(link);
                                    link.click();
                                    link.parentNode.removeChild(link);
                                } catch (e) {
                                    console.error(e);
                                    alert("Failed to download bulk report.");
                                }
                            }}
                            className="btn-primary w-full sm:w-auto h-11 flex items-center justify-center gap-2 shadow-md shadow-red-500/20 text-[11px] font-black uppercase tracking-widest whitespace-nowrap px-6"
                        >
                            <FaFileDownload className="text-sm" /> Export All Data
                        </button>
                    </div>
                </div>

                <div className="table-scroll border rounded-xl overflow-hidden shadow-sm">
                    <table className="min-w-[800px] w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-tight text-center w-24">Profile</th>
                                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-tight">Employee<br /><span className="text-[9px] opacity-70 text-slate-400">Details</span></th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-tight text-center">Organization<br /><span className="text-[9px] opacity-70 text-slate-400">Department</span></th>
                                <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-tight pr-10">Report<br /><span className="text-[9px] opacity-70 text-slate-400">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-slate-400 font-medium">
                                        Loading employee database...
                                    </td>
                                </tr>
                            ) : filteredList.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-slate-400 italic font-medium">
                                        No employees matching your search criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredList.map(emp => (
                                    <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 font-black text-xs border border-slate-200 shadow-sm mx-auto">
                                                {emp.employee_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-bold text-slate-800 leading-none mb-1.5">{emp.employee_name}</div>
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{emp.employee_code}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg uppercase tracking-wider border border-slate-200/50">
                                                {emp.department || 'General'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex flex-wrap items-center justify-end gap-2 px-2">
                                                <button
                                                    onClick={() => onView(emp.id, selectedYear, selectedMonth)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-blue-100 uppercase tracking-widest active:scale-95"
                                                    title="View Detailed Report"
                                                >
                                                    <FaEye className="text-[10px]" /> View
                                                </button>
                                                <button
                                                    onClick={() => handleExport(emp.id, emp.employee_name)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all border border-emerald-100 uppercase tracking-widest active:scale-95"
                                                    title="Export CSV Data"
                                                >
                                                    <FaFileDownload className="text-[10px]" /> Export
                                                </button>
                                            </div>
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
