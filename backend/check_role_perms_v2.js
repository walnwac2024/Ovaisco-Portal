const { pool } = require("./Utils/db");

async function check() {
    try {
        console.log("--- User Types ---");
        const [types] = await pool.execute("SELECT id, type FROM users_types");
        console.log(JSON.stringify(types, null, 2));

        console.log("\n--- Roles with attendance_audit (ID 63) ---");
        const [rows] = await pool.execute(`
            SELECT ut.type, ut.id as type_id
            FROM user_type_permission utp 
            JOIN users_types ut ON utp.user_type_id = ut.id 
            WHERE utp.permission_id = 63
        `);
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
