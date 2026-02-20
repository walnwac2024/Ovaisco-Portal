import React, { useState } from 'react';
import api from '../../../utils/api';
import { toast } from 'react-toastify';

const GeneratePayroll = () => {
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(false);

    const handleCalculate = async () => {
        if (!window.confirm(`Are you sure you want to generate payroll for ${month}/${year}? This will create records for all active employees.`)) return;

        try {
            setLoading(true);
            await api.post('/payroll/calculate', { month, year });
            toast.success('Payroll generated successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to generate payroll');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Bulk Payroll Generation</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Target Month</label>
                    <select
                        value={month}
                        onChange={(e) => setMonth(Number(e.target.value))}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-customRed/20"
                    >
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                                {new Date(0, i).toLocaleString('en', { month: 'long' })}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Target Year</label>
                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-customRed/20"
                    >
                        {[2024, 2025, 2026].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 mb-8">
                <p className="text-sm text-amber-800">
                    <strong>Notice:</strong> This action will process attendance data, overtime, and deductions for all employees with finalized <strong>Salary Setups</strong>.
                </p>
            </div>

            <button
                onClick={handleCalculate}
                disabled={loading}
                className="bg-customRed text-white px-8 py-3 rounded-xl font-bold hover:bg-customRed/90 transition-all shadow-md disabled:opacity-50"
            >
                {loading ? 'Processing...' : 'Generate Monthly Payroll'}
            </button>
        </div>
    );
};

export default GeneratePayroll;
