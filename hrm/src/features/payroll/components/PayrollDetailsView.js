import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../utils/api';
import { ArrowLeft, Download, Printer, Shield } from 'lucide-react';
import downloadPayslip from './PayslipDownloader';

const PayrollDetailsView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDetail();
    }, [id]);

    const fetchDetail = async () => {
        try {
            const res = await api.get(`/payroll/detail/${id}`);
            setData(res.data);
        } catch (err) {
            console.error("Failed to fetch payslip details", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading payslip...</div>;
    if (!data) return <div className="p-8 text-center">Payslip not found.</div>;

    const monthName = new Date(2024, data.month - 1).toLocaleString('default', { month: 'long' });

    const allowances = [
        { label: 'Contractual Pay', value: data.contractual_pay },
        { label: 'Transport Allowance', value: data.transport_allowance },
        { label: 'Attendance Bonus', value: data.attendance_bonus },
        { label: 'Mobile Allowance', value: data.mobile_allowance },
        { label: 'Tardiness Allowance', value: data.tardiness_allowance },
        { label: 'Night Allowance', value: data.night_allowance },
        { label: 'House Allowance', value: data.house_allowance },
        { label: 'Fuel Allowance', value: data.fuel_allowance },
        { label: 'Ad-Hoc Allowance', value: data.adhoc_allowance },
        { label: 'Relocation Allowance', value: data.relocation_allowance },
        { label: 'Misc. Allowance', value: data.misc_allowance },
    ].filter(item => Number(item.value) > 0);

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-2"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to List
                    </button>
                    <h1 className="text-2xl font-bold text-slate-900 font-display">Salary Statement</h1>
                    <p className="text-slate-500 text-sm">Statement for {monthName} {data.year}</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => downloadPayslip(data)}
                        className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600 font-bold text-xs uppercase tracking-wider"
                    >
                        <Printer className="w-4 h-4" />
                        Print
                    </button>
                    <button
                        onClick={() => downloadPayslip(data, 'download')}
                        className="flex items-center gap-2 px-6 py-2 bg-gradient-to-br from-customRed to-red-600 text-white rounded-xl hover:brightness-110 transition-all font-black text-xs uppercase tracking-widest shadow-lg shadow-customRed/20"
                    >
                        <Download className="w-4 h-4" />
                        Download PDF
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Employee Info & Breakdown */}
                <div className="lg:col-span-8 space-y-6">

                    {/* Employee Profile Bar */}
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left gap-6 shadow-sm">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-customRed font-black text-2xl border border-slate-100 shadow-inner shrink-0">
                            {data.name?.charAt(0)}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-black text-slate-900">{data.name}</h2>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wide opacity-80">{data.designation} • {data.department}</p>
                        </div>
                        <div className="sm:ml-auto sm:text-right">
                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] mb-1">Employee ID</p>
                            <p className="font-black text-slate-900 text-lg">{data.reference_number?.split('-')[1] || 'N/A'}</p>
                        </div>
                    </div>

                    {/* Salary Breakdown (Gains) */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-6 md:px-8 py-6 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Earnings Breakdown</h3>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Monthly Components</span>
                        </div>
                        <div className="p-6 md:p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
                                {allowances.length > 0 ? allowances.map((item, idx) => (
                                    <div key={idx} className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 sm:gap-4 group">
                                        <span className="text-slate-500 font-bold group-hover:text-slate-900 transition-colors text-sm">{item.label}</span>
                                        <span className="text-slate-900 font-black transition-all transform group-hover:text-customRed sm:text-right">Rs. {Number(item.value).toLocaleString()}</span>
                                    </div>
                                )) : (
                                    <div className="col-span-2 text-center py-6 text-slate-400 italic bg-slate-50 rounded-2xl font-bold">
                                        Basic salary structure only.
                                    </div>
                                )}
                            </div>
                            <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                <span className="text-slate-400 font-black uppercase text-[11px] tracking-[0.2em]">Total Gross Earnings</span>
                                <span className="text-3xl font-black text-slate-900">Rs. {Number(data.gross_salary).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Deductions Analytics */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-6 md:px-8 py-6 bg-customRed/5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <h3 className="font-black text-customRed uppercase tracking-widest text-xs">Deductions & Attendance</h3>
                            <span className="text-[10px] font-black text-customRed/50 uppercase tracking-[0.2em]">Absents / Lates</span>
                        </div>
                        <div className="p-6 md:p-10 space-y-8">
                            {/* Absent Info */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 bg-slate-50/50 rounded-3xl border border-slate-100 transition-all hover:border-customRed/20 hover:bg-white group">
                                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-customRed group-hover:bg-gradient-to-br group-hover:from-customRed group-hover:to-red-600 group-hover:text-white transition-all duration-300 border border-slate-100 shrink-0">
                                    <span className="font-black text-xl">{data.attendance_leave_days}</span>
                                </div>
                                <div className="flex-1 w-full shrink">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 sm:mb-1.5 gap-1">
                                        <h4 className="font-black text-slate-900 text-lg">Absent Days</h4>
                                        <span className="text-customRed font-black text-lg">- Rs. {Number(data.leave_deduction).toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                                        You had <span className="text-slate-900 font-bold">{data.attendance_leave_days}</span> absent days.
                                        Following <span className="text-emerald-600 font-black">2 free paid leaves</span>, deductions applied for {Math.max(0, data.attendance_leave_days - 2)} days.
                                    </p>
                                </div>
                            </div>

                            {/* Late Info */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 bg-slate-50/50 rounded-3xl border border-slate-100 transition-all hover:border-amber-200 hover:bg-white group">
                                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300 border border-slate-100 shrink-0">
                                    <span className="font-black text-xl">{data.attendance_late_days}</span>
                                </div>
                                <div className="flex-1 w-full shrink">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 sm:mb-1.5 gap-1">
                                        <h4 className="font-black text-slate-900 text-lg">Late Days</h4>
                                        <span className="text-customRed font-black text-lg">- Rs. {Number(data.late_deduction).toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                                        You arrived late <span className="text-slate-900 font-bold">{data.attendance_late_days}</span> times.
                                        Rule: <span className="text-emerald-600 font-black">First 4 lates are free</span>; every late after the 4th results in a 1-day salary cut.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 md:px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <span className="text-slate-400 font-black uppercase text-[11px] tracking-[0.2em]">Total Deductions</span>
                            <span className="text-2xl font-black text-customRed">Rs. {Number(data.total_deductions).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Summary Sidebar */}
                <div className="lg:col-span-4">
                    <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 sticky top-6 shadow-2xl overflow-hidden border border-slate-800">
                        {/* Premium Glow effect */}
                        <div className="absolute top-0 right-0 w-48 h-48 bg-customRed/10 rounded-full blur-[100px]"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[80px]"></div>

                        <div className="relative z-10 space-y-10">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Final Payout</h3>
                                    <div className="h-1 w-12 bg-customRed rounded-full mb-6"></div>
                                </div>
                                <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                                    <Shield className="w-5 h-5 text-customRed" />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-slate-400 text-sm font-bold tracking-tight">
                                        <span>Total Earnings</span>
                                        <span className="text-white font-black">Rs. {Number(data.gross_salary).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-400 text-sm font-bold tracking-tight">
                                        <span>Total Deductions</span>
                                        <span className="text-customRed font-black">- Rs. {Number(data.total_deductions).toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-white/5">
                                    <p className="text-slate-500 text-[10px] uppercase font-black tracking-[0.2em] mb-3">Net Payable Salary</p>
                                    <div className="flex items-baseline gap-3">
                                        <p className="text-6xl font-black text-white leading-none tracking-tighter">
                                            {Number(data.net_salary).toLocaleString()}
                                        </p>
                                        <span className="text-customRed font-black text-base italic tracking-tighter">PKR</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-10 space-y-6">
                                <div className="p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md">
                                    <p className="text-[10px] text-slate-400 leading-relaxed font-bold uppercase tracking-wide opacity-60 text-center">
                                        This is a computer-generated document and does not require a physical signature.
                                        Generated by <span className="text-slate-200">WorkSphere</span> on {new Date(data.created_at).toLocaleDateString()}.
                                    </p>
                                </div>

                                <button
                                    onClick={() => downloadPayslip(data, 'download')}
                                    className="w-full py-5 bg-gradient-to-br from-customRed to-red-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] hover:brightness-110 transition-all transform active:scale-[0.98] shadow-2xl shadow-customRed/20 border-t border-white/20"
                                >
                                    Download Copy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PayrollDetailsView;
