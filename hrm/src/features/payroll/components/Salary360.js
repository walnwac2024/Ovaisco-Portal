import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/api';
import downloadPayslip from './PayslipDownloader';

const Salary360 = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await api.get('/payroll/history');
                setHistory(response.data.payroll || []);
            } catch (error) {
                console.error('Error fetching payroll history:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-500">Loading your salary history...</div>;

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Salary 360</h2>
                    <p className="text-sm text-slate-500">View and download your monthly payslips</p>
                </div>
                <div className="flex gap-2">
                    <button className="text-sm text-customRed hover:bg-customRed/5 px-3 py-1.5 rounded-lg transition-colors font-medium">
                        Export PDF
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Month & Year</th>
                            <th className="px-6 py-4 font-semibold">Reference</th>
                            <th className="px-6 py-4 font-semibold text-right">Net Payable</th>
                            <th className="px-6 py-4 font-semibold">Status</th>
                            <th className="px-6 py-4 font-semibold text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {history.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                                    <i className="fas fa-receipt text-4xl mb-3 opacity-20 block"></i>
                                    No payroll records found.
                                </td>
                            </tr>
                        ) : (
                            history.map((record) => (
                                <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-customRed/10 text-customRed flex items-center justify-center font-bold text-sm">
                                                {new Date(record.year, record.month - 1).toLocaleString('default', { month: 'short' })}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-slate-800">
                                                    {new Date(record.year, record.month - 1).toLocaleString('default', { month: 'long' })}
                                                </div>
                                                <div className="text-xs text-slate-500">{record.year}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-mono text-slate-500">{record.reference_number}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="font-bold text-slate-900">
                                            Rs. {Number(record.net_salary).toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${record.status === 'PAID'
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            {record.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => navigate(`/payroll/details/${record.month}/${record.year}`)}
                                                className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-customRed hover:text-white transition-all shadow-sm"
                                                title="View Details"
                                            >
                                                <i className="fas fa-eye text-sm"></i>
                                            </button>
                                            <button
                                                onClick={() => downloadPayslip(record, 'download')}
                                                className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-800 hover:text-white transition-all shadow-sm"
                                                title="Download PDF"
                                            >
                                                <i className="fas fa-file-pdf text-sm"></i>
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
    );
};

export default Salary360;
