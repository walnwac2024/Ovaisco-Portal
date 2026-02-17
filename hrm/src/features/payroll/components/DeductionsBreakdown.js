import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';

const DeductionsBreakdown = () => {
    const [deductions, setDeductions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    });

    useEffect(() => {
        fetchDeductions();
    }, [filters]);

    const fetchDeductions = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/payroll/deductions/${filters.month}/${filters.year}`);
            setDeductions(response.data.deductions || []);
        } catch (error) {
            console.error('Error fetching deductions:', error);
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
        return <div className="payroll-loading">Loading deductions...</div>;
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

            {deductions.length === 0 ? (
                <div className="payroll-card payroll-empty-state">
                    <i className="fas fa-check-circle payroll-empty-icon status-success"></i>
                    <h3>No Deductions</h3>
                    <p>No deductions were applied for the selected period.</p>
                </div>
            ) : (
                <div className="payroll-table-container">
                    <table className="payroll-table">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Late Days</th>
                                <th>Late Deduction</th>
                                <th>Absent Days</th>
                                <th>Absent Deduction</th>
                                <th>Total Deduction</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deductions.map((record) => (
                                <tr key={record.id}>
                                    <td>
                                        <div>
                                            <strong>{record.employee_name}</strong>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                {record.employee_code}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        {record.late_days_count > 0 ? (
                                            <span className="status-warning">
                                                {record.late_days_count} days
                                            </span>
                                        ) : (
                                            <span className="status-success">0 days</span>
                                        )}
                                    </td>
                                    <td>
                                        {record.late_days_deduction > 0 ? (
                                            <span className="status-danger">
                                                -Rs. {Number(record.late_days_deduction).toLocaleString()}
                                            </span>
                                        ) : (
                                            <span style={{ opacity: 0.5 }}>-</span>
                                        )}
                                    </td>
                                    <td>
                                        {record.unauthorized_offs_count > 0 ? (
                                            <span className="status-warning">
                                                {record.unauthorized_offs_count} days
                                            </span>
                                        ) : (
                                            <span className="status-success">0 days</span>
                                        )}
                                    </td>
                                    <td>
                                        {record.unauthorized_offs_deduction > 0 ? (
                                            <span className="status-danger">
                                                -Rs. {Number(record.unauthorized_offs_deduction).toLocaleString()}
                                            </span>
                                        ) : (
                                            <span style={{ opacity: 0.5 }}>-</span>
                                        )}
                                    </td>
                                    <td>
                                        {record.total_deduction > 0 ? (
                                            <strong className="status-danger" style={{ fontSize: '15px' }}>
                                                -Rs. {Number(record.total_deduction).toLocaleString()}
                                            </strong>
                                        ) : (
                                            <strong className="status-success">Rs. 0</strong>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default DeductionsBreakdown;
