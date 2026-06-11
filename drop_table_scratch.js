const { pool } = require('./backend/Utils/db');

async function cleanup() {
    try {
        await pool.execute("DROP TABLE IF EXISTS birthday_wishes");
        console.log("✅ Dropped birthday_wishes table.");
    } catch (err) {
        console.error("Cleanup error:", err);
    } finally {
        process.exit();
    }
}

cleanup();
