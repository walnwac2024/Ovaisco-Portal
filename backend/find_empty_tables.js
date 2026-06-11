const mysql = require('mysql2/promise');
require('dotenv').config();

async function findEmptyTables() {
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
        const tables = rows.map(r => Object.values(r)[0]);
        
        let emptyTables = [];
        let duplicateCandidates = ['users_types']; // known potential dupes

        for (const table of tables) {
            try {
                const [countResult] = await pool.query(`SELECT COUNT(*) as cnt FROM ??`, [table]);
                if (countResult[0].cnt === 0) {
                    emptyTables.push(table);
                }
            } catch(e) { }
        }

        console.log("\n=== EMPTY TABLES (0 Rows) ===");
        emptyTables.forEach(t => console.log("- " + t));

    } catch (err) {
        console.error("DB Error:", err);
    } finally {
        await pool.end();
    }
}

findEmptyTables();
