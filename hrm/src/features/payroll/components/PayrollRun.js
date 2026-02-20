import React, { useState, useEffect, useMemo } from 'react';
import api from '../../../utils/api';
import { toast } from 'react-toastify';
import { Play, CheckCircle2 as CheckCircle, FileText, Edit2, Save, X, Search, Trash2, Download as FileDown } from 'lucide-react';
import downloadPayslip from './PayslipDownloader';

const PayrollRun = () => {
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Edit Modal State
    const [editingRecord, setEditingRecord] = useState(null);
    const [editForm, setEditForm] = useState({
        attendance_late_days: 0,
        attendance_leave_days: 0,
        total_deductions: 0,
        net_salary: 0
    });

    const months = [
        { v: 1, n: 'January' }, { v: 2, n: 'February' }, { v: 3, n: 'March' },
        { v: 4, n: 'April' }, { v: 5, n: 'May' }, { v: 6, n: 'June' },
        { v: 7, n: 'July' }, { v: 8, n: 'August' }, { v: 9, n: 'September' },
        { v: 10, n: 'October' }, { v: 11, n: 'November' }, { v: 12, n: 'December' }
    ];

    useEffect(() => {
        fetchHistory();
    }, [month, year]);

    const filteredHistory = useMemo(() => {
        if (!searchTerm) return history;
        return history.filter(row =>
            row.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            row.code?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [history, searchTerm]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/payroll/admin/list?month=${month}&year=${year}`);
            setHistory(res.data);
        } catch (err) {
            console.error("Failed to fetch history");
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        try {
            setSaving(true);
            const res = await api.post('/payroll/generate', { month, year });
            toast.success(res.data.message);
            fetchHistory();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to generate payroll");
        } finally {
            setSaving(false);
        }
    };

    const handleFinalize = async () => {
        if (!window.confirm("Are you sure you want to finalize internal payroll? Once finalized, employees will be able to see their payslips.")) return;
        try {
            setSaving(true);
            const res = await api.post('/payroll/finalize', { month, year });
            toast.success(res.data.message);
            fetchHistory();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to finalize");
        } finally {
            setSaving(false);
        }
    };

    const handleEditClick = (row) => {
        setEditingRecord(row);
        setEditForm({
            attendance_late_days: row.attendance_late_days,
            attendance_leave_days: row.attendance_leave_days,
            total_deductions: row.total_deductions,
            net_salary: row.net_salary
        });
    };

    // Auto-calculate deductions when days change
    const updateDays = (type, val) => {
        const newForm = { ...editForm, [type]: val };
        const salary = Number(editingRecord.gross_salary || 0);
        const dailyRate = salary / 30;

        // New Late Rule: Every late after 4th cuts 1 day
        const deductibleLates = Math.max(0, newForm.attendance_late_days - 4);
        const lateDed = deductibleLates * dailyRate;

        const deductibleLeaves = Math.max(0, newForm.attendance_leave_days - 2);
        const leaveDed = deductibleLeaves * dailyRate;

        newForm.total_deductions = Math.round(lateDed + leaveDed);
        newForm.net_salary = Math.max(0, salary - newForm.total_deductions);

        setEditForm(newForm);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const res = await api.put(`/payroll/update/${editingRecord.id}`, editForm);
            toast.success(res.data.message);
            setEditingRecord(null);
            fetchHistory();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update record");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete the draft payroll record for ${name}? This cannot be undone.`)) return;
        try {
            await api.delete(`/payroll/record/${id}`);
            toast.success(`Draft for ${name} deleted.`);
            fetchHistory();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete record.');
        }
    };

    const handleDownloadPayslip = async (rowId) => {
        try {
            const res = await api.get(`/payroll/detail/${rowId}`);
            downloadPayslip(res.data);
        } catch (err) {
            toast.error('Failed to load payslip details.');
        }
    };

    const hasDrafts = history.some(h => h.status === 'DRAFT');
    const isReady = history.length > 0;

    return (
        <div className="space-y-6">
            {/* Control Panel */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Month</label>
                        <select
                            value={month}
                            onChange={(e) => setMonth(Number(e.target.value))}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-4 focus:ring-customRed/5 focus:border-customRed font-bold text-slate-700 appearance-none bg-slate-50"
                        >
                            {months.map(m => <option key={m.v} value={m.v}>{m.n}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Year</label>
                        <select
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-4 focus:ring-customRed/5 focus:border-customRed font-bold text-slate-700 appearance-none bg-slate-50"
                        >
                            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <button
                        onClick={handleGenerate}
                        disabled={saving}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gradient-to-br from-slate-800 to-slate-950 text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:brightness-110 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 border-t border-white/10"
                    >
                        {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Play className="w-3.5 h-3.5 fill-current" />}
                        Generate Draft
                    </button>
                    {hasDrafts && (
                        <button
                            onClick={handleFinalize}
                            disabled={saving}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gradient-to-br from-customRed to-red-700 text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:brightness-110 transition-all shadow-xl shadow-customRed/20 disabled:opacity-50 border-t border-white/20"
                        >
                            <CheckCircle className="w-4 h-4" />
                            Finalize Payroll
                        </button>
                    )}
                </div>
            </div>

            {/* Records Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/30">
                    <div>
                        <h3 className="font-black text-slate-900 leading-tight">Payroll Records</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                            Review generated records for {months.find(m => m.v === month).n} {year}
                        </p>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search Employee..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-black uppercase tracking-wider outline-none focus:border-customRed focus:ring-4 focus:ring-customRed/5 transition-all shadow-sm placeholder:text-slate-300"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <div className="hidden sm:inline-flex px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 shadow-sm uppercase tracking-tighter">
                            {filteredHistory.length} {filteredHistory.length === history.length ? 'Records' : 'Matches'}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto text-sm">
                    {loading ? (
                        <div className="p-12 text-center text-slate-400">Loading records...</div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-widest font-bold">
                                <tr>
                                    <th className="px-6 py-4">Employee</th>
                                    <th className="px-6 py-4">Attendance (L/Ab)</th>
                                    <th className="px-6 py-4">Total Deducts</th>
                                    <th className="px-6 py-4 text-customRed">Net Salary</th>
                                    <th className="px-6 py-4 text-center">Actions / Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredHistory.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic">
                                            {searchTerm ? 'No matching employees found.' : 'No records found for this month. Click "Generate Draft" to start.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredHistory.map(row => (
                                        <tr key={row.id} className="hover:bg-slate-50/50 group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900">{row.name}</div>
                                                <div className="text-[10px] text-slate-500 text-xs">{row.code}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <span className="text-amber-600 font-bold">{row.attendance_late_days} L</span>
                                                    <span className="text-red-500 font-bold">{row.attendance_leave_days} Ab</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-500">
                                                Rs. {Number(row.total_deductions).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 font-black text-slate-950 text-base">
                                                Rs. {Number(row.net_salary).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-3">
                                                    {row.status === 'DRAFT' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleEditClick(row)}
                                                                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                                                                title="Edit Draft"
                                                            >
                                                                <Edit2 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(row.id, row.name)}
                                                                className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-customRed rounded-lg transition-colors"
                                                                title="Delete Draft"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </>
                                                    )}
                                                    {row.status === 'FINAL' && (
                                                        <button
                                                            onClick={() => handleDownloadPayslip(row.id)}
                                                            className="p-1.5 hover:bg-customRed/10 text-slate-400 hover:text-customRed rounded-lg transition-colors"
                                                            title="Download Payslip"
                                                        >
                                                            <FileDown className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${row.status === 'FINAL' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        {row.status}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {!isReady && !loading && (
                    <div className="p-12 flex flex-col items-center text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-slate-300" />
                        </div>
                        <div className="max-w-xs">
                            <p className="text-slate-900 font-bold">Ready to Generate?</p>
                            <p className="text-xs text-slate-500 line-clamp-2">
                                The system will automatically fetch attendance for all employees with locked salaries and apply the 4-late rule.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingRecord && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="font-black text-slate-900 leading-tight text-xl tracking-tight">Edit Payroll Draft</h3>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1.5 opacity-60">
                                    {editingRecord.name} • {editingRecord.code}
                                </p>
                            </div>
                            <button
                                onClick={() => setEditingRecord(null)}
                                className="p-2.5 hover:bg-white hover:shadow-sm text-slate-400 hover:text-slate-600 rounded-2xl transition-all border border-transparent hover:border-slate-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="p-8 space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Attendance: Late Days</label>
                                    <input
                                        type="number"
                                        value={editForm.attendance_late_days}
                                        onChange={(e) => updateDays('attendance_late_days', Number(e.target.value))}
                                        className="w-full px-5 py-3.5 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-customRed/5 focus:border-customRed outline-none transition-all font-black text-slate-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Attendance: Absent Days</label>
                                    <input
                                        type="number"
                                        value={editForm.attendance_leave_days}
                                        onChange={(e) => updateDays('attendance_leave_days', Number(e.target.value))}
                                        className="w-full px-5 py-3.5 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-customRed/5 focus:border-customRed outline-none transition-all font-black text-slate-700"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Deductions (PKR)</label>
                                    <input
                                        type="number"
                                        value={editForm.total_deductions}
                                        onChange={(e) => setEditForm({ ...editForm, total_deductions: Number(e.target.value) })}
                                        className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 bg-white focus:ring-4 focus:ring-customRed/5 focus:border-customRed outline-none transition-all font-black text-customRed text-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Net Salary (PKR)</label>
                                    <input
                                        type="number"
                                        value={editForm.net_salary}
                                        onChange={(e) => setEditForm({ ...editForm, net_salary: Number(e.target.value) })}
                                        className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 bg-white focus:ring-4 focus:ring-customRed/5 focus:border-customRed outline-none transition-all font-black text-slate-900 text-lg"
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full flex items-center justify-center gap-3 bg-gradient-to-br from-customRed to-red-700 text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] hover:brightness-110 transition-all transform active:scale-[0.98] shadow-2xl shadow-customRed/20"
                                >
                                    {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save className="w-5 h-5" />}
                                    Update Draft Record
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PayrollRun;
