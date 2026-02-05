const { pool } = require("./Utils/db");

async function debugManagerVisibility() {
    try {
        console.log("--- DEBUGGING MANAGER VISIBILITY ---");

        // 1. Get user-2 (The observer)
        const [mgrs] = await pool.execute("SELECT id, Employee_Name, Department FROM employee_records WHERE Employee_Name = 'user-2' LIMIT 1");
        if (mgrs.length === 0) {
            console.log("Observer 'user-2' not found.");
            process.exit(0);
        }
        const observer = mgrs[0];
        console.log(`Observer: ${observer.Employee_Name} (ID: ${observer.id}) | Dept: '${observer.Department}'`);

        // 2. Find recently created employees (last 10) and their User Types
        console.log("\n--- Recent Employees (Last 10) ---");
        const [recent] = await pool.execute(`
            SELECT e.id, e.Employee_Name, e.Department, e.is_active, ut.type as UserType
            FROM employee_records e
            LEFT JOIN employee_user_types eut ON eut.employee_id = e.id AND eut.is_primary = 1
            LEFT JOIN users_types ut ON ut.id = eut.user_type_id
            ORDER BY e.id DESC LIMIT 10
        `);

        recent.forEach(e => {
            const sameDept = e.Department === observer.Department;
            const matchLog = sameDept ? "✅ SAME DEPT" : "❌ DIFF DEPT";
            console.log(`[${e.id}] ${e.Employee_Name} | Type: ${e.UserType} | Dept: '${e.Department}' | Active: ${e.is_active} | ${matchLog}`);
        });

        // 3. Simulate Dashboard Query used in Role.js
        console.log("\n--- Simulating Dashboard 'My Team' Query ---");
        const [team] = await pool.execute(
            `SELECT id, Employee_Name, Department, is_active
             FROM employee_records
             WHERE is_active = 1 AND id != ? AND Department = ?
             ORDER BY id DESC LIMIT 25`,
            [observer.id, observer.Department]
        );

        console.log(`Query returned ${team.length} records:`);
        team.forEach(t => console.log(`- [${t.id}] ${t.Employee_Name}`));

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

debugManagerVisibility();
