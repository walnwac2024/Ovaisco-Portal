import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../utils/api';
import { Eye, Download, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MySalaryList = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        try {
            const res = await api.get('/payroll/self/list');
            setRecords(res.data);
        } catch (err) {
            console.error("Failed to fetch salary records", err);
        } finally {
            setLoading(false);
        }
    };

    const getMonthName = (m) => {
        return new Date(2024, m - 1).toLocaleString('default', { month: 'long' });
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading your payslips...</div>;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">My Salary Records</h2>
                    <p className="text-sm text-slate-500">View and download your monthly payslips</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <button className="flex-1 sm:flex-none justify-center items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-sm transition-colors flex">
                        <Filter className="w-4 h-4" />
                        Filters
                    </button>
                    <button className="flex-1 sm:flex-none justify-center items-center gap-2 px-3 py-2 bg-customRed text-white rounded-lg text-sm transition-opacity hover:opacity-90 flex">
                        <Download className="w-4 h-4" />
                        Export All
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                            <th className="px-6 py-4 font-semibold">Month</th>
                            <th className="px-6 py-4 font-semibold">Year</th>
                            <th className="px-6 py-4 font-semibold">Net Salary</th>
                            <th className="px-6 py-4 font-semibold">Status</th>
                            <th className="px-6 py-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {records.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic">
                                    No finalized payroll records found.
                                </td>
                            </tr>
                        ) : (
                            records.map((row) => (
                                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="font-medium text-slate-700">{getMonthName(row.month)}</span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{row.year}</td>
                                    <td className="px-6 py-4 font-bold text-slate-900">
                                        Rs. {Number(row.net_salary).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => navigate(`/self-service/my-salary/${row.id}`)}
                                            className="inline-flex items-center gap-1.5 text-customRed hover:text-red-700 font-medium text-sm transition-colors"
                                        >
                                            <Eye className="w-4 h-4" />
                                            View Payslip
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100">
                <p className="text-xs text-slate-500 text-center">
                    This is an automated system generated list. Contact HR for any discrepancies.
                </p>
            </div>
        </div>
    );
};

export default MySalaryList;
