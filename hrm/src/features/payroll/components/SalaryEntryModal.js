import React, { useState } from 'react';
import api from '../../../utils/api';
import './SalaryEntryModal.css';

const SalaryEntryModal = ({ onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        basic_salary: '',
        allowances: '',
        effective_from: new Date().toISOString().slice(0, 10)
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showWarning, setShowWarning] = useState(true);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.basic_salary || Number(formData.basic_salary) <= 0) {
            setError('Please enter a valid basic salary');
            return;
        }

        try {
            setLoading(true);
            setError('');

            await api.post('/payroll/salary', {
                basic_salary: Number(formData.basic_salary),
                allowances: Number(formData.allowances) || 0,
                effective_from: formData.effective_from
            });

            onSubmit();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit salary information');
        } finally {
            setLoading(false);
        }
    };

    const totalSalary = (Number(formData.basic_salary) || 0) + (Number(formData.allowances) || 0);

    return (
        <div className="salary-modal-overlay" onClick={onClose}>
            <div className="salary-modal" onClick={(e) => e.stopPropagation()}>
                <div className="salary-modal-header">
                    <h2><i className="fas fa-money-bill-wave"></i> Enter Salary Information</h2>
                    <button className="salary-modal-close" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="salary-modal-body">
                    {showWarning && (
                        <div className="salary-warning-box">
                            <div className="salary-warning-icon">
                                <i className="fas fa-exclamation-shield"></i>
                            </div>
                            <div className="salary-warning-main">
                                <div className="salary-warning-content">
                                    <h4>Important Notice</h4>
                                    <p>
                                        This is a <strong>one-time entry</strong>. Once you submit your salary information,
                                        it will be <strong>permanently locked</strong> and cannot be changed by anyone (including admins).
                                    </p>
                                    <p>
                                        Salary increments can only be applied through the increment system.
                                    </p>
                                </div>
                                <button
                                    className="salary-warning-dismiss"
                                    onClick={() => setShowWarning(false)}
                                >
                                    <i className="fas fa-check-circle"></i> I Understand
                                </button>
                            </div>
                        </div>
                    )}

                    <form id="salaryForm" onSubmit={handleSubmit} className="salary-form">
                        <div className="salary-form-group">
                            <label htmlFor="basic_salary">
                                Basic Salary <span className="salary-required">*</span>
                            </label>
                            <div className="salary-input-wrapper">
                                <span className="salary-currency">Rs.</span>
                                <input
                                    type="number"
                                    id="basic_salary"
                                    name="basic_salary"
                                    value={formData.basic_salary}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    required
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>

                        <div className="salary-form-group">
                            <label htmlFor="allowances">
                                Allowances (Optional)
                            </label>
                            <div className="salary-input-wrapper">
                                <span className="salary-currency">Rs.</span>
                                <input
                                    type="number"
                                    id="allowances"
                                    name="allowances"
                                    value={formData.allowances}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>

                        <div className="salary-form-group">
                            <label htmlFor="effective_from">
                                Effective From <span className="salary-required">*</span>
                            </label>
                            <div className="salary-input-wrapper date-wrapper">
                                <i className="fas fa-calendar-alt calendar-icon"></i>
                                <input
                                    type="date"
                                    id="effective_from"
                                    name="effective_from"
                                    value={formData.effective_from}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        {totalSalary > 0 && (
                            <div className="salary-summary-card">
                                <div className="summary-row">
                                    <span>Base Pay</span>
                                    <span>Rs. {Number(formData.basic_salary).toLocaleString()}</span>
                                </div>
                                <div className="summary-row">
                                    <span>Allowances</span>
                                    <span>Rs. {(Number(formData.allowances) || 0).toLocaleString()}</span>
                                </div>
                                <div className="summary-divider"></div>
                                <div className="summary-row total">
                                    <span>Annual Total</span>
                                    <span>Rs. {(totalSalary * 12).toLocaleString()}</span>
                                </div>
                                <div className="summary-row net">
                                    <span>Monthly Net</span>
                                    <span>Rs. {totalSalary.toLocaleString()}</span>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="salary-error-message">
                                <i className="fas fa-exclamation-circle"></i> {error}
                            </div>
                        )}
                    </form>
                </div>

                <div className="salary-modal-footer">
                    <button
                        type="button"
                        className="salary-btn-sec"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        form="salaryForm"
                        type="submit"
                        className="salary-btn-prim"
                        disabled={loading}
                    >
                        {loading ? (
                            <><i className="fas fa-circle-notch fa-spin"></i> Processing...</>
                        ) : (
                            <><i className="fas fa-shield-check"></i> Finalize & Lock</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SalaryEntryModal;
