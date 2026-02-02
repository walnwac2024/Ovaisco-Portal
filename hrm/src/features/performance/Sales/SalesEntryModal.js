import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { X } from "lucide-react";
import api from "../../../utils/api";

export default function SalesEntryModal({ onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        employee_id: "",
        date: new Date().toISOString().slice(0, 10),
        revenue: 0,
        leads_assigned: 0,
        leads_contacted: 0,
        leads_closed: 0,
        pipeline_value: 0,
        calls: 0,
        meetings: 0,
        demos: 0,
        follow_ups: 0
    });
    const [loading, setLoading] = useState(false);
    const [salesStaff, setSalesStaff] = useState([]);

    useEffect(() => {
        // Fetch only employees with Sales role or in Sales department
        api.get("/employees?department=Sales").then(({ data }) => setSalesStaff(data.employees || []));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.employee_id) return alert("Please select an employee.");

        try {
            setLoading(true);
            await api.post("/performance/sales/record", formData);
            onSuccess();
        } catch (err) {
            console.error("submit error:", err);
            alert("Failed to record sales metrics.");
        } finally {
            setLoading(false);
        }
    };

    return ReactDOM.createPortal(
        <div className="modal-overlay">
            <div className="modal-content max-w-2xl">
                <div className="modal-header">
                    <h3 className="text-lg font-bold text-slate-800">Record Sales Performance</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form id="sales-form" onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className="modal-body space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="form-label">Sales Staff <span className="text-customRed">*</span></label>
                                <select
                                    required
                                    className="select"
                                    value={formData.employee_id}
                                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                                >
                                    <option value="">Select Staff...</option>
                                    {salesStaff.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.department})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="form-label">Date <span className="text-customRed">*</span></label>
                                <input
                                    type="date"
                                    required
                                    className="input px-4"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="section-divider">
                            <div className="section-indicator" />
                            <h4 className="section-title">Performance Metrics</h4>
                        </div>

                        <div className="form-grid">
                            <div className="space-y-1.5">
                                <label className="form-label">Revenue Achieved ($)</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={formData.revenue_achieved}
                                    onChange={(e) => setFormData({ ...formData, revenue_achieved: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="form-label">Leads Assigned</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={formData.leads_assigned}
                                    onChange={(e) => setFormData({ ...formData, leads_assigned: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="form-label">Leads Closed</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={formData.leads_closed}
                                    onChange={(e) => setFormData({ ...formData, leads_closed: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="form-label">Calls Made</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={formData.calls_made}
                                    onChange={(e) => setFormData({ ...formData, calls_made: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="form-label">Meetings Conducted</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={formData.meetings_conducted}
                                    onChange={(e) => setFormData({ ...formData, meetings_conducted: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="form-label">Product Demos</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={formData.demos_given}
                                    onChange={(e) => setFormData({ ...formData, demos_given: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </form>

                <div className="modal-footer flex-col sm:flex-row">
                    <button type="button" onClick={onClose} className="btn-outline flex-1 sm:flex-none">Cancel</button>
                    <button form="sales-form" type="submit" disabled={loading} className="btn-primary flex-1 sm:flex-none">
                        {loading ? "Saving..." : "Record Data"}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
