const { pool } = require("./Utils/db");

async function debugRecent() {
    try {
        console.log("--- DEBUGGING RECENT USERS vs USER-2 ---");

        // 1. Get user-2 details
        const [mgrs] = await pool.execute("SELECT id, Employee_Name, Department FROM employee_records WHERE Employee_Name LIKE 'user-2%'");
        if (mgrs.length === 0) {
            console.log("User-2 not found!");
            process.exit(0);
        }
        const mgr = mgrs[0];
        console.log(`Manager: ${mgr.Employee_Name} (ID: ${mgr.id})`);
        console.log(`Manager Dept: '${mgr.Department}'`);

        // 2. Get 5 most recent employees
        const [recent] = await pool.execute(
            "SELECT id, Employee_Name, Department, Reporting, is_active FROM employee_records ORDER BY id DESC LIMIT 5"
        );

        console.log("\n--- 5 Most Recent Employees ---");
        recent.forEach(e => {
            const match = e.Department === mgr.Department;
            const matchLog = match ? "✅ MATCH" : "❌ MISMATCH";
            console.log(`[${e.id}] ${e.Employee_Name} | Dept: '${e.Department}' | Active: ${e.is_active} | ${matchLog}`);
        });

        // 3. Simulate Dashboard Query for user-2
        console.log("\n--- Simulating Dashboard Query for User-2 ---");
        const [rows] = await pool.execute(
            `SELECT id, Employee_Name FROM employee_records 
             WHERE is_active = 1 AND id != ? AND Department = ? 
             ORDER BY id DESC LIMIT 5`,
            [mgr.id, mgr.Department]
        );
        console.log(`Dashboard would show (${rows.length}):`);
        console.log(rows.map(r => r.Employee_Name));

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

debugRecent();
