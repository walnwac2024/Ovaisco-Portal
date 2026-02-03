// src/features/attendance/components/AttendanceSettings.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  getAttendanceRules,
  getAttendanceShifts,
  updateActiveAttendanceRule,
  updateAttendanceShift,
  bulkAssignAttendanceShift,
} from "../services/attendanceService";
import { useAuth } from "../../../context/AuthContext";
import SharedDropdown from "../../../components/common/SharedDropdown";

function toInputDate(v) {
  if (!v) return "";
  return String(v).slice(0, 10);
}

export default function AttendanceSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savingShiftId, setSavingShiftId] = useState(null);
  const [savingRule, setSavingRule] = useState(false);
  const [error, setError] = useState("");

  const [shifts, setShifts] = useState([]);
  const [rules, setRules] = useState([]);

  // active rule = is_active=1 (fallback first)
  const activeRule = useMemo(
    () => rules?.find((r) => Number(r.is_active) === 1) || rules?.[0] || null,
    [rules]
  );

  const [bulkShiftId, setBulkShiftId] = useState("");
  const [savingBulk, setSavingBulk] = useState(false);
  const [bulkMessage, setBulkMessage] = useState("");

  const [ruleForm, setRuleForm] = useState({
    grace_minutes: 15,
    notify_employee: 1,
    notify_hr_admin: 1,
  });

  useEffect(() => {
    if (!activeRule) return;
    setRuleForm({
      grace_minutes: Number(activeRule.grace_minutes ?? 15),
      notify_employee: Number(activeRule.notify_employee ?? 1),
      notify_hr_admin: Number(activeRule.notify_hr_admin ?? 1),
    });
  }, [activeRule]);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const [s, r] = await Promise.all([getAttendanceShifts(), getAttendanceRules()]);
      setShifts(s);
      setRules(r);
    } catch (e) {
      console.error(e);
      setError("Failed to load attendance settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateShiftLocal = (id, patch) => {
    setShifts((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const saveShift = async (shift) => {
    try {
      setSavingShiftId(shift.id);
      setError("");

      await updateAttendanceShift(shift.id, {
        start_time: shift.start_time,
        end_time: shift.end_time,
        effective_from: toInputDate(shift.effective_from),
        effective_to: toInputDate(shift.effective_to),
        is_active: shift.is_active ? 1 : 0,
      });

      await load();
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "Failed to update shift");
    } finally {
      setSavingShiftId(null);
    }
  };

  const saveRule = async () => {
    try {
      setSavingRule(true);
      setError("");

      await updateActiveAttendanceRule({
        grace_minutes: Number(ruleForm.grace_minutes),
        notify_employee: Number(ruleForm.notify_employee) ? 1 : 0,
        notify_hr_admin: Number(ruleForm.notify_hr_admin) ? 1 : 0,
      });

      await load();
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "Failed to update rule");
    } finally {
      setSavingRule(false);
    }
  };

  const handleBulkAssign = async () => {
    if (!bulkShiftId) {
      setError("Please select a shift first.");
      return;
    }

    if (!window.confirm("Are you sure you want to assign this shift to ALL active employees? This will overwrite their current shift assignments.")) {
      return;
    }

    try {
      setSavingBulk(true);
      setError("");
      setBulkMessage("");
      const res = await bulkAssignAttendanceShift({ shift_id: bulkShiftId });
      setBulkMessage(res.message);
      await load();
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "Failed to perform bulk shift assignment");
    } finally {
      setSavingBulk(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            Attendance Settings
          </h2>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {user?.role?.replace("_", " ") || "User"}
          </span>
        </div>

        <div className="card-body space-y-8">
          {/* RULES */}
          <div className="rounded-2xl border border-slate-100 p-6 bg-slate-50/30">
            <div className="flex items-center justify-between mb-6">
              <div className="text-[13px] font-bold text-slate-700 uppercase tracking-wider">Global Rule</div>

              <button
                onClick={saveRule}
                disabled={savingRule || loading}
                className="btn-primary shadow-red-500/20"
              >
                {savingRule ? "Saving..." : "Save Rule"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="form-label">
                  Grace Minutes
                </label>
                <input
                  type="number"
                  min={0}
                  max={240}
                  value={ruleForm.grace_minutes}
                  onChange={(e) =>
                    setRuleForm((p) => ({ ...p, grace_minutes: e.target.value }))
                  }
                  className="input"
                />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  id="notifyEmp"
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-customRed focus:ring-customRed"
                  checked={!!Number(ruleForm.notify_employee)}
                  onChange={(e) =>
                    setRuleForm((p) => ({
                      ...p,
                      notify_employee: e.target.checked ? 1 : 0,
                    }))
                  }
                />
                <label htmlFor="notifyEmp" className="text-sm font-medium text-slate-700">
                  Email employee
                </label>
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  id="notifyAdmins"
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-customRed focus:ring-customRed"
                  checked={!!Number(ruleForm.notify_hr_admin)}
                  onChange={(e) =>
                    setRuleForm((p) => ({
                      ...p,
                      notify_hr_admin: e.target.checked ? 1 : 0,
                    }))
                  }
                />
                <label htmlFor="notifyAdmins" className="text-sm font-medium text-slate-700">
                  Email HR/Admin/Super Admin
                </label>
              </div>
            </div>

            <p className="mt-3 text-[11px] font-medium text-slate-500 italic">
              Grace is used for late detection + missing attendance alerts.
            </p>
          </div>

          {/* BULK ASSIGN */}
          <div className="rounded-2xl border border-slate-100 p-6 bg-slate-50/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="text-[13px] font-bold text-slate-700 uppercase tracking-wider">Bulk Shift Assignment</div>
              </div>
              <button
                onClick={handleBulkAssign}
                disabled={savingBulk || loading || !bulkShiftId}
                className="btn-primary shadow-red-500/20 whitespace-normal h-auto py-2 text-center"
              >
                {savingBulk ? "Processing..." : "Assign to ALL"}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="w-full sm:max-w-xs">
                <label className="form-label">Select Shift to Apply Everywhere</label>
                <SharedDropdown
                  value={bulkShiftId}
                  onChange={(val) => setBulkShiftId(val)}
                  options={shifts.filter(s => !!Number(s.is_active)).map(s => ({
                    value: s.id,
                    label: `${s.name} (${s.start_time.slice(0, 5)} - ${s.end_time.slice(0, 5)})`
                  }))}
                  placeholder="-- Choose Shift --"
                  searchable={true}
                  className="input"
                />
              </div>
              <p className="text-[11px] font-medium text-slate-500 italic pb-2">
                This will automatically update the shift assignment for all active employees starting from today.
              </p>
            </div>

            {bulkMessage && (
              <div className="mt-4 text-xs font-bold text-slate-600 border border-slate-100 bg-white rounded-xl p-3 flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-slate-400 animate-pulse" />
                {bulkMessage}
              </div>
            )}
          </div>

          {/* SHIFTS */}
          <div className="rounded-2xl border border-slate-100 overflow-hidden bg-white shadow-sm">
            <div className="px-6 py-5 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100">
              <div className="text-[13px] font-bold text-slate-700 uppercase tracking-wider">Shifts Configuration</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-white/60 px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm self-start sm:self-auto">
                Priority: RAMADAN &gt; SUMMER &gt; WINTER
              </div>
            </div>

            <div className="table-scroll">
              <table className="min-w-[1000px] w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-3 sm:px-6 py-4 text-left text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest">Shift Name</th>
                    <th className="px-2 sm:px-6 py-4 text-left text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-tight w-[100px]">Start<br /><span className="text-[9px] opacity-70">Time</span></th>
                    <th className="px-2 sm:px-6 py-4 text-left text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-tight w-[100px]">End<br /><span className="text-[9px] opacity-70">Time</span></th>
                    <th className="px-2 sm:px-6 py-4 text-left text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-tight min-w-[130px]">Effective<br /><span className="text-[9px] opacity-70">From</span></th>
                    <th className="px-2 sm:px-6 py-4 text-left text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-tight min-w-[130px]">Effective<br /><span className="text-[9px] opacity-70">To</span></th>
                    <th className="px-2 sm:px-6 py-4 text-left text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest">Active</th>
                    <th className="px-3 sm:px-6 py-4 text-right text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-slate-400 font-medium">
                        Loading shift data...
                      </td>
                    </tr>
                  ) : shifts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-slate-400 font-medium">
                        No shifts configured.
                      </td>
                    </tr>
                  ) : (
                    shifts.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800">{s.name}</td>

                        <td className="px-2 sm:px-6 py-4">
                          <input
                            type="time"
                            value={String(s.start_time).slice(0, 5)}
                            onChange={(e) =>
                              updateShiftLocal(s.id, {
                                start_time: e.target.value + ":00",
                              })
                            }
                            className="input h-9 py-1 px-2 text-xs w-full sm:w-[120px]"
                          />
                        </td>

                        <td className="px-2 sm:px-6 py-4">
                          <input
                            type="time"
                            value={String(s.end_time).slice(0, 5)}
                            onChange={(e) =>
                              updateShiftLocal(s.id, {
                                end_time: e.target.value + ":00",
                              })
                            }
                            className="input h-9 py-1 px-2 text-xs w-full sm:w-[120px]"
                          />
                        </td>

                        <td className="px-2 sm:px-6 py-4">
                          <input
                            type="date"
                            value={toInputDate(s.effective_from)}
                            onChange={(e) =>
                              updateShiftLocal(s.id, {
                                effective_from: e.target.value,
                              })
                            }
                            className="input h-9 py-1 px-2 text-xs w-full sm:w-[140px]"
                          />
                        </td>

                        <td className="px-6 py-4">
                          <input
                            type="date"
                            value={toInputDate(s.effective_to)}
                            onChange={(e) =>
                              updateShiftLocal(s.id, { effective_to: e.target.value })
                            }
                            className="input h-9 py-1 px-2 text-xs w-[140px]"
                          />
                        </td>

                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 text-customRed focus:ring-customRed"
                            checked={!!Number(s.is_active)}
                            onChange={(e) =>
                              updateShiftLocal(s.id, {
                                is_active: e.target.checked ? 1 : 0,
                              })
                            }
                          />
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => saveShift(s)}
                            disabled={savingShiftId === s.id}
                            className={`btn-primary h-8 px-4 text-[10px] shadow-red-500/10 ${savingShiftId === s.id ? "opacity-30" : ""}`}
                          >
                            {savingShiftId === s.id ? "Saving..." : "Update"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/30 border-t border-slate-100">
              Note: Ramadan dates change yearly — update effective range once per season.
            </div>
          </div>

          {error && (
            <div className="text-xs font-bold text-red-600 border border-red-100 bg-red-50/50 rounded-xl p-4 flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
