import React from "react";
import SharedSidebar from "../../../components/common/SharedSidebar";
import { useAuth } from "../../../context/AuthContext";

const icons = {
  request: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  exemption: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  worksheet: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <rect x="8" y="13" width="8" height="4" />
    </svg>
  ),
  remote: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  shift: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  amend: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  approval: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <polyline points="17 11 19 13 23 9" />
    </svg>
  ),
  schedule: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  audit: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  logs: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06-1.45 2.51-.1-.03a1.65 1.65 0 0 0-1.54.45l-.06.06-2.51-1.45-.1.08a1.65 1.65 0 0 0-1.82 0l-.1-.08-2.51 1.45-.06-.06a1.65 1.65 0 0 0-1.54-.45l-.1.03-1.45-2.51.06-.06a1.65 1.65 0 0 0 .33-1.82V12a1.65 1.65 0 0 0-.33-1.82l-.06-.06 1.45-2.51.1.03a1.65 1.65 0 0 0 1.54-.45l.06-.06 2.51 1.45.1-.08a1.65 1.65 0 0 0 1.82 0l.1.08 2.51-1.45.06.06a1.65 1.65 0 0 0 1.54.45l.1-.03 1.45 2.51-.06.06a1.65 1.65 0 0 0-.33 1.82V12z" />
    </svg>
  )
};

export default function AttendanceSidebar({ items = [], onNavigate, title = "ATTENDANCE" }) {
  const { user } = useAuth();

  const mappedItems = items.map(it => {
    let icon = icons.request;
    let permission = "attendance_view";

    if (it.id === 'exemption-request') icon = icons.exemption;
    if (it.id === 'worksheet') icon = icons.worksheet;
    if (it.id === 'remote-work') icon = icons.remote;
    if (it.id.includes('shift')) icon = icons.shift;
    if (it.id.includes('amend')) {
      icon = icons.amend;
      permission = "attendance_edit";
    }
    if (it.id.includes('approval')) {
      icon = icons.approval;
      permission = "attendance_edit";
    }
    if (it.id === 'schedule') icon = icons.schedule;
    if (it.id === 'location-audit') {
      icon = icons.audit;
      permission = "attendance_audit";
    }
    if (it.id === 'attendance-logs') {
      icon = icons.logs;
      permission = "attendance_view_logs"; // Make sure this matches backend permission check
    }

    if (it.id.includes('settings')) {
      icon = icons.settings;
      permission = "attendance_manage_settings";
    }

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
