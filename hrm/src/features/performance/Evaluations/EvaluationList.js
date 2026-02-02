import React, { useState, useEffect, useCallback } from "react";
import { ClipboardCheck, ArrowRight, User, Search } from "lucide-react";
import api from "../../../utils/api";
import EvaluationForm from "./EvaluationForm";

const STATUS_MAP = {
    self_evaluation: { label: "Self Evaluation", color: "bg-blue-50 text-blue-600" },
    manager_review: { label: "Manager Review", color: "bg-amber-50 text-amber-600" },
    hr_review: { label: "HR Review", color: "bg-purple-50 text-purple-600" },
    final_approval: { label: "Final Approval", color: "bg-cyan-50 text-cyan-600" },
    completed: { label: "Completed", color: "bg-emerald-50 text-emerald-600" }
};

export default function EvaluationList() {
    const [evaluations, setEvaluations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeEvaluation, setActiveEvaluation] = useState(null);
    const [search, setSearch] = useState("");

    const fetchEvaluations = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get("/performance/evaluations");
            setEvaluations(data);
        } catch (err) {
            console.error("fetchEvaluations error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEvaluations();
    }, [fetchEvaluations]);

    const filtered = evaluations.filter(e =>
        e.employee_name.toLowerCase().includes(search.toLowerCase()) ||
        e.cycle_name.toLowerCase().includes(search.toLowerCase())
    );

    if (activeEvaluation) {
        return (
            <EvaluationForm
                evaluationId={activeEvaluation}
                onBack={() => {
                    setActiveEvaluation(null);
                    fetchEvaluations();
                }}
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="card px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by employee or cycle..."
                        className="input pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="card py-20 text-center text-slate-400 font-medium italic">
                        Loading evaluations...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="card py-20 text-center text-slate-400 font-medium italic">
                        No evaluations found.
                    </div>
                ) : (
                    filtered.map((ev) => (
                        <div key={ev.id} className="card p-5 flex items-center justify-between group hover:shadow-md transition-all">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-customRed group-hover:text-white transition-colors">
                                    <User size={24} />
                                </div>
                                <div>
                                    <h3 className="h2 pb-0 leading-tight">{ev.employee_name}</h3>
                                    <p className="text-[11px] text-slate-500 font-black uppercase tracking-wider">{ev.cycle_name}</p>
                                </div>
                            </div>

                            <div className="hidden md:flex flex-col items-center px-10 border-x border-slate-50">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Status</span>
                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight ${STATUS_MAP[ev.status]?.color}`}>
                                    {STATUS_MAP[ev.status]?.label}
                                </span>
                            </div>

                            <div className="hidden lg:flex flex-col items-center px-10">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Score</span>
                                <span className="text-[20px] font-black text-slate-800">{ev.total_score ? parseFloat(ev.total_score).toFixed(1) : "—"}</span>
                            </div>

                            <button
                                onClick={() => setActiveEvaluation(ev.id)}
                                className="btn-outline"
                            >
                                <span className="mr-2">{ev.status === 'completed' ? 'View Details' : 'Continue'}</span>
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
