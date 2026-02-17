import React, { useState } from 'react';
import api from '../../../utils/api';
import './IncrementRequestModal.css';

const IncrementRequestModal = ({ currentSalary, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        request_type: 'AMOUNT',
        requested_amount: '',
        requested_percentage: '',
        reason: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const calculateNewSalary = () => {
        if (formData.request_type === 'AMOUNT' && formData.requested_amount) {
            return currentSalary + Number(formData.requested_amount);
        } else if (formData.request_type === 'PERCENTAGE' && formData.requested_percentage) {
            return currentSalary + (currentSalary * Number(formData.requested_percentage) / 100);
        }
        return currentSalary;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.request_type === 'AMOUNT' && (!formData.requested_amount || Number(formData.requested_amount) <= 0)) {
            setError('Please enter a valid increment amount');
            return;
        }

        if (formData.request_type === 'PERCENTAGE' && (!formData.requested_percentage || Number(formData.requested_percentage) <= 0)) {
            setError('Please enter a valid increment percentage');
            return;
        }

        try {
            setLoading(true);
            setError('');

            await api.post('/payroll/increment/request', {
                request_type: formData.request_type,
                requested_amount: formData.request_type === 'AMOUNT' ? Number(formData.requested_amount) : null,
                requested_percentage: formData.request_type === 'PERCENTAGE' ? Number(formData.requested_percentage) : null,
                reason: formData.reason
            });

            onSubmit();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit increment request');
        } finally {
            setLoading(false);
        }
    };

    const newSalary = calculateNewSalary();

    return (
        <div className="increment-modal-overlay" onClick={onClose}>
            <div className="increment-modal" onClick={(e) => e.stopPropagation()}>
                <div className="increment-modal-header">
                    <h2><i className="fas fa-arrow-up"></i> Request Salary Increment</h2>
                    <button className="increment-modal-close" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="increment-form">
                    <div className="increment-current-salary">
                        <span>Current Salary:</span>
                        <span className="increment-salary-amount">Rs. {currentSalary.toLocaleString()}</span>
                    </div>

                    <div className="increment-type-selector">
                        <label>
                            <input
                                type="radio"
                                name="request_type"
                                value="AMOUNT"
                                checked={formData.request_type === 'AMOUNT'}
                                onChange={handleChange}
                            />
                            <span className="increment-type-option">
                                <i className="fas fa-money-bill-wave"></i> Fixed Amount
                            </span>
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="request_type"
                                value="PERCENTAGE"
                                checked={formData.request_type === 'PERCENTAGE'}
                                onChange={handleChange}
                            />
                            <span className="increment-type-option">
                                <i className="fas fa-percent"></i> Percentage
                            </span>
                        </label>
                    </div>

                    {formData.request_type === 'AMOUNT' ? (
                        <div className="increment-form-group">
                            <label htmlFor="requested_amount">
                                Increment Amount <span className="increment-required">*</span>
                            </label>
                            <div className="increment-input-wrapper">
                                <span className="increment-currency">Rs.</span>
                                <input
                                    type="number"
                                    id="requested_amount"
                                    name="requested_amount"
                                    value={formData.requested_amount}
                                    onChange={handleChange}
                                    placeholder="Enter increment amount"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="increment-form-group">
                            <label htmlFor="requested_percentage">
                                Increment Percentage <span className="increment-required">*</span>
                            </label>
                            <div className="increment-input-wrapper">
                                <input
                                    type="number"
                                    id="requested_percentage"
                                    name="requested_percentage"
                                    value={formData.requested_percentage}
                                    onChange={handleChange}
                                    placeholder="Enter percentage"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                />
                                <span className="increment-percent-symbol">%</span>
                            </div>
                        </div>
                    )}

                    <div className="increment-form-group">
                        <label htmlFor="reason">
                            Reason (Optional)
                        </label>
                        <textarea
                            id="reason"
                            name="reason"
                            value={formData.reason}
                            onChange={handleChange}
                            placeholder="Explain why you're requesting this increment..."
                            rows="4"
                        />
                    </div>

                    {newSalary > currentSalary && (
                        <div className="increment-preview">
                            <div className="increment-preview-row">
                                <span>Current Salary:</span>
                                <span>Rs. {currentSalary.toLocaleString()}</span>
                            </div>
                            <div className="increment-preview-row increment-highlight">
                                <span>Increment:</span>
                                <span>+Rs. {(newSalary - currentSalary).toLocaleString()}</span>
                            </div>
                            <div className="increment-preview-row increment-total">
                                <span>New Salary:</span>
                                <span>Rs. {newSalary.toLocaleString()}</span>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="increment-error-message">
                            <i className="fas fa-exclamation-circle"></i> {error}
                        </div>
                    )}

                    <div className="increment-modal-actions">
                        <button
                            type="button"
                            className="increment-btn increment-btn-secondary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="increment-btn increment-btn-primary"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i> Submitting...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-paper-plane"></i> Submit Request
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default IncrementRequestModal;
