const { pool } = require('../Utils/db');

/**
 * Create Payroll System Tables
 * Run: node scripts/create_payroll_tables.js
 */

async function createPayrollTables() {
    const conn = await pool.getConnection();

    try {
        console.log('🚀 Creating payroll system tables...\n');

        // 1. payroll_salaries table
        console.log('Creating payroll_salaries table...');
        await conn.execute(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        console.log('✅ payroll_salaries table created\n');

        // 2. salary_increments table
        console.log('Creating salary_increments table...');
        await conn.execute(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        console.log('✅ salary_increments table created\n');

        // 3. increment_requests table
        console.log('Creating increment_requests table...');
        await conn.execute(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        console.log('✅ increment_requests table created\n');

        // 4. increment_reminders table
        console.log('Creating increment_reminders table...');
        await conn.execute(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        console.log('✅ increment_reminders table created\n');

        // 5. payroll_deductions table
        console.log('Creating payroll_deductions table...');
        await conn.execute(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        console.log('✅ payroll_deductions table created\n');

        // 6. payroll_monthly table
        console.log('Creating payroll_monthly table...');
        await conn.execute(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        console.log('✅ payroll_monthly table created\n');

        console.log('🎉 All payroll tables created successfully!');

    } catch (error) {
        console.error('❌ Error creating payroll tables:', error);
        throw error;
    } finally {
        conn.release();
    }
}

// Run the migration
createPayrollTables()
    .then(() => {
        console.log('\n✅ Migration completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    });
