// src/features/attendance/components/AddRequestModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { createAttendanceRequest, getSignInTimeForDate } from "../services/requestApi";
import SharedDropdown from "../../../components/common/SharedDropdown";

const required = (v) => (v === undefined || v === null || String(v).trim() === "" ? "Required" : "");

export default function AddRequestModal({ open, onClose, onSaved }) {
  const [employee, setEmployee] = useState("");
  const [attendanceDate, setAttendanceDate] = useState("");
  const [inDate, setInDate] = useState("");
  const [outDate, setOutDate] = useState("");
  const [inTime, setInTime] = useState("");
  const [outTime, setOutTime] = useState("");
  const [attendanceType, setAttendanceType] = useState("Other");
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Close with ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Copy date into in/out date if empty
  useEffect(() => {
    if (attendanceDate) {
      if (!inDate) setInDate(attendanceDate);
      if (!outDate) setOutDate(attendanceDate);
    }
  }, [attendanceDate, inDate, outDate]);

  // Auto fetch Sign-In time after selecting Employee + Attendance Date
  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!employee || !attendanceDate) return;
      try {
        const t = await getSignInTimeForDate(employee, attendanceDate);
        if (!ignore && t) setInTime(t);
      } catch {/* ignore */ }
    }
    load();
    return () => { ignore = true; };
  }, [employee, attendanceDate]);

  const errors = useMemo(() => ({
    employee: required(employee),
    attendanceDate: required(attendanceDate),
    inTime: required(inTime),
    outTime: required(outTime),
    reason: required(reason),
  }), [employee, attendanceDate, inTime, outTime, reason]);

  const showErr = (name) => touched[name] && errors[name];
  const fieldClass = (name) =>
    `input ${showErr(name) ? "ring-2 ring-customRed/40 border-customRed/60" : ""}`;

  const reset = () => {
    setEmployee(""); setAttendanceDate(""); setInDate(""); setOutDate("");
    setInTime(""); setOutTime(""); setAttendanceType("Other"); setReason("");
    setTouched({}); setSubmitting(false);
  };

  const handleClose = () => { reset(); onClose?.(); };

  const onSubmit = async (e) => {
    e.preventDefault();
    setTouched({ employee: true, attendanceDate: true, inTime: true, outTime: true, reason: true });
    if (Object.values(errors).some(Boolean)) return;

    setSubmitting(true);
    try {
      await createAttendanceRequest({
        employee, attendanceDate, inDate, inTime, outDate, outTime, attendanceType, reason,
      });
      onSaved?.();
      handleClose();
    } catch (err) {
      console.error("Submit failed:", err);
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-4xl">
        {/* Header */}
        <div className="modal-header">
          <h2 className="text-lg font-semibold text-gray-800">Add Attendance Request</h2>
          <button className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
            aria-label="Close" onClick={handleClose}>×</button>
        </div>

        {/* Body (form) — same layout as your first screenshot */}
        <form onSubmit={onSubmit} className="modal-body">
          <div className="form-grid">
            {/* Employee */}
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
                options={[
                  { value: "E-1001", label: "E-1001 • Sumitha Thomas" },
                  { value: "E-1002", label: "E-1002 • Ahmed Khan" }
                ]}
                placeholder="Select One"
                searchable={true}
                className={fieldClass("employee")}
              />
            </div>

            {/* Attendance Date */}
            <div>
              <label className="form-label">
                Attendance Date <span className="text-customRed">*</span>
              </label>
              <input
                type="date"
                className={fieldClass("attendanceDate")}
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, attendanceDate: true }))}
              />
            </div>

            {/* In Date */}
            <div>
              <label className="form-label">In Date</label>
              <input type="date" className="input" value={inDate} onChange={(e) => setInDate(e.target.value)} />
            </div>

            {/* In Time (required) */}
            <div>
              <label className="form-label">
                In Time <span className="text-customRed">*</span>
              </label>
              <input
                type="time"
                className={fieldClass("inTime")}
                value={inTime}
                onChange={(e) => setInTime(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, inTime: true }))}
              />
            </div>

            {/* Out Date */}
            <div>
              <label className="form-label">Out Date</label>
              <input type="date" className="input" value={outDate} onChange={(e) => setOutDate(e.target.value)} />
            </div>

            {/* Out Time (required) */}
            <div>
              <label className="form-label">
                Out Time <span className="text-customRed">*</span>
              </label>
              <input
                type="time"
                className={fieldClass("outTime")}
                value={outTime}
                onChange={(e) => setOutTime(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, outTime: true }))}
              />
            </div>

            {/* Attendance Type */}
            <div>
              <label className="form-label">Attendance Type</label>
              <SharedDropdown
                value={attendanceType}
                onChange={(val) => setAttendanceType(val)}
                options={["Other", "In/Out Adjust", "Shift Correction"]}
                placeholder="Select Type"
                searchable={true}
                className="select"
              />
            </div>

            {/* spacer for grid balance */}
            <div className="hidden md:block" />

            {/* Reason (required) */}
            <div className="md:col-span-2">
              <label className="form-label">
                Reason <span className="text-customRed">*</span>
              </label>
              <textarea
                rows={6}
                className={fieldClass("reason")}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, reason: true }))}
              />
            </div>
          </div>

          {/* Footer (Submit bottom-left, like screenshot) */}
          <div className="modal-footer flex-col sm:flex-row">
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={onClose} className="btn-outline h-11 px-8 text-slate-500">
                Cancel
              </button>
              <button type="submit" className="btn-success h-11 px-10 shadow-emerald-500/20">
                Submit Request
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
