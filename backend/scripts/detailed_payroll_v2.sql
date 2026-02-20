-- ============================================
-- DETAILED PAYROLL SYSTEM - CONSOLIDATED SCHEMA
-- ============================================

-- 1. Base Payroll Settings (Config per employee)
CREATE TABLE IF NOT EXISTS payroll_base_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    contractual_pay DECIMAL(15, 2) DEFAULT 0,
    transport_allowance DECIMAL(15, 2) DEFAULT 0,
    attendance_bonus DECIMAL(15, 2) DEFAULT 0,
    mobile_allowance DECIMAL(15, 2) DEFAULT 0,
    night_allowance DECIMAL(15, 2) DEFAULT 0,
    house_allowance DECIMAL(15, 2) DEFAULT 0,
    fuel_allowance DECIMAL(15, 2) DEFAULT 0,
    adhoc_allowance DECIMAL(15, 2) DEFAULT 0,
    misc_allowance DECIMAL(15, 2) DEFAULT 0,
    relocation_allowance DECIMAL(15, 2) DEFAULT 0,
    is_locked TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee_records(id) ON DELETE CASCADE,
    UNIQUE KEY unique_employee_base (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Monthly Payroll Records (Snapshot of generated payslips)
CREATE TABLE IF NOT EXISTS payroll_monthly_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    reference_number VARCHAR(50),
    transfer_date DATE,
    
    -- Basics Snapshot (What was active when payroll was generated)
    basic_contractual_pay DECIMAL(15, 2) DEFAULT 0,
    basic_transport_allowance DECIMAL(15, 2) DEFAULT 0,
    basic_attendance_bonus DECIMAL(15, 2) DEFAULT 0,
    basic_mobile_allowance DECIMAL(15, 2) DEFAULT 0,
    basic_night_allowance DECIMAL(15, 2) DEFAULT 0,
    basic_house_allowance DECIMAL(15, 2) DEFAULT 0,
    basic_fuel_allowance DECIMAL(15, 2) DEFAULT 0,
    basic_adhoc_allowance DECIMAL(15, 2) DEFAULT 0,
    basic_misc_allowance DECIMAL(15, 2) DEFAULT 0,
    basic_relocation_allowance DECIMAL(15, 2) DEFAULT 0,
    basic_total_payroll DECIMAL(15, 2) DEFAULT 0,

    -- Overtime Additions
    ot_1_5_hours DECIMAL(10, 2) DEFAULT 0,
    ot_1_5_amount DECIMAL(15, 2) DEFAULT 0,
    ot_2_0_hours DECIMAL(10, 2) DEFAULT 0,
    ot_2_0_amount DECIMAL(15, 2) DEFAULT 0,
    ot_2_5_hours DECIMAL(10, 2) DEFAULT 0,
    ot_2_5_amount DECIMAL(15, 2) DEFAULT 0,
    special_ot_1_5_hours DECIMAL(10, 2) DEFAULT 0,
    special_ot_1_5_amount DECIMAL(15, 2) DEFAULT 0,
    special_ot_2_0_hours DECIMAL(10, 2) DEFAULT 0,
    special_ot_2_0_amount DECIMAL(15, 2) DEFAULT 0,
    referral_bonus DECIMAL(15, 2) DEFAULT 0,
    performance_bonus DECIMAL(15, 2) DEFAULT 0,
    arrears_addition DECIMAL(15, 2) DEFAULT 0,
    other_addition DECIMAL(15, 2) DEFAULT 0,
    commission_amount DECIMAL(15, 2) DEFAULT 0,
    total_overtime_additions DECIMAL(15, 2) DEFAULT 0,

    -- Deductions
    absent_days INT DEFAULT 0,
    absent_amount DECIMAL(15, 2) DEFAULT 0,
    late_hours DECIMAL(10, 2) DEFAULT 0,
    late_amount DECIMAL(15, 2) DEFAULT 0,
    attendance_bonus_deduction DECIMAL(15, 2) DEFAULT 0,
    security_fund_amount DECIMAL(15, 2) DEFAULT 0,
    travel_deduction_amount DECIMAL(15, 2) DEFAULT 0,
    night_allowance_deduction DECIMAL(15, 2) DEFAULT 0,
    arrears_deduction_amount DECIMAL(15, 2) DEFAULT 0,
    eobi_amount DECIMAL(15, 2) DEFAULT 0,
    advance_deduction_amount DECIMAL(15, 2) DEFAULT 0,
    other_deductions_amount DECIMAL(15, 2) DEFAULT 0,
    tax_deductions_amount DECIMAL(15, 2) DEFAULT 0,
    total_deductions DECIMAL(15, 2) DEFAULT 0,

    -- Summary
    gross_salary DECIMAL(15, 2) DEFAULT 0,
    net_salary DECIMAL(15, 2) DEFAULT 0,
    
    status ENUM('GENERATED', 'PAID', 'RELEASED') DEFAULT 'GENERATED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee_records(id) ON DELETE CASCADE,
    UNIQUE KEY unique_monthly_payroll (employee_id, month, year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
