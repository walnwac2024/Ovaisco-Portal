import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { toast } from 'react-toastify';
import { Download, Search, Users, Table as TableIcon, Filter, ExternalLink } from 'lucide-react';

const SalaryOverview = () => {
    const [salaryData, setSalaryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('All');

    useEffect(() => {
        fetchSalaryData();
    }, []);

    const fetchSalaryData = async () => {
        try {
            const res = await api.get('/payroll/admin/salary-overview');
            setSalaryData(res.data);
        } catch (err) {
            toast.error("Failed to fetch salary records");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            toast.info("Preparing Excel report...");
            const response = await api.get('/payroll/admin/export-salaries', {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Salary_Breakdown_Report_${new Date().toLocaleDateString()}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("Report downloaded successfully");
        } catch (err) {
            toast.error("Failed to export report");
        }
    };

    const departments = ['All', ...new Set(salaryData.map(d => d.department))];

    const filteredData = salaryData.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept = filterDepartment === 'All' || item.department === filterDepartment;
        return matchesSearch && matchesDept;
    });

    if (loading) return <div className="p-8 text-center text-slate-500">Loading payroll records...</div>;

    return (
        <div className="space-y-6">
            {/* Header / Stats */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                        <TableIcon className="w-6 h-6 text-customRed" />
                        Salary Breakdown Overview
                    </h2>
                    <p className="text-slate-500 text-sm font-medium">Detailed view of base salary and all allowances for active employees.</p>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                >
                    <Download className="w-4 h-4" />
                    Export to Excel
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name or employee code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-customRed/5 focus:border-customRed outline-none transition-all font-medium text-sm"
                    />
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2 text-slate-500 bg-slate-50 px-3 py-3 rounded-xl border border-slate-100">
                        <Filter className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Dept:</span>
                        <select
                            value={filterDepartment}
                            onChange={(e) => setFilterDepartment(e.target.value)}
                            className="bg-transparent outline-none font-bold text-slate-700 text-sm"
                        >
                            {departments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 text-[10px] uppercase tracking-widest font-black text-slate-400 border-b border-slate-100">
                                <th className="px-6 py-4 sticky left-0 bg-slate-50/50 z-10 w-48">Employee Info</th>
                                <th className="px-4 py-4">Contractual</th>
                                <th className="px-4 py-4">Transport</th>
                                <th className="px-4 py-4">Att. Bonus</th>
                                <th className="px-4 py-4">Mobile</th>
                                <th className="px-4 py-4">Tardiness</th>
                                <th className="px-4 py-4">Night</th>
                                <th className="px-4 py-4">House</th>
                                <th className="px-4 py-4">Fuel</th>
                                <th className="px-4 py-4">Ad-Hoc</th>
                                <th className="px-4 py-4">Misc</th>
                                <th className="px-4 py-4">Reloc.</th>
                                <th className="px-6 py-4 text-slate-900 border-l border-slate-100 bg-slate-50/80 sticky right-0 z-10 w-44">Gross Salary</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredData.map(row => (
                                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-4 sticky left-0 bg-white group-hover:bg-slate-50/80 z-10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                                                <Users className="w-4 h-4 text-slate-400" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-slate-900 truncate">{row.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">{row.code}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-[13px] font-semibold text-slate-600">
                                        Rs. {Number(row.contractual_pay || 0).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-4 text-[13px] font-semibold text-slate-600">
                                        Rs. {Number(row.transport_allowance || 0).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-4 text-[13px] font-semibold text-slate-600">
                                        Rs. {Number(row.attendance_bonus || 0).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-4 text-[13px] font-semibold text-slate-600">
                                        Rs. {Number(row.mobile_allowance || 0).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-4 text-[13px] font-semibold text-slate-600">
                                        Rs. {Number(row.tardiness_allowance || 0).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-4 text-[13px] font-semibold text-slate-600">
                                        Rs. {Number(row.night_allowance || 0).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-4 text-[13px] font-semibold text-slate-600">
                                        Rs. {Number(row.house_allowance || 0).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-4 text-[13px] font-semibold text-slate-600">
                                        Rs. {Number(row.fuel_allowance || 0).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-4 text-[13px] font-semibold text-slate-600">
                                        Rs. {Number(row.adhoc_allowance || 0).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-4 text-[13px] font-semibold text-slate-600">
                                        Rs. {Number(row.misc_allowance || 0).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-4 text-[13px] font-semibold text-slate-600">
                                        Rs. {Number(row.relocation_allowance || 0).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 border-l border-slate-100 bg-slate-50/20 sticky right-0 group-hover:bg-slate-50/100 z-10">
                                        <div className="flex items-center justify-between gap-4">
                                            <span className="text-sm font-black text-slate-900">
                                                Rs. {Number(row.total_gross || 0).toLocaleString()}
                                            </span>
                                            {row.salary_locked ? (
                                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 shrink-0">LOCKED</span>
                                            ) : (
                                                <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 shrink-0">PENDING</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!filteredData.length && (
                        <div className="p-12 text-center">
                            <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold">No salary records found matching your criteria.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <TableIcon className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="text-sm font-black text-blue-900 mb-1 leading-tight uppercase tracking-wider">Admin Insight</h4>
                    <p className="text-[13px] text-blue-800 leading-relaxed font-medium">
                        This view combines data from <strong>Employee Records</strong> and <strong>Payroll Base Settings</strong>.
                        Only active employees are shown. Use the export feature for comprehensive offline auditing.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SalaryOverview;
