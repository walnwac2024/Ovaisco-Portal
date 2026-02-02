const { pool } = require("./Utils/db");
const fs = require("fs");

async function dumpPermissions() {
    try {
        const [rows] = await pool.execute("SELECT * FROM permissions");
        fs.writeFileSync("permissions_dump.json", JSON.stringify(rows, null, 2));
        console.log("Permissions dumped to permissions_dump.json");
        process.exit(0);
    } catch (err) {
        console.error("Error dumping permissions:", err);
        process.exit(1);
    }
}

dumpPermissions();
