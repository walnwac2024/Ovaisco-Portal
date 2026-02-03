import React, { useState } from "react";
import PerformanceSidebar from "./components/PerformanceSidebar";
import TemplateList from "./KPITemplates/TemplateList";
import CycleList from "./Cycles/CycleList";
import EvaluationList from "./Evaluations/EvaluationList";
import SalesMetricsList from "./Sales/SalesMetricsList";

// Sub-components (Placeholders for now)
const ComingSoon = ({ title }) => (
    <div className="card min-h-[400px] flex flex-col items-center justify-center p-10 text-center animate-fade-in">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100 shadow-sm">
            <span className="text-2xl">🚧</span>
        </div>
        <h3 className="text-lg font-bold text-slate-700 mb-2">{title}</h3>
        <p className="text-sm text-slate-400 max-w-xs mx-auto">This feature is currently under development and will be available in a future update.</p>
        <span className="mt-6 px-3 py-1 bg-customRed/5 text-customRed text-[10px] font-black uppercase tracking-widest rounded-full border border-customRed/10">
            Coming Soon
        </span>
    </div>
);

const PerformanceDashboard = () => <ComingSoon title="Dashboard & Analytics" />;
const KPITemplates = () => <TemplateList />;
const PerformanceCycles = () => <CycleList />;
const Evaluations = () => <EvaluationList />;
const GoalsOKRs = () => <ComingSoon title="Goals & OKRs Tracking" />;
const SalesPerformance = () => <SalesMetricsList />;
const PIPPlans = () => <ComingSoon title="Performance Improvement Plans" />;
const Reports = () => <ComingSoon title="Performance Reports" />;
const Settings = () => <ComingSoon title="Module Settings" />;

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
