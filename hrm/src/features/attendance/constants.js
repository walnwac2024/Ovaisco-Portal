// Sidebar items
export const ATTENDANCE_NAV = [
  { id: 'attendance-request', label: 'Attendance Request', status: 'working' },
  { id: 'exemption-request', label: 'Exemption Request', status: 'working' },
  { id: 'worksheet', label: 'WorkSheet', status: 'working' },
  { id: 'remote-work', label: 'Remote Work Request', status: 'working' },
  { id: 'shift-request', label: 'Shift Request', status: 'working' },
  { id: 'amend-attendance', label: 'Amend Attendance', status: 'working' },
  { id: 'amend-employee-shift', label: 'Amend Employee Shift', status: 'working' },
  { id: 'attendance-approval', label: 'Attendance Approval', status: 'working' },
  { id: 'location-audit', label: 'Attendance Audit' },
  { id: 'attendance-logs', label: 'Attendance Logs' },
  { id: 'attendance-settings', label: 'Attendance Settings', active: true },
];

// (optional) routes if you use them elsewhere
export const ATTENDANCE_ROUTES = {
  'attendance-request': '/attendance',
  'exemption-request': '/attendance/exemption',
  'worksheet': '/attendance/worksheet',
  'remote-work': '/attendance/remote-work',
  'shift-request': '/attendance/shift',
  'amend-attendance': '/attendance/amend',
  'amend-employee-shift': '/attendance/amend-shift',
  'attendance-approval': '/attendance/approval',
  'schedule': '/attendance/schedule',
  'attendance-settings': '/attendance/settings',
};

// Filter option sets
export const STATIONS = ['--ALL--', 'Karachi', 'Lahore', 'Islamabad'];
export const DEPARTMENTS = ['--ALL--', 'HR', 'Engineering', 'Finance'];
export const SUB_DEPARTMENTS = ['--ALL--', 'Recruitment', 'Payroll', 'Backend', 'Frontend'];
export const EMPLOYEE_GROUPS = ['--ALL--', 'A', 'B', 'C'];
export const EMPLOYEES = ['--ALL--', 'Sumitha Thomas', 'Ahmed Khan', 'Sara Malik'];
export const STATUSES = ['--ALL--', 'Pending', 'Approved', 'Rejected'];
export const REQUEST_TYPES = ['My Requests', 'Pending Approvals', 'All Requests'];
export const FLAGS = ['--ALL--', 'Flagged', 'Unflagged'];
export const MARK_FROM_DASHBOARD = ['--ALL--', 'Yes', 'No'];

// Attendance-only
export const ATTENDANCE_TYPES = ['--ALL--', 'In/Out Adjust', 'Work From Home', 'Remote', 'On Site'];

// Exemption-only
export const EXEMPTION_TYPES = ['--ALL--', 'Official Duty', 'Medical', 'Personal', 'Other'];
export const FLAG_TYPES = ['--ALL--', 'Normal', 'Critical'];


export const WORKSHEET_ACTIONS = ['ALL', 'Created', 'Updated', 'Deleted'];
export const WORKSHEET_YEARS = [
  '--ALL--',
  '2030', '2029', '2028', '2027', '2026', '2025', '2024', '2023', '2022', '2021'
];
export const WORKSHEET_MONTHS = [
  '--ALL--', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];