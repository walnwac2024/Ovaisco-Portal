const { pool } = require('../Utils/db');
async function check() {
    try {
        const [rows] = await pool.execute(`
            SELECT er.Employee_Name, lb.leave_type_id, lb.balance, lb.year 
            FROM employee_records er 
            JOIN leave_balances lb ON er.id = lb.employee_id 
            WHERE er.Department LIKE '%Sales%' 
            LIMIT 50
        `);
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
