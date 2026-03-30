const { pool } = require('../../Utils/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        const sqlPath = path.join(__dirname, '2026_03_11_office_management.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Split by semicolon and filter empty strings
        const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);

        for (let statement of statements) {
            console.log(`Executing: ${statement.substring(0, 50)}...`);
            await pool.execute(statement);
        }

        console.log("✅ Office Management migration successful!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration failed:", err);
        process.exit(1);
    }
}

runMigration();
