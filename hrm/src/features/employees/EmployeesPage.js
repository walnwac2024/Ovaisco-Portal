// src/features/employees/EmployeesPage.js
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Filters from "./components/Filters";
import ActionsBar from "./components/ActionsBar";
import ExportModal from "./components/ExportModal";
import EmployeesTable from "./components/EmployeesTable";
import UploadExcelModal from "./components/UploadExcelModal";
// import SendCredentialsModal from "./components/SendCredentialsModal";

import AddEmployeeModal from "./components/AddEmployeeModal";
import useEmployees from "./hooks/useEmployees";
import useEmployeeFilterOptions from "./hooks/useEmployeeFilterOptions";
import EmployeeSidebar from "./components/EmployeeSidebar";

// Screens
import EmployeeProfileRequest from "./components/EmployeeProfileRequest";
import EmployeeTransfer from "./components/EmployeeTransfer";
import EmployeeInfoRequest from "./components/EmployeeInfoRequest";
import EmployeeApprovals from "./components/EmployeeApprovals";
import EmployeeTimeline from "./components/EmployeeTimeline";


// Employee Role screens
import EmployeeRoleMainView from "./components/EmployeeRoleMainView";
import CopyRoleView from "./components/CopyRoleView";
import RoleTemplatesView from "./components/RoleTemplatesView";

// Employee Settings Screen
import EmployeeSettings from "./components/EmployeeSettings";

import EditEmployeeModal from "./components/EditEmployeeModal";
import api from "../../utils/api";

import { useAuth } from "../../context/AuthContext";

export default function EmployeesPage() {
  const { user } = useAuth();
  const features = user?.features || [];
  const canViewList = features.includes("employee_view");
  const canViewTimeline = features.includes("timeline_view");

  const [active, setActive] = useState(() => {
    if (canViewList) return "employee-list";
    if (canViewTimeline) return "employee-timeline";
    return "employee-list";
  });
  const navigate = useNavigate();

  const {
    filters,
    resetFilters,
    perPage,
    setPerPage,
    page,
    setPage,
    totalPages,
    firstItem,
    rows,
    list,
    total,
    openExport,
    setOpenExport,
    apply,
    exportData,
    loading,
    error,
    refetch,
  } = useEmployees();

  const [uiFilters, setUiFilters] = useState(filters);

  useEffect(() => {
    setUiFilters(filters);
  }, [filters]);

  const handleFilterChange = (name, value) => {
    setUiFilters((prev) => ({
      ...prev,
      [name]: value ?? "",
    }));
  };

  const handleApply = () => {
    apply(uiFilters);
  };

  const handleClear = () => {
    resetFilters();
  };

  const handleSearchChange = useCallback((value) => {
    const next = { ...uiFilters, search: value };
    setUiFilters(next);
    apply(next);
  }, [uiFilters, apply]);

  const {
    options: filterOptions,
    error: filterOptionsError,
  } = useEmployeeFilterOptions();

  const [uploadOpen, setUploadOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editEmployeeId, setEditEmployeeId] = useState(null);

  const handleViewEmployee = useCallback((row) => {
    if (!row?.id) return;
    navigate(`/employees/${row.id}`);
  }, [navigate]);

  const handleEditEmployee = useCallback((row) => {
    if (!row?.id) return;
    setEditEmployeeId(row.id);
  }, []);

  /* ------------------------------------------------------------------
   * ✅ MARK INACTIVE / ACTIVATE (TOGGLE)
   * ------------------------------------------------------------------ */
  const handleMarkInactive = async (row) => {
    if (!row?.id) return;

    const isCurrentlyActive =
      row.isActive === true || Number(row.isActive) === 1;

    const nextActive = !isCurrentlyActive;

    const confirmText = nextActive
      ? "Activate this employee?"
      : "Mark this employee as inactive?";

    const ok = window.confirm(confirmText);
    if (!ok) return;

    try {
      await api.patch(`/employees/${row.id}/status`, {
        is_active: nextActive ? 1 : 0,
        status: nextActive ? "Active" : "Left",
      });

      refetch();
    } catch (e) {
      console.error("Failed to update employee status", e);
      alert(
        e?.response?.data?.message ||
        e?.message ||
        "Failed to update employee status"
      );
    }
  };

  /* ------------------------------------------------------------------
   * ✅ PERMANENT DELETE
   * ------------------------------------------------------------------ */
  const handleDeleteEmployee = async (row) => {
    if (!row?.id) return;

    const name = row.employee_name || row.Employee_Name || row.name || "this employee";

    const ok1 = window.confirm(`Are you sure you want to PERMANENTLY delete ${name}? This will remove all their records (attendance, documents, etc.) and CANNOT be undone.`);
    if (!ok1) return;

    const ok2 = window.confirm(`FINAL CONFIRMATION: Are you absolutely sure you want to delete ${name}?`);
    if (!ok2) return;

    try {
      await api.delete(`/employees/${row.id}`);
      refetch();
    } catch (e) {
      console.error("Failed to delete employee", e);
      alert(
        e?.response?.data?.message ||
        e?.message ||
        "Failed to delete employee"
      );
    }
  };

  const handleCloseEdit = useCallback((shouldRefresh = false) => {
    setEditEmployeeId(null);
    if (shouldRefresh) refetch();
  }, [refetch]);

  const renderMain = () => {
    if (active === "employee-role" || active === "employee-role/main")
      return <EmployeeRoleMainView />;
    if (active === "employee-role/copy") return <CopyRoleView />;
    if (active === "employee-role/templates") return <RoleTemplatesView />;

    if (active === "employee-profile-request")
      return <EmployeeProfileRequest />;
    if (active === "employee-transfer") return <EmployeeTransfer />;
    if (active === "employee-info-request") return <EmployeeInfoRequest />;
    if (active === "employee-approvals") return <EmployeeApprovals />;
    if (active === "employee-timeline") return <EmployeeTimeline />;

    if (active === "employee-settings") return <EmployeeSettings />;

    // Default: Employee List (only if permitted)
    if (active === "employee-list" && !canViewList) {
      return (
        <div className="p-10 text-center">
          <div className="text-slate-400 mb-2">Access Restricted</div>
          <div className="text-sm text-slate-500">You do not have permission to view the employee list.</div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Filters Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Filters</h2>
          </div>

          <div className="p-4">
            {filterOptionsError && (
              <div className="mb-3 text-sm text-red-600">
                {filterOptionsError}
              </div>
            )}

            <Filters
              filters={uiFilters}
              onChange={handleFilterChange}
              options={filterOptions}
            />

            <ActionsBar
              onApply={handleApply}
              onClear={handleClear}
              perPage={perPage}
              setPerPage={setPerPage}
              setOpenExport={setOpenExport}
              onOpenUpload={() => setUploadOpen(true)}
              onAddNew={() => setAddOpen(true)}
              total={total}
            />

            {openExport && (
              <ExportModal
                onClose={() => setOpenExport(false)}
                onExport={() => {
                  exportData();
                  setOpenExport(false);
                }}
              />
            )}
          </div>
        </div>

        {/* Results Card */}
        <div className="card">
          <div className="card-header flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Showing {rows.length} of {total} employees
            </div>
            <div className="w-full md:max-w-sm">
              <input
                type="text"
                placeholder="Search name, code, department..."
                className="input"
                value={uiFilters.search || ""}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
          </div>

          {loading && (
            <div className="px-4 py-2 text-sm text-gray-500 border-b">
              Loading employees…
            </div>
          )}
          {error && !loading && (
            <div className="px-4 py-2 text-sm text-red-600 border-b">
              {error}
            </div>
          )}

          <EmployeesTable
            rows={rows}
            firstItem={firstItem}
            onViewEmployee={handleViewEmployee}
            onEditEmployee={handleEditEmployee}
            onMarkInactive={handleMarkInactive}
            onDeleteEmployee={handleDeleteEmployee}
          />

          <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm pagination-safe">
            <div className="font-medium text-slate-700">
              Page {total === 0 ? 0 : page} of {totalPages}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:space-x-2 sm:gap-0">
              <button
                type="button"
                className="btn-outline w-full sm:w-auto"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn-outline w-full sm:w-auto"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Modals */}
        <UploadExcelModal
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
        />
        <AddEmployeeModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          onCreated={() => {
            setAddOpen(false);
            refetch();
          }}
        />

        {editEmployeeId && (
          <EditEmployeeModal
            employeeId={editEmployeeId}
            onClose={handleCloseEdit}
          />
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <EmployeeSidebar activeKey={active} onNavigate={setActive} />
      <section className="flex-1 min-w-0 w-full overflow-hidden">{renderMain()}</section>
    </div>
  );
}
