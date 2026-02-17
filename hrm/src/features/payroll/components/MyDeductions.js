import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';

const MyDeductions = ({ employeeId }) => {
    const [deductions, setDeductions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    });

    useEffect(() => {
        fetchMyDeductions();
    }, [filters, employeeId]);

    const fetchMyDeductions = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/payroll/deductions/${filters.month}/${filters.year}`);
            // Filter to show only current employee's deductions
            const myDeductions = response.data.deductions?.filter(d => d.employee_id === employeeId) || [];
            setDeductions(myDeductions);
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
        return <div className="payroll-loading">Loading your deductions...</div>;
    }

    const currentDeduction = deductions[0];

    return (
        <div>
            <div className="payroll-section-header">
                <h3>My Salary Deductions</h3>
                <div className="payroll-filters" style={{ display: 'flex', gap: '12px' }}>
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
            </div>

            {!currentDeduction ? (
                <div className="payroll-card payroll-empty-state">
                    <i className="fas fa-check-circle payroll-empty-icon status-success"></i>
                    <h3>No Deductions!</h3>
                    <p>Great job! You had no salary deductions for {new Date(filters.year, filters.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}.</p>
                </div>
            ) : (
                <div className="my-deductions-container">
                    {/* Summary Card */}
                    <div className="payroll-card" style={{ marginBottom: '20px' }}>
                        <div className="deduction-summary">
                            <div className="deduction-summary-header">
                                <h4>Deduction Summary for {new Date(filters.year, filters.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</h4>
                            </div>
                            <div className="deduction-total-amount">
                                <span className="deduction-label">Total Deduction:</span>
                                <span className="deduction-amount">
                                    Rs. {Number(currentDeduction.total_deduction).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Breakdown */}
                    <div className="payroll-card">
                        <h4 style={{ marginBottom: '24px' }}>Deduction Breakdown</h4>

                        {/* Late Days Section */}
                        <div className="deduction-item">
                            <div className="deduction-item-header">
                                <div className="deduction-icon late-icon-bg">
                                    <i className="fas fa-clock"></i>
                                </div>
                                <div className="deduction-item-info">
                                    <h5>Late Arrivals</h5>
                                    <p className="deduction-description">
                                        Deduction applied for arriving late (beyond 15-minute grace period)
                                    </p>
                                </div>
                            </div>
                            <div className="deduction-item-details">
                                <div className="deduction-stat">
                                    <span className="deduction-stat-label">Late Days:</span>
                                    <span className={`deduction-stat-value ${currentDeduction.late_days_count > 0 ? 'status-warning' : 'status-success'}`}>
                                        {currentDeduction.late_days_count} {currentDeduction.late_days_count === 1 ? 'day' : 'days'}
                                    </span>
                                </div>
                                <div className="deduction-stat">
                                    <span className="deduction-stat-label">Deduction:</span>
                                    <span className="deduction-stat-value status-danger">
                                        {currentDeduction.late_days_deduction > 0
                                            ? `-Rs. ${Number(currentDeduction.late_days_deduction).toLocaleString()}`
                                            : 'Rs. 0'
                                        }
                                    </span>
                                </div>
                            </div>
                            {currentDeduction.late_days_count > 0 && (
                                <div className="deduction-note">
                                    <i className="fas fa-info-circle"></i>
                                    <span>Deduction is applied when you have 4 or more late arrivals in a month.</span>
                                </div>
                            )}
                        </div>

                        {/* Unauthorized Offs Section */}
                        <div className="deduction-item">
                            <div className="deduction-item-header">
                                <div className="deduction-icon absent-icon-bg">
                                    <i className="fas fa-calendar-times"></i>
                                </div>
                                <div className="deduction-item-info">
                                    <h5>Unauthorized Absences</h5>
                                    <p className="deduction-description">
                                        Deduction applied for absences without approved leave
                                    </p>
                                </div>
                            </div>
                            <div className="deduction-item-details">
                                <div className="deduction-stat">
                                    <span className="deduction-stat-label">Absent Days:</span>
                                    <span className={`deduction-stat-value ${currentDeduction.unauthorized_offs_count > 0 ? 'status-warning' : 'status-success'}`}>
                                        {currentDeduction.unauthorized_offs_count} {currentDeduction.unauthorized_offs_count === 1 ? 'day' : 'days'}
                                    </span>
                                </div>
                                <div className="deduction-stat">
                                    <span className="deduction-stat-label">Deduction:</span>
                                    <span className="deduction-stat-value status-danger">
                                        {currentDeduction.unauthorized_offs_deduction > 0
                                            ? `-Rs. ${Number(currentDeduction.unauthorized_offs_deduction).toLocaleString()}`
                                            : 'Rs. 0'
                                        }
                                    </span>
                                </div>
                            </div>
                            {currentDeduction.unauthorized_offs_count > 0 && (
                                <div className="deduction-note">
                                    <i className="fas fa-info-circle"></i>
                                    <span>Deduction is applied when you have 2 or more unauthorized absences in a month.</span>
                                </div>
                            )}
                        </div>

                        {/* Tips Section */}
                        {currentDeduction.total_deduction > 0 && (
                            <div className="deduction-tips">
                                <h5><i className="fas fa-lightbulb"></i> How to Avoid Deductions</h5>
                                <ul>
                                    <li>Arrive on time or within the 15-minute grace period</li>
                                    <li>Apply for leave in advance for planned absences</li>
                                    <li>Ensure your attendance is marked daily</li>
                                    <li>Contact HR if you have any attendance issues</li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyDeductions;
