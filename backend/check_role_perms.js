const { pool } = require("./Utils/db");

async function checkRolePermissions() {
    try {
        console.log("--- Roles with attendance_audit (ID 63) ---");
        const [rows] = await pool.execute(`
            SELECT ut.type, rp.permission_id 
            FROM role_permissions rp 
            JOIN users_types ut ON rp.user_type_id = ut.id 
            WHERE rp.permission_id = 63
        `);
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkRolePermissions();
