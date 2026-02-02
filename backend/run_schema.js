const { pool } = require('./Utils/db');
const fs = require('fs');
const path = require('path');

async function runSchema() {
    try {
        const schemaPath = path.join(__dirname, 'database', 'performance_schema.sql');
        const sql = fs.readFileSync(schemaPath, 'utf8');

        // Split SQL by semicolon, but handle multiple statements correctly
        // A better way is to use the mysql cli if possible, but we'll try splitting for simple tables
        const statements = sql
            .split(/;\s*$/m)
            .map(s => s.trim())
            .filter(s => s.length > 0);

        console.log(`Executing ${statements.length} statements...`);

        const connection = await pool.getConnection();
        try {
            for (const statement of statements) {
                await connection.query(statement);
            }
            console.log('Performance schema applied successfully.');
        } finally {
            connection.release();
        }
    } catch (err) {
        console.error('Error applying performance schema:', err);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

runSchema();
