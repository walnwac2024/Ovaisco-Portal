const { pool } = require('../Utils/db');
const fs = require('fs');
const path = require('path');

async function tableExists(connection, table) {
    const [rows] = await connection.query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = ?
    `, [table]);
    return rows.length > 0;
}

async function columnExists(connection, table, column) {
    const [rows] = await connection.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = ? 
        AND COLUMN_NAME = ?
    `, [table, column]);
    return rows.length > 0;
}

async function indexExists(connection, table, index) {
    const [rows] = await connection.query(`
        SELECT INDEX_NAME 
        FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = ? 
        AND INDEX_NAME = ?
    `, [table, index]);
    return rows.length > 0;
}

async function applyFix() {
    try {
        const sqlPath = path.join(__dirname, '..', 'scripts', 'company_id.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        const statements = sql
            .split(/;(?=(?:[^']*'[^']*')*[^']*$)/)
            .map(s => s.trim())
            .filter(s => s.length > 0);

        console.log(`Executing ${statements.length} statements from company_id.sql...`);

        const connection = await pool.getConnection();
        try {
            for (let statement of statements) {
                // Remove comments
                statement = statement.replace(/--.*$/gm, '').trim();
                if (statement.length === 0) continue;

                // Handle ALTER TABLE ... ADD COLUMN IF NOT EXISTS
                const addColumnMatch = statement.match(/ALTER TABLE (\w+) ADD COLUMN IF NOT EXISTS (\w+)/i);
                if (addColumnMatch) {
                    const table = addColumnMatch[1];
                    const column = addColumnMatch[2];
                    
                    if (!(await tableExists(connection, table))) {
                        console.log(`Skipping: Table ${table} does not exist`);
                        continue;
                    }

                    if (await columnExists(connection, table, column)) {
                        console.log(`Skipping: Column ${column} already exists in ${table}`);
                        continue;
                    }
                    // Rewrite statement without IF NOT EXISTS
                    statement = statement.replace(/ADD COLUMN IF NOT EXISTS/i, 'ADD COLUMN');
                }

                // Handle CREATE INDEX IF NOT EXISTS
                const createIndexMatch = statement.match(/CREATE INDEX IF NOT EXISTS (\w+) ON (\w+)/i);
                if (createIndexMatch) {
                    const index = createIndexMatch[1];
                    const table = createIndexMatch[2];
                    
                    if (!(await tableExists(connection, table))) {
                        console.log(`Skipping: Table ${table} does not exist (for index ${index})`);
                        continue;
                    }

                    if (await indexExists(connection, table, index)) {
                        console.log(`Skipping: Index ${index} already exists on ${table}`);
                        continue;
                    }
                    // Rewrite statement without IF NOT EXISTS
                    statement = statement.replace(/IF NOT EXISTS/i, '');
                }

                console.log(`Executing: ${statement.substring(0, 50)}...`);
                try {
                    await connection.query(statement);
                } catch (stmtErr) {
                    if (stmtErr.code === 'ER_DUP_ENTRY' || stmtErr.code === 'ER_DUP_FIELDNAME' || stmtErr.code === 'ER_TABLE_EXISTS_ERROR' || stmtErr.code === 'ER_DUP_KEYNAME') {
                        console.log(`Skipping due to duplicate entry/field/table/key: ${stmtErr.code}`);
                    } else if (stmtErr.code === 'ER_NO_SUCH_TABLE') {
                        console.log(`Skipping: Table mentioned in statement does not exist`);
                    } else {
                        console.error(`Error executing statement: ${statement}`);
                        throw stmtErr;
                    }
                }
            }
            console.log('Successfully applied company_id fix script.');
        } finally {
            connection.release();
        }
    } catch (err) {
        console.error('Error applying fix:', err);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

applyFix();
