// src/features/employees/components/EmployeeInfoRequest.js
import React, { useEffect, useMemo, useState } from "react";
import apiService from "../../../utils/apiService";

/**
 * Employee Info Request (Compact)
 * - Denser filter bar that fits more fields per row
 * - Smaller inputs, labels, and buttons
 * - Tighter table
 */

export default function EmployeeInfoRequest({ rows: externalRows = [], compact = true }) {
  // ----- Demo / fallback data (safe if you already provide rows via props)
  const demoRows = useMemo(
    () => [
      {
        id: 1,
        sn: 1,
        name: "Abdullah Jan Farooqui",
        station: "RegionalOffice",
        department: "Management",
        designation: "Chief Information Officer",
        group: "Head Group",
        status: "Rejected",
        addedOn: "08-Oct-2020 05:49 PM",
        addedBy: "Asim Qureshi",
      },
    ],
    []
  );
  const rows = externalRows.length ? externalRows : demoRows;
  const [employee, setEmployee]=useState([])
   const featchempdata=async ()=>{
    try {
     const response= await apiService.get('/all-employee')
      
      setEmployee(response.data)
    } catch (error) {
      console.error('Failed to fetch employees', error)
    }
   }
   useEffect(()=>{
      featchempdata()
   },[])
  // ----- Filters state (replace with your real source of options/data)
  const [filters, setFilters] = useState({
    station: "",
    department: "",
    employeeGroup: "",
    employee: "",
    action: "ALL",
    requestType: "My Requests",
    flag: "ALL",
    perPage: 10,
  });

  const set = (name) => (e) => setFilters((f) => ({ ...f, [name]: e.target.value }));

  const handleApply = (e) => {
    e.preventDefault();
    // TODO: call your fetch with `filters`
  };

  const handleClear = () => {
    setFilters({
      station: "",
      department: "",
      employeeGroup: "",
      employee: "",
      action: "ALL",
      requestType: "My Requests",
      flag: "ALL",
      perPage: 10,
    });
  };

  // ---- Compact class helpers
  const sizes = compact
    ? {
        label: "text-[11px]",
        gap: "gap-1",
        select: "h-8 text-[12px] px-2",
        grid: "grid-cols-2 md:grid-cols-6 gap-3",
        btn: "h-8 px-3 text-[12px]",
        iconBtn: "h-7 w-7",
        pill: "px-2 py-[2px] text-[11px]",
        tableText: "text-[12px]",
        th: "px-3 py-2 text-[12px]",
        td: "px-3 py-2",
      }
    : {
        label: "text-[12px]",
        gap: "gap-2",
        select: "h-9 text-[13px] px-2",
        grid: "grid-cols-1 md:grid-cols-4 gap-4",
        btn: "h-9 px-4 text-[13px]",
        iconBtn: "h-8 w-8",
        pill: "px-2.5 py-1 text-[12px]",
        tableText: "text-sm",
        th: "px-4 py-3 text-[13px]",
        td: "px-4 py-3",
      };

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
        <h2 className="text-[14px] font-semibold text-slate-800">Employee Info Request</h2>
        <button className="text-xs text-slate-500 hover:text-slate-700">Filters</button>
      </div>

      {/* Filters */}
      <form onSubmit={handleApply} className="px-5 pt-3 pb-2">
        <div className={`grid ${sizes.grid}`}>
          <Field label="Station" labelClass={sizes.label} gapClass={sizes.gap}>
            <Select value={filters.station} onChange={set("station")} sizeClass={sizes.select} />
          </Field>
          <Field label="Department" labelClass={sizes.label} gapClass={sizes.gap}>
            <Select value={filters.department} onChange={set("department")} sizeClass={sizes.select} />
          </Field>
          <Field label="Employee Group" labelClass={sizes.label} gapClass={sizes.gap}>
            <Select value={filters.employeeGroup} onChange={set("employeeGroup")} sizeClass={sizes.select} />
          </Field>
          <Field label="Employee" labelClass={sizes.label} gapClass={sizes.gap}>
            <Select value={filters.employee} onChange={set("employee")} sizeClass={sizes.select} />
          </Field>

          <Field label="Action" labelClass={sizes.label} gapClass={sizes.gap}>
            <Select value={filters.action} onChange={set("action")} sizeClass={sizes.select}>
              <option value="ALL">ALL</option>
              <option value="ADD">ADD</option>
              <option value="UPDATE">UPDATE</option>
            </Select>
          </Field>
          <Field label="Request Type" labelClass={sizes.label} gapClass={sizes.gap}>
            <Select value={filters.requestType} onChange={set("requestType")} sizeClass={sizes.select}>
              <option>My Requests</option>
              <option>All Requests</option>
            </Select>
          </Field>
          <Field label="Flag" labelClass={sizes.label} gapClass={sizes.gap}>
            <Select value={filters.flag} onChange={set("flag")} sizeClass={sizes.select}>
              <option>ALL</option>
              <option>Pending</option>
              <option>Approved</option>
              <option>Rejected</option>
            </Select>
          </Field>

          {/* Per page + records */}
          <div className="flex items-end justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-slate-600">Show</span>
              <select
                className={`rounded-md border border-slate-300 bg-white outline-none focus:border-customRed focus:ring-customRed w-[78px] ${sizes.select}`}
                value={filters.perPage}
                onChange={set("perPage")}
              >
                {[10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span className="text-[12px] text-slate-600">( {rows.length} ) Records</span>
            </div>
          </div>
        </div>

        {/* Actions row */}
        <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2">
            <button
              type="submit"
              className={`rounded-md bg-customRed text-white shadow-sm hover:bg-customRed/90 focus:outline-none ${sizes.btn}`}
            >
              Apply
            </button>

            <button
              type="button"
              onClick={handleClear}
              className={`rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 ${sizes.btn}`}
            >
              Clear Filters
            </button>
          </div>

          <button
            type="button"
            className={`inline-flex items-center justify-center gap-2 rounded-md bg-customRed text-white shadow-sm hover:bg-customRed/90 ${sizes.btn}`}
            onClick={() => {
              // TODO: open apply-for-employee-info modal
            }}
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-white/15">+</span>
            <span>Apply for Employee Info</span>
          </button>
        </div>
      </form>

      {/* Divider */}
      <div className="mt-2 border-t border-slate-200" />

      {/* Table */}
      <div className="overflow-x-auto">
        <table className={`min-w-full ${sizes.tableText}`}>
          <thead>
            <tr className="text-left text-slate-600">
              <Th className={`w-12 ${sizes.th}`}>S#</Th>
              <Th className={`min-w-[200px] ${sizes.th}`}>Employee Name</Th>
              <Th className={sizes.th}>Details</Th>
              <Th className={`w-28 ${sizes.th}`}>Status</Th>
              <Th className={`w-44 ${sizes.th}`}>Added On</Th>
              <Th className={`w-20 ${sizes.th}`}>Details</Th>
              <Th className={`w-20 ${sizes.th}`}>Approvals</Th>
              <Th className={`w-14 ${sizes.th}`}>Action</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/60">
                <Td className={sizes.td}>{r.sn ?? r.id}</Td>

                <Td className={`text-customRed hover:underline cursor-pointer ${sizes.td}`}>{r.name}</Td>

                <Td className={sizes.td}>
                  <div className="text-[12px] text-slate-700 leading-5">
                    <div>
                      <span className="font-medium">Station :</span> {r.station}
                    </div>
                    <div>
                      <span className="font-medium">Department :</span> {r.department}
                    </div>
                    <div>
                      <span className="font-medium">Designation :</span> {r.designation}
                    </div>
                    <div>
                      <span className="font-medium">Group :</span> {r.group}
                    </div>
                  </div>
                </Td>

                <Td className={sizes.td}>
                  <StatusPill value={r.status} compact={compact} />
                </Td>

                <Td className={sizes.td}>
                  <div className="text-[12px] text-slate-700">
                    {r.addedOn}
                    <div className="text-slate-500">By {r.addedBy}</div>
                  </div>
                </Td>

                {/* ICON-ONLY CELLS (Details / Approvals) */}
                <Td className={sizes.td}>
                  <IconButton
                    title="Details"
                    sizeClass={sizes.iconBtn}
                    onClick={() => {
                      // TODO: open details modal
                    }}
                  >
                    <CalendarIcon />
                  </IconButton>
                </Td>

                <Td className={sizes.td}>
                  <IconButton
                    title="Approvals"
                    sizeClass={sizes.iconBtn}
                    onClick={() => {
                      // TODO: open approvals
                    }}
                  >
                    <UsersIcon />
                  </IconButton>
                </Td>

                <Td className={sizes.td}>
                  <IconButton title="More actions" sizeClass={sizes.iconBtn} onClick={() => {}}>
                    <EllipsisIcon />
                  </IconButton>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* -------------------------
 * Small UI helpers
 * ------------------------- */

const Field = ({ label, labelClass = "text-[12px]", gapClass = "gap-1.5", children }) => (
  <label className={`flex flex-col ${gapClass}`}>
    <span className={`${labelClass} font-medium text-slate-600`}>{label}</span>
    {children}
  </label>
);

const Select = ({ sizeClass = "h-8 text-[12px] px-2", children, ...props }) => (
  <select
    {...props}
    className={`w-full rounded-md border border-slate-300 bg-white outline-none focus:border-customRed focus:ring-customRed ${sizeClass}`}
  >
    {children ?? <option value="">--ALL--</option>}
  </select>
);

const Th = ({ className = "", children }) => (
  <th className={`font-semibold ${className}`}>{children}</th>
);

const Td = ({ className = "", children }) => (
  <td className={`align-top text-slate-800 ${className}`}>{children}</td>
);

const StatusPill = ({ value = "", compact = true }) => {
  const color =
    value.toLowerCase() === "approved"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : value.toLowerCase() === "pending"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-rose-50 text-rose-700 border-rose-200";
  const size = compact ? "px-2 py-[2px] text-[11px]" : "px-2.5 py-1 text-[12px]";
  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${size} ${color}`}>
      {value}
    </span>
  );
};

const IconButton = ({ title, sizeClass = "h-7 w-7", className = "", ...props }) => (
  <button
    {...props}
    title={title}
    aria-label={title}
    className={`inline-flex items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:text-customRed hover:border-customRed/40 hover:bg-customRed/5 transition-colors ${sizeClass} ${className}`}
  />
);

const CalendarIcon = ({ className = "" }) => (
  <svg className={["h-4 w-4", className].join(" ")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const UsersIcon = ({ className = "" }) => (
  <svg className={["h-4 w-4", className].join(" ")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const EllipsisIcon = ({ className = "" }) => (
  <svg className={["h-4 w-4", className].join(" ")} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="5" cy="12" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="19" cy="12" r="2" />
  </svg>
);
