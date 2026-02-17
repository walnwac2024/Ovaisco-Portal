import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';

const IncrementHistoryTable = ({ employeeId }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
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

    if (loading) {
        return <div className="payroll-loading">Loading increment history...</div>;
    }

    if (history.length === 0) {
        return (
            <div className="payroll-card payroll-empty-state">
                <i className="fas fa-chart-line payroll-empty-icon"></i>
                <h3>No Increment History</h3>
                <p>You haven't received any salary increments yet.</p>
            </div>
        );
    }

    return (
        <div className="payroll-table">
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Previous Salary</th>
                        <th>Increment</th>
                        <th>New Salary</th>
                        <th>Applied By</th>
                        <th>Reason</th>
                    </tr>
                </thead>
                <tbody>
                    {history.map((item) => (
                        <tr key={item.id}>
                            <td>{new Date(item.applied_at).toLocaleDateString()}</td>
                            <td>Rs. {Number(item.previous_salary).toLocaleString()}</td>
                            <td>
                                {item.increment_type === 'AMOUNT' ? (
                                    <span className="payroll-badge payroll-badge-amount">
                                        +Rs. {Number(item.increment_amount).toLocaleString()}
                                    </span>
                                ) : (
                                    <span className="payroll-badge payroll-badge-percentage">
                                        +{Number(item.increment_percentage)}%
                                    </span>
                                )}
                            </td>
                            <td>
                                <strong>Rs. {Number(item.new_salary).toLocaleString()}</strong>
                            </td>
                            <td>{item.applied_by_name}</td>
                            <td>{item.reason || '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default IncrementHistoryTable;
