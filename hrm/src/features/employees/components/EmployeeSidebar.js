import React from "react";
import SharedSidebar from "../../../components/common/SharedSidebar";
import { useAuth } from "../../../context/AuthContext";

const icons = {
  list: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  transfer: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 3 21 3 21 8" />
      <line x1="4" y1="20" x2="21" y2="3" />
      <polyline points="8 21 3 21 3 16" />
      <line x1="3" y1="21" x2="20" y2="4" />
    </svg>
  ),
  role: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
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
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06-1.45 2.51-.1-.03a1.65 1.65 0 0 0-1.54.45l-.06.06-2.51-1.45-.1.08a1.65 1.65 0 0 0-1.82 0l-.1-.08-2.51 1.45-.06-.06a1.65 1.65 0 0 0-1.54-.45l-.1.03-1.45-2.51.06-.06a1.65 1.65 0 0 0 .33-1.82V12a1.65 1.65 0 0 0-.33-1.82l-.06-.06 1.45-2.51.1.03a1.65 1.65 0 0 0 1.54-.45l.06-.06 2.51 1.45.1-.08a1.65 1.65 0 0 0 1.82 0l.1.08 2.51-1.45.06.06a1.65 1.65 0 0 0 1.54.45l.1-.03 1.45 2.51-.06.06a1.65 1.65 0 0 0-.33 1.82V12z" />
    </svg>
  ),
  timeline: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
};

const MENU_ITEMS = [
  { id: "employee-list", label: "Employee List", permission: "employee_view", icon: icons.list },
  { id: "employee-timeline", label: "Timeline", permission: "timeline_view", icon: icons.timeline },
  { id: "employee-profile-request", label: "Profile Request", permission: "employee_view", status: "working", icon: icons.profile },
  { id: "employee-transfer", label: "Employee Transfer", permission: "employee_edit", status: "working", icon: icons.transfer },
  {
    id: "employee-role",
    label: "Employee Role",
    permission: "employee_edit",
    status: "working",
    icon: icons.role,
    subItems: [
      { id: "employee-role/main", label: "Role List" },
      { id: "employee-role/copy", label: "Copy Role" },
    ]
  },
  { id: "employee-info-request", label: "Info Request", permission: "employee_view", status: "working", icon: icons.info },
  { id: "employee-approvals", label: "Approvals", permission: "employee_edit", status: "working", icon: icons.approvals },
  { id: "employee-settings", label: "Settings", permission: "employee_settings", status: "working", icon: icons.settings },
];

export default function EmployeeSidebar({ activeKey, onNavigate }) {
  const { user } = useAuth();
  return (
    <SharedSidebar
      title="EMPLOYEE"
      items={MENU_ITEMS}
      activeKey={activeKey}
      onNavigate={onNavigate}
      userPermissions={user?.features || []}
    />
  );
}
