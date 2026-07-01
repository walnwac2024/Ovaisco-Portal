import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { FaExclamationCircle, FaPlus, FaSyncAlt, FaTicketAlt } from "react-icons/fa";
import SharedDropdown from "../../components/common/SharedDropdown";
import { useAuth } from "../../context/AuthContext";
import {
  createComplaint,
  listComplaints,
  updateComplaintStatus,
} from "./services/complaintService";

const CATEGORY_OPTIONS = [
  { value: "HR", label: "HR" },
  { value: "Payroll", label: "Payroll" },
  { value: "Attendance", label: "Attendance" },
  { value: "IT", label: "IT" },
  { value: "Admin", label: "Admin" },
  { value: "Facilities", label: "Facilities" },
  { value: "Other", label: "Other" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_CLASS = {
  open: "bg-blue-50 text-blue-700 border-blue-100",
  in_progress: "bg-amber-50 text-amber-700 border-amber-100",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-100",
  closed: "bg-slate-100 text-slate-600 border-slate-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-100",
};

const PRIORITY_CLASS = {
  low: "bg-slate-50 text-slate-600",
  medium: "bg-sky-50 text-sky-700",
  high: "bg-orange-50 text-orange-700",
  urgent: "bg-red-50 text-red-700",
};

function titleCase(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeStatusInput(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  const byLabel = STATUS_OPTIONS.find(
    (item) => item.label.toLowerCase() === String(value || "").trim().toLowerCase()
  );

  return byLabel?.value || normalized;
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function isAdminLike(user) {
  const role = String(user?.role || "").toLowerCase();
  const roles = (Array.isArray(user?.roles) ? user.roles : []).map((r) => String(r).toLowerCase());
  const features = (user?.features || []).map((f) => String(f).toLowerCase());
  return (
    ["admin", "super_admin", "hr", "developer"].includes(role) ||
    roles.some((r) => ["admin", "super_admin", "hr", "developer"].includes(r)) ||
    features.includes("complaint_manage") ||
    features.includes("complaint_view_all")
  );
}

export default function ComplaintPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    subject: "",
    category: "HR",
    priority: "medium",
    description: "",
  });
  const [complaints, setComplaints] = useState([]);
  const [canManage, setCanManage] = useState(false);
  const [scope, setScope] = useState("mine");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const localAdminLike = useMemo(() => isAdminLike(user), [user]);

  const loadComplaints = async (nextScope = scope, nextStatus = statusFilter) => {
    try {
      setLoading(true);
      const data = await listComplaints({
        scope: nextScope,
        status: nextStatus || undefined,
      });
      setComplaints(data.complaints || []);
      setCanManage(Boolean(data.canManage));
      if (!data.canManage && nextScope === "all") setScope("mine");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load complaints");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints("mine", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateForm = (patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.subject.trim() || !form.description.trim()) {
      toast.error("Subject and description are required");
      return;
    }

    try {
      setSubmitting(true);
      const data = await createComplaint(form);
      toast.success(`Complaint registered: ${data?.complaint?.ticket_no || "ticket created"}`);
      setForm({ subject: "", category: "HR", priority: "medium", description: "" });
      setScope("mine");
      setStatusFilter("");
      await loadComplaints("mine", "");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to register complaint");
    } finally {
      setSubmitting(false);
    }
  };

  const handleScope = async (nextScope) => {
    setScope(nextScope);
    await loadComplaints(nextScope, statusFilter);
  };

  const handleStatusFilter = async (nextStatus) => {
    setStatusFilter(nextStatus);
    await loadComplaints(scope, nextStatus);
  };

  const handleUpdateStatus = async (complaint) => {
    const nextStatus = window.prompt(
      "Enter status: Open, In Progress, Resolved, Closed, Rejected",
      titleCase(complaint.status || "in_progress")
    );
    if (!nextStatus) return;

    const normalized = normalizeStatusInput(nextStatus);
    if (!STATUS_OPTIONS.some((item) => item.value === normalized)) {
      toast.error("Invalid status");
      return;
    }

    const comment = window.prompt("Optional comment for this ticket:", complaint.admin_comment || "");

    try {
      await updateComplaintStatus(complaint.id, {
        status: normalized,
        admin_comment: comment || "",
      });
      toast.success("Complaint updated");
      await loadComplaints(scope, statusFilter);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update complaint");
    }
  };

  const visibleManage = canManage || localAdminLike;

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-customRed">
            <FaTicketAlt />
            Ticket Desk
          </div>
          <h1 className="mt-3 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Complaints
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Register complaints and track ticket progress inside your own portal.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadComplaints(scope, statusFilter)}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[11px] font-black uppercase tracking-widest text-slate-600 hover:border-customRed hover:text-customRed transition-all"
        >
          <FaSyncAlt />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[420px_minmax(0,1fr)] gap-6 items-start">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="h-10 w-10 rounded-xl bg-customRed text-white flex items-center justify-center shadow-lg shadow-red-500/20">
              <FaPlus />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">
                New Complaint
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                A ticket number will be generated automatically.
              </p>
            </div>
          </div>

          <div>
            <label className="form-label uppercase text-[10px] font-bold">Subject</label>
            <input
              className="input h-11"
              value={form.subject}
              onChange={(event) => updateForm({ subject: event.target.value })}
              placeholder="Short title for your complaint"
              maxLength={180}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SharedDropdown
              label="Category"
              value={form.category}
              onChange={(value) => updateForm({ category: value })}
              options={CATEGORY_OPTIONS}
              placeholder="Select category"
            />
            <SharedDropdown
              label="Priority"
              value={form.priority}
              onChange={(value) => updateForm({ priority: value })}
              options={PRIORITY_OPTIONS}
              placeholder="Select priority"
            />
          </div>

          <div>
            <label className="form-label uppercase text-[10px] font-bold">Description</label>
            <textarea
              className="textarea min-h-[150px] py-3"
              value={form.description}
              onChange={(event) => updateForm({ description: event.target.value })}
              placeholder="Explain what happened and what support you need..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full h-12 rounded-xl shadow-red-500/20 disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Generate Ticket"}
          </button>
        </form>

        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">
                Ticket Register
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {scope === "all" ? "Company tickets for this portal only." : "Your complaint tickets."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => handleScope("mine")}
                  className={`h-9 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    scope === "mine" ? "bg-white text-customRed shadow-sm" : "text-slate-500"
                  }`}
                >
                  Mine
                </button>
                {visibleManage && (
                  <button
                    type="button"
                    onClick={() => handleScope("all")}
                    className={`h-9 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      scope === "all" ? "bg-white text-customRed shadow-sm" : "text-slate-500"
                    }`}
                  >
                    Company
                  </button>
                )}
              </div>

              <SharedDropdown
                className="w-full sm:w-48"
                value={statusFilter}
                onChange={handleStatusFilter}
                options={[{ value: "", label: "All Statuses" }, ...STATUS_OPTIONS]}
                placeholder="All Statuses"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-500">
                  <th className="px-4 py-3 font-black">Ticket</th>
                  <th className="px-4 py-3 font-black">Complaint</th>
                  <th className="px-4 py-3 font-black">Priority</th>
                  <th className="px-4 py-3 font-black">Status</th>
                  <th className="px-4 py-3 font-black">Created</th>
                  {visibleManage && <th className="px-4 py-3 font-black text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={visibleManage ? 6 : 5} className="px-4 py-10 text-center text-sm text-slate-400">
                      Loading complaints...
                    </td>
                  </tr>
                ) : complaints.length === 0 ? (
                  <tr>
                    <td colSpan={visibleManage ? 6 : 5} className="px-4 py-12 text-center">
                      <div className="mx-auto h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300">
                        <FaExclamationCircle />
                      </div>
                      <p className="mt-3 text-sm font-bold text-slate-500">No complaints found</p>
                    </td>
                  </tr>
                ) : (
                  complaints.map((complaint) => (
                    <tr key={complaint.id} className="hover:bg-slate-50/60 transition-colors align-top">
                      <td className="px-4 py-4">
                        <div className="font-black text-[12px] text-slate-900 whitespace-nowrap">
                          {complaint.ticket_no}
                        </div>
                        {scope === "all" && (
                          <div className="mt-1 text-[10px] text-slate-400 font-bold">
                            {complaint.requester_name} {complaint.requester_code ? `(${complaint.requester_code})` : ""}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 min-w-[280px]">
                        <div className="font-bold text-sm text-slate-800">{complaint.subject}</div>
                        <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          {complaint.category}
                        </div>
                        <div className="mt-2 text-xs text-slate-500 leading-relaxed line-clamp-2">
                          {complaint.description}
                        </div>
                        {complaint.admin_comment && (
                          <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                            <span className="font-black uppercase tracking-wider text-slate-400">Response:</span>{" "}
                            {complaint.admin_comment}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${PRIORITY_CLASS[complaint.priority] || PRIORITY_CLASS.medium}`}>
                          {complaint.priority}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${STATUS_CLASS[complaint.status] || STATUS_CLASS.open}`}>
                          {titleCase(complaint.status)}
                        </span>
                        {complaint.handled_by_name && (
                          <div className="mt-1 text-[10px] text-slate-400 font-bold">
                            By {complaint.handled_by_name}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(complaint.created_at)}
                      </td>
                      {visibleManage && (
                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(complaint)}
                            className="btn-utility !h-9 !px-4 !text-[10px]"
                          >
                            Update
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
