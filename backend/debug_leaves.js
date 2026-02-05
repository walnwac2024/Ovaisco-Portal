const { pool } = require("./Utils/db");

async function debug() {
    try {
        const mgrName = "Dainyal Mughal";
        console.log(`Searching for Manager: ${mgrName}`);

        const [mgrs] = await pool.execute("SELECT * FROM employee_records WHERE Employee_Name LIKE ?", [`%${mgrName}%`]);
        if (mgrs.length === 0) {
            console.log("Manager not found in employee_records.");
            process.exit(0);
        }

        const mgr = mgrs[0];
        console.log("Manager Found:", { id: mgr.id, name: mgr.Employee_Name, dept: mgr.Department });

        // Check employees in KREATORS
        const [kreators] = await pool.execute("SELECT id, Employee_Name, Reporting FROM employee_records WHERE Department = 'KREATORS'");
        console.log(`\nEmployees in KREATORS (${kreators.length}):`);
        if (kreators.length > 0) {
            console.log(kreators.slice(0, 5)); // Show first 5
        }

        // Check if ANY manager exists for KREATORS
        const [existingDM] = await pool.execute("SELECT * FROM department_managers WHERE department_name = 'KREATORS'");
        console.log("\nCurrent Manager for KREATORS:", existingDM);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

debug();
