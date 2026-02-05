-- =====================================================
-- System Settings Tables - Migration SQL
-- Purpose: Create centralized tables for dropdown management
-- Date: 2026-02-03
-- =====================================================

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS `system_departments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` INT NULL,
  INDEX `idx_active` (`is_active`),
  INDEX `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Designations Table
CREATE TABLE IF NOT EXISTS `system_designations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` INT NULL,
  INDEX `idx_active` (`is_active`),
  INDEX `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Offices/Locations Table
CREATE TABLE IF NOT EXISTS `system_offices` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `address` TEXT NULL,
  `city` VARCHAR(50) NULL,
  `country` VARCHAR(50) NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` INT NULL,
  INDEX `idx_active` (`is_active`),
  INDEX `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Employment Types Table
CREATE TABLE IF NOT EXISTS `system_employment_types` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `description` TEXT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` INT NULL,
  INDEX `idx_active` (`is_active`),
  INDEX `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Blood Groups Table
CREATE TABLE IF NOT EXISTS `system_blood_groups` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(10) NOT NULL UNIQUE,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Religions Table
CREATE TABLE IF NOT EXISTS `system_religions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Marital Statuses Table
CREATE TABLE IF NOT EXISTS `system_marital_statuses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(20) NOT NULL UNIQUE,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Insert Default Data
-- =====================================================

-- Default Blood Groups
INSERT IGNORE INTO `system_blood_groups` (`name`) VALUES
('A+'), ('A-'), ('B+'), ('B-'), ('AB+'), ('AB-'), ('O+'), ('O-');

-- Default Religions
INSERT IGNORE INTO `system_religions` (`name`) VALUES
('Islam'), ('Christianity'), ('Hinduism'), ('Buddhism'), ('Sikhism'), ('Judaism'), ('Other');

-- Default Marital Statuses
INSERT IGNORE INTO `system_marital_statuses` (`name`) VALUES
('Single'), ('Married'), ('Divorced'), ('Widowed');

-- Default Employment Types
INSERT IGNORE INTO `system_employment_types` (`name`, `description`) VALUES
('Full-Time', 'Full-time permanent employee'),
('Part-Time', 'Part-time employee'),
('Contract', 'Contract-based employee'),
('Internship', 'Intern or trainee'),
('Probation', 'Employee on probation period');

-- =====================================================
-- Migration Complete
-- =====================================================
