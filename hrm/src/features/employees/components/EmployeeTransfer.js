// src/features/employees/components/EmployeeTransfer.js
import React, { useState } from "react";
import EmployeeTransferModal from "./EmployeeTransferModal"; // NEW

const Field = ({ label, children }) => (
  <div>
    <label className="block text-sm text-slate-700 mb-1">{label}</label>
    {children}
  </div>
);
const Select = (props) => (
  <select
    {...props}
    className="w-full h-9 rounded border border-slate-300 focus:border-customRed focus:ring-customRed"
  />
);

export default function EmployeeTransfer() {
  const [filters, setFilters] = useState({
    station: "",
    department: "",
    employee_group: "",
    employee: "",
    year: "",
    month: "",
    action: "ALL",
    request_type: "My Requests",
    flag: "ALL",
  });

  const [openForm, setOpenForm] = useState(false); // NEW

  const set = (name) => (e) =>
    setFilters((f) => ({ ...f, [name]: e.target.value }));

  const handleApply = (e) => {
    e.preventDefault();
    // TODO: fetch with filters
  };

  const handleClear = () =>
    setFilters({
      station: "",
      department: "",
      employee_group: "",
      employee: "",
      year: "",
      month: "",
      action: "ALL",
      request_type: "My Requests",
      flag: "ALL",
    });

  const rows = []; // TODO: replace with fetched data
  const firstItem = 1;

  return (
    <div className="pr-6 pb-6">
      {/* Header card */}
      <div className="bg-white rounded-lg overflow-hidden shadow border border-slate-200">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="font-medium">Employee Transfer</h2>
          <button
            type="button"
            className="text-slate-600 hover:text-slate-800 inline-flex items-center gap-1"
            title="Filters"
          >
            <span>Filters</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
            </svg>
          </button>
        </div>

        {/* Filters grid */}
        <form onSubmit={handleApply} className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Field label="Station">
              <Select value={filters.station} onChange={set("station")}>
                <option value=""></option>
                {["--ALL--", "RegionalOffice", "HeadOffice"].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Department">
              <Select value={filters.department} onChange={set("department")}>
                <option value=""></option>
                {["--ALL--", "Marketing", "HR", "IT", "Finance"].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Employee Group">
              <Select
                value={filters.employee_group}
                onChange={set("employee_group")}
              >
                <option value=""></option>
                {["--ALL--", "Head Group", "A", "B"].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Employee">
              <Select value={filters.employee} onChange={set("employee")}>
                <option value=""></option>
                {["--ALL--", "John Doe", "Sumitha Thomas"].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Year">
              <Select value={filters.year} onChange={set("year")}>
                <option value=""></option>
                {["--ALL--", "2022", "2023", "2024"].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Month">
              <Select value={filters.month} onChange={set("month")}>
                <option value=""></option>
                {[
                  "--ALL--",
                  "Jan",
                  "Feb",
                  "Mar",
                  "Apr",
                  "May",
                  "Jun",
                  "Jul",
                  "Aug",
                ].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Action">
              <Select value={filters.action} onChange={set("action")}>
                {["ALL", "Approved", "Pending", "Rejected"].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Request Type">
              <Select
                value={filters.request_type}
                onChange={set("request_type")}
              >
                {["My Requests", "All Requests"].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Flag">
              <Select value={filters.flag} onChange={set("flag")}>
                {["ALL", "YES", "NO"].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          {/* Actions row */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="submit"
              className="h-8 px-4 rounded bg-customRed text-white hover:bg-customRed/90 text-sm"
            >
              Apply
            </button>

            <button
              type="button"
              onClick={handleClear}
              className="h-8 px-4 rounded border border-customRed text-customRed bg-white hover:bg-customRed/10 text-sm"
            >
              Clear Filters
            </button>

            <div className="ml-auto">
              <button
                type="button"
                className="h-8 px-4 rounded bg-customRed text-white hover:bg-customRed/90 text-sm"
                onClick={() => setOpenForm(true)} // NEW
              >
                + Apply for Employee Transfer
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Results card */}
      <div className="mt-4 bg-white rounded-lg overflow-hidden shadow border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b">
                <th className="text-left px-4 py-2 w-12">S#</th>
                <th className="text-left px-4 py-2">Employee</th>
                <th className="text-left px-4 py-2">Employee Details</th>
                <th className="text-left px-4 py-2">Transfer Details</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Details</th>
                <th className="text-left px-4 py-2">Approvals</th>
                <th className="text-left px-4 py-2">Added On</th>
                <th className="text-left px-4 py-2 w-20">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-slate-500">
                    No transfers found.
                  </td>
                </tr>
              ) : (
                rows.map((r, idx) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="px-4 py-2">{firstItem + idx}</td>
                    <td className="px-4 py-2">{r.employeeName}</td>
                    <td className="px-4 py-2">{r.empDetails}</td>
                    <td className="px-4 py-2">{r.transferDetails}</td>
                    <td className="px-4 py-2">{r.status}</td>
                    <td className="px-4 py-2">…</td>
                    <td className="px-4 py-2">…</td>
                    <td className="px-4 py-2">{r.addedOn}</td>
                    <td className="px-4 py-2">
                      <button type="button" className="h-7 px-3 rounded border bg-white hover:bg-slate-50">
                        ⋮
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <EmployeeTransferModal
        open={openForm}
        onClose={() => setOpenForm(false)}
        onSubmit={() => {
          // TODO: call API here
          alert("Transfer request submitted!");
          setOpenForm(false);
        }}
      />
    </div>
  );
}
