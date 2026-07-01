import api from "../../../utils/api";

export async function createComplaint(payload) {
  const { data } = await api.post("/complaints", payload);
  return data;
}

export async function listComplaints(params = {}) {
  const { data } = await api.get("/complaints", { params });
  return data;
}

export async function updateComplaintStatus(id, payload) {
  const { data } = await api.patch(`/complaints/${id}/status`, payload);
  return data;
}
