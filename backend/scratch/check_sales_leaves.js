const { pool } = require('../Utils/db');
async function check() {
    try {
        const [rows] = await pool.execute(`
            SELECT er.id, er.Employee_Name, er.Department 
            FROM employee_records er 
            WHERE er.Department LIKE '%Sales%' 
            AND er.id NOT IN (SELECT employee_id FROM leave_balances WHERE year = 2026)
            LIMIT 20
        `);
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
