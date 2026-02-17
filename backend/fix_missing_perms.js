const { pool } = require("./Utils/db");

async function fix() {
    try {
        console.log("Checking for attendance_view_logs...");
        const [rows] = await pool.execute("SELECT id FROM permissions WHERE code = 'attendance_view_logs'");

        let permId;
        if (rows.length === 0) {
            console.log("Adding attendance_view_logs...");
            const [result] = await pool.execute(
                "INSERT INTO permissions (module, action, code) VALUES ('Attendance', 'View Logs', 'attendance_view_logs')"
            );
            permId = result.insertId;
        } else {
            permId = rows[0].id;
        }

        console.log(`Permission ID for attendance_view_logs: ${permId}`);

        // Assign to Admin, HR, Super Admin (IDs 1, 10, 9)
        const roleIds = [1, 10, 9];
        for (const roleId of roleIds) {
            const [check] = await pool.execute(
                "SELECT id FROM user_type_permission WHERE user_type_id = ? AND permission_id = ?",
                [roleId, permId]
            );
            if (check.length === 0) {
                console.log(`Assigning to Role ID ${roleId}...`);
                await pool.execute(
                    "INSERT INTO user_type_permission (user_type_id, permission_id) VALUES (?, ?)",
                    [roleId, permId]
                );
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fix();
