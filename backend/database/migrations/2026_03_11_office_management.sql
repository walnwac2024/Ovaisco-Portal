-- Create tables for Office Management Requisitions

CREATE TABLE IF NOT EXISTS office_requisitions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    title VARCHAR(255),
    employee_name_manual VARCHAR(255),
    employee_code_manual VARCHAR(255),
    designation VARCHAR(255),
    department VARCHAR(255),
    office_location VARCHAR(255),
    line_manager_name VARCHAR(255),
    assigned_accounts_id INT NULL,
    status ENUM('pending_hr', 'pending_accounts', 'approved', 'rejected') DEFAULT 'pending_hr',
    hr_remarks TEXT,
    accounts_remarks TEXT,
    hr_approved_by INT,
    accounts_approved_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee_records(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_accounts_id) REFERENCES employee_records(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS office_requisition_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    requisition_id INT NOT NULL,
    sr_no INT,
    type_of_particular VARCHAR(255),
    description TEXT,
    qty INT,
    qty_issued INT DEFAULT 0,
    FOREIGN KEY (requisition_id) REFERENCES office_requisitions(id) ON DELETE CASCADE
);

-- Insert new permissions
INSERT INTO permissions (module, action, code) VALUES 
('Office Management', 'Apply', 'office_req_apply'),
('Office Management', 'Approve HR', 'office_req_approve_hr'),
('Office Management', 'Approve Accounts', 'office_req_approve_accounts'),
('Office Management', 'View All', 'office_req_view_all')
ON DUPLICATE KEY UPDATE code=code;
