import React, { useState } from 'react';
import SharedDropdown from '../../../components/common/SharedDropdown';
import {
  STATIONS, DEPARTMENTS, SUB_DEPARTMENTS, EMPLOYEE_GROUPS, EMPLOYEES,
  STATUSES, REQUEST_TYPES, FLAGS, MARK_FROM_DASHBOARD,
  ATTENDANCE_TYPES, EXEMPTION_TYPES, FLAG_TYPES,
  WORKSHEET_ACTIONS, WORKSHEET_YEARS, WORKSHEET_MONTHS,
} from '../constants';

function Field({ label, children }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}

/**
 * Reusable filters for:
 * mode: 'attendance' | 'exemption' | 'worksheet' | 'remote' | 'shift'
 */
export default function Filters({
  mode = 'attendance',
  title = 'Attendance Request',
  onApply,
  perPage = 10,
  onPerPageChange = () => { },
  onUploadExcel = () => { },
  onAddNew = () => { },
  onAddIrregular = () => { },
}) {
  const isExemption = mode === 'exemption';
  const isWorksheet = mode === 'worksheet';
  const isRemote = mode === 'remote';
  const isShift = mode === 'shift';

  const [vals, setVals] = useState({
    station: '--ALL--',
    department: '--ALL--',
    subDepartment: '--ALL--',
    employeeGroup: '--ALL--',
    employee: '--ALL--',
    date: '', // attendance / exemption / remote / shift date
    status: '--ALL--',
    employeeCode: '',
    employeeName: '',
    requestType: 'My Requests',
    flagType: '--ALL--',            // exemption only
    flag: '--ALL--',
    isMarkFromDashboard: '--ALL--', // attendance only
    type: '--ALL--',                // attendance/exemption type
    // worksheet-only
    titleText: '',
    year: '--ALL--',
    month: '--ALL--',
    action: 'ALL',
  });

  const set = (k) => (val) => setVals((v) => ({ ...v, [k]: val }));

  const resetVals = () =>
    setVals({
      station: '--ALL--',
      department: '--ALL--',
      subDepartment: '--ALL--',
      employeeGroup: '--ALL--',
      employee: '--ALL--',
      date: '',
      status: '--ALL--',
      employeeCode: '',
      employeeName: '',
      requestType: 'My Requests',
      flagType: '--ALL--',
      flag: '--ALL--',
      isMarkFromDashboard: '--ALL--',
      type: '--ALL--',
      titleText: '',
      year: '--ALL--',
      month: '--ALL--',
      action: 'ALL',
    });

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Filters</h2>
      </div>

      <div className="p-4">
        {/* Row 1 (shared) */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <SharedDropdown
            label="Station"
            value={vals.station}
            onChange={set('station')}
            options={STATIONS}
            searchable
          />

          <SharedDropdown
            label="Department"
            value={vals.department}
            onChange={set('department')}
            options={DEPARTMENTS}
            searchable
          />

          <SharedDropdown
            label="Sub Department"
            value={vals.subDepartment}
            onChange={set('subDepartment')}
            options={SUB_DEPARTMENTS}
            searchable
          />

          <SharedDropdown
            label="Employee Group"
            value={vals.employeeGroup}
            onChange={set('employeeGroup')}
            options={EMPLOYEE_GROUPS}
            searchable
          />
        </div>

        {/* Row 2 */}
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
          <SharedDropdown
            label="Employee"
            value={vals.employee}
            onChange={set('employee')}
            options={EMPLOYEES}
            searchable
          />

          {/* Attendance/Exemption/Remote/Shift show date; Worksheet has its own fields */}
          {!isWorksheet && (
            <>
              <Field
                label={
                  isExemption ? 'Exemption Date'
                    : isRemote ? 'Remote Work Date'
                      : isShift ? 'Shift Date'
                        : 'Attendance Date'
                }
              >
                <input type="date" className="input" value={vals.date} onChange={set('date')} />
              </Field>

              <SharedDropdown
                label="Status"
                value={vals.status}
                onChange={set('status')}
                options={STATUSES}
                searchable
              />

              {isExemption ? (
                <SharedDropdown
                  label="Flag Type"
                  value={vals.flagType}
                  onChange={set('flagType')}
                  options={FLAG_TYPES}
                  searchable
                />
              ) : (
                // Show Employee Code for Attendance AND Shift; hide for Exemption/Remote
                (mode === 'attendance' || isShift) && (
                  <Field label="Employee Code">
                    <input
                      className="input"
                      placeholder="Employee Code"
                      value={vals.employeeCode}
                      onChange={set('employeeCode')}
                    />
                  </Field>
                )
              )}
            </>
          )}

          {/* Worksheet-specific Row 2 right side */}
          {isWorksheet && (
            <>
              <Field label="Title">
                <input
                  className="input"
                  placeholder="Type something"
                  value={vals.titleText}
                  onChange={set('titleText')}
                />
              </Field>

              <SharedDropdown
                label="Year"
                value={vals.year}
                onChange={set('year')}
                options={WORKSHEET_YEARS}
                searchable
              />

              <SharedDropdown
                label="Month"
                value={vals.month}
                onChange={set('month')}
                options={WORKSHEET_MONTHS}
                searchable
              />
            </>
          )}
        </div>

        {/* Row 3 */}
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
          <Field label="Employee Name">
            <input
              className="input"
              placeholder="Employee Name"
              value={vals.employeeName}
              onChange={set('employeeName')}
            />
          </Field>

          <SharedDropdown
            label="Request Type"
            value={vals.requestType}
            onChange={set('requestType')}
            options={REQUEST_TYPES}
            searchable
          />

          <SharedDropdown
            label="Flag"
            value={vals.flag}
            onChange={set('flag')}
            options={FLAGS}
            searchable
          />

          {/* Attendance-only control */}
          {!isExemption && !isWorksheet && !isRemote && !isShift && (
            <SharedDropdown
              label="Is Mark From Dashboard"
              value={vals.isMarkFromDashboard}
              onChange={set('isMarkFromDashboard')}
              options={MARK_FROM_DASHBOARD}
              searchable
            />
          )}

          {isWorksheet && (
            <SharedDropdown
              label="Action"
              value={vals.action}
              onChange={set('action')}
              options={WORKSHEET_ACTIONS}
              searchable
            />
          )}
        </div>

        {/* Row 4 (attendance/exemption types only) */}
        {!isWorksheet && !isRemote && !isShift && (
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
            <SharedDropdown
              label={isExemption ? 'Exemption Type' : 'Attendance Type'}
              value={vals.type}
              onChange={set('type')}
              options={isExemption ? EXEMPTION_TYPES : ATTENDANCE_TYPES}
              searchable
            />
          </div>
        )}

        {/* Actions Section - Matching ActionsBar pattern */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6">
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn-primary" onClick={() => onApply?.(vals)}>
              Apply Filters
            </button>
            <button className="btn-outline" onClick={resetVals}>
              Clear
            </button>
            <div className="ml-2 h-10 w-px bg-slate-200 hidden sm:block" />
            <div className="flex items-center px-4 h-10 bg-white rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-3">Show</span>
              <select
                className="bg-transparent outline-none font-bold text-slate-800 cursor-pointer appearance-none pr-4 text-xs"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2394a3b8\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2.5\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right center', backgroundSize: '0.8rem' }}
                value={perPage}
                onChange={(e) => onPerPageChange?.(Number(e.target.value))}
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isExemption && !isRemote && !isShift && (
              <button onClick={onUploadExcel} className="btn-utility">
                Upload Excel
              </button>
            )}
            {!isWorksheet && !isRemote && !isExemption && (
              <button onClick={onAddIrregular} className="btn-utility">
                + Irregular
              </button>
            )}
            <button
              onClick={onAddNew}
              className="btn-primary shadow-lg shadow-red-500/20"
            >
              {isWorksheet ? '+ WorkSheet' : '+ New Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
