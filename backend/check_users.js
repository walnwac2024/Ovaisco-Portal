const { pool } = require("./Utils/db");

async function check() {
    try {
        console.log("--- User Types ---");
        const [types] = await pool.execute("SELECT id, type, permission_level FROM users_types");
        console.log(JSON.stringify(types, null, 2));

        console.log("\n--- Active Employees with Roles ---");
        const [emps] = await pool.execute(`
            SELECT e.id, e.Employee_Name, ut.type, ut.permission_level 
            FROM employee_records e 
            JOIN employee_user_types eut ON e.id = eut.employee_id 
            JOIN users_types ut ON eut.user_type_id = ut.id 
            WHERE e.can_login = 1 AND e.is_active = 1
        `);
        console.log(JSON.stringify(emps, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
