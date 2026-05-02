// backend/scripts/fix_permissions.js
const { pool } = require("../Utils/db");

async function fix() {
    try {
        console.log("Starting permission fix...");

        // 1. Core Permissions to add
        const corePerms = [
            { module: "attendance", action: "View Daily Report", code: "attendance_daily_report" },
            { module: "permissions", action: "View/Edit Permissions", code: "permissions_view" },
            { module: "settings", action: "View System Settings", code: "system_settings_view" },
            { module: "logs", action: "View System Logs", code: "logs_view" },
            { module: "branding", action: "Manage Branding", code: "branding_view" }
        ];

        for (const cp of corePerms) {
            const [existing] = await pool.execute("SELECT id FROM permissions WHERE code = ?", [cp.code]);
            let permissionId;
            
            if (existing.length === 0) {
                const [result] = await pool.execute(
                    "INSERT INTO permissions (module, action, code) VALUES (?, ?, ?)",
                    [cp.module, cp.action, cp.code]
                );
                permissionId = result.insertId;
                console.log(`Inserted new permission: ${cp.code} (ID: ${permissionId})`);
            } else {
                permissionId = existing[0].id;
                console.log(`Permission already exists: ${cp.code} (ID: ${permissionId})`);
            }

            // 2. Assign to default roles (Admin, Super Admin, HR, Developer)
            const targetRoles = [1, 9, 10, 11]; // admin, super_admin, HR, Developer
            for (const roleId of targetRoles) {
                const [mapExists] = await pool.execute(
                    "SELECT id FROM user_type_permission WHERE user_type_id = ? AND permission_id = ?",
                    [roleId, permissionId]
                );
                
                if (mapExists.length === 0) {
                    await pool.execute(
                        "INSERT INTO user_type_permission (user_type_id, permission_id) VALUES (?, ?)",
                        [roleId, permissionId]
                    );
                    console.log(`Assigned ${cp.code} to role ID: ${roleId}`);
                }
            }
        }

        console.log("Permission fix completed successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Error fixing permissions:", err);
        process.exit(1);
    }
}

fix();
