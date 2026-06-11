const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function migrateMultiTenant() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'hrm_db',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        console.log("Starting Multi-Tenant DB Migration...");

        // 1. Create Companies Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS companies (
                company_id INT AUTO_INCREMENT PRIMARY KEY,
                company_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NULL,
                status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("✅ Created or checked 'companies' table.");

        // 2. Insert Default Company (SuperAdmin / Default Tenant)
        const [existingCompany] = await pool.query(`SELECT * FROM companies WHERE company_id = 1`);
        if (existingCompany.length === 0) {
            await pool.query(`INSERT INTO companies (company_id, company_name, email) VALUES (1, 'Main Company (Default)', 'admin@default.com')`);
            console.log("✅ Created Default Company (ID: 1).");
        }

        // 3. Get all tables
        const [rows] = await pool.query('SHOW TABLES');
        const tables = rows.map(r => Object.values(r)[0]);

        // Tables that do NOT need company_id (system lookup tables, migrations, etc.)
        const ignoreTables = [
            'companies', 'migrations', 'failed_jobs', 'sessions', 'personal_access_tokens',
            'lookup_departments', 'lookup_designations', 'lookup_statuses', 'system_blood_groups',
            'system_departments', 'system_designations', 'system_employment_types', 
            'system_marital_statuses', 'system_offices', 'system_religions'
        ];

        let alteredCount = 0;
        for (const table of tables) {
            if (ignoreTables.includes(table)) continue;

            try {
                // Check if company_id already exists
                const [cols] = await pool.query(`SHOW COLUMNS FROM ?? LIKE 'company_id'`, [table]);
                
                if (cols.length === 0) {
                    await pool.query(`ALTER TABLE ?? ADD COLUMN company_id INT DEFAULT 1`, [table]);
                    console.log(`✅ Added company_id to: ${table}`);
                    alteredCount++;
                } else {
                    console.log(`⚡ company_id already exists in: ${table}`);
                }
            } catch (err) {
                console.error(`❌ Error updating table ${table}:`, err.message);
            }
        }

        console.log(`\n🎉 Migration Completed Successfully! Altered ${alteredCount} tables.`);
    } catch (err) {
        console.error("Migration Fatal Error:", err);
    } finally {
        await pool.end();
    }
}

migrateMultiTenant();
