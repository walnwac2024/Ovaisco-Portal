// =====================================================
// Complete System Settings Migration Script
// Purpose: Run SQL migration and data migration in one go
// Usage: node backend/scripts/complete_migration.js
// =====================================================

const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { pool } = require("../Utils/db");

async function runMigration() {
    const conn = await pool.getConnection();

    try {
        console.log("🚀 Starting Full System Settings Migration...\n");

        // 1. Run SQL Schema Migration
        console.log("📜 Step 1: Creating Database Tables...");
        const sqlPath = path.join(__dirname, "..", "migrations", "create_system_settings_tables.sql");
        const sqlContent = fs.readFileSync(sqlPath, "utf8");

        // Split SQL by semicolon, and clean each query
        const queries = sqlContent
            .split(";")
            .map(q => q.trim())
            .filter(q => q.length > 0);

        for (let query of queries) {
            // Remove comments from within the query
            const cleanQuery = query
                .split("\n")
                .filter(line => !line.trim().startsWith("--") && !line.trim().startsWith("#"))
                .join(" ")
                .trim();

            if (!cleanQuery) continue;

            console.log(`  Executing query: ${cleanQuery.substring(0, 100)}...`);
            try {
                await conn.query(cleanQuery);
            } catch (err) {
                console.error(`  ❌ Error executing query:`, err.message);
                throw err;
            }
        }
        console.log("  ✅ Tables created successfully.\n");

        // 2. Data Migration
        console.log("📁 Step 2: Migrating Existing Data...");
        await conn.beginTransaction();

        const migrationSteps = [
            {
                name: "Departments",
                sql: "SELECT DISTINCT TRIM(Department) AS name FROM employee_records WHERE Department IS NOT NULL AND Department != ''",
                table: "system_departments"
            },
            {
                name: "Designations",
                sql: "SELECT DISTINCT TRIM(Designations) AS name FROM employee_records WHERE Designations IS NOT NULL AND Designations != ''",
                table: "system_designations"
            },
            {
                name: "Offices",
                sql: "SELECT DISTINCT TRIM(Office_Location) AS name FROM employee_records WHERE Office_Location IS NOT NULL AND Office_Location != ''",
                table: "system_offices"
            },
            {
                name: "Employment Types",
                sql: "SELECT DISTINCT TRIM(Status) AS name FROM employee_records WHERE Status IS NOT NULL AND Status != ''",
                table: "system_employment_types"
            }
        ];

        for (const step of migrationSteps) {
            console.log(`   Migrating ${step.name}...`);
            const [rows] = await conn.execute(step.sql);
            let count = 0;
            for (const row of rows) {
                await conn.execute(
                    `INSERT IGNORE INTO ${step.table} (name, is_active) VALUES (?, 1)`,
                    [row.name]
                );
                count++;
            }
            console.log(`   ✅ Migrated ${count} ${step.name}`);
        }

        await conn.commit();
        console.log("\n✨ Migration Complete Successfully!");

    } catch (error) {
        if (conn) await conn.rollback();
        console.error("\n❌ Migration failed:", error);
        process.exit(1);
    } finally {
        if (conn) conn.release();
        process.exit(0);
    }
}

runMigration();
