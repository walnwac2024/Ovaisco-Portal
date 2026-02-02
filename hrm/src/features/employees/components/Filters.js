import React, { useCallback } from "react";
import SharedDropdown from "../../../components/common/SharedDropdown";

const LabeledInput = ({
  label,
  name,
  value,
  onChange,
  placeholder = "",
  className = "",
}) => {
  const handleChange = useCallback(
    (e) => {
      onChange?.(name, e.target.value);
    },
    [name, onChange]
  );

  const handleBlur = (e) => {
    const active = document.activeElement;
    const body = document.body;

    // If some extension (e.g. ColorZilla) stole focus to BODY with this flag,
    // immediately take it back so typing feels normal.
    if (active === body && body?.getAttribute("cz-shortcut-listen") === "true") {
      e.target.focus();
      return;
    }
  };

  return (
    <label className={`block ${className}`}>
      <div className="text-[12px] text-slate-600 mb-1">{label}</div>
      <input
        type="text"
        name={name}
        value={value ?? ""}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="input"
      />
    </label>
  );
};

const LabeledSelect = ({
  label,
  name,
  value,
  onChange,
  options = [],
  className = "",
  searchable = false
}) => {
  return (
    <SharedDropdown
      label={label}
      value={value}
      onChange={(val) => onChange?.(name, val)}
      options={options}
      className={className}
      searchable={searchable}
      clearable
    />
  );
};

function Filters({ filters, onChange, options }) {
  const {
    stations = [],
    departments = [],
    groups = [],
    designations = [],
    statuses = [],
    roleTemplates = [],
  } = options || {};

  // Helper to render simple string arrays
  const asSimpleOptions = (arr) => arr.map((v) => ({ value: v, label: v }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Row 1 */}
      <LabeledSelect
        className="col-span-1"
        label="Station"
        name="station"
        value={filters.station}
        onChange={onChange}
        options={asSimpleOptions(stations)}
        searchable
      />

      <LabeledSelect
        className="col-span-1"
        label="Department"
        name="department"
        value={filters.department}
        onChange={onChange}
        options={asSimpleOptions(departments)}
        searchable
      />

      <LabeledSelect
        className="col-span-1"
        label="Employee Group"
        name="employee_group"
        value={filters.employee_group}
        onChange={onChange}
        options={asSimpleOptions(groups)}
        searchable
      />

      <LabeledSelect
        className="col-span-1"
        label="Designation"
        name="designation"
        value={filters.designation}
        onChange={onChange}
        options={asSimpleOptions(designations)}
        searchable
      />

      {/* Row 2 */}
      <LabeledInput
        className="col-span-1"
        label="Employee Code"
        name="employee_code"
        value={filters.employee_code}
        onChange={onChange}
      />

      <LabeledInput
        className="col-span-1"
        label="Employee Name"
        name="employee_name"
        value={filters.employee_name}
        onChange={onChange}
      />

      <LabeledInput
        className="col-span-1"
        label="User Name"
        name="user_name"
        value={filters.user_name}
        onChange={onChange}
      />

      <LabeledSelect
        className="col-span-1"
        label="Status"
        name="status"
        value={filters.status}
        onChange={onChange}
        options={asSimpleOptions(statuses)}
        searchable
      />

      {/* Row 3 */}
      <LabeledSelect
        className="col-span-1"
        label="Documents Attached"
        name="documents_attached"
        value={filters.documents_attached}
        onChange={onChange}
        options={["ALL", "YES", "NO"].map((v) => ({ value: v, label: v }))}
        searchable
      />

      <LabeledSelect
        className="col-span-1"
        label="Roles Template"
        name="role_template"
        value={filters.role_template}
        onChange={onChange}
        options={asSimpleOptions(roleTemplates)}
        searchable
      />

      <LabeledInput
        className="col-span-1"
        label="Cnic #"
        name="cnic"
        value={filters.cnic}
        onChange={onChange}
      />

      <LabeledSelect
        className="col-span-1"
        label="Flag"
        name="flag"
        value={filters.flag}
        onChange={onChange}
        options={["ALL", "YES", "NO"].map((v) => ({ value: v, label: v }))}
        searchable
      />
    </div>
  );
}

export default React.memo(Filters);
