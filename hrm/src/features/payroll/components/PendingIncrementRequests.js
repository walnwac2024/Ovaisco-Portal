import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import IncrementGrantModal from './IncrementGrantModal';

const PendingIncrementRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showGrantModal, setShowGrantModal] = useState(false);

    useEffect(() => {
        fetchPendingRequests();
    }, []);

    const fetchPendingRequests = async () => {
        try {
            setLoading(true);
            const response = await api.get('/payroll/increment/requests');
            setRequests(response.data.requests || []);
        } catch (error) {
            console.error('Error fetching pending requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGrantClick = (request) => {
        setSelectedRequest(request);
        setShowGrantModal(true);
    };

    const handleActionComplete = () => {
        setShowGrantModal(false);
        setSelectedRequest(null);
        fetchPendingRequests();
    };

    if (loading) {
        return <div className="payroll-loading">Loading pending requests...</div>;
    }

    return (
        <div>
            <div className="payroll-section-header">
                <h3>Pending Increment Requests</h3>
            </div>

            {requests.length === 0 ? (
                <div className="payroll-card payroll-empty-state">
                    <i className="fas fa-clock payroll-empty-icon"></i>
                    <h3>No Pending Requests</h3>
                    <p>All increment requests have been processed.</p>
                </div>
            ) : (
                <div className="payroll-table-container">
                    <table className="payroll-table">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Request Type</th>
                                <th>Requested Amount</th>
                                <th>Requested On</th>
                                <th>Reason</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map((request) => (
                                <tr key={request.id}>
                                    <td>
                                        <div>
                                            <strong>{request.employee_name}</strong>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                {request.employee_code}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`payroll-badge ${request.request_type === 'SALARY' ? 'payroll-badge-salary' : 'payroll-badge-allowance'}`}>
                                            {request.request_type}
                                        </span>
                                    </td>
                                    <td>
                                        <div>
                                            Rs. {Number(request.requested_amount).toLocaleString()}
                                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                                {request.is_percentage ? `${request.percentage_value}% increase` : 'Fixed amount'}
                                            </div>
                                        </div>
                                    </td>
                                    <td>{new Date(request.requested_at).toLocaleDateString()}</td>
                                    <td>
                                        <div className="payroll-reason-text" title={request.reason}>
                                            {request.reason}
                                        </div>
                                    </td>
                                    <td>
                                        <button
                                            className="payroll-btn payroll-btn-primary"
                                            onClick={() => handleGrantClick(request)}
                                            style={{ padding: '8px 16px', fontSize: '10px' }}
                                        >
                                            Review & Grant
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showGrantModal && (
                <IncrementGrantModal
                    isOpen={showGrantModal}
                    onClose={() => setShowGrantModal(false)}
                    onSuccess={handleActionComplete}
                    requestId={selectedRequest?.id}
                    employeeId={selectedRequest?.employee_id}
                />
            )}
        </div>
    );
};

export default PendingIncrementRequests;
