import React, { useState, useEffect, useCallback } from "react";
import { Plus, Calendar, Lock, Unlock, CheckCircle2, MoreVertical } from "lucide-react";
import api from "../../../utils/api";
import CycleModal from "./CycleModal";

const STATUS_COLORS = {
    draft: "bg-slate-100 text-slate-500",
    open: "bg-emerald-50 text-emerald-600",
    locked: "bg-amber-50 text-amber-600",
    closed: "bg-red-50 text-red-600"
};

export default function CycleList() {
    const [cycles, setCycles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const fetchCycles = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get("/performance/cycles");
            setCycles(data);
        } catch (err) {
            console.error("fetchCycles error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCycles();
    }, [fetchCycles]);

    const handleUpdateStatus = async (id, status) => {
        try {
            await api.patch(`/performance/cycles/${id}/status`, { status });
            fetchCycles();
        } catch (err) {
            console.error("update status error:", err);
            alert("Failed to update status.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <button className="btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} className="mr-2" />
                    New Cycle
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 text-center text-slate-400 font-medium">Loading cycles...</div>
                ) : cycles.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-slate-400 font-medium bg-white rounded-2xl border-2 border-dashed border-slate-100 italic">
                        No performance cycles created yet.
                    </div>
                ) : (
                    cycles.map((c) => (
                        <div key={c.id} className="card group hover:shadow-lg transition-all duration-300">
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-red-50 rounded-2xl text-customRed group-hover:bg-customRed group-hover:text-white transition-colors duration-300">
                                        <Calendar size={24} />
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${STATUS_COLORS[c.status]}`}>
                                        {c.status}
                                    </span>
                                </div>

                                <h3 className="h2 mb-1 group-hover:text-customRed transition-colors">{c.name}</h3>
                                <div className="text-xs text-slate-500 font-medium flex items-center gap-2 mb-6">
                                    <span>{new Date(c.start_date).toLocaleDateString()}</span>
                                    <span>→</span>
                                    <span>{new Date(c.end_date).toLocaleDateString()}</span>
                                </div>

                                <div className="flex items-center gap-2 mt-auto">
                                    {c.status === 'draft' && (
                                        <button
                                            onClick={() => handleUpdateStatus(c.id, 'open')}
                                            className="w-full btn-outline border-emerald-200 text-emerald-600 hover:bg-emerald-600 hover:text-white hover:border-emerald-600"
                                        >
                                            Open Cycle
                                        </button>
                                    )}
                                    {c.status === 'open' && (
                                        <button
                                            onClick={() => handleUpdateStatus(c.id, 'locked')}
                                            className="w-full btn-outline border-amber-200 text-amber-600 hover:bg-amber-600 hover:text-white hover:border-amber-600"
                                        >
                                            Lock Cycle
                                        </button>
                                    )}
                                    {c.status === 'locked' && (
                                        <button
                                            onClick={() => handleUpdateStatus(c.id, 'closed')}
                                            className="w-full btn-outline border-red-200 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600"
                                        >
                                            Close Cycle
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showModal && (
                <CycleModal
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        setShowModal(false);
                        fetchCycles();
                    }}
                />
            )}
        </div>
    );
}
