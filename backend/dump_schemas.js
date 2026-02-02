
const mysql = require('mysql2/promise');
require('dotenv').config();

async function dumpSchemas() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'hrm_db',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        const tables = ['leave_types', 'leave_balances', 'leave_requests'];

        for (const table of tables) {
            try {
                const [rows] = await pool.query(`SHOW CREATE TABLE ${table}`);
                console.log(`\n-- Schema for ${table} --`);
                console.log(rows[0]['Create Table'] + ";");
            } catch (e) {
                console.log(`\n-- Table ${table} not found or error: ${e.message} --`);
            }
        }
    } catch (err) {
        console.error("Dump Error:", err);
    } finally {
        await pool.end();
    }
}

dumpSchemas();
