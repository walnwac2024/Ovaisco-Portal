const { pool } = require("../Utils/db");
const fs = require("fs");
const path = require("path");

async function runMigration() {
    try {
        const sqlPath = path.join(__dirname, "detailed_allowances.sql");
        const sql = fs.readFileSync(sqlPath, "utf8");

        console.log("Running detailed allowances migration...");
        await pool.query(sql);
        console.log("Migration successful!");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

runMigration();
