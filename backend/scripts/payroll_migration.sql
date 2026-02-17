-- ============================================
-- PAYROLL SYSTEM - DATABASE MIGRATION
-- Run this SQL on your live server
-- ============================================

-- 1. PAYROLL SALARIES TABLE
-- Stores employee salary information (one-time entry, locked after submission)
CREATE TABLE IF NOT EXISTS payroll_salaries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  basic_salary DECIMAL(10, 2) NOT NULL,
  allowances DECIMAL(10, 2) DEFAULT 0,
  effective_from DATE NOT NULL,
  is_locked TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employee_records(id) ON DELETE CASCADE,
  UNIQUE KEY unique_employee_salary (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. SALARY INCREMENTS TABLE
-- Complete history of all salary increments
CREATE TABLE IF NOT EXISTS salary_increments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  previous_salary DECIMAL(10, 2) NOT NULL,
  increment_amount DECIMAL(10, 2) DEFAULT NULL,
  increment_percentage DECIMAL(5, 2) DEFAULT NULL,
  new_salary DECIMAL(10, 2) NOT NULL,
  increment_type ENUM('AMOUNT', 'PERCENTAGE') NOT NULL,
  applied_by_employee_id INT NOT NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  effective_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employee_records(id) ON DELETE CASCADE,
  FOREIGN KEY (applied_by_employee_id) REFERENCES employee_records(id) ON DELETE CASCADE,
  INDEX idx_employee_id (employee_id),
  INDEX idx_applied_at (applied_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. INCREMENT REQUESTS TABLE
-- Employee-initiated increment requests
CREATE TABLE IF NOT EXISTS increment_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  requested_amount DECIMAL(10, 2) DEFAULT NULL,
  requested_percentage DECIMAL(5, 2) DEFAULT NULL,
  request_type ENUM('AMOUNT', 'PERCENTAGE') NOT NULL,
  reason TEXT,
  status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_by_employee_id INT DEFAULT NULL,
  reviewed_at TIMESTAMP NULL,
  review_notes TEXT,
  FOREIGN KEY (employee_id) REFERENCES employee_records(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by_employee_id) REFERENCES employee_records(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_employee_id (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. INCREMENT REMINDERS TABLE
-- Annual review reminders for HR/Admin
CREATE TABLE IF NOT EXISTS increment_reminders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  last_increment_date DATE NOT NULL,
  next_review_date DATE NOT NULL,
  reminder_sent TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employee_records(id) ON DELETE CASCADE,
  UNIQUE KEY unique_employee_reminder (employee_id),
  INDEX idx_next_review_date (next_review_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. PAYROLL DEDUCTIONS TABLE
-- Monthly deduction records (late days, unauthorized offs)
CREATE TABLE IF NOT EXISTS payroll_deductions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  month INT NOT NULL,
  year INT NOT NULL,
  late_days_count INT DEFAULT 0,
  late_days_deduction DECIMAL(10, 2) DEFAULT 0,
  unauthorized_offs_count INT DEFAULT 0,
  unauthorized_offs_deduction DECIMAL(10, 2) DEFAULT 0,
  total_deduction DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employee_records(id) ON DELETE CASCADE,
  UNIQUE KEY unique_employee_month_year (employee_id, month, year),
  INDEX idx_month_year (month, year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. PAYROLL MONTHLY TABLE
-- Monthly payroll calculation results
CREATE TABLE IF NOT EXISTS payroll_monthly (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  month INT NOT NULL,
  year INT NOT NULL,
  basic_salary DECIMAL(10, 2) NOT NULL,
  allowances DECIMAL(10, 2) DEFAULT 0,
  gross_salary DECIMAL(10, 2) NOT NULL,
  total_deductions DECIMAL(10, 2) DEFAULT 0,
  net_salary DECIMAL(10, 2) NOT NULL,
  status ENUM('GENERATED', 'PAID') DEFAULT 'GENERATED',
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP NULL,
  FOREIGN KEY (employee_id) REFERENCES employee_records(id) ON DELETE CASCADE,
  UNIQUE KEY unique_employee_payroll (employee_id, month, year),
  INDEX idx_month_year (month, year),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- MIGRATION COMPLETE
-- All 6 payroll tables have been created
-- ============================================
