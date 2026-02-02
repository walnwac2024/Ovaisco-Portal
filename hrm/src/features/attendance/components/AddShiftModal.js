import React, { useEffect, useMemo, useState } from "react";
import { EMPLOYEES } from "../constants";
import SharedDropdown from "../../../components/common/SharedDropdown";

const required = (v) =>
  v === undefined || v === null || String(v).trim() === "" ? "Required" : "";

export default function AddShiftModal({ open, onClose, onSaved, irregular = false }) {
  const [employee, setEmployee] = useState("");
  const [shiftDate, setShiftDate] = useState("");
  const [inTime, setInTime] = useState("");
  const [outTime, setOutTime] = useState("");
  const [reason, setReason] = useState("");
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
      shiftDate: required(shiftDate),
      inTime: required(inTime),
      outTime: required(outTime),
      reason: irregular ? required(reason) : "", // Irregular must provide reason
    }),
    [employee, shiftDate, inTime, outTime, reason, irregular]
  );
  const showErr = (k) => touched[k] && errors[k];

  const input = (k) =>
    `input ${showErr(k) ? "ring-2 ring-customRed/40 border-customRed/60" : ""}`;
  const select = (k) =>
    `select ${showErr(k) ? "ring-2 ring-customRed/40 border-customRed/60" : ""}`;

  const reset = () => {
    setEmployee("");
    setShiftDate("");
    setInTime("");
    setOutTime("");
    setReason("");
    setTouched({});
  };

  const submit = async (e) => {
    e.preventDefault();
    setTouched({ employee: true, shiftDate: true, inTime: true, outTime: true, reason: true });
    if (Object.values(errors).some(Boolean)) return;

    setBusy(true);
    try {
      onSaved?.({
        employee,
        shiftDate,
        inTime,
        outTime,
        details: reason,
        irregular,
        status: "Pending",
        addedOn: new Date().toISOString(),
      });
      reset();
      onClose?.();
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-4xl">
        {/* Header */}
        <div className="modal-header">
          <h2 className="text-lg font-semibold text-gray-800">
            {irregular ? "Add Irregular Shift Request" : "Add Shift Request"}
          </h2>
          <button type="button" onClick={onClose} className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors" aria-label="Close">
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="modal-body">
          <div className="form-grid">
            <div>
              <label className="form-label">Employee <span className="text-customRed">*</span></label>
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
              <label className="form-label">Shift Date <span className="text-customRed">*</span></label>
              <input
                type="date"
                className={input("shiftDate")}
                value={shiftDate}
                onChange={(e) => setShiftDate(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, shiftDate: true }))}
              />
            </div>

            <div>
              <label className="form-label">In Time <span className="text-customRed">*</span></label>
              <input
                type="time"
                className={input("inTime")}
                value={inTime}
                onChange={(e) => setInTime(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, inTime: true }))}
              />
            </div>

            <div>
              <label className="form-label">Out Time <span className="text-customRed">*</span></label>
              <input
                type="time"
                className={input("outTime")}
                value={outTime}
                onChange={(e) => setOutTime(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, outTime: true }))}
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="form-label">
              Details {irregular && <span className="text-customRed">*</span>}
            </label>
            <textarea
              rows={6}
              className={input("reason")}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, reason: true }))}
              placeholder={irregular ? "Explain irregular shift…" : "Optional details…"}
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
