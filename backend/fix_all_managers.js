const { pool } = require("./Utils/db");

async function fixAll() {
    try {
        console.log("Starting Auto-Discovery of Department Managers...");

        // 1. Get all departments
        const [depts] = await pool.execute("SELECT DISTINCT Department FROM employee_records WHERE Department IS NOT NULL AND Department != ''");
        console.log(`Found ${depts.length} departments.`);

        for (const row of depts) {
            const dept = row.Department;

            // 2. Find most common 'Reporting' value for this department
            const [reporters] = await pool.execute(`
                SELECT Reporting, COUNT(*) as cnt 
                FROM employee_records 
                WHERE Department = ? AND Reporting IS NOT NULL AND Reporting != ''
                GROUP BY Reporting 
                ORDER BY cnt DESC 
                LIMIT 1
            `, [dept]);

            if (reporters.length === 0) {
                console.log(`[${dept}] No reporting data found. Skipping.`);
                continue;
            }

            const managerName = reporters[0].Reporting;
            const reportCount = reporters[0].cnt;

            // 3. Find this manager's ID
            // First, try by Name
            let [mgrRows] = await pool.execute(
                "SELECT id, Employee_Name FROM employee_records WHERE Employee_Name LIKE ? LIMIT 1",
                [`${managerName}`]
            );

            // If not found by name, try by Designation
            if (mgrRows.length === 0) {
                console.log(`[${dept}] Name mismatch for "${managerName}". Trying to find employee with Designation = "${managerName}"...`);

                // Try exact designation match
                [mgrRows] = await pool.execute(
                    "SELECT id, Employee_Name FROM employee_records WHERE Designations = ? OR Designations LIKE ? LIMIT 1",
                    [managerName, `%${managerName}%`]
                );
            }

            if (mgrRows.length === 0) {
                // Try stripping "Manager" prefix/suffix? 
                // Or look for "Head of" logic? 
                // For now, let's just log failure.
                console.log(`[${dept}] FAILED to resolve manager "${managerName}" (${reportCount} reports). No matching Name or Designation.`);
                continue;
            }

            const mgrId = mgrRows[0].id;
            const verifiedName = mgrRows[0].Employee_Name;

            // 4. Update/Insert into department_managers
            const [existing] = await pool.execute("SELECT id FROM department_managers WHERE department_name = ?", [dept]);

            if (existing.length > 0) {
                // Optional: Update if you want to overwrite, or skip. 
                // Let's update to ensure it's correct based on data.
                await pool.execute("UPDATE department_managers SET manager_id = ? WHERE department_name = ?", [mgrId, dept]);
                console.log(`[${dept}] UPDATED manager to "${verifiedName}" (was top reporter with ${reportCount} reports).`);
            } else {
                await pool.execute("INSERT INTO department_managers (department_name, manager_id) VALUES (?, ?)", [dept, mgrId]);
                console.log(`[${dept}] NEW mapping to manager "${verifiedName}" (${reportCount} reports).`);
            }
        }

        console.log("\nDone.");

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

fixAll();
