import React from "react";
import {
    BarChart3,
    Target,
    RefreshCcw,
    ClipboardCheck,
    Goal,
    TrendingUp,
    Users,
    FileText,
    Settings
} from "lucide-react";

export default function PerformanceSidebar({ activeKey, onNavigate }) {
    const menuItems = [
        { key: "dashboard", label: "Dashboard", icon: BarChart3 },
        { key: "kpis", label: "KPI Templates", icon: Target },
        { key: "cycles", label: "Cycles", icon: RefreshCcw },
        { key: "evaluations", label: "Evaluations", icon: ClipboardCheck },
        { key: "goals", label: "Goals / OKRs", icon: Goal },
        { key: "sales", label: "Sales Performance", icon: TrendingUp },
        { key: "pip", label: "PIP Plans", icon: Users },
        { key: "reports", label: "Reports", icon: FileText },
        { key: "settings", label: "Settings", icon: Settings },
    ];

    return (
        <div className="w-full lg:w-64 shrink-0 transition-all duration-500 ease-in-out">
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden sticky top-6">
                <div className="hidden lg:block p-6 pb-2 lg:pb-6 border-b border-slate-50 lg:border-b-0">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest leading-relaxed">Performance Management</h3>
                </div>

                <nav className="p-2 lg:p-3 flex flex-row lg:flex-col gap-1 overflow-x-auto no-scrollbar lg:overflow-visible">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeKey === item.key;
                        return (
                            <button
                                key={item.key}
                                onClick={() => onNavigate(item.key)}
                                className={`
                                    relative flex items-center lg:w-full gap-2 lg:gap-3 rounded-2xl px-5 lg:px-4 h-11 lg:h-11 text-[13px] lg:text-[14px] font-bold transition-all duration-200 whitespace-nowrap outline-none text-left shrink-0
                                    ${isActive
                                        ? "bg-customRed/5 text-customRed"
                                        : "text-slate-600 hover:bg-slate-50 active:scale-95"
                                    }
                                `}
                            >
                                {isActive && <span className="hidden lg:block absolute left-0 top-3 h-5 w-[4px] rounded-r-full bg-customRed shadow-[2px_0_8px_rgba(239,68,68,0.4)]" />}
                                {isActive && <span className="lg:hidden absolute bottom-1 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-t-full bg-customRed shadow-[0_-2px_6px_rgba(239,68,68,0.4)]" />}

                                <Icon size={18} className={`transition-colors h-[18px] w-[18px] ${isActive ? "text-customRed" : "text-slate-400"}`} />
                                <span className="truncate">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
