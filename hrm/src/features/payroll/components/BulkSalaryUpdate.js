import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import './BulkSalaryUpdate.css';

const BulkSalaryUpdate = () => {
    const [salaries, setSalaries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [updateConfig, setUpdateConfig] = useState({
        update_type: 'PERCENTAGE',
        amount: '',
        percentage: '',
        reason: 'Annual salary adjustment'
    });
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchAllSalaries();
    }, []);

    const fetchAllSalaries = async () => {
        try {
            setLoading(true);
            const response = await api.get('/payroll/salaries/all');
            setSalaries(response.data.salaries || []);
            // Initially select all active employees
            setSelectedEmployees((response.data.salaries || []).map(s => s.id));
        } catch (err) {
            setError('Failed to fetch salaries');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedEmployees(filteredSalaries.map(s => s.id));
        } else {
            setSelectedEmployees([]);
        }
    };

    const handleSelectOne = (id) => {
        if (selectedEmployees.includes(id)) {
            setSelectedEmployees(selectedEmployees.filter(eid => eid !== id));
        } else {
            setSelectedEmployees([...selectedEmployees, id]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedEmployees.length === 0) {
            setError('Please select at least one employee');
            return;
        }

        if (updateConfig.update_type === 'PERCENTAGE' && !updateConfig.percentage) {
            setError('Please enter a percentage');
            return;
        }

        if (updateConfig.update_type === 'AMOUNT' && !updateConfig.amount) {
            setError('Please enter an amount');
            return;
        }

        try {
            setLoading(true);
            setError('');
            setSuccess('');

            await api.post('/payroll/salaries/bulk-update', {
                ...updateConfig,
                employee_ids: selectedEmployees
            });

            setSuccess(`Successfully updated ${selectedEmployees.length} employees`);
            fetchAllSalaries();
        } catch (err) {
            setError(err.response?.data?.message || 'Bulk update failed');
        } finally {
            setLoading(false);
        }
    };

    const filteredSalaries = salaries.filter(s =>
        s.Employee_Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.Employee_ID.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.Department.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bulk-update-container">
            <div className="bulk-update-header">
                <h2><i className="fas fa-users-cog"></i> Company-Wide Salary Adjustment</h2>
                <p>Apply percentage or fixed amount increases to multiple employees simultaneously.</p>
            </div>

            <div className="bulk-update-layout">
                <div className="bulk-update-controls">
                    <form onSubmit={handleSubmit} className="bulk-config-form">
                        <div className="bulk-form-group">
                            <label>Adjustment Type</label>
                            <div className="bulk-type-toggle">
                                <button
                                    type="button"
                                    className={`bulk-type-btn ${updateConfig.update_type === 'PERCENTAGE' ? 'active' : ''}`}
                                    onClick={() => setUpdateConfig({ ...updateConfig, update_type: 'PERCENTAGE' })}
                                >
                                    <i className="fas fa-percent"></i> Percentage (%)
                                </button>
                                <button
                                    type="button"
                                    className={`bulk-type-btn ${updateConfig.update_type === 'AMOUNT' ? 'active' : ''}`}
                                    onClick={() => setUpdateConfig({ ...updateConfig, update_type: 'AMOUNT' })}
                                >
                                    <i className="fas fa-plus"></i> Fixed Amount
                                </button>
                            </div>
                        </div>

                        {updateConfig.update_type === 'PERCENTAGE' ? (
                            <div className="bulk-form-group">
                                <label>Percentage Increase</label>
                                <div className="bulk-input-wrapper">
                                    <input
                                        type="number"
                                        value={updateConfig.percentage}
                                        onChange={(e) => setUpdateConfig({ ...updateConfig, percentage: e.target.value })}
                                        placeholder="e.g. 5"
                                        step="0.01"
                                    />
                                    <span className="unit">%</span>
                                </div>
                            </div>
                        ) : (
                            <div className="bulk-form-group">
                                <label>Fixed Amount Increase</label>
                                <div className="bulk-input-wrapper">
                                    <span className="unit">Rs.</span>
                                    <input
                                        type="number"
                                        value={updateConfig.amount}
                                        onChange={(e) => setUpdateConfig({ ...updateConfig, amount: e.target.value })}
                                        placeholder="e.g. 5000"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="bulk-form-group">
                            <label>Audit Reason</label>
                            <textarea
                                value={updateConfig.reason}
                                onChange={(e) => setUpdateConfig({ ...updateConfig, reason: e.target.value })}
                                placeholder="Why is this adjustment being made?"
                                rows="3"
                            />
                        </div>

                        {error && <div className="bulk-error"><i className="fas fa-exclamation-circle"></i> {error}</div>}
                        {success && <div className="bulk-success"><i className="fas fa-check-circle"></i> {success}</div>}

                        <button type="submit" className="bulk-submit-btn" disabled={loading}>
                            {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-play"></i>}
                            Apply to {selectedEmployees.length} Employees
                        </button>
                    </form>
                </div>

                <div className="bulk-update-table-section">
                    <div className="table-header-actions">
                        <div className="bulk-search">
                            <i className="fas fa-search"></i>
                            <input
                                type="text"
                                placeholder="Filter employees..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="selection-info">
                            {selectedEmployees.length} of {filteredSalaries.length} selected
                        </div>
                    </div>

                    <div className="bulk-table-wrapper">
                        <table className="bulk-salary-table">
                            <thead>
                                <tr>
                                    <th className="checkbox-col">
                                        <input
                                            type="checkbox"
                                            onChange={handleSelectAll}
                                            checked={selectedEmployees.length === filteredSalaries.length && filteredSalaries.length > 0}
                                        />
                                    </th>
                                    <th>Employee</th>
                                    <th>Department</th>
                                    <th className="amount-col">Current Salary</th>
                                    <th className="amount-col">Projected Salary</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSalaries.map(emp => {
                                    const current = Number(emp.basic_salary || 0) + Number(emp.allowances || 0);
                                    let projected = current;
                                    if (updateConfig.update_type === 'PERCENTAGE' && updateConfig.percentage) {
                                        projected = current + (current * Number(updateConfig.percentage) / 100);
                                    } else if (updateConfig.update_type === 'AMOUNT' && updateConfig.amount) {
                                        projected = current + Number(updateConfig.amount);
                                    }

                                    return (
                                        <tr key={emp.id} className={selectedEmployees.includes(emp.id) ? 'selected' : ''}>
                                            <td className="checkbox-col">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedEmployees.includes(emp.id)}
                                                    onChange={() => handleSelectOne(emp.id)}
                                                />
                                            </td>
                                            <td>
                                                <div className="emp-cell">
                                                    <span className="emp-name">{emp.Employee_Name}</span>
                                                    <span className="emp-code">{emp.Employee_ID}</span>
                                                </div>
                                            </td>
                                            <td><span className="dept-tag">{emp.Department}</span></td>
                                            <td className="amount-col">Rs. {current.toLocaleString()}</td>
                                            <td className="amount-col projected">
                                                {projected !== current ? (
                                                    <span>Rs. {projected.toLocaleString()}</span>
                                                ) : '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BulkSalaryUpdate;
