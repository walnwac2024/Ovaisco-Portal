// src/features/employees/services/employeesApi.js
import api from "../../../utils/api";

// Sample stub kept for compatibility in any old UI that still uses it
const SAMPLE = [
  {
    id: 1,
    code: "E-1001",
    punch_code: "1001",
    employee_name: "Sumitha Thomas",
    cnic: "35202-1234567-1",
    user_name: "sumitha",
    station: "Karachi",
    department: "HR",
    designation: "HR Manager",
    employee_group: "A",
    documents_attached: true,
    role_template: "HR",
    m_att_allow: true,
    status: "Active",
    added_on: "2024-08-01T10:15:00Z",
    modified_on: "2024-08-10T09:05:00Z",
  },
];

/**
 * Old stub - kept so existing code doesn't break.
 */
export async function fetchEmployees(/* filters */) {
  return Promise.resolve({ items: SAMPLE, count: SAMPLE.length });
}

export async function exportEmployees(/* filters */) {
  return Promise.resolve(true);
}

/* ------------------------------------------------------------------
 * NEW: create employee (POST /employees)
 * ------------------------------------------------------------------ */
export async function createEmployee(payload) {
  const { data } = await api.post("/employees", payload);
  return data;
}

/* ------------------------------------------------------------------
 * ✅ NEW: mark inactive / activate (PATCH /employees/:id/status)
 * isActive: true => active (1)
 * isActive: false => inactive (0)
 * ------------------------------------------------------------------ */
export async function updateEmployeeStatus(employeeId, isActive) {
  const { data } = await api.patch(`/employees/${employeeId}/status`, {
    is_active: isActive ? 1 : 0,
  });
  return data;
}

/* ------------------------------------------------------------------
 * NEW: upload documents (POST /employees/:id/documents)
 * ------------------------------------------------------------------ */
export async function uploadEmployeeDocuments(employeeId, docs) {
  if (!employeeId || !docs || !docs.length) return;

  const formData = new FormData();

  docs.forEach((doc) => {
    if (!doc.file) return;
    formData.append("files", doc.file);
    formData.append("titles", doc.title || "");
    formData.append("types", doc.type || "");
    formData.append("issued_at", doc.issuedAt || "");
    formData.append("expires_at", doc.expiresAt || "");
  });

  if ([...formData.keys()].length === 0) return;

  await api.post(`/employees/${employeeId}/documents`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

/* ------------------------------------------------------------------
 * NEW: documents API helpers
 * ------------------------------------------------------------------ */
export async function fetchEmployeeDocuments(employeeId) {
  const { data } = await api.get(`/employees/${employeeId}/documents`);
  return Array.isArray(data) ? data : [];
}

export async function updateEmployeeDocument(employeeId, docId, payload) {
  const { data } = await api.patch(
    `/employees/${employeeId}/documents/${docId}`,
    payload
  );
  return data;
}

export async function deleteEmployeeDocument(employeeId, docId) {
  const { data } = await api.delete(
    `/employees/${employeeId}/documents/${docId}`
  );
  return data;
}

export async function replaceEmployeeDocumentFile(employeeId, docId, file) {
  const fd = new FormData();
  fd.append("file", file);

  const { data } = await api.put(
    `/employees/${employeeId}/documents/${docId}/file`,
    fd,
    { headers: { "Content-Type": "multipart/form-data" } }
  );

  return data;
}
