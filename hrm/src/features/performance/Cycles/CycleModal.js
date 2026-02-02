import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { X } from "lucide-react";
import api from "../../../utils/api";

export default function CycleModal({ onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        name: "",
        start_date: "",
        end_date: "",
        departments: []
    });
    const [loading, setLoading] = useState(false);
    const [allDepartments, setAllDepartments] = useState([]);

    useEffect(() => {
        api.get("/employees/lookups/departments").then(({ data }) => setAllDepartments(data));
    }, []);

    const toggleDept = (dept) => {
        setFormData(prev => {
            const current = prev.departments;
            if (current.includes(dept)) {
                return { ...prev, departments: current.filter(d => d !== dept) };
            } else {
                return { ...prev, departments: [...current, dept] };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await api.post("/performance/cycles", formData);
            onSuccess();
        } catch (err) {
            console.error("submit error:", err);
            alert("Failed to create cycle.");
        } finally {
            setLoading(false);
        }
    };

    return ReactDOM.createPortal(
        <div className="modal-overlay">
            <div className="modal-content max-w-lg">
                <div className="modal-header">
                    <h3 className="text-lg font-bold text-slate-800">New Performance Cycle</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form id="cycle-form" onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className="modal-body space-y-4">
                        <div className="space-y-1.5">
                            <label className="form-label">Cycle Name <span className="text-customRed">*</span></label>
                            <input
                                type="text"
                                required
                                className="input"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Annual Review 2026"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="form-label">Start Date <span className="text-customRed">*</span></label>
                                <input
                                    type="date"
                                    required
                                    className="input px-4"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="form-label">End Date <span className="text-customRed">*</span></label>
                                <input
                                    type="date"
                                    required
                                    className="input px-4"
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="form-label">Included Departments</label>
                            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-slate-100 rounded-2xl custom-scrollbar">
                                {allDepartments.map(dept => (
                                    <button
                                        key={dept}
                                        type="button"
                                        onClick={() => toggleDept(dept)}
                                        className={`px-3 py-2 rounded-xl text-left text-xs font-bold transition-all ${formData.departments.includes(dept)
                                            ? "bg-customRed/10 text-customRed ring-1 ring-customRed/20"
                                            : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                                            }`}
                                    >
                                        {dept}
                                    </button>
                                ))}
                            </div>
                            <p className="mt-1 text-[10px] text-slate-400 font-medium">Leave empty to include all departments</p>
                        </div>
                    </div>
                </form>

                <div className="modal-footer flex-col sm:flex-row">
                    <button type="button" onClick={onClose} className="btn-outline flex-1 sm:flex-none">Cancel</button>
                    <button form="cycle-form" type="submit" disabled={loading} className="btn-primary flex-1 sm:flex-none">
                        {loading ? "Creating..." : "Initiate Cycle"}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
