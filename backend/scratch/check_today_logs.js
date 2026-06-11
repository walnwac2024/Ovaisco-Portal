const { pool } = require('../Utils/db');

async function checkLogs() {
    try {
        const [rows] = await pool.query("SELECT actor_name, action, details, created_at FROM audit_logs WHERE DATE(created_at) = CURDATE() ORDER BY created_at DESC");
        console.log(JSON.stringify(rows, null, 2));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

checkLogs();
