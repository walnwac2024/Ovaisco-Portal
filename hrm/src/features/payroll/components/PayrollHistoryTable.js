import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';

const PayrollHistoryTable = () => {
    const [payroll, setPayroll] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    });

    useEffect(() => {
        fetchPayrollHistory();
    }, [filters]);

    const fetchPayrollHistory = async () => {
        try {
            setLoading(true);
            const response = await api.get('/payroll/history', {
                params: filters
            });
            setPayroll(response.data.payroll || []);
        } catch (error) {
            console.error('Error fetching payroll history:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        setFilters({
            ...filters,
            [e.target.name]: e.target.value
        });
    };

    if (loading) {
        return <div className="payroll-loading">Loading payroll history...</div>;
    }

    return (
        <div>
            <div className="payroll-filters" style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
                <select
                    className="payroll-select"
                    name="month"
                    value={filters.month}
                    onChange={handleFilterChange}
                >
                    {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                            {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                        </option>
                    ))}
                </select>
                <select
                    className="payroll-select"
                    name="year"
                    value={filters.year}
                    onChange={handleFilterChange}
                >
                    {Array.from({ length: 5 }, (_, i) => {
                        const year = new Date().getFullYear() - i;
                        return (
                            <option key={year} value={year}>
                                {year}
                            </option>
                        );
                    })}
                </select>
            </div>

            {payroll.length === 0 ? (
                <div className="payroll-card payroll-empty-state">
                    <i className="fas fa-file-invoice-dollar payroll-empty-icon"></i>
                    <h3>No Payroll Records</h3>
                    <p>No payroll has been generated for the selected period.</p>
                </div>
            ) : (
                <div className="payroll-table-container">
                    <table className="payroll-table">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Basic Salary</th>
                                <th>Allowances</th>
                                <th>Gross Salary</th>
                                <th>Deductions</th>
                                <th>Net Salary</th>
                                <th>Status</th>
                                <th>Generated</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payroll.map((record) => (
                                <tr key={record.id}>
                                    <td>
                                        <div>
                                            <strong>{record.employee_name}</strong>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                {record.employee_code}
                                            </div>
                                        </div>
                                    </td>
                                    <td>Rs. {Number(record.basic_salary).toLocaleString()}</td>
                                    <td>Rs. {Number(record.allowances).toLocaleString()}</td>
                                    <td>Rs. {Number(record.gross_salary).toLocaleString()}</td>
                                    <td className="status-danger">
                                        -Rs. {Number(record.total_deductions).toLocaleString()}
                                    </td>
                                    <td>
                                        <strong className="status-success" style={{ fontSize: '15px' }}>
                                            Rs. {Number(record.net_salary).toLocaleString()}
                                        </strong>
                                    </td>
                                    <td>
                                        <span className={`payroll-badge ${record.status === 'PAID' ? 'payroll-badge-approved' : 'payroll-badge-pending'}`}>
                                            {record.status}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '12px' }}>{new Date(record.generated_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default PayrollHistoryTable;
