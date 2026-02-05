// =====================================================
// Data Migration Script - System Settings
// Purpose: Migrate existing dropdown data to new tables
// Usage: node backend/scripts/migrate_system_settings_data.js
// =====================================================

const { pool } = require("../Utils/db");

async function migrateSystemSettings() {
    const conn = await pool.getConnection();

    try {
        console.log("🚀 Starting System Settings Data Migration...\n");

        await conn.beginTransaction();

        // ==================== DEPARTMENTS ====================
        console.log("📁 Migrating Departments...");
        const [deptRows] = await conn.execute(`
      SELECT DISTINCT TRIM(Department) AS name
      FROM employee_records
      WHERE Department IS NOT NULL 
        AND Department != ''
        AND TRIM(Department) != ''
      ORDER BY name
    `);

        let deptCount = 0;
        for (const row of deptRows) {
            try {
                await conn.execute(
                    `INSERT IGNORE INTO system_departments (name, is_active) VALUES (?, 1)`,
                    [row.name]
                );
                deptCount++;
            } catch (err) {
                console.warn(`  ⚠️  Skipped duplicate: ${row.name}`);
            }
        }
        console.log(`  ✅ Migrated ${deptCount} departments\n`);

        // ==================== DESIGNATIONS ====================
        console.log("💼 Migrating Designations...");
        const [desigRows] = await conn.execute(`
      SELECT DISTINCT TRIM(Designations) AS name
      FROM employee_records
      WHERE Designations IS NOT NULL 
        AND Designations != ''
        AND TRIM(Designations) != ''
      ORDER BY name
    `);

        let desigCount = 0;
        for (const row of desigRows) {
            try {
                await conn.execute(
                    `INSERT IGNORE INTO system_designations (name, is_active) VALUES (?, 1)`,
                    [row.name]
                );
                desigCount++;
            } catch (err) {
                console.warn(`  ⚠️  Skipped duplicate: ${row.name}`);
            }
        }
        console.log(`  ✅ Migrated ${desigCount} designations\n`);

        // ==================== OFFICES ====================
        console.log("🏢 Migrating Offices/Locations...");
        const [officeRows] = await conn.execute(`
      SELECT DISTINCT TRIM(Office_Location) AS name
      FROM employee_records
      WHERE Office_Location IS NOT NULL 
        AND Office_Location != ''
        AND TRIM(Office_Location) != ''
      ORDER BY name
    `);

        let officeCount = 0;
        for (const row of officeRows) {
            try {
                await conn.execute(
                    `INSERT IGNORE INTO system_offices (name, is_active) VALUES (?, 1)`,
                    [row.name]
                );
                officeCount++;
            } catch (err) {
                console.warn(`  ⚠️  Skipped duplicate: ${row.name}`);
            }
        }
        console.log(`  ✅ Migrated ${officeCount} offices\n`);

        // ==================== EMPLOYMENT TYPES ====================
        console.log("📋 Migrating Employment Types...");
        const [statusRows] = await conn.execute(`
      SELECT DISTINCT TRIM(Status) AS name
      FROM employee_records
      WHERE Status IS NOT NULL 
        AND Status != ''
        AND TRIM(Status) != ''
      ORDER BY name
    `);

        let statusCount = 0;
        for (const row of statusRows) {
            try {
                await conn.execute(
                    `INSERT IGNORE INTO system_employment_types (name, is_active) VALUES (?, 1)`,
                    [row.name]
                );
                statusCount++;
            } catch (err) {
                console.warn(`  ⚠️  Skipped duplicate: ${row.name}`);
            }
        }
        console.log(`  ✅ Migrated ${statusCount} employment types\n`);

        await conn.commit();

        console.log("═══════════════════════════════════════");
        console.log("✨ Migration Complete!");
        console.log("═══════════════════════════════════════");
        console.log(`📊 Summary:`);
        console.log(`   Departments: ${deptCount}`);
        console.log(`   Designations: ${desigCount}`);
        console.log(`   Offices: ${officeCount}`);
        console.log(`   Employment Types: ${statusCount}`);
        console.log("═══════════════════════════════════════\n");

    } catch (error) {
        await conn.rollback();
        console.error("❌ Migration failed:", error);
        throw error;
    } finally {
        conn.release();
        await pool.end();
    }
}

// Run migration
migrateSystemSettings()
    .then(() => {
        console.log("👍 Migration script completed successfully");
        process.exit(0);
    })
    .catch((err) => {
        console.error("💥 Migration script failed:", err);
        process.exit(1);
    });
