// src/features/employees/components/EmployeeApprovals.js
import React from "react";

/* ---------------- Mock data hook ---------------- */
const useEmployeeApprovals = () => {
  const [filters, setFilters] = React.useState({
    station: "ALL",
    department: "ALL",
    empGroup: "ALL",
    employee: "ALL",
    empCode: "",
    empName: "",
    requestType: "ALL",
    action: "ALL",
    flag: "ALL",
  });
  const setFilter = (k, v) => setFilters((s) => ({ ...s, [k]: v }));

  const rows = [
    {
      id: 1,
      requester: { code: "PO-1900", name: "Arsalan Ali", punch: "1900" },
      requestFrom: "Stn: HeadOffice\nDept: Jafferejes Operation\nGrp: Head Group",
      requestType: "Employee Transfer Request",
      status: "Pending",
      transferDate: "17-October-2020",
      department: "Operations",
      manager: "--",
      forwardedOn: "17-Oct-2020 01:37 PM",
      description: "",
    },
    {
      id: 2,
      requester: { code: "267", name: "Danyial Habib", punch: "0267" },
      requestFrom: "Stn: RegionalOffice\nDept: Finance & Accounts\nGrp: Head Group",
      requestType: "Employee Profile Request",
      status: "Pending",
      transferDate: "09-January-2019",
      department: "Finance & Accounts",
      manager: "--",
      forwardedOn: "09-Jan-2019 04:31 PM",
      description: "",
    },
  ];

  return {
    filters,
    setFilter,
    resetFilters: () =>
      setFilters({
        station: "ALL",
        department: "ALL",
        empGroup: "ALL",
        employee: "ALL",
        empCode: "",
        empName: "",
        requestType: "ALL",
        action: "ALL",
        flag: "ALL",
      }),
    rows,
    perPage: 10,
    setPerPage: () => {},
  };
};

/* ---------------- Page ---------------- */
export default function EmployeeApprovals() {
  const { filters, setFilter, resetFilters, rows, perPage, setPerPage } =
    useEmployeeApprovals();

  /* selection for bulk actions */
  const [selectedIds, setSelectedIds] = React.useState(() => new Set());
  const allIds = rows.map((r) => r.id);
  const isAllSelected = rows.length > 0 && selectedIds.size === rows.length;

  const toggleRow = (id) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelectedIds((prev) =>
      prev.size === rows.length ? new Set() : new Set(allIds)
    );

  /* commit modal (bulk & per-row & from details) */
  const [modal, setModal] = React.useState({
    open: false,
    action: /** @type {"approve" | "reject" | null} */ (null),
    ids: /** @type {number[]} */ ([]),
    title: "",          // header like "Approve Request - (PO-1900) Arsalan Ali"
    fromDetails: null,  // when opened from details, store that row to enable Back
  });

  const openModal = ({ action, ids, title = "", fromDetails = null }) =>
    setModal({ open: true, action, ids, title, fromDetails });

  const closeModal = () =>
    setModal({ open: false, action: null, ids: [], title: "", fromDetails: null });

  /* details modal */
  const [detailRow, setDetailRow] = React.useState(null);
  const openDetails = (row) => setDetailRow(row);
  const closeDetails = () => setDetailRow(null);

  /* BULK handlers -> commit popup */
  const bulkApprove = () =>
    openModal({ action: "approve", ids: Array.from(selectedIds), title: "Approve Requests" });
  const bulkReject = () =>
    openModal({ action: "reject", ids: Array.from(selectedIds), title: "Reject Requests" });

  /* single row handlers -> commit popup */
  const singleApprove = (id) => openModal({ action: "approve", ids: [id], title: "Approve Request" });
  const singleReject = (id) => openModal({ action: "reject", ids: [id], title: "Reject Request" });

  /* details -> commit popup with Back */
  const openCommitFromDetails = (action, row) => {
    // close details, open commit with Back capability
    setDetailRow(null);
    openModal({
      action,
      ids: [row.id],
      title: `${cap(action)} Request - (${row.requester.code}) ${row.requester.name}`,
      fromDetails: row,
    });
  };

  /* confirm path */
  const confirmAction = ({ action, ids, comment }) => {
    void action;
    void ids;
    void comment;
    // TODO: call your API and refresh state. For now we just clear selection.
    setSelectedIds(new Set());
  };

  const onConfirmModal = (comment) => {
    if (!modal.action) return;
    confirmAction({ action: modal.action, ids: modal.ids, comment });
    closeModal();
  };

  const onBackFromCommit = () => {
    if (!modal.fromDetails) return;
    const row = modal.fromDetails;
    closeModal();
    setDetailRow(row);
  };

  return (
    <div className="w-full px-3 md:px-6 pb-6">
      <div className="w-full bg-white rounded-lg shadow border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="font-semibold">Employee Approvals</h2>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-700 text-sm"
            title="Filters"
          >
            <ChevronDown className="h-4 w-4" />
            Filters
          </button>
        </div>

        {/* FILTERS */}
        <form className="px-4 pt-4 pb-2">
          <div className="grid grid-cols-12 gap-4">
            <LabeledSelect
              className="col-span-12 md:col-span-6 lg:col-span-3 xl:col-span-2"
              label="Station"
              value={filters.station}
              onChange={(v) => setFilter("station", v)}
              options={["ALL", "Karachi", "Lahore", "Islamabad"]}
            />
            <LabeledSelect
              className="col-span-12 md:col-span-6 lg:col-span-3 xl:col-span-2"
              label="Department"
              value={filters.department}
              onChange={(v) => setFilter("department", v)}
              options={["ALL", "HR", "Finance", "Engineering"]}
            />
            <LabeledSelect
              className="col-span-12 md:col-span-6 lg:col-span-3 xl:col-span-2"
              label="Employee Group"
              value={filters.empGroup}
              onChange={(v) => setFilter("empGroup", v)}
              options={["ALL", "A", "B", "C"]}
            />
            <LabeledSelect
              className="col-span-12 md:col-span-6 lg:col-span-3 xl:col-span-2"
              label="Employee"
              value={filters.employee}
              onChange={(v) => setFilter("employee", v)}
              options={["ALL", "John", "Jane", "Alex"]}
            />
            <LabeledInput
              className="col-span-12 md:col-span-6 lg:col-span-3 xl:col-span-2"
              label="Employee Code"
              value={filters.empCode}
              onChange={(v) => setFilter("empCode", v)}
            />
            <LabeledInput
              className="col-span-12 md:col-span-6 lg:col-span-3 xl:col-span-2"
              label="Employee Name"
              value={filters.empName}
              onChange={(v) => setFilter("empName", v)}
            />
            <LabeledSelect
              className="col-span-12 md:col-span-6 lg:col-span-3 xl:col-span-2"
              label="Request Type"
              value={filters.requestType}
              onChange={(v) => setFilter("requestType", v)}
              options={[
                "ALL",
                "Employee Profile Request",
                "Employee Transfer Request",
                "Info Request",
              ]}
            />
            <LabeledSelect
              className="col-span-12 md:col-span-6 lg:col-span-3 xl:col-span-2"
              label="Action"
              value={filters.action}
              onChange={(v) => setFilter("action", v)}
              options={["ALL", "Approve", "Reject", "Pending"]}
            />
            <LabeledSelect
              className="col-span-12 md:col-span-6 lg:col-span-3 xl:col-span-2"
              label="Flag"
              value={filters.flag}
              onChange={(v) => setFilter("flag", v)}
              options={["ALL", "High", "Normal", "Low"]}
            />
          </div>

          {/* Buttons */}
          <div className="mt-3 mb-1 flex items-center gap-2">
            <BrandButton type="submit">Apply</BrandButton>
            <OutlineButton type="button" onClick={resetFilters}>
              Clear Filters
            </OutlineButton>
          </div>
        </form>

        {/* Toolbar row: "Show … Records" + conditional bulk actions */}
        <div className="px-4 py-3 flex items-center justify-between text-sm border-t">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              className="h-9 rounded-md border px-2"
              value={perPage}
              onChange={(e) => setPerPage(parseInt(e.target.value, 10))}
            >
              {[10, 25, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span>Records</span>
          </div>

          {/* Bulk Approve / Reject only when something is selected */}
          {selectedIds.size > 0 ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={bulkApprove}
                className="h-9 px-4 rounded-md bg-customRed text-white hover:opacity-90"
                title="Approve selected"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={bulkReject}
                className="h-9 px-4 rounded-md border-2 border-customRed text-customRed bg-white hover:bg-customRed hover:text-white"
                title="Reject selected"
              >
                Reject
              </button>
            </div>
          ) : (
            <div />
          )}
        </div>

        {/* TABLE */}
        <div className="border-t">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 sticky top-0 z-10">
                <tr className="[&>th]:py-3 [&>th]:px-4 [&>th]:text-left">
                  <th style={{ width: 36 }}>
                    <input
                      type="checkbox"
                      className="accent-customRed"
                      checked={isAllSelected}
                      onChange={toggleAll}
                    />
                  </th>
                  <th style={{ width: 56 }}>S#</th>
                  <th>Request From</th>
                  <th>Requester Details</th>
                  <th>Request Type</th>
                  <th>Status</th>
                  <th>Details</th>
                  <th>Approvals</th>
                  <th>Forwarded On</th>
                  <th style={{ width: 48 }}>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((r, idx) => {
                  const checked = selectedIds.has(r.id);
                  return (
                    <tr key={r.id} className="[&>td]:py-3 [&>td]:px-4 align-top">
                      <td>
                        <input
                          type="checkbox"
                          className="accent-customRed"
                          checked={checked}
                          onChange={() => toggleRow(r.id)}
                        />
                      </td>
                      <td>{idx + 1}</td>

                      <td className="whitespace-nowrap">
                        <a href="#" className="text-customRed hover:underline">
                          ({r.requester.code}) {r.requester.name}
                        </a>
                      </td>

                      <td className="whitespace-pre-line text-slate-600">
                        {r.requestFrom}
                      </td>

                      <td>{r.requestType}</td>

                      <td>
                        <StatusPill status={r.status} />
                      </td>

                      <td>
                        <IconButton title="Details" onClick={() => openDetails(r)}>
                          <CalendarIcon className="h-4 w-4" />
                        </IconButton>
                      </td>

                      <td>
                        <IconButton title="Approvals">
                          <UsersIcon className="h-4 w-4" />
                        </IconButton>
                      </td>

                      <td className="whitespace-nowrap">{r.forwardedOn}</td>

                      <td>
                        <RowActionMenu
                          onApprove={() => singleApprove(r.id)}
                          onReject={() => singleReject(r.id)}
                        />
                      </td>
                    </tr>
                  );
                })}

                {rows.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-500">
                      No records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer row */}
          <div className="px-4 py-3 text-sm text-slate-600">
            Records 1 - {rows.length} of {rows.length}
          </div>
        </div>
      </div>

      {/* Commit / Confirm Modal */}
      <CommitModal
        open={modal.open}
        mode={modal.action}
        title={modal.title}
        onClose={closeModal}
        onConfirm={onConfirmModal}
        onBack={modal.fromDetails ? onBackFromCommit : undefined}
      />

      {/* Details Modal (Approve/Reject jumps to Commit popup with Back) */}
      <DetailsModal
        row={detailRow}
        onClose={closeDetails}
        onApprove={(row) => openCommitFromDetails("approve", row)}
        onReject={(row) => openCommitFromDetails("reject", row)}
      />
    </div>
  );
}

/* ---------------- Reusable controls ---------------- */
function LabeledInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  className = "",
}) {
  return (
    <label className={`block ${className}`}>
      <div className="text-[13px] text-slate-600 mb-1">{label}</div>
      <input
        type={type}
        className="h-10 w-full rounded-md border px-3 outline-none focus:ring-2 focus:ring-customRed/30"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function LabeledSelect({
  label,
  value,
  onChange,
  options = [],
  className = "",
}) {
  return (
    <label className={`block ${className}`}>
      <div className="text-[13px] text-slate-600 mb-1">{label}</div>
      <select
        className="h-10 w-full rounded-md border px-2 outline-none focus:ring-2 focus:ring-customRed/30"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function BrandButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`h-9 px-4 rounded-md bg-customRed text-white hover:opacity-90 ${className}`}
    >
      {children}
    </button>
  );
}

function OutlineButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`h-9 px-4 rounded-md border border-slate-300 bg-white hover:bg-slate-50 ${className}`}
    >
      {children}
    </button>
  );
}

function StatusPill({ status }) {
  let cls = "bg-amber-100 text-amber-700";
  if (status === "Approved") cls = "bg-emerald-100 text-emerald-700";
  if (status === "Rejected") cls = "bg-rose-100 text-rose-700";
  if (status === "Pending") cls = "bg-amber-100 text-amber-700";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 h-6 text-xs font-medium ${cls}`}
    >
      {status}
    </span>
  );
}

function IconButton({ title, children, ...props }) {
  return (
    <button
      type="button"
      title={title}
      className="inline-flex items-center justify-center h-8 w-8 rounded border bg-white hover:bg-slate-50"
      {...props}
    >
      {children}
    </button>
  );
}

/* ---------------- Row Action Menu (brand color) ---------------- */
function RowActionMenu({ onApprove, onReject }) {
  const [open, setOpen] = React.useState(false);
  const btnRef = React.useRef(null);

  React.useEffect(() => {
    function onDocClick(e) {
      if (!btnRef.current) return;
      if (!btnRef.current.contains(e.target)) setOpen(false);
    }
    function onEsc(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  return (
    <div className="relative inline-block" ref={btnRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Actions"
        className="inline-flex items-center justify-center h-7 w-7 rounded border-2 border-customRed text-customRed bg-white hover:bg-customRed hover:text-white focus:outline-none focus:ring-2 focus:ring-customRed/30"
      >
        <ChevronDown className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-36 rounded-md border border-slate-200 bg-white shadow-lg z-20">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onApprove?.();
            }}
            className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onReject?.();
            }}
            className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------- Commit / Confirm Modal (with Back) ---------------- */
function CommitModal({ open, mode, title, onClose, onConfirm, onBack }) {
  const [comment, setComment] = React.useState("");

  React.useEffect(() => {
    if (open) setComment(""); // reset on open
  }, [open, mode, title]);

  React.useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && (onBack ? onBack() : onClose?.());
    if (!open) return;
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onBack, onClose]);

  if (!open || !mode) return null;

  const isApprove = mode === "approve";
  const header = title || (isApprove ? "Approve Request" : "Reject Request");
  const cta = isApprove ? "Approve" : "Reject";

  const submit = (e) => {
    e.preventDefault();
    onConfirm?.(comment.trim());
  };

  return (
    <div className="fixed inset-0 z-40">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onBack ? onBack : onClose}
        aria-hidden="true"
      />
      {/* dialog */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <form
          onSubmit={submit}
          className="w-full max-w-3xl bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden"
          role="dialog"
          aria-modal="true"
        >
          {/* header */}
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h3 className="font-semibold">{header}</h3>
            <button
              type="button"
              onClick={onBack ? onBack : onClose}
              className="h-7 w-7 inline-flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
              aria-label="Close"
              title="Close"
            >
              ×
            </button>
          </div>

          {/* body */}
          <div className="p-4">
            <label className="block">
              <span className="text-sm text-slate-600">Comments</span>
              <textarea
                rows={5}
                className="mt-2 w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-customRed/30"
                placeholder={isApprove ? "Ok request is approved" : "Request is rejected"}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </label>
          </div>

          {/* footer */}
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <button
              type="button"
              onClick={onBack ? onBack : onClose}
              className="h-9 px-4 rounded-md border border-slate-300 bg-white hover:bg-slate-50"
            >
              Back
            </button>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className={`h-9 px-4 rounded-md ${
                  isApprove
                    ? "bg-customRed text-white hover:opacity-90"
                    : "border-2 border-customRed text-customRed bg-white hover:bg-customRed hover:text-white"
                }`}
              >
                {cta}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------------- Details Modal (opens Commit with Back) ---------------- */
function DetailsModal({ row, onClose, onApprove, onReject }) {
  const [comment, setComment] = React.useState("");

  React.useEffect(() => {
    if (row) setComment(row.description || "");
  }, [row]);

  React.useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && onClose?.();
    if (!row) return;
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [row, onClose]);

  if (!row) return null;

  return (
    <div className="fixed inset-0 z-40">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* dialog */}
      <div className="absolute inset-0 flex items-start justify-center p-4">
        <div className="w-full max-w-3xl bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden mt-10">
          {/* header */}
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h3 className="font-semibold">
              {row.requestType} Detail - ({row.requester.code}) {row.requester.name}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="h-7 w-7 inline-flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
              aria-label="Close"
              title="Close"
            >
              ×
            </button>
          </div>

          {/* body */}
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-12 gap-3">
              <DetailField label="Code" value={row.requester.code} />
              <DetailField label="Punch Code" value={row.requester.punch ?? "--"} />
              <DetailField label="Name" value={row.requester.name} className="col-span-4" />
              <DetailField label="Transfer Date" value={row.transferDate ?? "--"} />
              <DetailField label="Department" value={row.department ?? "--"} />
              <DetailField label="Manager" value={row.manager ?? "--"} />
            </div>

            <div>
              <div className="text-sm text-slate-600 mb-2">Description</div>
              <textarea
                rows={5}
                className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-customRed/30"
                placeholder="Enter comments…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
          </div>

          {/* footer */}
          <div className="px-4 py-3 border-t flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-md border border-slate-300 bg-white hover:bg-slate-50"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => onApprove?.({ ...row, comment })}
              className="h-9 px-4 rounded-md bg-customRed text-white hover:opacity-90"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => onReject?.({ ...row, comment })}
              className="h-9 px-4 rounded-md border-2 border-customRed text-customRed bg-white hover:bg-customRed hover:text-white"
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailField({ label, value, className = "" }) {
  return (
    <div className={`col-span-12 sm:col-span-4 ${className}`}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 rounded-md border bg-slate-50 px-2 py-2 text-sm">
        {value}
      </div>
    </div>
  );
}

/* ---------------- Inline icons ---------------- */
function ChevronDown(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 10l5 5 5-5H7z" />
    </svg>
  );
}
function CalendarIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function UsersIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

/* ---------------- helpers ---------------- */
function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
