const { pool } = require("./Utils/db");

async function checkPermissions() {
    try {
        console.log("--- Permissions ---");
        const [rows] = await pool.execute("SELECT id, code FROM permissions WHERE code LIKE '%audit%' OR code LIKE '%attendance%'");
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkPermissions();
