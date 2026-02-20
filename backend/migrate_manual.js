const { pool } = require("./Utils/db");
const fs = require("fs");
const path = require("path");

async function migrate() {
    try {
        console.log("Starting Migration...");
        const sqlFile = path.join(__dirname, "database", "migrations", "2024_02_18_minimal_payroll.sql");
        const sql = fs.readFileSync(sqlFile, "utf8");

        // Split by semicolon but ignore ones inside comments or strings (simple split for now)
        const statements = sql
            .split(";")
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const statement of statements) {
            console.log("Executing:", statement.substring(0, 50) + "...");
            await pool.execute(statement);
        }

        console.log("✅ Migration Successful!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Migration Failed:", error);
        process.exit(1);
    }
}

migrate();
