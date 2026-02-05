const { pool } = require("./Utils/db");

async function fix() {
    try {
        const mgrName = "Dainyal Mughal";
        const deptName = "KREATORS";

        console.log(`Fixing Manager Mapping for ${mgrName} -> ${deptName}`);

        // Get Manager ID
        const [mgrs] = await pool.execute("SELECT id FROM employee_records WHERE Employee_Name LIKE ?", [`%${mgrName}%`]);
        if (mgrs.length === 0) {
            console.error("Manager not found!");
            process.exit(1);
        }
        const mgrId = mgrs[0].id;

        // Check if mapping exists
        const [existing] = await pool.execute("SELECT id FROM department_managers WHERE department_name = ?", [deptName]);

        if (existing.length > 0) {
            console.log("Mapping already exists. Updating...");
            await pool.execute("UPDATE department_managers SET manager_id = ? WHERE department_name = ?", [mgrId, deptName]);
        } else {
            console.log("Creating new mapping...");
            await pool.execute("INSERT INTO department_managers (department_name, manager_id) VALUES (?, ?)", [deptName, mgrId]);
        }

        console.log("Success! Manager mapped.");

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

fix();
