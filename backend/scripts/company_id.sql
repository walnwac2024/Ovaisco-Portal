-- ============================================
-- 1. MULTI-TENANT CORE SETUP
-- ============================================

-- Companies Table create karein agar nahi hai
CREATE TABLE IF NOT EXISTS companies (
    company_id INT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Default Company (ID: 1) insert karein
INSERT IGNORE INTO companies (company_id, company_name, email) 
VALUES (1, 'Main Company (Default)', 'admin@default.com');

-- Core Tables mein company_id column add karein
-- (Ye script safe hai, agar column pehle se hai to skip ho jayega)
ALTER TABLE employee_records ADD COLUMN IF NOT EXISTS company_id INT DEFAULT 1 AFTER id;
ALTER TABLE users_types ADD COLUMN IF NOT EXISTS company_id INT DEFAULT 1;
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS company_id INT DEFAULT 1;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS company_id INT DEFAULT 1;
ALTER TABLE leave_applications ADD COLUMN IF NOT EXISTS company_id INT DEFAULT 1;
ALTER TABLE news ADD COLUMN IF NOT EXISTS company_id INT DEFAULT 1;
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS company_id INT DEFAULT 1;

-- ============================================
-- 2. PERFORMANCE OPTIMIZATIONS (INDEXES)
-- ============================================

-- Employees Table
CREATE INDEX IF NOT EXISTS idx_employees_code ON employee_records(Employee_ID);
CREATE INDEX IF NOT EXISTS idx_employees_name ON employee_records(Employee_Name);
CREATE INDEX IF NOT EXISTS idx_employees_active ON employee_records(is_active);
CREATE INDEX IF NOT EXISTS idx_employees_company ON employee_records(company_id);

-- Attendance Table
CREATE INDEX IF NOT EXISTS idx_attendance_emp_date ON attendance(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_company ON attendance(company_id);

-- Leave Applications
CREATE INDEX IF NOT EXISTS idx_leave_emp_status ON leave_applications(employee_id, status);
CREATE INDEX IF NOT EXISTS idx_leave_company ON leave_applications(company_id);

-- ============================================
-- 3. MISSING PERMISSIONS (SYSTEM SETTINGS)
-- ============================================

INSERT IGNORE INTO permissions (module, action, code) VALUES 
('News', 'View News', 'news_view'),
('News', 'Manage News', 'news_manage'),
('News', 'Post Reactions', 'news_react'),
('News', 'Post Comments', 'news_comment'),
('Timeline', 'View Timeline', 'timeline_view'),
('Timeline', 'Manage Events', 'timeline_manage'),
('Branding', 'View Branding', 'branding_view'),
('Branding', 'Manage Branding', 'branding_manage'),
('Attendance', 'View All Attendance', 'attendance_view_all'),
('Attendance', 'Manage Settings', 'attendance_manage_settings'),
('Attendance', 'Attendance Audit', 'attendance_audit'),
('Audit', 'View Logs', 'audit_view'),
('WhatsApp', 'Manage Integration', 'whatsapp_manage'),
('Permissions', 'Manage Roles', 'permissions_edit');