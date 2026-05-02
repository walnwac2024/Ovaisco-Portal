import React from "react";
import SharedSidebar from "../../../components/common/SharedSidebar";

const icons = {
    myLeaves: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    ),
    apply: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
        </svg>
    ),
    approvals: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    ),
    settings: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06-1.45 2.51-.1-.03a1.65 1.65 0 0 0-1.54.45l-.06.06-2.51-1.45-.1.08a1.65 1.65 0 0 0-1.82 0l-.1-.08-2.51 1.45-.1-.03-1.45-2.51.06-.06a1.65 1.65 0 0 0 .33-1.82V12a1.65 1.65 0 0 0-.33-1.82l-.06-.06 1.45-2.51.1.03a1.65 1.65 0 0 0 1.54-.45l.06-.06 2.51 1.45.1-.08a1.65 1.65 0 0 0 1.82 0l.1.08 2.51-1.45.06.06a1.65 1.65 0 0 0 1.54.45l.1-.03 1.45 2.51-.06.06a1.65 1.65 0 0 0-.33 1.82V12z" />
        </svg>
    )
};

const LEAVE_MENU = [
    { id: "my-leaves", label: "My Leaves", permission: "leave_view", icon: icons.myLeaves },
    { id: "apply-leave", label: "Apply Leave", permission: "leave_request", icon: icons.apply },
    { id: "leave-approvals", label: "Leave Approvals", permission: "leave_approve", icon: icons.approvals },
    { id: "leave-settings", label: "Leave Settings", permission: "leave_settings", icon: icons.settings },
];

export default function LeaveSidebar({ activeKey, onNavigate, user }) {
    return (
        <SharedSidebar
            title="LEAVE"
            items={LEAVE_MENU}
            activeKey={activeKey}
            onNavigate={onNavigate}
            userPermissions={user?.features || []}
            userRole={user?.role || ""}
        />
    );
}
