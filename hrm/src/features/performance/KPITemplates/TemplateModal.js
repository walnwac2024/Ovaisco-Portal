import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { X } from "lucide-react";
import api from "../../../utils/api";

export default function TemplateModal({ template, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        type: "rating_1_5",
        weightage: 1.0,
        evidence_required: false,
        department: ""
    });
    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState([]);

    useEffect(() => {
        if (template) {
            setFormData({
                title: template.title || "",
                description: template.description || "",
                type: template.type || "rating_1_5",
                weightage: template.weightage || 1.0,
                evidence_required: !!template.evidence_required,
                department: template.department || ""
            });
        }

        // Fetch departments for the dropdown
        api.get("/employees/lookups/departments").then(({ data }) => setDepartments(data));
    }, [template]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (template) {
                await api.patch(`/performance/kpis/${template.id}`, formData);
            } else {
                await api.post("/performance/kpis", formData);
            }
            onSuccess();
        } catch (err) {
            console.error("submit error:", err);
            alert("Failed to save template.");
        } finally {
            setLoading(false);
        }
    };

    return ReactDOM.createPortal(
        <div className="modal-overlay">
            <div className="modal-content max-w-lg">
                <div className="modal-header flex-shrink-0">
                    <h3 className="text-lg font-bold text-slate-800">
                        {template ? "Edit Template" : "New KPI Template"}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form id="template-form" onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    <div className="modal-body space-y-3">
                        <div className="space-y-1.5">
                            <label className="form-label">Title <span className="text-customRed">*</span></label>
                            <input
                                type="text"
                                required
                                className="input"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g., Code Quality"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="form-label">Description</label>
                            <textarea
                                className="textarea min-h-[60px]"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe what is being measured..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="form-label">Type</label>
                                <select
                                    className="select"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="rating_1_5">Rating (1-5)</option>
                                    <option value="numeric">Numeric Value</option>
                                    <option value="yes_no">Yes / No</option>
                                    <option value="target_vs_achieved">Target vs Achieved</option>
                                    <option value="text">Text Response</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="form-label">Weight</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    className="input"
                                    value={formData.weightage}
                                    onChange={(e) => setFormData({ ...formData, weightage: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="form-label">Department (Optional)</label>
                            <select
                                className="select"
                                value={formData.department}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                            >
                                <option value="">All Departments</option>
                                {departments.map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-3 py-2">
                            <label className="inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={formData.evidence_required}
                                    onChange={(e) => setFormData({ ...formData, evidence_required: e.target.checked })}
                                />
                                <div className="relative w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-customRed"></div>
                                <span className="ml-3 text-[13px] text-slate-700">Evidence Required</span>
                            </label>
                        </div>
                    </div>
                </form>

                <div className="modal-footer flex-shrink-0 flex-col sm:flex-row">
                    <button type="button" onClick={onClose} className="btn-outline flex-1 sm:flex-none">Cancel</button>
                    <button form="template-form" type="submit" disabled={loading} className="btn-primary flex-1 sm:flex-none">
                        {loading ? "Saving..." : template ? "Update Template" : "Create Template"}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
