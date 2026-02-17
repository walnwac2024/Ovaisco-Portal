import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import './IncrementGrantModal.css';

const IncrementGrantModal = ({ onClose, onSubmit }) => {
    const [employees, setEmployees] = useState([]);
    const [formData, setFormData] = useState({
        employee_id: '',
        increment_type: 'SET_FIXED',
        increment_amount: '',
        increment_percentage: '',
        fixed_salary: '',
        allowances: '',
        reason: ''
    });
    const [currentSalary, setCurrentSalary] = useState(null);
    const [rawSalaryData, setRawSalaryData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const response = await api.get('/employees/lookups/basic');
            setEmployees(response.data || []);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    const fetchEmployeeSalary = async (employeeId) => {
        if (!employeeId) {
            setError('Employee ID is required to fetch salary details.');
            setCurrentSalary(null);
            setRawSalaryData(null);
            setFormData(prev => ({
                ...prev,
                fixed_salary: '',
                allowances: ''
            }));
            return;
        }
        try {
            const response = await api.get(`/payroll/salary/${employeeId}`);
            if (response.data.salary) {
                const { basic_salary, allowances } = response.data.salary;
                const total = Number(basic_salary) + Number(allowances);
                setCurrentSalary(total);
                setRawSalaryData({ basic_salary, allowances });

                // Pre-fill fixed salary fields if in SET_FIXED mode
                setFormData(prev => ({
                    ...prev,
                    fixed_salary: basic_salary,
                    allowances: allowances
                }));
            } else {
                setCurrentSalary(0);
                setRawSalaryData({ basic_salary: 0, allowances: 0 });
                setFormData(prev => ({
                    ...prev,
                    fixed_salary: '',
                    allowances: ''
                }));
            }
        } catch (error) {
            console.error('Error fetching employee salary:', error);
            setCurrentSalary(null);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });

        if (name === 'employee_id' && value) {
            fetchEmployeeSalary(value);
            setError('');
        }
    };

    const calculateNewSalary = () => {
        if (formData.increment_type === 'SET_FIXED') {
            return Number(formData.fixed_salary || 0) + Number(formData.allowances || 0);
        }

        if (!currentSalary) return 0;
        if (formData.increment_type === 'AMOUNT' && formData.increment_amount) {
            return currentSalary + Number(formData.increment_amount);
        } else if (formData.increment_type === 'PERCENTAGE' && formData.increment_percentage) {
            return currentSalary + (currentSalary * Number(formData.increment_percentage) / 100);
        }
        return currentSalary;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.employee_id) {
            setError('Please select an employee');
            return;
        }

        if (!currentSalary) {
            setError('Cannot grant increment - employee has not set their salary');
            return;
        }

        if (formData.increment_type === 'SET_FIXED' && (!formData.fixed_salary || Number(formData.fixed_salary) < 0)) {
            setError('Please enter a valid basic salary');
            return;
        }

        if (formData.increment_type === 'AMOUNT' && (!formData.increment_amount || Number(formData.increment_amount) <= 0)) {
            setError('Please enter a valid increment amount');
            return;
        }

        if (formData.increment_type === 'PERCENTAGE' && (!formData.increment_percentage || Number(formData.increment_percentage) <= 0)) {
            setError('Please enter a valid increment percentage');
            return;
        }

        try {
            setLoading(true);
            setError('');

            await api.post('/payroll/increment/grant', {
                employee_id: formData.employee_id,
                increment_type: formData.increment_type,
                increment_amount: formData.increment_type === 'AMOUNT' ? Number(formData.increment_amount) : null,
                increment_percentage: formData.increment_type === 'PERCENTAGE' ? Number(formData.increment_percentage) : null,
                fixed_salary: formData.increment_type === 'SET_FIXED' ? Number(formData.fixed_salary) : null,
                allowances: formData.increment_type === 'SET_FIXED' ? Number(formData.allowances) : null,
                reason: formData.reason
            });

            onSubmit();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to grant increment');
        } finally {
            setLoading(false);
        }
    };

    const newSalary = calculateNewSalary();

    return (
        <div className="grant-modal-overlay" onClick={onClose}>
            <div className="grant-modal" onClick={(e) => e.stopPropagation()}>
                <div className="grant-modal-header">
                    <h2><i className="fas fa-user-edit"></i> Update Employee Salary</h2>
                    <button className="grant-modal-close" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="grant-modal-body">
                    <form onSubmit={handleSubmit} className="grant-form">
                        <div className="grant-form-group">
                            <label htmlFor="employee_id">
                                Select Employee <span className="grant-required">*</span>
                            </label>
                            <div className="grant-searchable-select">
                                <div
                                    className={`grant-select-box ${showDropdown ? 'active' : ''}`}
                                    onClick={() => setShowDropdown(!showDropdown)}
                                >
                                    {formData.employee_id ? (
                                        <span>
                                            {employees.find(e => e.id === Number(formData.employee_id))?.Employee_Name}
                                            ({employees.find(e => e.id === Number(formData.employee_id))?.Employee_ID})
                                        </span>
                                    ) : (
                                        <span className="placeholder">-- Select Employee --</span>
                                    )}
                                    <i className={`fas fa-chevron-${showDropdown ? 'up' : 'down'}`}></i>
                                </div>

                                {showDropdown && (
                                    <div className="grant-dropdown-container">
                                        <div className="grant-dropdown-search">
                                            <i className="fas fa-search"></i>
                                            <input
                                                type="text"
                                                placeholder="Search by name or ID..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                autoFocus
                                            />
                                        </div>
                                        <div className="grant-dropdown-list">
                                            {employees
                                                .filter(emp =>
                                                    emp.Employee_Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                    emp.Employee_ID.toLowerCase().includes(searchTerm.toLowerCase())
                                                )
                                                .map(emp => (
                                                    <div
                                                        key={emp.id}
                                                        className={`grant-dropdown-item ${Number(formData.employee_id) === emp.id ? 'selected' : ''}`}
                                                        onClick={() => {
                                                            handleChange({ target: { name: 'employee_id', value: emp.id } });
                                                            setShowDropdown(false);
                                                            setSearchTerm('');
                                                        }}
                                                    >
                                                        <div className="emp-info">
                                                            <span className="emp-name">{emp.Employee_Name}</span>
                                                            <span className="emp-id">{emp.Employee_ID}</span>
                                                        </div>
                                                    </div>
                                                ))
                                            }
                                            {employees.filter(emp =>
                                                emp.Employee_Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                emp.Employee_ID.toLowerCase().includes(searchTerm.toLowerCase())
                                            ).length === 0 && (
                                                    <div className="grant-dropdown-no-results">No employees found</div>
                                                )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {currentSalary !== null && (
                            <div className="grant-current-salary-info">
                                <span>Current Salary:</span>
                                <span className="grant-salary-amount">Rs. {currentSalary.toLocaleString()}</span>
                            </div>
                        )}

                        <div className="grant-type-toggle">
                            <button
                                type="button"
                                className={`grant-type-btn ${formData.increment_type === 'SET_FIXED' ? 'active' : ''}`}
                                onClick={() => setFormData({ ...formData, increment_type: 'SET_FIXED' })}
                            >
                                <i className="fas fa-edit"></i> Set Fixed
                            </button>
                            <button
                                type="button"
                                className={`grant-type-btn ${formData.increment_type === 'AMOUNT' ? 'active' : ''}`}
                                onClick={() => setFormData({ ...formData, increment_type: 'AMOUNT' })}
                            >
                                <i className="fas fa-plus"></i> Add Amount
                            </button>
                            <button
                                type="button"
                                className={`grant-type-btn ${formData.increment_type === 'PERCENTAGE' ? 'active' : ''}`}
                                onClick={() => setFormData({ ...formData, increment_type: 'PERCENTAGE' })}
                            >
                                <i className="fas fa-percent"></i> Percentage
                            </button>
                        </div>

                        {formData.increment_type === 'SET_FIXED' ? (
                            <div className="grant-set-fixed-grid">
                                <div className="grant-form-group">
                                    <label htmlFor="fixed_salary">
                                        Basic Salary <span className="grant-required">*</span>
                                    </label>
                                    <div className="grant-input-wrapper">
                                        <span className="grant-currency">Rs.</span>
                                        <input
                                            type="number"
                                            id="fixed_salary"
                                            name="fixed_salary"
                                            className="grant-input"
                                            value={formData.fixed_salary}
                                            onChange={handleChange}
                                            placeholder="Enter basic salary"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                </div>
                                <div className="grant-form-group">
                                    <label htmlFor="allowances">
                                        Allowances
                                    </label>
                                    <div className="grant-input-wrapper">
                                        <span className="grant-currency">Rs.</span>
                                        <input
                                            type="number"
                                            id="allowances"
                                            name="allowances"
                                            className="grant-input"
                                            value={formData.allowances}
                                            onChange={handleChange}
                                            placeholder="Enter allowances"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : formData.increment_type === 'AMOUNT' ? (
                            <div className="grant-form-group">
                                <label htmlFor="increment_amount">
                                    Increment Amount <span className="grant-required">*</span>
                                </label>
                                <div className="grant-input-wrapper">
                                    <span className="grant-currency">Rs.</span>
                                    <input
                                        type="number"
                                        id="increment_amount"
                                        name="increment_amount"
                                        className="grant-input"
                                        value={formData.increment_amount}
                                        onChange={handleChange}
                                        placeholder="Enter increment amount"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="grant-form-group">
                                <label htmlFor="increment_percentage">
                                    Increment Percentage <span className="grant-required">*</span>
                                </label>
                                <div className="grant-input-wrapper">
                                    <input
                                        type="number"
                                        id="increment_percentage"
                                        name="increment_percentage"
                                        className="grant-input"
                                        value={formData.increment_percentage}
                                        onChange={handleChange}
                                        placeholder="Enter percentage"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                    />
                                    <span className="grant-percent-symbol">%</span>
                                </div>
                            </div>
                        )}

                        <div className="grant-form-group">
                            <label htmlFor="reason">
                                Reason (Optional)
                            </label>
                            <textarea
                                id="reason"
                                name="reason"
                                className="grant-textarea"
                                value={formData.reason}
                                onChange={handleChange}
                                placeholder="Explain the reason for this increment..."
                                rows="4"
                            />
                        </div>

                        {currentSalary !== null && newSalary !== currentSalary && (
                            <div className="grant-preview-card">
                                <div className="grant-preview-item">
                                    <span>Current Salary:</span>
                                    <span>Rs. {currentSalary.toLocaleString()}</span>
                                </div>
                                <div className="grant-preview-item grant-highlight">
                                    <span>{newSalary > currentSalary ? 'Increase:' : 'Decrease:'}</span>
                                    <span>{newSalary > currentSalary ? '+' : '-'}Rs. {Math.abs(newSalary - currentSalary).toLocaleString()}</span>
                                </div>
                                <div className="grant-preview-item new-total">
                                    <span>New Salary:</span>
                                    <span>Rs. {newSalary.toLocaleString()}</span>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="grant-error-message">
                                <i className="fas fa-exclamation-circle"></i> {error}
                            </div>
                        )}

                        <div className="grant-modal-footer">
                            <button
                                type="button"
                                className="grant-btn grant-btn-secondary"
                                onClick={onClose}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="grant-btn grant-btn-primary"
                                disabled={loading || (formData.increment_type !== 'SET_FIXED' && currentSalary === 0)}
                            >
                                {loading ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin"></i> Updating...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-check"></i> Update Salary
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default IncrementGrantModal;
