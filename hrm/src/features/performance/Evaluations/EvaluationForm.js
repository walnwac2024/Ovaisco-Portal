import React, { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Save, CheckCircle, Info, Paperclip } from "lucide-react";
import api from "../../../utils/api";

const STEPS = [
    { key: "self_evaluation", label: "Self Evaluation" },
    { key: "manager_review", label: "Manager Review" },
    { key: "hr_review", label: "HR Review" },
    { key: "final_approval", label: "Final Approval" },
    { key: "completed", label: "Completed" }
];

export default function EvaluationForm({ evaluationId, onBack }) {
    const [evaluation, setEvaluation] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [finalComments, setFinalComments] = useState("");

    const fetchDetails = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/performance/evaluations/${evaluationId}`);
            setEvaluation(data);
            setItems(data.items || []);
            setFinalComments(data.final_comments || "");
        } catch (err) {
            console.error("fetchDetails error:", err);
        } finally {
            setLoading(false);
        }
    }, [evaluationId]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    const handleScoreChange = (itemIdx, score) => {
        const updated = [...items];
        updated[itemIdx].score = score;
        setItems(updated);
    };

    const handleCommentChange = (itemIdx, comments) => {
        const updated = [...items];
        updated[itemIdx].comments = comments;
        setItems(updated);
    };

    const handleSubmit = async (nextStatus = null) => {
        try {
            setSaving(true);
            await api.post("/performance/evaluations/submit", {
                evaluation_id: evaluationId,
                items,
                status: nextStatus || evaluation.status,
                final_comments: finalComments
            });
            if (nextStatus) {
                onBack();
            } else {
                alert("Draft saved successfully.");
            }
        } catch (err) {
            console.error("submit error:", err);
            alert("Failed to save evaluation.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="py-20 text-center text-slate-400">Loading evaluation details...</div>;

    const currentStepIdx = STEPS.findIndex(s => s.key === evaluation.status);
    const isCompleted = evaluation.status === "completed";

    return (
        <div className="animate-fade-in transition-all">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={onBack} className="p-3 hover:bg-slate-100 rounded-2xl transition-all">
                    <ArrowLeft size={20} className="text-slate-600" />
                </button>
                <div>
                    <h2 className="h2 pb-1">{evaluation.employee_name} Evaluation</h2>
                    <p className="text-xs text-slate-500 font-black uppercase tracking-widest">{evaluation.cycle_name}</p>
                </div>
            </div>

            {/* Stepper */}
            <div className="mb-10 overflow-x-auto no-scrollbar card p-6">
                <div className="flex items-center justify-between min-w-[600px] px-2">
                    {STEPS.map((s, idx) => {
                        const isPast = idx < currentStepIdx;
                        const isCurrent = idx === currentStepIdx;
                        return (
                            <React.Fragment key={s.key}>
                                <div className="flex flex-col items-center gap-2">
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all ${isPast ? "bg-customRed border-customRed text-white shadow-lg shadow-red-500/20" :
                                            isCurrent ? "border-customRed text-customRed ring-4 ring-customRed/10" :
                                                "border-slate-200 text-slate-300"
                                        }`}>
                                        {isPast ? <CheckCircle size={20} /> : <span className="font-bold">{idx + 1}</span>}
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-tight ${isCurrent ? "text-customRed" : "text-slate-400"}`}>
                                        {s.label}
                                    </span>
                                </div>
                                {idx < STEPS.length - 1 && (
                                    <div className={`flex-1 h-[2px] mx-4 rounded-full ${idx < currentStepIdx ? "bg-customRed" : "bg-slate-100"}`} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* KPI Evaluation Section */}
            <div className="space-y-6">
                <div className="section-divider">
                    <div className="section-indicator" />
                    <h3 className="section-title">KPI Assessment</h3>
                </div>
                {items.map((item, idx) => (
                    <div key={item.id} className="card p-6 shadow-sm">
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-1">
                                <h4 className="font-bold text-slate-800 mb-1">{item.title}</h4>
                                <p className="text-sm text-slate-500 mb-4">{item.description}</p>

                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                                    <Info size={12} />
                                    <span>Weight: {item.weightage} | Type: {item.type.replace('_', ' ')}</span>
                                </div>
                            </div>

                            <div className="w-full md:w-80">
                                <label className="form-label font-bold text-[10px] uppercase tracking-widest text-slate-400">Rating / Value</label>
                                {item.type === 'rating_1_5' ? (
                                    <div className="flex items-center gap-2">
                                        {[1, 2, 3, 4, 5].map(num => (
                                            <button
                                                key={num}
                                                disabled={isCompleted}
                                                onClick={() => handleScoreChange(idx, num)}
                                                className={`h-10 w-10 rounded-xl font-bold transition-all ${item.score == num
                                                        ? "bg-customRed text-white shadow-lg shadow-red-500/20 scale-110"
                                                        : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                                                    }`}
                                            >
                                                {num}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <input
                                        type="text"
                                        disabled={isCompleted}
                                        className="input font-bold text-center"
                                        value={item.score || ""}
                                        onChange={(e) => handleScoreChange(idx, e.target.value)}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-50">
                            <label className="form-label font-bold text-[10px] uppercase tracking-widest text-slate-400">Comments & Evidence</label>
                            <div className="flex flex-col md:flex-row gap-4">
                                <textarea
                                    disabled={isCompleted}
                                    className="textarea flex-1 min-h-[60px]"
                                    placeholder="Provide specific feedback or justification..."
                                    value={item.comments || ""}
                                    onChange={(e) => handleCommentChange(idx, e.target.value)}
                                />
                                {item.evidence_required && (
                                    <div className="w-full md:w-64 flex flex-col gap-2">
                                        <button disabled={isCompleted} className="btn-outline h-auto py-3 flex items-center justify-center gap-2 border-dashed">
                                            <Paperclip size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-widest leading-none mt-0.5">Attach Evidence</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-10 card p-8">
                <h4 className="h2 pb-2">Final Summary & Feedback</h4>
                <textarea
                    disabled={isCompleted}
                    className="textarea min-h-[120px]"
                    placeholder="Overall summary of performance for this cycle..."
                    value={finalComments}
                    onChange={(e) => setFinalComments(e.target.value)}
                />
            </div>

            {!isCompleted && (
                <div className="mt-8 flex items-center justify-end gap-4 pb-10">
                    <button
                        onClick={() => handleSubmit()}
                        disabled={saving}
                        className="btn-outline"
                    >
                        <Save size={18} className="mr-2" />
                        <span>Save Draft</span>
                    </button>
                    <button
                        onClick={() => {
                            const next = STEPS[currentStepIdx + 1]?.key;
                            if (next) handleSubmit(next);
                        }}
                        disabled={saving}
                        className="btn-primary px-8"
                    >
                        <span>Submit to {STEPS[currentStepIdx + 1]?.label}</span>
                    </button>
                </div>
            )}
        </div>
    );
}
