import React, { useState, useEffect, useCallback } from "react";
import { TrendingUp, Plus, DollarSign, Users, Phone, Video, Calendar, CheckCircle, RefreshCcw } from "lucide-react";
import api from "../../../utils/api";
import SalesEntryModal from "./SalesEntryModal";

export default function SalesMetricsList() {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const fetchSummary = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get("/performance/sales/summary");
            setSummary(data);
        } catch (err) {
            console.error("fetchSummary error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    const stats = [
        { label: "Total Revenue", value: summary?.total_revenue ? `$${parseFloat(summary.total_revenue).toLocaleString()}` : "$0", icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Total Leads", value: summary?.total_leads_assigned || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Closed Leads", value: summary?.total_leads_closed || 0, icon: CheckCircle, color: "text-purple-600", bg: "bg-purple-50" },
        { label: "Conv. Rate", value: summary?.total_leads_assigned > 0 ? `${((summary.total_leads_closed / summary.total_leads_assigned) * 100).toFixed(1)}%` : "0%", icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50" },
    ];

    const activities = [
        { label: "Calls", value: summary?.total_calls || 0, icon: Phone },
        { label: "Meetings", value: summary?.total_meetings || 0, icon: Calendar },
        { label: "Demos", value: summary?.total_demos || 0, icon: Video },
        { label: "Follow-ups", value: summary?.total_follow_ups || 0, icon: RefreshCcw },
    ];

    return (
        <div className="space-y-8">
            <div className="flex justify-end">
                <button className="btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} className="mr-2" />
                    Record Sales Data
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <div key={idx} className="card p-6 flex items-center gap-4 hover:shadow-lg transition-all">
                            <div className={`h-14 w-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                                <Icon size={28} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{stat.label}</p>
                                <h4 className="h2 pb-0 tracking-tight">{stat.value}</h4>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="card p-8">
                <h3 className="h2 pb-6 flex items-center gap-3">
                    <TrendingUp size={24} className="text-customRed" />
                    Activity Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {activities.map((act, idx) => {
                        const Icon = act.icon;
                        return (
                            <div key={idx} className="flex flex-col items-center text-center p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                                <div className="h-10 w-10 text-slate-400 mb-2">
                                    <Icon size={24} />
                                </div>
                                <span className="text-2xl font-black text-slate-800 mb-1">{act.value}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{act.label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {showModal && (
                <SalesEntryModal
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        setShowModal(false);
                        fetchSummary();
                    }}
                />
            )}
        </div>
    );
}
