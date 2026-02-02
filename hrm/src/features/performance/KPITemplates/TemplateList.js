import React, { useState, useEffect, useCallback } from "react";
import { Plus, Search, Edit2, Trash2, Filter } from "lucide-react";
import api from "../../../utils/api";
import TemplateModal from "./TemplateModal";

export default function TemplateList() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [search, setSearch] = useState("");

    const fetchTemplates = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get("/performance/kpis");
            setTemplates(data);
        } catch (err) {
            console.error("fetchTemplates error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    const handleCreate = () => {
        setEditingTemplate(null);
        setShowModal(true);
    };

    const handleEdit = (tmpl) => {
        setEditingTemplate(tmpl);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this template?")) return;
        try {
            await api.delete(`/performance/kpis/${id}`);
            fetchTemplates();
        } catch (err) {
            console.error("delete error:", err);
            alert("Failed to delete template.");
        }
    };

    const filtered = templates.filter(t =>
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.department?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <div className="card px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search templates..."
                        className="input pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <button className="btn-primary" onClick={handleCreate}>
                    <Plus size={18} className="mr-2" />
                    Create Template
                </button>
            </div>

            <div className="card">
                <div className="table-scroll">
                    <table className="table">
                        <thead className="thead">
                            <tr className="tr">
                                <th className="th">Title</th>
                                <th className="th">Department</th>
                                <th className="th">Type</th>
                                <th className="th">Weight</th>
                                <th className="th">Evidence</th>
                                <th className="th text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr className="tr">
                                    <td colSpan="6" className="td text-center text-slate-400 py-10">Loading templates...</td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr className="tr">
                                    <td colSpan="6" className="td text-center text-slate-400 py-10">No templates found.</td>
                                </tr>
                            ) : (
                                filtered.map((t) => (
                                    <tr key={t.id} className="tr">
                                        <td className="td">
                                            <div className="font-bold text-slate-900">{t.title}</div>
                                            <div className="text-xs text-slate-500 line-clamp-1">{t.description}</div>
                                        </td>
                                        <td className="td">
                                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${t.department ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"
                                                }`}>
                                                {t.department || "All Depts"}
                                            </span>
                                        </td>
                                        <td className="td capitalize">{t.type.replace(/_/g, " ")}</td>
                                        <td className="td font-mono font-bold text-customRed">{t.weightage}</td>
                                        <td className="td">
                                            {t.evidence_required ? (
                                                <span className="badge-red">Required</span>
                                            ) : (
                                                <span className="badge-gray">Optional</span>
                                            )}
                                        </td>
                                        <td className="td text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors" title="Edit" onClick={() => handleEdit(t)}>
                                                    <Edit2 size={16} />
                                                </button>
                                                <button className="p-2 hover:bg-red-50 rounded-xl text-red-500 transition-colors" title="Delete" onClick={() => handleDelete(t.id)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <TemplateModal
                    template={editingTemplate}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        setShowModal(false);
                        fetchTemplates();
                    }}
                />
            )}
        </div>
    );
}
