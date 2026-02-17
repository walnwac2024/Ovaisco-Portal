import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext'; // ✅ add this (path may be ../.. depending where AttendancePage is)

import Sidebar from './components/Sidebar';
import Filters from './components/Filters';
import RequestTable from './components/RequestTable';
import ExemptionTable from './components/ExemptionTable';
import WorkSheetTable from './components/WorkSheetTable';
import RemoteWorkTable from './components/RemoteWorkTable';
import ShiftTable from './components/ShiftTable';

import AddRequestModal from './components/AddRequestModal';
import AddExemptionModal from './components/AddExemptionModal';
import AddWorkSheetModal from './components/AddWorkSheetModal';
import AddRemoteWorkModal from './components/AddRemoteWorkModal';
import AddShiftModal from './components/AddShiftModal';

// NEW: approval UI (import concrete files, not from an index)
import ApprovalFilters from './components/ApprovalFilters';
import AttendanceApprovalTable from './components/AttendanceApprovalTable';
import ApprovalViewModal from './components/ApprovalViewModal';
import LocationAuditTable from './components/LocationAuditTable';
import AttendanceLogsTable from './components/AttendanceLogsTable';
import AttendanceLogsFilters from './components/AttendanceLogsFilters';

import useAttendanceRequests from './hooks/useAttendanceRequests';
import useAttendanceLogs from './hooks/useAttendanceLogs';
import { ATTENDANCE_NAV } from './constants';

// ✅ Real settings UI
import AttendanceSettings from './components/AttendanceSettings';

function ComingSoon({ label }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">{label}</h3>
      </div>
      <div className="p-6 text-sm text-slate-500 dark:text-slate-400 italic">
        This section is coming soon...
      </div>
    </div>
  );
}

function UnauthorizedBox() {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Unauthorized</h3>
      </div>
      <div className="p-6 text-sm text-rose-500 font-medium">
        You don’t have permission to view this page.
      </div>
    </div>
  );
}

function ExemptionRequestPage({ perPage, onPerPageChange, onAddNew, onApply }) {
  const [page, setPage] = useState(1);
  const pageCount = 1;
  const rows = [];

  return (
    <>
      <Filters
        mode="exemption"
        title="Exemption Request"
        perPage={perPage}
        onPerPageChange={onPerPageChange}
        onAddNew={onAddNew}
        onApply={onApply}
      />
      <ExemptionTable
        rows={rows}
        page={page}
        pageCount={pageCount}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(pageCount, p + 1))}
      />
    </>
  );
}

function WorkSheetSection({ perPage, onPerPageChange, onAddNew }) {
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const pageCount = 1;

  return (
    <>
      <Filters
        mode="worksheet"
        title="WorkSheet"
        perPage={perPage}
        onPerPageChange={onPerPageChange}
        onUploadExcel={() => { }}
        onAddNew={onAddNew}
        onApply={() => { }}
      />
      <WorkSheetTable
        rows={rows}
        page={page}
        pageCount={pageCount}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(pageCount, p + 1))}
      />
    </>
  );
}

function RemoteWorkSection({ perPage, onPerPageChange, onAddNew, rows }) {
  const [page, setPage] = useState(1);
  const pageCount = 1;

  return (
    <>
      <Filters
        mode="remote"
        title="Remote Work Request"
        perPage={perPage}
        onPerPageChange={onPerPageChange}
        onAddNew={onAddNew}
        onApply={() => { }}
      />
      <RemoteWorkTable
        rows={rows}
        page={page}
        pageCount={pageCount}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(pageCount, p + 1))}
      />
    </>
  );
}

function ShiftSection({ perPage, onPerPageChange, onAddNew, onAddIrregular, rows }) {
  const [page, setPage] = useState(1);
  const pageCount = 1;

  return (
    <>
      <Filters
        mode="shift"
        title="Shift Request"
        perPage={perPage}
        onPerPageChange={onPerPageChange}
        onAddNew={onAddNew}
        onAddIrregular={onAddIrregular}
        onApply={() => { }}
      />
      <ShiftTable
        rows={rows}
        page={page}
        pageCount={pageCount}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(pageCount, p + 1))}
      />
    </>
  );
}

export default function AttendancePage() {
  const { user } = useAuth();

  // ✅ Check settings permission
  const canSeeSettings = useMemo(() => {
    return (user?.features || []).includes('attendance_manage_settings');
  }, [user]);

  // ✅ Build nav based on permissions
  const safeNav = useMemo(() => {
    const base = Array.isArray(ATTENDANCE_NAV) ? ATTENDANCE_NAV : [];
    const features = user?.features || [];

    const filtered = base.filter(item => {
      if (item.id === 'attendance-settings') return features.includes('attendance_manage_settings');
      if (item.id === 'attendance-approval') return features.includes('attendance_edit');
      if (item.id === 'location-audit') return features.includes('attendance_audit');
      if (item.id === 'attendance-logs') return features.includes('attendance_view_logs');
      return features.includes('attendance_view');
    });

    if (!filtered.some((i) => i.active) && filtered.length) {
      return filtered.map((i, idx) => ({ ...i, active: idx === 0 }));
    }
    return filtered;
  }, [user]);

  const [nav, setNav] = useState(safeNav);
  const [modal, setModal] = useState(null);
  const [perPage, setPerPage] = useState(10);
  const { rows, applyFilters } = useAttendanceRequests({});

  // Attendance Logs state
  const [logsDate, setLogsDate] = useState(new Date().toISOString().split('T')[0]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { logs, summary, loading: logsLoading, downloadExcel } = useAttendanceLogs({
    date: logsDate,
    autoRefresh
  });

  const [remoteRows, setRemoteRows] = useState([]);
  const [shiftRows, setShiftRows] = useState([]);

  // ✅ keep nav synced if permissions change or on first render
  useEffect(() => {
    setNav(safeNav);
  }, [safeNav]);

  const initialApprovalFilters = {
    station: '',
    department: '',
    subDepartment: '',
    employeeGroup: '',
    employee: '',
    employeeCode: '',
    employeeName: '',
    action: 'Pending',
    approvalType: 'Other Approval',
    requestDate: '',
    fromDashboard: '',
    flag: '',
  };
  const [approvalFilters, setApprovalFilters] = useState(initialApprovalFilters);

  const [approvalRows, setApprovalRows] = useState([
    {
      id: 1,
      employee: { name: 'Usama Test', code: '1235456' },
      employeeDetails: 'Stn :HeadOffice\nDept :Finance\nSub Dept :–\nGrp :Head Group',
      requestDate: '14-Jun-2021 (Monday)',
      requestType: 'Attendance Request',
      status: 'Pending',
      forwardedOn: '14-Jun-2021 05:48 PM',
      isFromDashboard: false,
      details: '—',
      approvals: '—',
    },
  ]);

  const [viewRow, setViewRow] = useState(null);

  const activeItem = nav.find((i) => i.active);
  const activeId = activeItem?.id || 'attendance-request';
  const isWorking = activeItem?.status === 'working';

  const handleNavigate = (id) => {
    // ✅ Block navigation to settings if user isn’t allowed
    if (id === 'attendance-settings' && !canSeeSettings) return;
    setNav((prev) => prev.map((it) => ({ ...it, active: it.id === id })));
  };

  const handleApprovalAction = (action, row) => {
    if (action === 'view') {
      setViewRow(row);
      return;
    }
    if (action === 'download') {
      const blob = new Blob([JSON.stringify(row, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `request-${row.id}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      return;
    }

    setApprovalRows((prev) =>
      prev.map((r) =>
        r.id === row.id
          ? {
            ...r,
            status:
              action === 'approve'
                ? 'Approved'
                : action === 'reject'
                  ? 'Rejected'
                  : action === 'force'
                    ? 'Forcefully Approved'
                    : action === 'cancel'
                      ? 'Cancelled'
                      : r.status,
          }
          : r
      )
    );
  };
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <Sidebar items={nav} onNavigate={handleNavigate} />

      <section className="flex-1 min-w-0 w-full overflow-hidden">
        <div className="flex flex-col gap-6">
          {isWorking ? (
            <ComingSoon label={activeItem?.label || ''} />
          ) : (
            <>
              {activeId === 'attendance-request' && (
                <>
                  <Filters
                    mode="attendance"
                    title="Attendance Request"
                    onApply={applyFilters}
                    perPage={perPage}
                    onPerPageChange={setPerPage}
                    onUploadExcel={() => { }}
                    onAddNew={() => setModal('attendance')}
                    onAddIrregular={() => { }}
                  />
                  <RequestTable rows={rows} />
                </>
              )}

              {activeId === 'exemption-request' && (
                <ExemptionRequestPage
                  perPage={perPage}
                  onPerPageChange={setPerPage}
                  onAddNew={() => setModal('exemption')}
                  onApply={() => { }}
                />
              )}

              {activeId === 'worksheet' && (
                <WorkSheetSection
                  perPage={perPage}
                  onPerPageChange={setPerPage}
                  onAddNew={() => setModal('worksheet')}
                />
              )}

              {activeId === 'remote-work' && (
                <RemoteWorkSection
                  perPage={perPage}
                  onPerPageChange={setPerPage}
                  onAddNew={() => setModal('remote')}
                  rows={remoteRows}
                />
              )}

              {activeId === 'shift-request' && (
                <ShiftSection
                  perPage={perPage}
                  onPerPageChange={setPerPage}
                  onAddNew={() => setModal('shift')}
                  onAddIrregular={() => setModal('shift-irregular')}
                  rows={shiftRows}
                />
              )}

              {activeId === 'attendance-approval' && (
                <>
                  <ApprovalFilters
                    value={approvalFilters}
                    onChange={setApprovalFilters}
                    onApply={() => console.log('apply approval filters', approvalFilters)}
                    onClear={() => setApprovalFilters(initialApprovalFilters)}
                  />
                  <AttendanceApprovalTable
                    rows={approvalRows.map((r) => ({
                      id: r.id,
                      employeeName: `${r.employee.name} (${r.employee.code})`,
                      employeeCode: r.employee.code,
                      requestDate: r.requestDate,
                      requestType: r.requestType,
                      status: r.status,
                    }))}
                    onView={(row) => handleApprovalAction('view', row)}
                    onForceApprove={(row) => handleApprovalAction('force', row)}
                    onDownload={(row) => handleApprovalAction('download', row)}
                  />
                </>
              )}

              {activeId === 'location-audit' && (
                <LocationAuditTable />
              )}

              {activeId === 'attendance-logs' && (
                <>
                  <AttendanceLogsFilters
                    date={logsDate}
                    onDateChange={setLogsDate}
                    onDownloadExcel={downloadExcel}
                    autoRefresh={autoRefresh}
                    onAutoRefreshChange={setAutoRefresh}
                    summary={summary}
                  />
                  <AttendanceLogsTable rows={logs} loading={logsLoading} />
                </>
              )}

              {activeId === 'attendance-settings' && (
                canSeeSettings ? <AttendanceSettings /> : <UnauthorizedBox />
              )}
            </>
          )}
        </div>
      </section>

      {/* Modals */}
      <AddRequestModal open={modal === 'attendance'} onClose={() => setModal(null)} />
      <AddExemptionModal open={modal === 'exemption'} onClose={() => setModal(null)} />

      <AddWorkSheetModal
        open={modal === 'worksheet'}
        onClose={() => setModal(null)}
        onSaved={(payload) => console.log('worksheet saved', payload)}
      />

      <AddRemoteWorkModal
        open={modal === 'remote'}
        onClose={() => setModal(null)}
        onSaved={(payload) => {
          setRemoteRows((prev) => [
            {
              id: Date.now(),
              employee: { name: payload.employee },
              remoteDate: payload.remoteDate,
              inDate: payload.inDate,
              outDate: payload.outDate,
              inTime: payload.inTime,
              outTime: payload.outTime,
              details: payload.details,
              status: 'Pending',
              addedOn: payload.addedOn,
              approvals: '—',
            },
            ...prev,
          ]);
        }}
      />

      <AddShiftModal
        open={modal === 'shift'}
        onClose={() => setModal(null)}
        onSaved={(payload) => {
          setShiftRows((prev) => [
            {
              id: Date.now(),
              employee: { name: payload.employee },
              shiftDate: payload.shiftDate,
              details: payload.details,
              status: payload.status,
              addedOn: payload.addedOn,
              approvals: '—',
            },
            ...prev,
          ]);
        }}
      />

      <AddShiftModal
        irregular
        open={modal === 'shift-irregular'}
        onClose={() => setModal(null)}
        onSaved={(payload) => {
          setShiftRows((prev) => [
            {
              id: Date.now(),
              employee: { name: payload.employee },
              shiftDate: payload.shiftDate,
              details: payload.details,
              status: payload.status,
              addedOn: payload.addedOn,
              approvals: '—',
            },
            ...prev,
          ]);
        }}
      />

      <ApprovalViewModal
        open={!!viewRow}
        data={viewRow}
        onClose={() => setViewRow(null)}
        onApprove={(row) => {
          handleApprovalAction('approve', row);
          setViewRow(null);
        }}
        onReject={(row) => {
          handleApprovalAction('reject', row);
          setViewRow(null);
        }}
      />
    </div>
  );
}
