import React, { useState } from "react";

/**
 * Copy Role panel — stacked rows like the reference image:
 * Label (left) | Select (right) | * (asterisk)
 * Save button aligned under the selects.
 */
export default function CopyRolePanel() {
  const [fromEmp, setFromEmp] = useState("");
  const [toEmp, setToEmp] = useState("");

  // TODO: wire these to real employees
  const employees = [
    { id: "156", name: "Ali Asghar Yunus (156)" },
    { id: "113", name: "Asif Qamar (113)" },
    { id: "101", name: "John Doe (101)" },
  ];

  const inputCls =
    "h-9 w-[340px] rounded border border-slate-300 bg-white px-3 text-sm " +
    "focus:outline-none focus:ring-2 focus:ring-customRed/30 focus:border-customRed";

  const handleSave = (e) => {
    e.preventDefault();
    if (!fromEmp || !toEmp) return;
    // TODO: call API
  };

  return (
    <div className="w-full max-w-3xl">
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* header */}
        <div className="px-4 py-2 border-b bg-slate-50">
          <h3 className="font-semibold text-[15px] leading-none">Copy Role</h3>
        </div>

        {/* body */}
        <form onSubmit={handleSave} className="px-4 py-4">
          {/* Row 1 */}
          <div className="flex items-center gap-3 py-2">
            <div className="w-64 text-[13px] text-slate-600">
              Copy Roles From (Source):
            </div>
            <select
              className={inputCls}
              value={fromEmp}
              onChange={(e) => setFromEmp(e.target.value)}
            >
              <option value="">Select One</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
            <span className="text-customRed">*</span>
          </div>

          {/* Row 2 */}
          <div className="flex items-center gap-3 py-2">
            <div className="w-64 text-[13px] text-slate-600">
              Copy Roles To (Destination):
            </div>
            <select
              className={inputCls}
              value={toEmp}
              onChange={(e) => setToEmp(e.target.value)}
            >
              <option value="">Select One</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
            <span className="text-customRed">*</span>
          </div>

          {/* Save button aligned under selects */}
          <div className="mt-3 ml-64">
            <button
              type="submit"
              disabled={!fromEmp || !toEmp}
              className="h-9 px-5 rounded bg-customRed text-white shadow-sm
                         hover:bg-customRed/90 active:bg-customRed/95
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
