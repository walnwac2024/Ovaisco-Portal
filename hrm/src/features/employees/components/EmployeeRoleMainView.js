// src/features/employees/components/EmployeeRoleMainView.jsx
import React, { useMemo, useState } from "react";
import RoleTemplateModal from "./RoleTemplateModal";

/* --- demo data (replace with API) --- */
const DEMO_EMPLOYEES = [
  { id: "e-1", name: "Ali Asghar Yunus (156)" },
  { id: "e-2", name: "Sumitha Thomas" },
  { id: "e-3", name: "Waqas Falak" },
];

const MODULES = [
  "Attendance","Leave","Payroll","Employee","Reports","Recruitment",
  "Performance","Organization","Letters","Expense","ScheduledReport",
  "ScheduleAlerts","EmployeeSeparation","EmployeeBudgeting","General",
];

const DEFAULT_PERMS = ["View","Create","Edit","Delete","Approve"];

const TEMPLATES = [
  { key: "admin",   label: "System Administrator (Full Access)" },
  { key: "manager", label: "Manager" },
  { key: "viewer",  label: "Viewer" },
];

function seedEmptyRoles() {
  const obj = {}; MODULES.forEach(m => (obj[m] = [])); return obj;
}
function rolesFromTemplate(key) {
  if (key === "admin") {
    const r = {}; MODULES.forEach(m => (r[m] = [...DEFAULT_PERMS])); return r;
  }
  if (key === "manager") {
    const r = {}; MODULES.forEach(m => (r[m] = ["View","Create","Edit","Approve"])); return r;
  }
  if (key === "viewer") {
    const r = {}; MODULES.forEach(m => (r[m] = ["View"])); return r;
  }
  return seedEmptyRoles();
}

export default function EmployeeRoleMainView() {
  // ✅ you can open the template modal anytime
  const [modalOpen, setModalOpen] = useState(false);

  // selected employee (does NOT reset the template/grid)
  const [employeeId, setEmployeeId] = useState("");

  // the chosen template + the currently visible grid
  const [templateKey, setTemplateKey] = useState("");
  const [roles, setRoles]             = useState(seedEmptyRoles());

  const templateLabel = useMemo(() => {
    const t = TEMPLATES.find(t => t.key === templateKey);
    return t ? t.label : "—";
  }, [templateKey]);

  const [openRows, setOpenRows] = useState(new Set());
  const toggleRow = (name) => {
    const n = new Set(openRows); n.has(name) ? n.delete(name) : n.add(name); setOpenRows(n);
  };

  const togglePerm = (mod, perm) => {
    const next = { ...roles };
    const g = new Set(next[mod] || []);
    g.has(perm) ? g.delete(perm) : g.add(perm);
    next[mod] = Array.from(g);
    setRoles(next);
  };
  const toggleAll = (mod, on) => {
    const next = { ...roles };
    next[mod] = on ? [...DEFAULT_PERMS] : [];
    setRoles(next);
  };

  const onApplyTemplate = (tplKey) => {
    setTemplateKey(tplKey);
    setRoles(rolesFromTemplate(tplKey)); // seed grid
    setModalOpen(false);
  };

  const saveRoles = () => {
    if (!employeeId) return;
    // TODO: replace with API call
    void templateKey;
    void roles;
    alert("Roles saved (demo).");
  };

  return (
    <div className=" pr-6 pb-6">
      <div className="bg-white rounded-lg overflow-hidden shadow border border-slate-200">
        {/* Header */}
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="font-semibold">Employee Role</div>
        </div>

        {/* Top controls */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
          <div>
            <label className="text-sm text-slate-600 block mb-1">Employee:</label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)} // ✅ do NOT reset template/grid
              className="h-9 w-full max-w-lg rounded border border-slate-300 px-3 focus:border-customRed focus:ring-customRed"
            >
              <option value="">Select One</option>
              {DEMO_EMPLOYEES.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end md:items-center md:justify-end">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="h-9 px-4 rounded text-white bg-customRed hover:bg-customRed/90 active:bg-customRed/80"
            >
              Apply Role Templates
            </button>
          </div>
        </div>

        {/* Current template label (updates right after modal save) */}
        <div className="px-4 -mt-2 pb-2">
          <span className="text-xs text-slate-500">
            Current Templates:&nbsp;
            <span className="text-customRed font-medium">{templateLabel}</span>
          </span>
        </div>

        {/* Accordion */}
        <div className="p-4 pt-0">
          <div className="rounded-md border border-slate-200 overflow-hidden">
            {MODULES.map((m) => {
              const isOpen = openRows.has(m);
              const grants = new Set(roles[m] || []);
              const all = DEFAULT_PERMS.every(p => grants.has(p));

              return (
                <div key={m} className="border-b last:border-b-0 border-slate-200">
                  <button
                    type="button"
                    onClick={() => toggleRow(m)}
                    className="w-full grid grid-cols-[1fr_auto] items-center text-left px-4 h-11 bg-slate-50 hover:bg-slate-100"
                  >
                    <span className="text-[13px] font-medium text-slate-700">{m}</span>
                    <span className="text-slate-400">{isOpen ? "▴" : "▾"}</span>
                  </button>

                  {isOpen && (
                    <div className="px-4 py-3 bg-white">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm text-slate-700">All Features</label>
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={all}
                            onChange={(e) => toggleAll(m, e.target.checked)}
                          />
                          <span className="text-sm text-slate-600">
                            Grant all permissions in {m}
                          </span>
                        </label>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                        {DEFAULT_PERMS.map((p) => (
                          <label key={p} className="inline-flex items-center gap-2 border border-slate-200 rounded px-3 py-2 hover:bg-slate-50">
                            <input
                              type="checkbox"
                              checked={grants.has(p)}
                              onChange={() => togglePerm(m, p)}
                            />
                            <span className="text-sm">{p}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Save */}
          <div className="mt-4">
            <button
              type="button"
              onClick={saveRoles}
              disabled={!employeeId}
              className={[
                "h-9 px-5 rounded text-white",
                employeeId
                  ? "bg-customRed hover:bg-customRed/90 active:bg-customRed/80"
                  : "bg-slate-300 cursor-not-allowed",
              ].join(" ")}
            >
              Save Roles
            </button>
          </div>
        </div>
      </div>

      {/* Modal: choose template first */}
      <RoleTemplateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={onApplyTemplate}
        options={TEMPLATES}
        initial={templateKey}
      />
    </div>
  );
}
