import React, { useEffect, useMemo, useState } from "react";
import { EMPLOYEES } from "../constants"; // already in your constants
import SharedDropdown from "../../../components/common/SharedDropdown";
// If you have a real list of projects, replace this with your source
const WORKSHEET_PROJECTS = ["Select One", "Website Revamp", "Payroll Cleanup", "Infra Upgrade"];

const required = (v) =>
  v === undefined || v === null || String(v).trim() === "" ? "Required" : "";

export default function AddWorkSheetModal({ open, onClose, onSaved }) {
  const [employee, setEmployee] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [desc, setDesc] = useState("");
  const [lines, setLines] = useState([
    { project: "", startDate: "", endDate: "", startTime: "", endTime: "" },
  ]);
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState({});

  // esc + scroll lock
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const errors = useMemo(
    () => ({
      employee: required(employee),
      title: required(title),
      desc: required(desc),
      // Date is optional in the screenshot, so not required
      // We won't hard-require line-level fields (since they can add/leave blank).
    }),
    [employee, title, desc]
  );
  const showErr = (k) => touched[k] && errors[k];

  const input = (k) =>
    `input ${showErr(k) ? "ring-2 ring-customRed/40 border-customRed/60" : ""}`;
  const select = (k) =>
    `select ${showErr(k) ? "ring-2 ring-customRed/40 border-customRed/60" : ""}`;

  const changeLine = (idx, key, val) =>
    setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, [key]: val } : l)));

  const addLine = () =>
    setLines((ls) => [...ls, { project: "", startDate: "", endDate: "", startTime: "", endTime: "" }]);

  const removeLine = (idx) =>
    setLines((ls) => (ls.length === 1 ? ls : ls.filter((_, i) => i !== idx)));

  const reset = () => {
    setEmployee("");
    setTitle("");
    setDate("");
    setDesc("");
    setLines([{ project: "", startDate: "", endDate: "", startTime: "", endTime: "" }]);
    setTouched({});
  };

  const submit = async (e) => {
    e.preventDefault();
    setTouched({ employee: true, title: true, desc: true });
    if (Object.values(errors).some(Boolean)) return;

    setBusy(true);
    try {
      // TODO: replace with your API call
      // await worksheetApi.create({ employee, title, date, desc, lines })
      onSaved?.({ employee, title, date, desc, lines });
      reset();
      onClose?.();
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-5xl">
        {/* Header */}
        <div className="modal-header">
          <h2 className="text-lg font-semibold text-gray-800">WorkSheet</h2>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body / Form */}
        <form onSubmit={submit} className="modal-body">
          <div className="form-grid">
            <div>
              <label className="form-label">
                Employee <span className="text-customRed">*</span>
              </label>
              <SharedDropdown
                value={employee}
                onChange={(val) => {
                  setEmployee(val);
                  setTouched((t) => ({ ...t, employee: true }));
                }}
                options={EMPLOYEES.filter((x) => x !== "--ALL--")}
                placeholder="Select One"
                searchable={true}
                className={select("employee")}
              />
            </div>

            <div>
              <label className="form-label">
                Title <span className="text-customRed">*</span>
              </label>
              <input
                className={input("title")}
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, title: true }))}
              />
            </div>

            <div>
              <label className="form-label">Date</label>
              <input
                type="date"
                className="input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          {/* Lines grid */}
          <div className="mt-6">
            <div className="mb-2 text-sm font-medium text-gray-900">Lines</div>

            <div className="table-scroll rounded-xl border border-slate-200 shadow-sm bg-white">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 w-10">S#</th>
                    <th className="px-4 py-3 min-w-[200px]">Project</th>
                    <th className="px-4 py-3 min-w-[140px]">Start Date</th>
                    <th className="px-4 py-3 min-w-[140px]">End Date</th>
                    <th className="px-4 py-3 min-w-[100px]">Start Time</th>
                    <th className="px-4 py-3 min-w-[100px]">End Time</th>
                    <th className="px-4 py-3 w-20 text-center">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lines.map((ln, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 text-slate-500 font-medium">{i + 1}</td>
                      <td className="px-4 py-3">
                        <SharedDropdown
                          value={ln.project}
                          onChange={(val) => changeLine(i, "project", val)}
                          options={WORKSHEET_PROJECTS.map((p) => ({
                            value: p === "Select One" ? "" : p,
                            label: p,
                          }))}
                          placeholder="Select"
                          searchable={true}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="date"
                          className="w-full h-9 rounded border border-slate-300 px-2 text-xs focus:ring-1 focus:ring-customRed focus:border-customRed outline-none"
                          value={ln.startDate}
                          onChange={(e) => changeLine(i, "startDate", e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="date"
                          className="w-full h-9 rounded border border-slate-300 px-2 text-xs focus:ring-1 focus:ring-customRed focus:border-customRed outline-none"
                          value={ln.endDate}
                          onChange={(e) => changeLine(i, "endDate", e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="time"
                          className="w-full h-9 rounded border border-slate-300 px-2 text-xs focus:ring-1 focus:ring-customRed focus:border-customRed outline-none"
                          value={ln.startTime}
                          onChange={(e) => changeLine(i, "startTime", e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="time"
                          className="w-full h-9 rounded border border-slate-300 px-2 text-xs focus:ring-1 focus:ring-customRed focus:border-customRed outline-none"
                          value={ln.endTime}
                          onChange={(e) => changeLine(i, "endTime", e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                          onClick={() => removeLine(i)}
                          disabled={lines.length === 1}
                          title={lines.length === 1 ? "At least one line required" : "Delete"}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button type="button" className="btn-chip mt-3" onClick={addLine}>
              + Add New Line
            </button>
          </div>

          <div className="md:col-span-2">
            <label className="form-label">
              Description <span className="text-customRed">*</span>
            </label>
            <textarea
              rows={8}
              className={input("desc")}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, desc: true }))}
              placeholder="Add description…"
            />
          </div>

          <div className="modal-footer flex-col sm:flex-row">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button type="submit" className="btn-primary flex-1 sm:flex-none" disabled={busy}>
                {busy ? "Submitting..." : "Submit"}
              </button>
              <button type="button" className="btn-outline flex-1 sm:flex-none" onClick={onClose} disabled={busy}>
                Back
              </button>
            </div>
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
              Fields marked with <span className="text-customRed">*</span> are mandatory.
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
