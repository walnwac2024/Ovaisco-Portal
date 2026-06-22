import React, { useState, memo } from "react";
import { BASE_URL } from "../../../utils/api";

function EmployeesTable({
  rows = [],
  firstItem = 1,
  onViewEmployee,
  onEditEmployee,
  onMarkInactive,
  onDeleteEmployee,
}) {
  const [openRowId, setOpenRowId] = useState(null);

  const toggleMenu = (id) => {
    setOpenRowId((prev) => (prev === id ? null : id));
  };

  const getInitials = (name) => {
    if (!name) return "";
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length === 0) return "";
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || "";
    return `${parts[0][0]?.toUpperCase() || ""}${parts[1][0]?.toUpperCase() || ""
      }`;
  };

  // Use same base-url logic as profile/topbar
  const FILE_BASE = BASE_URL;

  return (
    <div className="card !overflow-visible">
      <div className="table-scroll">
        <table className="min-w-full text-sm table-auto sm:table-fixed">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="px-4 py-3 w-12 hidden sm:table-cell">S#</th>
              <th className="px-4 py-3 min-w-[200px]">Employee</th>
              <th className="px-4 py-3 hidden md:table-cell w-[150px]">Department</th>
              <th className="px-4 py-3 hidden lg:table-cell w-[120px]">Station</th>
              <th className="px-4 py-3 hidden xl:table-cell w-[180px]">Designation</th>
              <th className="px-4 py-3 w-16 text-right sticky right-0 bg-slate-50 shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.1)] sm:shadow-none">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center"
                >
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span className="text-sm font-medium">No employees found.</span>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => {
                const isOpen = openRowId === row.id;

                const name =
                  row.employee_name || row.Employee_Name || row.name || "—";
                const code =
                  row.employee_code ||
                  row.employeeCode ||
                  row.Employee_ID ||
                  "—";
                const department = row.department || row.Department || "—";
                const station =
                  row.station || row.Office_Location || row.location || "—";
                const designation =
                  row.designation || row.Designations || row.title || "—";

                const isInactive =
                  row.isActive === false || Number(row.isActive) === 0;

                const avatarUrl = row.profile_picture
                  ? `${FILE_BASE}${row.profile_picture}`
                  : null;
                const initials = getInitials(name);

                return (
                  <tr
                    key={row.id ?? `${firstItem}-${idx}`}
                    className={`hover:bg-slate-50/80 transition-colors border-b last:border-0 ${isInactive ? "opacity-70" : ""}`}
                  >
                    <td className="px-4 py-4 align-top text-xs text-slate-400 hidden sm:table-cell font-mono">
                      {firstItem + idx}
                    </td>

                    <td className="px-4 py-3 align-top">
                      <div className="flex items-start gap-3">
                        {/* Avatar / initials */}
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={name}
                            className="mt-0.5 h-10 w-10 rounded-full object-cover border border-slate-100 shadow-sm"
                          />
                        ) : (
                          <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-customRed text-[12px] font-black text-white uppercase shadow-sm">
                            {initials}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <div className="font-bold text-slate-800 leading-tight truncate text-[14px]">
                              {name}
                            </div>

                            {isInactive && (
                              <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-bold text-red-600 uppercase tracking-wider">
                                Inactive
                              </span>
                            )}
                          </div>

                          <div className="mt-1 text-[11px] text-slate-500 font-medium">
                            <span className="opacity-60">ID:</span> {code}
                          </div>

                          {/* Mobile-only info */}
                          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 md:hidden">
                            <div className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">
                              {department}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium">
                              • {station}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 align-middle text-sm text-slate-600 hidden md:table-cell">
                      {department}
                    </td>

                    <td className="px-4 py-4 align-middle text-sm text-slate-600 hidden lg:table-cell">
                      {station}
                    </td>

                    <td className="px-4 py-4 align-middle text-sm text-slate-600 hidden xl:table-cell">
                      {designation}
                    </td>

                    <td className="px-4 py-3 align-top text-right relative">
                      <button
                        type="button"
                        onClick={() => toggleMenu(row.id)}
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full border border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200 hover:bg-slate-50 transition ${isOpen ? "bg-slate-100 text-slate-700" : ""
                          }`}
                        aria-haspopup="menu"
                        aria-expanded={isOpen}
                      >
                        <span className="sr-only">Actions</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-90" : ""
                            }`}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </button>

                      {isOpen && (
                        <div
                          className="absolute right-0 mt-2 w-44 origin-top-right rounded-lg border border-slate-200 bg-white py-1.5 shadow-lg ring-1 ring-black/5 z-20"
                          role="menu"
                        >
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                            onClick={() => {
                              setOpenRowId(null);
                              onViewEmployee?.(row);
                            }}
                          >
                            <span className="inline-flex h-4 w-4 items-center justify-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                className="h-4 w-4"
                              >
                                <path
                                  d="M2.25 12s2.25-5.25 9.75-5.25S21.75 12 21.75 12 19.5 17.25 12 17.25 2.25 12 2.25 12z"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <circle
                                  cx="12"
                                  cy="12"
                                  r="2.25"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                />
                              </svg>
                            </span>
                            <span>View employee</span>
                          </button>

                          <button
                            type="button"
                            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                            onClick={() => {
                              setOpenRowId(null);
                              onEditEmployee?.(row);
                            }}
                          >
                            <span className="inline-flex h-4 w-4 items-center justify-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                className="h-4 w-4"
                              >
                                <path
                                  d="M15.232 5.232l3.536 3.536M4 20h4l10.5-10.5a1.5 1.5 0 0 0 0-2.121L15.621 4a1.5 1.5 0 0 0-2.121 0L4 13.879V20z"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </span>
                            <span>Edit employee</span>
                          </button>

                          <div className="my-1 border-t border-slate-100" />

                          <button
                            type="button"
                            className={`flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50 ${isInactive ? "text-emerald-600" : "text-red-600"
                              }`}
                            onClick={() => {
                              setOpenRowId(null);
                              onMarkInactive?.(row); // ✅ parent toggles based on row.isActive
                            }}
                          >
                            <span className="inline-flex h-4 w-4 items-center justify-center">
                              {isInactive ? (
                                // check icon
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  className="h-4 w-4"
                                >
                                  <path
                                    d="M20 6L9 17l-5-5"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              ) : (
                                // X icon
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  className="h-4 w-4"
                                >
                                  <path
                                    d="M15 9l-6 6m0-6l6 6"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                            </span>
                            <span>{isInactive ? "Activate employee" : "Mark inactive"}</span>
                          </button>

                          <div className="my-1 border-t border-slate-100" />

                          <button
                            type="button"
                            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                            onClick={() => {
                              setOpenRowId(null);
                              onDeleteEmployee?.(row);
                            }}
                          >
                            <span className="inline-flex h-4 w-4 items-center justify-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                className="h-4 w-4"
                              >
                                <path
                                  d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </span>
                            <span>Delete employee</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default memo(EmployeesTable);
