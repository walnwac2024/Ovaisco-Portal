import React from "react";
import SharedSidebar from "../../../components/common/SharedSidebar";
import { useAuth } from "../../../context/AuthContext";

const icons = {
    attendance: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
        </svg>
    ),
};

export default function ReportsSidebar({ items = [], onNavigate, title = "REPORTS" }) {
    const { user } = useAuth();

    const mappedItems = items.map(it => {
        let icon = icons.attendance;
        let permission = "attendance_report";

        return {
            id: it.id,
            label: it.label,
            status: it.status,
            isActive: !!it.active,
            icon: icon,
            permission: permission
        };
    });

    const activeKey = items.find(it => it.active)?.id || "";

    return (
        <SharedSidebar
            title={title}
            items={mappedItems}
            activeKey={activeKey}
            onNavigate={onNavigate}
            userPermissions={user?.features || []}
            userRole={user?.role || ""}
        />
    );
}
