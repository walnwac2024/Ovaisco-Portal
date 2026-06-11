const mysql = require('mysql2/promise');
require('dotenv').config();

async function showTables() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        const [rows] = await pool.query('SHOW TABLES');
        const dbName = process.env.DB_NAME || Object.keys(rows[0])[0].split('_')[2] || 'hrm_db';
        const tables = rows.map(r => Object.values(r)[0]);
        console.log(JSON.stringify(tables, null, 2));
    } catch (err) {
        console.error("DB Error:", err);
    } finally {
        await pool.end();
    }
}

showTables();
