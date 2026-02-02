const { pool } = require("../Utils/db");

async function createTable() {
    try {
        console.log("Creating employee_timeline table...");
        const sql = `
            CREATE TABLE IF NOT EXISTS employee_timeline (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                employee_id INT NOT NULL,
                event_type VARCHAR(50) NOT NULL,
                category VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                actioned_by INT,
                event_date DATETIME NOT NULL,
                internal_notes TEXT,
                visibility ENUM('ALL', 'MANAGERS_ONLY', 'HR_ONLY') DEFAULT 'ALL',
                attachments JSON,
                metadata JSON,
                is_system_generated TINYINT(1) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_timeline_employee (employee_id),
                INDEX idx_timeline_date (event_date),
                INDEX idx_timeline_category (category)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        await pool.execute(sql);
        console.log("Table created successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Error creating table:", err);
        process.exit(1);
    }
}

createTable();
