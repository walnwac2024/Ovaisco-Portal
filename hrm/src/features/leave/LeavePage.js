import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LeaveSidebar from "./components/LeaveSidebar";
import SharedDropdown from "../../components/common/SharedDropdown";
import {
    getLeaveTypes,
    getMyLeaves,
    applyLeave,
    getLeaveBalances,
    getAllLeavesAdmin,
    approveLeaveAdmin,
    createLeaveType,
    updateLeaveType,
    deleteLeaveType,
    deleteLeaveApplication
} from "./services/leaveService";

export default function LeavePage() {
    const { user } = useAuth();
    const [activeKey, setActiveKey] = useState("my-leaves");
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [myLeaves, setMyLeaves] = useState([]);
    const [balances, setBalances] = useState([]);
    const [allLeaves, setAllLeaves] = useState([]);
    const [loading, setLoading] = useState(false);

    // Leave Application Form state
    const [formData, setFormData] = useState({
        leave_type_id: "",
        start_date: "",
        end_date: "",
        reason: "",
    });

    // Leave Settings state
    const [showTypeForm, setShowTypeForm] = useState(false);
    const [typeFormData, setTypeFormData] = useState({ id: null, name: "", entitlement_days: "" });

    const location = useLocation(); // Add hook

    useEffect(() => {
        if (location.state?.activeTab) {
            setActiveKey(location.state.activeTab);
            // Optional: Clear state so refresh doesn't stick? 
            // Actually, keep it simple for now. 
            // If we wanted to clear, we'd navigate matching current path with replace.
        }
    }, [location.state]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const types = await getLeaveTypes();
            setLeaveTypes(types);
            if (activeKey === "my-leaves") {
                const [my, bal] = await Promise.all([getMyLeaves(), getLeaveBalances()]);
                setMyLeaves(my);
                setBalances(bal);
            } else if (activeKey === "leave-approvals") {
                const all = await getAllLeavesAdmin();
                setAllLeaves(all);
            }
        } catch (e) {
            console.error("fetchInitialData error", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeKey === "my-leaves") {
            getMyLeaves().then(setMyLeaves);
            getLeaveBalances().then(setBalances);
        } else if (activeKey === "leave-approvals") {
            getAllLeavesAdmin().then(setAllLeaves);
        } else if (activeKey === "leave-settings") {
            getLeaveTypes().then(setLeaveTypes);
        }
    }, [activeKey]);

    const handleApply = async (e) => {
        e.preventDefault();
        try {
            await applyLeave(formData);
            toast.success("Leave applied successfully");
            setActiveKey("my-leaves");
            setFormData({ leave_type_id: "", start_date: "", end_date: "", reason: "" });
            getMyLeaves().then(setMyLeaves);
            getLeaveBalances().then(setBalances);
        } catch (e) {
            const msg = e.response?.data?.message || "Failed to apply leave";
            toast.error(msg);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            const comment = status === "rejected"
                ? window.prompt("Enter rejection reason:")
                : window.prompt("Optional comment:");

            if (status === "rejected" && !comment) return; // Rejection requires reason

            await approveLeaveAdmin(id, { status, comment: comment || "" });
            toast.success(`Leave ${status} successfully`);
            const all = await getAllLeavesAdmin();
            setAllLeaves(all);
        } catch (e) {
            toast.error("Failed to update status");
        }
    };

    // Settings Handlers
    const handleSaveType = async (e) => {
        e.preventDefault();
        try {
            if (typeFormData.id) {
                await updateLeaveType(typeFormData.id, typeFormData);
            } else {
                await createLeaveType(typeFormData);
            }
            toast.success("Leave type saved successfully");
            setShowTypeForm(false);
            setTypeFormData({ id: null, name: "", entitlement_days: "" });

            // Refresh both leave types and balances
            await Promise.all([
                getLeaveTypes().then(setLeaveTypes),
                getLeaveBalances().then(setBalances)
            ]);
        } catch (e) {
            toast.error("Failed to save leave type");
        }
    };

    const handleDeleteType = async (id) => {
        if (!window.confirm("Are you sure you want to deactivate this leave type?")) return;
        try {
            await deleteLeaveType(id);
            getLeaveTypes().then(setLeaveTypes);
        } catch (e) {
            alert("Failed to delete");
        }
    };

    const handleDeleteLeave = async (id) => {
        if (!window.confirm("Are you sure you want to delete this leave application?")) return;
        try {
            await deleteLeaveApplication(id);
            toast.success("Leave application deleted");
            getMyLeaves().then(setMyLeaves);
            getLeaveBalances().then(setBalances);
        } catch (e) {
            toast.error(e.response?.data?.message || "Failed to delete leave application");
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            <LeaveSidebar
                activeKey={activeKey}
                onNavigate={setActiveKey}
                user={user}
            />

            <section className="flex-1 min-w-0">
                <div className="card min-h-[500px]">
                    <div className="card-header flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <h2 className="card-title order-2 sm:order-1 capitalize">
                            {activeKey.replace("-", " ")}
                        </h2>
                        {activeKey === "leave-settings" && !showTypeForm && (
                            <button
                                onClick={() => { setTypeFormData({ id: null, name: "", entitlement_days: "" }); setShowTypeForm(true); }}
                                className="btn-primary w-full sm:w-auto h-11 px-6 shadow-red-500/10"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                Add Leave Type
                            </button>
                        )}
                    </div>

                    <div className="p-6">
                        {loading && <div className="text-slate-400 text-sm">Loading...</div>}

                        {activeKey === "my-leaves" && (
                            <div className="space-y-6">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {balances.map(b => (
                                        <div key={b.id} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider truncate mb-1" title={b.leave_type_name}>
                                                {b.leave_type_name}
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-2xl font-black text-slate-800">{Number(b.entitlement)}</span>
                                                <span className="text-xs text-slate-500 font-medium">Days Total</span>
                                            </div>
                                            <div className="text-xs text-slate-600 mt-1">
                                                <span className="font-semibold text-emerald-600">{Number(b.balance)}</span> available
                                            </div>
                                            <div className="mt-2 h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-500 ${Number(b.balance) < 2 ? 'bg-rose-400' : 'bg-emerald-400'}`}
                                                    style={{ width: `${(Number(b.balance) / Number(b.entitlement)) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                    {balances.length === 0 && !loading && (
                                        <div className="col-span-full py-4 text-center text-slate-400 text-xs italic">No balances found for the current year.</div>
                                    )}
                                </div>

                                <div className="table-scroll">
                                    <table className="w-full text-sm text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-[11px] text-slate-500 uppercase tracking-wider">
                                                <th className="px-4 py-3 font-semibold">Type</th>
                                                <th className="px-4 py-3 font-semibold">Dates</th>
                                                <th className="px-4 py-3 font-semibold">Days</th>
                                                <th className="px-4 py-3 font-semibold">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {myLeaves.map((l) => (
                                                <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-4 py-4 font-medium text-slate-700">
                                                        {l.leave_type_name}
                                                        {l.approver_name && (l.status === 'approved' || l.status === 'rejected') && (
                                                            <div className="text-[10px] text-slate-400 mt-0.5">
                                                                {l.status === 'approved' ? 'Approved' : 'Rejected'} by {l.approver_name}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4 text-slate-600 font-medium">
                                                        <div className="text-[13px]">{new Date(l.start_date).toLocaleDateString()} - {new Date(l.end_date).toLocaleDateString()}</div>
                                                        {l.rejection_reason && (
                                                            <div className="text-[10px] text-rose-500 mt-1 italic font-medium max-w-[200px] truncate" title={l.rejection_reason}>
                                                                Reason: {l.rejection_reason}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4 text-slate-600 font-bold">{l.total_days}</td>
                                                    <td className="px-4 py-4 flex items-center gap-2">
                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${l.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm shadow-emerald-50' :
                                                            l.status === 'rejected' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                                                'bg-amber-50 text-amber-600 border border-amber-100 animate-pulse'
                                                            }`}>
                                                            {l.status}
                                                        </span>
                                                        {l.status === 'pending' && (
                                                            <button
                                                                onClick={() => handleDeleteLeave(l.id)}
                                                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                                title="Delete applied leave"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {myLeaves.length === 0 && !loading && (
                                                <tr><td colSpan="4" className="text-center py-10 text-slate-400 italic">No leave requests found.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeKey === "apply-leave" && (
                            <form onSubmit={handleApply} className="w-full space-y-6 bg-slate-50/50 p-8 rounded-2xl border border-slate-100">
                                <div className="form-grid">
                                    <div className="md:col-span-2">
                                        <SharedDropdown
                                            label="Leave Type"
                                            value={formData.leave_type_id}
                                            onChange={(val) => setFormData({ ...formData, leave_type_id: val })}
                                            options={balances.map((b) => ({
                                                value: b.leave_type_id,
                                                label: `${b.leave_type_name} (Balance: ${Number(b.balance)} days)`
                                            }))}
                                            placeholder="Select Type"
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label uppercase text-[11px] font-bold">Start Date</label>
                                        <input
                                            type="date"
                                            className="input h-11"
                                            value={formData.start_date}
                                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label uppercase text-[11px] font-bold">End Date</label>
                                        <input
                                            type="date"
                                            className="input h-11"
                                            value={formData.end_date}
                                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="form-label uppercase text-[11px] font-bold">Reason</label>
                                        <textarea
                                            className="textarea min-h-[120px] py-3"
                                            value={formData.reason}
                                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                            required
                                            placeholder="Briefly explain the reason for leave..."
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="flex justify-end pt-2">
                                    <button
                                        type="submit"
                                        className="btn-success w-full sm:w-auto sm:px-12 h-12 shadow-emerald-500/20"
                                    >
                                        Submit Application
                                    </button>
                                </div>
                            </form>
                        )}

                        {activeKey === "leave-approvals" && (
                            <div className="table-scroll">
                                <table className="w-full text-sm text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-[11px] text-slate-500 uppercase tracking-wider">
                                            <th className="px-4 py-3 font-semibold">Employee Info</th>
                                            <th className="px-4 py-3 font-semibold">Type</th>
                                            <th className="px-4 py-3 font-semibold">Dates & Days</th>
                                            <th className="px-4 py-3 font-semibold">Status</th>
                                            <th className="px-4 py-3 text-right font-semibold">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {allLeaves.map((l) => (
                                            <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-4 py-4 text-slate-700">
                                                    <div className="font-bold flex items-center gap-2">
                                                        {l.Employee_Name}
                                                        <span className="px-1.5 py-0.5 bg-slate-100 text-[9px] rounded uppercase text-slate-500">{l.employee_code}</span>
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 font-medium leading-tight mt-1">
                                                        {l.Designations} <br />
                                                        <span className="text-slate-400 font-normal">{l.Department}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-slate-600 font-medium">{l.leave_type_name}</td>
                                                <td className="px-4 py-4 text-slate-600">
                                                    <div className="font-medium text-[13px]">{new Date(l.start_date).toLocaleDateString()} - {new Date(l.end_date).toLocaleDateString()}</div>
                                                    <div className="text-[11px] text-slate-400">{l.total_days} days</div>
                                                    {l.reason && (
                                                        <div className="text-[10px] text-slate-500 mt-1 italic leading-tight border-l-2 border-slate-100 pl-2">
                                                            \"{l.reason}\"
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${l.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                        l.status === 'rejected' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                                            'bg-amber-50 text-amber-600 border border-amber-100'
                                                        }`}>
                                                        {l.status}
                                                    </span>
                                                    {l.handled_by && (
                                                        <div className="text-[9px] text-slate-400 mt-1 uppercase">By {l.handled_by}</div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    {(l.status === "pending" || ((user?.features || []).some(f => ['leave_manage', 'leave_approve'].includes(f.toLowerCase())))) && (
                                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
                                                            {l.status !== 'approved' && (
                                                                <button
                                                                    onClick={() => handleStatusUpdate(l.id, "approved")}
                                                                    className="btn-utility !border-emerald-200 !text-emerald-600 !hover:bg-emerald-50 !h-9 !px-4"
                                                                >
                                                                    Approve
                                                                </button>
                                                            )}
                                                            {l.status !== 'rejected' && (
                                                                <button
                                                                    onClick={() => handleStatusUpdate(l.id, "rejected")}
                                                                    className="btn-utility !border-rose-200 !text-rose-600 !hover:bg-rose-50 !h-9 !px-4"
                                                                >
                                                                    Reject
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeKey === "leave-settings" && (
                            <div className="space-y-6">
                                {showTypeForm ? (
                                    <form onSubmit={handleSaveType} className="w-full space-y-6 bg-slate-50/50 p-8 rounded-2xl border border-slate-100">
                                        <h3 className="text-xs font-bold text-slate-700 uppercase mb-4">{typeFormData.id ? "Edit Leave Type" : "Add New Leave Type"}</h3>
                                        <div className="form-grid">
                                            <div>
                                                <label className="form-label uppercase text-[10px] font-bold">Type Name</label>
                                                <input
                                                    className="input h-10"
                                                    value={typeFormData.name}
                                                    onChange={(e) => setTypeFormData({ ...typeFormData, name: e.target.value })}
                                                    placeholder="e.g. Sick Leave"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="form-label uppercase text-[10px] font-bold">Entitlement (Days)</label>
                                                <input
                                                    type="number"
                                                    className="input h-10"
                                                    value={typeFormData.entitlement_days}
                                                    onChange={(e) => setTypeFormData({ ...typeFormData, entitlement_days: e.target.value })}
                                                    placeholder="e.g. 10"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                                            <button type="button" onClick={() => setShowTypeForm(false)} className="btn-outline w-full sm:w-auto h-11 px-8 text-slate-500">Cancel</button>
                                            <button type="submit" className="btn-primary w-full sm:w-auto h-11 px-8">Save Type</button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="table-scroll">
                                        <table className="w-full text-sm text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-slate-100 text-[11px] text-slate-500 uppercase tracking-wider">
                                                    <th className="px-4 py-3 font-semibold">Name</th>
                                                    <th className="px-4 py-3 font-semibold">Entitlement</th>
                                                    <th className="px-4 py-3 font-semibold">Status</th>
                                                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {leaveTypes.map((t) => (
                                                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-4 py-4 text-slate-800 font-bold">{t.name}</td>
                                                        <td className="px-4 py-4 text-slate-600 font-medium">{t.entitlement_days} Days</td>
                                                        <td className="px-4 py-4">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${t.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                                                {t.is_active ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 text-right space-x-2">
                                                            <button
                                                                onClick={() => {
                                                                    setTypeFormData({
                                                                        id: Number(t.id),
                                                                        name: t.name || "",
                                                                        entitlement_days: t.entitlement_days || ""
                                                                    });
                                                                    setShowTypeForm(true);
                                                                }}
                                                                className="text-slate-400 hover:text-customRed transition-colors"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteType(t.id)}
                                                                className="text-slate-400 hover:text-rose-500 transition-colors"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div >
            </section >
        </div >
    );
}
