const { pool } = require("./Utils/db");

async function debugUser2() {
    try {
        const mgrName = "user-2";
        console.log(`Searching for Manager: ${mgrName}`);

        const [mgrs] = await pool.execute("SELECT * FROM employee_records WHERE Employee_Name LIKE ?", [`%${mgrName}%`]);
        if (mgrs.length === 0) {
            console.log("Manager not found in employee_records.");
            process.exit(0);
        }

        const mgr = mgrs[0];
        console.log("Manager Found:", {
            id: mgr.id,
            name: mgr.Employee_Name,
            dept: mgr.Department,
            designation: mgr.Designations,
            reporting: mgr.Reporting
        });

        if (!mgr.Department) {
            console.log("⚠️ Manager has NO DEPARTMENT assigned.");
        } else {
            // Check department_managers
            const [dm] = await pool.execute("SELECT * FROM department_managers WHERE department_name = ?", [mgr.Department]);
            console.log("\nCurrent Manager for Dept '" + mgr.Department + "':", dm);

            // Check employees in this department
            const [team] = await pool.execute("SELECT id, Employee_Name, Reporting FROM employee_records WHERE Department = ?", [mgr.Department]);
            console.log(`\nEmployees in '${mgr.Department}' (${team.length}):`);
            if (team.length > 0) {
                console.log(team.slice(0, 5)); // Show first 5
            }

            // Check matching leaves logic
            let query = `
                SELECT count(*) as count
                FROM leave_applications la
                JOIN employee_records er ON la.employee_id = er.id
                WHERE (er.Department = ? AND ?) OR (er.Reporting = ? OR er.Reporting LIKE ?)
            `;
            // NOTE: The actual query in Leave.js is stricter about department checks (must be in department_managers).
            // This is just a rough check.
        }

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

debugUser2();
