const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function dropTables() {
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
        const tablesToDrop = [
            'users_types',
            'lookup_departments',
            'lookup_designations',
            'lookup_statuses',
            'failed_jobs',
            'password_resets',
            'personal_access_tokens'
        ];

        console.log("Starting DB Cleanup...");
        for (const table of tablesToDrop) {
            try {
                await pool.query(`DROP TABLE IF EXISTS ??`, [table]);
                console.log(`✅ Dropped table: ${table}`);
            } catch (err) {
                console.error(`❌ Failed to drop table ${table}:`, err.message);
            }
        }
        console.log("Cleanup completed!");
    } catch (err) {
        console.error("DB Error:", err);
    } finally {
        await pool.end();
    }
}

dropTables();
