-- Migration: Detailed Payroll Allowances
-- Date: 2024-02-18

-- 1. Create Base Payroll Settings table for detailed allowances
CREATE TABLE IF NOT EXISTS payroll_base_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    contractual_pay DECIMAL(15, 2) DEFAULT 0.00,
    transport_allowance DECIMAL(15, 2) DEFAULT 0.00,
    attendance_bonus DECIMAL(15, 2) DEFAULT 0.00,
    mobile_allowance DECIMAL(15, 2) DEFAULT 0.00,
    tardiness_allowance DECIMAL(15, 2) DEFAULT 0.00,
    night_allowance DECIMAL(15, 2) DEFAULT 0.00,
    house_allowance DECIMAL(15, 2) DEFAULT 0.00,
    fuel_allowance DECIMAL(15, 2) DEFAULT 0.00,
    adhoc_allowance DECIMAL(15, 2) DEFAULT 0.00,
    misc_allowance DECIMAL(15, 2) DEFAULT 0.00,
    relocation_allowance DECIMAL(15, 2) DEFAULT 0.00,
    is_locked TINYINT(1) DEFAULT 0,
    locked_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee_records(id) ON DELETE CASCADE,
    UNIQUE KEY unique_employee_base (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
