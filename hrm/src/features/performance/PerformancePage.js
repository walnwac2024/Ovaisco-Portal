import React, { useState } from "react";
import PerformanceSidebar from "./components/PerformanceSidebar";
import TemplateList from "./KPITemplates/TemplateList";
import CycleList from "./Cycles/CycleList";
import EvaluationList from "./Evaluations/EvaluationList";
import SalesMetricsList from "./Sales/SalesMetricsList";

// Sub-components (Placeholders for now)
const PerformanceDashboard = () => <div className="card p-10 flex items-center justify-center text-slate-400 font-medium italic min-h-[400px]">Dashboard & Analytics — Coming Soon</div>;
const KPITemplates = () => <TemplateList />;
const PerformanceCycles = () => <CycleList />;
const Evaluations = () => <EvaluationList />;
const GoalsOKRs = () => <div className="card p-10 flex items-center justify-center text-slate-400 font-medium italic min-h-[400px]">Goals & OKRs Tracking — Coming Soon</div>;
const SalesPerformance = () => <SalesMetricsList />;
const PIPPlans = () => <div className="card p-10 flex items-center justify-center text-slate-400 font-medium italic min-h-[400px]">PIP (Performance Improvement Plans) — Coming Soon</div>;
const Reports = () => <div className="card p-10 flex items-center justify-center text-slate-400 font-medium italic min-h-[400px]">Performance Reports — Coming Soon</div>;
const Settings = () => <div className="card p-10 flex items-center justify-center text-slate-400 font-medium italic min-h-[400px]">Module Settings — Coming Soon</div>;

export default function PerformancePage() {
    const [activeTab, setActiveTab] = useState("dashboard");

    const renderContent = () => {
        switch (activeTab) {
            case "dashboard": return <PerformanceDashboard />;
            case "kpis": return <KPITemplates />;
            case "cycles": return <PerformanceCycles />;
            case "evaluations": return <Evaluations />;
            case "goals": return <GoalsOKRs />;
            case "sales": return <SalesPerformance />;
            case "pip": return <PIPPlans />;
            case "reports": return <Reports />;
            case "settings": return <Settings />;
            default: return <PerformanceDashboard />;
        }
    };

    return (
        <div className="page">
            <div className="flex flex-col lg:flex-row gap-6 animate-fade-in">
                <PerformanceSidebar activeKey={activeTab} onNavigate={setActiveTab} />

                <main className="flex-1 min-w-0 w-full pb-10">
                    <header className="mb-6">
                        <h1 className="h1 capitalize">
                            {activeTab === 'kpis' ? 'KPI Templates' : activeTab === 'pip' ? 'PIP Plans' : activeTab}
                        </h1>
                        <p className="text-sm text-slate-500 font-medium">Manage and track organization-wide performance</p>
                    </header>

                    <section className="relative z-0">
                        {renderContent()}
                    </section>
                </main>
            </div>
        </div>
    );
}
