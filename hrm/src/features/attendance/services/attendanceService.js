// src/features/attendance/services/attendanceService.js
import api from "../../../utils/api";

// ---- existing demo for Attendance Requests (keep it) ----
const demoRows = [
  {
    id: 1,
    employee: { code: "E-1001", punch: "1001", name: "Sumitha Thomas" },
    date: "2024-08-10",
    changeType: "In/Out Adjust",
    status: "Pending",
    details: "Late arrival due to traffic",
    approvals: "Line Mgr",
    addedOn: "2024-08-10 09:15",
  },
];

export async function fetchAttendanceRequests(filters) {
  await new Promise((r) => setTimeout(r, 200));
  return demoRows;
}

// ---- NEW: attendance core APIs ----
export async function getAttendanceOffices() {
  const { data } = await api.get("/attendance/offices");
  return data.offices || [];
}

export async function getTodayAttendance() {
  const { data } = await api.get("/attendance/today");
  return data;
}

export async function punchAttendance({
  office_id,
  punch_type,
  employee_id,
  note,
  clientTime,
  latitude,
  longitude
}) {
  const { data } = await api.post("/attendance/punch", {
    office_id,
    punch_type,
    employee_id,
    note,
    clientTime,
    latitude,
    longitude,
  });
  return data;
}

// HR/Admin
export async function getAdminMissingAttendance(date) {
  const { data } = await api.get("/attendance/admin/missing", {
    params: { date },
  });
  return data;
}

// --- Super Admin settings ---
export async function getAttendanceShifts() {
  const { data } = await api.get("/attendance/settings/shifts");
  return data.shifts || [];
}

export async function updateAttendanceShift(id, payload) {
  const { data } = await api.put(`/attendance/settings/shifts/${id}`, payload);
  return data;
}

export async function getAttendanceRules() {
  const { data } = await api.get("/attendance/settings/rules");
  return data.rules || [];
}

export async function updateActiveAttendanceRule(payload) {
  const { data } = await api.put("/attendance/settings/rules/active", payload);
  return data;
}

export async function bulkAssignAttendanceShift(payload) {
  const { data } = await api.post("/attendance/settings/shifts/bulk-assign", payload);
  return data;
}

export async function getPersonalAttendanceSummary() {
  const { data } = await api.get("/attendance/summary/personal");
  return data;
}

export async function getMonthlyAttendanceReport(params) {
  const { data } = await api.get("/attendance/report/monthly", { params });
  return data;
}

export async function getAuditLocations() {
  const { data } = await api.get("/attendance/audit-locations");
  return data;
}
