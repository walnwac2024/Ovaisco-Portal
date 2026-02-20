-- Database Migration for Minimalist Payroll System

-- 1. Update employee_records for Salary Setup
ALTER TABLE employee_records 
ADD COLUMN monthly_salary DECIMAL(15, 2) DEFAULT 0.00,
ADD COLUMN salary_locked TINYINT(1) DEFAULT 0,
ADD COLUMN salary_locked_at DATETIME NULL;

-- 2. Create Consolidated Payroll Records Table
CREATE TABLE IF NOT EXISTS payroll_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    reference_number VARCHAR(50) UNIQUE,
    
    -- Attendance Snapshot
    attendance_late_days INT DEFAULT 0,
    attendance_leave_days INT DEFAULT 0,
    
    -- Money Matters
    gross_salary DECIMAL(15, 2) NOT NULL,
    late_deduction DECIMAL(15, 2) DEFAULT 0.00,
    leave_deduction DECIMAL(15, 2) DEFAULT 0.00,
    total_deductions DECIMAL(15, 2) DEFAULT 0.00,
    net_salary DECIMAL(15, 2) NOT NULL,
    
    -- Meta
    status ENUM('DRAFT', 'FINAL') DEFAULT 'DRAFT',
    transfer_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX (employee_id),
    INDEX (month, year),
    FOREIGN KEY (employee_id) REFERENCES employee_records(id) ON DELETE CASCADE
);

-- 3. Create Increment History Table
CREATE TABLE IF NOT EXISTS increment_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    old_salary DECIMAL(15, 2) NOT NULL,
    new_salary DECIMAL(15, 2) NOT NULL,
    increment_type ENUM('FIXED', 'PERCENTAGE') NOT NULL,
    increment_value DECIMAL(15, 2) NOT NULL,
    effective_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX (employee_id),
    FOREIGN KEY (employee_id) REFERENCES employee_records(id) ON DELETE CASCADE
);
