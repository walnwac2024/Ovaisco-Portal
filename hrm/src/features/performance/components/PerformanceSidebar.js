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
        <div className="sidebar">
            <div className="sidebar-card">
                <div className="sidebar-heading">Performance Management</div>
                <nav className="sidebar-list">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeKey === item.key;
                        return (
                            <button
                                key={item.key}
                                onClick={() => onNavigate(item.key)}
                                className={`sidebar-item ${isActive ? "sidebar-active" : ""}`}
                            >
                                {isActive && <div className="sidebar-strip" />}
                                <Icon size={18} className="sidebar-icon" />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
