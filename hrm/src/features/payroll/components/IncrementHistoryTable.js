import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import IncrementRequestModal from './IncrementRequestModal';

const IncrementHistoryTable = ({ employeeId }) => {
    const [history, setHistory] = useState([]);
    const [currentSalary, setCurrentSalary] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showRequestModal, setShowRequestModal] = useState(false);

    useEffect(() => {
        fetchHistory();
        fetchCurrentSalary();
    }, [employeeId]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/payroll/increment/history/${employeeId}`);
            setHistory(response.data.history || []);
        } catch (error) {
            console.error('Error fetching increment history:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCurrentSalary = async () => {
        try {
            const response = await api.get(`/payroll/salary/${employeeId}`);
            setCurrentSalary(response.data.salary?.basic_salary || 0);
        } catch (error) {
            console.error('Error fetching current salary:', error);
        }
    };

    if (loading) {
        return <div className="payroll-loading">Loading increment history...</div>;
    }

    return (
        <div className="payroll-table-section">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Increment History</h2>
                    <p className="text-sm text-slate-500">View your salary progression over time</p>
                </div>
                <button
                    onClick={() => setShowRequestModal(true)}
                    className="bg-customRed text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-customRed/90 transition-all shadow-sm flex items-center gap-2"
                >
                    <i className="fas fa-plus"></i> Request Increment
                </button>
            </div>

            {history.length === 0 ? (
                <div className="payroll-card payroll-empty-state">
                    <i className="fas fa-chart-line payroll-empty-icon text-slate-300 text-4xl mb-4"></i>
                    <h3 className="text-lg font-semibold text-slate-600">No Increment History</h3>
                    <p className="text-slate-400">You haven't received any salary increments yet. Click above to request one.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                    <table>
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 text-left font-semibold">Date</th>
                                <th className="px-6 py-4 text-left font-semibold">Previous Salary</th>
                                <th className="px-6 py-4 text-left font-semibold">Increment</th>
                                <th className="px-6 py-4 text-left font-semibold">New Salary</th>
                                <th className="px-6 py-4 text-left font-semibold">Applied By</th>
                                <th className="px-6 py-4 text-left font-semibold">Reason</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {history.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-slate-600">{new Date(item.applied_at).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">Rs. {Number(item.previous_salary).toLocaleString()}</td>
                                    <td className="px-6 py-4 text-sm">
                                        {item.increment_type === 'AMOUNT' ? (
                                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs font-bold">
                                                +Rs. {Number(item.increment_amount).toLocaleString()}
                                            </span>
                                        ) : (
                                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-xs font-bold">
                                                +{Number(item.increment_percentage)}%
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <strong className="text-slate-900 font-bold">Rs. {Number(item.new_salary).toLocaleString()}</strong>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{item.applied_by_name}</td>
                                    <td className="px-6 py-4 text-sm text-slate-500 italic">{item.reason || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showRequestModal && (
                <IncrementRequestModal
                    isOpen={true}
                    currentSalary={currentSalary}
                    onClose={() => setShowRequestModal(false)}
                    onSubmit={() => {
                        setShowRequestModal(false);
                        fetchHistory();
                    }}
                />
            )}
        </div>
    );
};

export default IncrementHistoryTable;
