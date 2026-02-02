
const mysql = require('mysql2/promise');
require('dotenv').config();

async function debugLatestEmployee() {
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
        console.log("--- Debugging Latest Employee ---");

        // 1. Get latest employee
        const [employees] = await pool.execute(
            `SELECT id, Employee_ID, Employee_Name 
             FROM employee_records 
             ORDER BY id DESC LIMIT 1`
        );

        if (employees.length === 0) {
            console.log("No employees found.");
            return;
        }

        const emp = employees[0];
        console.log("Latest Employee:", emp);

        // 2. Check Leave Balances
        const [balances] = await pool.execute(
            `SELECT * FROM leave_balances WHERE employee_id = ?`,
            [emp.id]
        );

        console.log(`\nLeave Balances Found: ${balances.length}`);
        if (balances.length > 0) {
            console.table(balances);
        } else {
            console.log("❌ NO leave balances found for this employee.");
        }

        // 3. Check Leave Types (to ensure we have types to assign)
        const [types] = await pool.execute('SELECT * FROM leave_types WHERE is_active = 1');
        console.log(`\nActive Leave Types: ${types.length}`);
        if (types.length === 0) {
            console.log("❌ No active leave types found!");
        } else {
            console.table(types);
        }

        // 4. Check Schema of leave_balances
        console.log("\n--- Schema of leave_balances ---");
        const [schema] = await pool.execute('DESCRIBE leave_balances');
        console.table(schema);

    } catch (err) {
        console.error("Debug Error:", err);
    } finally {
        await pool.end();
    }
}

debugLatestEmployee();
