-- ============================================
-- PAYROLL & ATTENDANCE PERMISSIONS MIGRATION
-- Adds new permission codes and maps them to Admin and HR roles
-- ============================================

-- 1. Insert new permissions (if they don't exist)
INSERT INTO permissions (module, action, code) 
SELECT 'Payroll', 'View Salaries', 'payroll_view_salaries'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'payroll_view_salaries');

INSERT INTO permissions (module, action, code) 
SELECT 'Payroll', 'Manage Increments', 'payroll_manage_increments'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'payroll_manage_increments');

-- Attendance Permissions
INSERT INTO permissions (module, action, code) 
SELECT 'Attendance', 'View Daily Logs', 'attendance_view_logs'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'attendance_view_logs');

INSERT INTO permissions (module, action, code) 
SELECT 'Attendance', 'Audit Locations', 'attendance_audit'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'attendance_audit');

-- 2. Map permissions to Admin and HR
-- Assuming role types are 'admin' and 'hr'

INSERT INTO user_type_permission (user_type_id, permission_id)
SELECT ut.id, p.id
FROM users_types ut
JOIN permissions p ON p.code IN (
    'payroll_view_salaries', 
    'payroll_manage_increments',
    'attendance_view_logs',
    'attendance_audit'
)
WHERE ut.type IN ('admin', 'hr')
AND NOT EXISTS (
    SELECT 1 FROM user_type_permission utp 
    WHERE utp.user_type_id = ut.id AND utp.permission_id = p.id
);

-- ============================================
-- PERMISSIONS UPDATE COMPLETE
-- ============================================
