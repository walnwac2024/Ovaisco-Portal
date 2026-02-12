// src/features/leave/services/leaveService.js
import api from "../../../utils/api";

export async function getLeaveTypes() {
    const { data } = await api.get("/leaves/types");
    return data.types || [];
}

export async function applyLeave(payload) {
    const { data } = await api.post("/leaves/apply", payload);
    return data;
}

export async function getMyLeaves() {
    const { data } = await api.get("/leaves/my");
    return data.leaves || [];
}

export async function getLeaveBalances() {
    const { data } = await api.get("/leaves/balances");
    return data.balances || [];
}

export async function getAllLeavesAdmin() {
    const { data } = await api.get("/leaves/admin/all");
    return data.leaves || [];
}

export async function approveLeaveAdmin(id, payload) {
    const { data } = await api.patch(`/leaves/approve/${id}`, payload);
    return data;
}

export async function createLeaveType(payload) {
    const { data } = await api.post("/leaves/types", payload);
    return data;
}

export async function updateLeaveType(id, payload) {
    const { data } = await api.patch(`/leaves/types/${id}`, payload);
    return data;
}

export async function deleteLeaveType(id) {
    const { data } = await api.delete(`/leaves/types/${id}`);
    return data;
}

export async function getLeaveDashboardStats() {
    const { data } = await api.get("/leaves/summary/stats");
    return data;
}

export async function deleteLeaveApplication(id) {
    const { data } = await api.delete(`/leaves/${id}`);
    return data;
}
