// src/features/employees/components/EmployeeSettings.js
import React, { useMemo, useState } from "react";

/* ---------- Icons ---------- */
const ChevronRight = ({ className = "" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M9 6l6 6-6 6" />
  </svg>
);
const Check = ({ className = "" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/* ---------- Small building blocks ---------- */
function LabeledSelect({ label, value, onChange, options = [], className = "" }) {
  return (
    <label className={`block ${className}`}>
      <div className="text-[12px] text-slate-600 mb-1">{label}</div>
      <select
        className="h-9 w-full rounded-md border px-2 text-sm outline-none focus:ring-2 focus:ring-customRed/30"
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

function Accordion({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-slate-200">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50"
      >
        <span className="font-medium">{title}</span>
        <ChevronRight className={`h-5 w-5 text-customRed transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      {open && <div className="px-4 pb-4 pt-1 border-t border-slate-100">{children}</div>}
    </div>
  );
}

function Toggle({ checked = false, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
        checked ? "bg-customRed" : "bg-slate-300"
      }`}
      aria-pressed={checked}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
          checked ? "translate-x-4" : "translate-x-1"
        }`}
      />
    </button>
  );
}

/* ---------- Page ---------- */
export default function EmployeeSettings() {
  const [activeTab, setActiveTab] = useState("general");

  /* --- Employee Profile Request state --- */
  const [approvalLevelType, setApprovalLevelType] = useState("Multi Level");
  const [approvalType, setApprovalType] = useState("Two Levels");
  const [selectType1, setSelectType1] = useState("Specific Employee");
  const [employee, setEmployee] = useState("Select One");
  const [selectType2, setSelectType2] = useState("Other");
  const [approvalType2, setApprovalType2] = useState("Employee Reporting Line Manager");
  const saveProfile = () => alert("Saved Employee Profile Request settings");

  /* --- Employee Transfer Request state --- */
  const [trApprovalLevelType, setTrApprovalLevelType] = useState("Auto Approved");
  const [trApprovalType, setTrApprovalType] = useState("Two Levels");
  const [trSelectType1, setTrSelectType1] = useState("Specific Employee");
  const [trEmployee, setTrEmployee] = useState("Ali Asghar Yunus (156)");
  const [trSelectType2, setTrSelectType2] = useState("Other");
  const [trApprovalType2, setTrApprovalType2] = useState("Employee Reporting Line Manager");
  const saveTransfer = () =>
    alert(
      trApprovalLevelType === "Auto Approved"
        ? "Saved Transfer: Auto Approved"
        : "Saved Transfer: Multi Level configuration"
    );

  /* --- Employee Info Request state --- */
  const [infoApprovalLevelType, setInfoApprovalLevelType] = useState("Auto Approved");
  const [infoApprovalType, setInfoApprovalType] = useState("Two Levels");
  const [infoSelectType1, setInfoSelectType1] = useState("Specific Employee");
  const [infoEmployee, setInfoEmployee] = useState("Ali Asghar Yunus (156)");
  const [infoSelectType2, setInfoSelectType2] = useState("Other");
  const [infoApprovalType2, setInfoApprovalType2] = useState("Employee Reporting Line Manager");
  const saveInfo = () =>
    alert(
      infoApprovalLevelType === "Auto Approved"
        ? "Saved Info: Auto Approved"
        : "Saved Info: Multi Level configuration"
    );

  /* --- Employee Field Approval Setting (tab #2) --- */
  const fields = useMemo(
    () => [
      "First Name",
      "Image",
      "Last Name",
      "Mobile No",
      "Email",
      "Is Allow Manual Attendance",
      "Marital Status",
      "Gender",
      "BirthDate",
      "PlaceOfBirth",
      "CnicNo",
      "CnicExpiry",
      "Cnic Issuance Date",
      "Religion",
      "AccountNo",
      "AccountTitle",
      "Bank",
      "BranchCode",
      "Address",
      "Country",
      "City",
      "State",
      "ZipCode",
      "EmergencyContactPerson",
      "Relation Ship With Person",
      "Employee Status",
      "JoiningDate",
      "ConfirmationDate",
      "ResignDate",
      "AcademicInformation",
      "WorkHistory",
      "EmployeeDocuments",
      "EmergencyNumber",
    ],
    []
  );

  const [fieldState, setFieldState] = useState(() =>
    fields.map((name) => ({
      name,
      enable: true,
      approval: true,
      modifiedOn: "17-Oct-2020 01:59 PM",
      modifiedBy: "Asim Qureshi",
    }))
  );

  const flip = (idx, key) =>
    setFieldState((prev) =>
      prev.map((row, i) =>
        i === idx
          ? {
              ...row,
              [key]: !row[key],
              modifiedOn: new Date().toLocaleString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }),
              modifiedBy: "You",
            }
          : row
      )
    );

  const saveFieldSettings = () => {
    void fieldState;
    alert("Employee Field Approval settings saved");
  };

  return (
    <div className="mx-auto w-full max-w-[1180px] px-3 lg:px-4">
      {/* Header styled like "Employee Approvals" */}
      <div className="bg-white rounded-lg shadow border border-slate-200 mt-4">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-base font-semibold text-slate-800">Employee Settings</h2>
          <button
            type="button"
            className="text-sm text-customRed hover:text-customRed/80"
            // onClick={() => ...} // hook up when you add real filters
            title="Filters"
          >
            Filters
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={() => setActiveTab("general")}
          className={`px-4 py-2 text-sm font-semibold rounded-md ${
            activeTab === "general"
              ? "bg-customRed text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          General Employee Setting
        </button>
        <button
          onClick={() => setActiveTab("approval")}
          className={`px-4 py-2 text-sm font-semibold rounded-md ${
            activeTab === "approval"
              ? "bg-customRed text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          Employee Field Approval Setting
        </button>
      </div>

      {/* Card */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="p-4 md:p-5 space-y-3">
          {activeTab === "general" && (
            <div className="space-y-3">
              {/* PROFILE */}
              <Accordion title="Employee Profile Request" defaultOpen>
                <div className="rounded-md bg-slate-50/40 p-3 md:p-4">
                  <div className="grid grid-cols-12 gap-4">
                    <LabeledSelect className="col-span-12 md:col-span-6 lg:col-span-4" label="Approval Level Type" value={approvalLevelType} onChange={setApprovalLevelType} options={["Multi Level", "Single Level"]} />
                    <LabeledSelect className="col-span-12 md:col-span-6 lg:col-span-4" label="Approval Type" value={approvalType} onChange={setApprovalType} options={["One Level", "Two Levels", "Three Levels"]} />
                    <LabeledSelect className="col-span-12 md:col-span-6 lg:col-span-4" label="Select Type" value={selectType1} onChange={setSelectType1} options={["Specific Employee", "Role", "Department"]} />
                    <LabeledSelect className="col-span-12 md:col-span-6 lg:col-span-4" label="Employee" value={employee} onChange={setEmployee} options={["Select One", "John Doe", "Jane Smith", "Alex Lee"]} />
                    <LabeledSelect className="col-span-12 md:col-span-6 lg:col-span-4" label="Select Type" value={selectType2} onChange={setSelectType2} options={["Other", "HR", "Manager", "Custom Group"]} />
                    <LabeledSelect className="col-span-12 md:col-span-6 lg:col-span-4" label="Approval Type 2" value={approvalType2} onChange={setApprovalType2} options={["Employee Reporting Line Manager", "Department Head", "HR Manager"]} />
                  </div>
                  <div className="mt-4">
                    <button type="button" onClick={saveProfile} className="h-9 px-4 rounded-md bg-customRed text-white hover:opacity-90 inline-flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      Save
                    </button>
                  </div>
                </div>
              </Accordion>

              {/* TRANSFER */}
              <Accordion title="Employee Transfer Request" defaultOpen>
                <div className="rounded-md bg-slate-50/40 p-3 md:p-4 space-y-4">
                  {/* Auto Approved block */}
                  <div className="rounded-md border border-slate-200 bg-white p-3">
                    <div className="grid grid-cols-12 gap-4">
                      <LabeledSelect className="col-span-12 md:col-span-6 lg:col-span-4" label="Approval Level Type" value={trApprovalLevelType} onChange={setTrApprovalLevelType} options={["Auto Approved", "Multi Level"]} />
                    </div>
                    <div className="mt-3">
                      <button type="button" onClick={saveTransfer} className="h-9 px-4 rounded-md bg-customRed text-white hover:opacity-90 inline-flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        Save
                      </button>
                    </div>
                  </div>

                  {/* Multi Level block */}
                  {trApprovalLevelType === "Multi Level" && (
                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="grid grid-cols-12 gap-4">
                        <LabeledSelect className="col-span-12 md:col-span-6 lg:col-span-4" label="Approval Level Type" value={trApprovalLevelType} onChange={setTrApprovalLevelType} options={["Multi Level", "Auto Approved"]} />
                        <LabeledSelect className="col-span-12 md:col-span-6 lg:col-span-4" label="Approval Type" value={trApprovalType} onChange={setTrApprovalType} options={["One Level", "Two Levels", "Three Levels"]} />
                        <LabeledSelect className="col-span-12 md:col-span-6 lg:col-span-4" label="Select Type" value={trSelectType1} onChange={setTrSelectType1} options={["Specific Employee", "Role", "Department"]} />
                        <LabeledSelect className="col-span-12 md:col-span-6 lg:col-span-4" label="Employee" value={trEmployee} onChange={setTrEmployee} options={["Ali Asghar Yunus (156)", "Sara Malik (221)", "Hamza Khan (309)"]} />
                        <LabeledSelect className="col-span-12 md:col-span-6 lg:col-span-4" label="Select Type" value={trSelectType2} onChange={setTrSelectType2} options={["Other", "HR", "Manager", "Custom Group"]} />
                        <LabeledSelect className="col-span-12 md:col-span-6 lg:col-span-4" label="Approval Type 2" value={trApprovalType2} onChange={setTrApprovalType2} options={["Employee Reporting Line Manager", "Department Head", "HR Manager"]} />
                      </div>
                      <div className="mt-4">
                        <button type="button" onClick={saveTransfer} className="h-9 px-4 rounded-md bg-customRed text-white hover:opacity-90 inline-flex items-center gap-2">
                          <Check className="h-4 w-4" />
                          Save
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </Accordion>

              {/* INFO */}
              <Accordion title="Employee Info Request" defaultOpen>
                <div className="rounded-md bg-slate-50/40 p-3 md:p-4 space-y-4">
                  {/* Auto Approved block */}
                  <div className="rounded-md border border-slate-200 bg-white p-3">
                    <div className="grid grid-cols-12 gap-4">
                      <LabeledSelect className="col-span-12 md:col-span-6 lg:col-span-4" label="Approval Level Type" value={infoApprovalLevelType} onChange={setInfoApprovalLevelType} options={["Auto Approved", "Multi Level"]} />
                    </div>
                    <div className="mt-3">
                      <button type="button" onClick={saveInfo} className="h-9 px-4 rounded-md bg-customRed text-white hover:opacity-90 inline-flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        Save
                      </button>
                    </div>
                  </div>

                  {/* Multi Level block */}
                  {infoApprovalLevelType === "Multi Level" && (
                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="grid grid-cols-12 gap-4">
                        <LabeledSelect className="col-span-12 md:col-span-6 lg:col-span-4" label="Approval Level Type" value={infoApprovalLevelType} onChange={setInfoApprovalLevelType} options={["Multi Level", "Auto Approved"]} />
                        <LabeledSelect className="col-span-12 md:col-span-6 lg:col-span-4" label="Approval Type" value={infoApprovalType} onChange={setInfoApprovalType} options={["One Level", "Two Levels", "Three Levels"]} />
                        <LabeledSelect className="col-span-12 md:col-span-6 lg:col-span-4" label="Select Type" value={infoSelectType1} onChange={setInfoSelectType1} options={["Specific Employee", "Role", "Department"]} />
                        <LabeledSelect className="col-span-12 md:col-span-6 lg:col-span-4" label="Employee" value={infoEmployee} onChange={setInfoEmployee} options={["Ali Asghar Yunus (156)", "Sara Malik (221)", "Hamza Khan (309)"]} />
                        <LabeledSelect className="col-span-12 md:col-span-6 lg:col-span-4" label="Select Type" value={infoSelectType2} onChange={setInfoSelectType2} options={["Other", "HR", "Manager", "Custom Group"]} />
                        <LabeledSelect className="col-span-12 md:col-span-6 lg:col-span-4" label="Approval Type 2" value={infoApprovalType2} onChange={setInfoApprovalType2} options={["Employee Reporting Line Manager", "Department Head", "HR Manager"]} />
                      </div>
                      <div className="mt-4">
                        <button type="button" onClick={saveInfo} className="h-9 px-4 rounded-md bg-customRed text-white hover:opacity-90 inline-flex items-center gap-2">
                          <Check className="h-4 w-4" />
                          Save
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </Accordion>
            </div>
          )}

          {/* --------- TAB #2: Employee Field Approval Setting --------- */}
          {activeTab === "approval" && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                This is linked with <span className="font-medium">Employee Info Request</span>. If a field’s{" "}
                <span className="font-medium">Enable</span> or <span className="font-medium">On Approval</span> toggle
                is off, the dropdown/input will be disabled and won’t go to approval.
              </p>

              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr className="[&>th]:py-3 [&>th]:px-3 [&>th]:text-left">
                      <th className="w-14">S#</th>
                      <th>Field Name</th>
                      <th className="w-40">Enable</th>
                      <th className="w-44">On Approval</th>
                      <th className="w-[220px]">Modified On</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {fieldState.map((row, idx) => (
                      <tr key={row.name} className="[&>td]:py-3 [&>td]:px-3">
                        <td>{idx + 1}</td>
                        <td className="text-slate-800">{row.name}</td>
                        <td>
                          <Toggle checked={row.enable} onChange={() => flip(idx, "enable")} />
                        </td>
                        <td>
                          <Toggle checked={row.approval} onChange={() => flip(idx, "approval")} />
                        </td>
                        <td className="text-slate-500">
                          {row.modifiedOn}
                          <div className="text-xs">By {row.modifiedBy}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={saveFieldSettings}
                  className="h-9 px-4 rounded-md bg-customRed text-white hover:opacity-90 inline-flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  Save
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Global sticky footer */}
        <div className="sticky bottom-0 border-t border-slate-200 bg-white/95 backdrop-blur px-4 md:px-5 py-3 flex items-center justify-end gap-2 rounded-b-xl">
          <button type="button" className="h-9 px-4 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button
            type="button"
            className="h-9 px-4 rounded-md bg-customRed text-white hover:opacity-90"
            onClick={() => alert("All settings saved")}
          >
            Save All
          </button>
        </div>
      </div>
    </div>
  );
}
