const { pool } = require('../Utils/db');

const sql = `
CREATE TABLE IF NOT EXISTS shift_rotation_patterns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cycle_days INT NOT NULL DEFAULT 7,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shift_rotation_pattern_days (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pattern_id INT NOT NULL,
    day_number INT NOT NULL,
    shift_id INT,
    FOREIGN KEY (pattern_id) REFERENCES shift_rotation_patterns(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS employee_rotation_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    pattern_id INT NOT NULL,
    start_date DATE NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pattern_id) REFERENCES shift_rotation_patterns(id)
);

CREATE TABLE IF NOT EXISTS employee_scheduled_shifts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    date DATE NOT NULL,
    shift_id INT,
    is_override TINYINT(1) DEFAULT 0,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY idx_emp_date (employee_id, date)
);

ALTER TABLE attendance_shifts ADD COLUMN color VARCHAR(20) DEFAULT '#3b82f6';
`;

async function runMigration() {
    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

    console.log(`Running ${statements.length} migration statements...`);

    const conn = await pool.getConnection();
    try {
        for (let statement of statements) {
            console.log(`Executing statement...`);
            try {
                await conn.query(statement);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log("Column already exists, skipping...");
                    continue;
                }
                throw err;
            }
        }
        console.log("Migration completed successfully!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        conn.release();
        process.exit();
    }
}

runMigration();
