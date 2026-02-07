// =====================================================
// System Settings Controller
// Purpose: Manage all system dropdown options (CRUD)
// Feature: Auto-initialization (No manual migration needed)
// =====================================================

const { pool } = require("../../Utils/db");
const { recordLog } = require("../../Utils/AuditUtils");

// Map of allowed types to their table names and migration sources
const SETTINGS_CONFIG = {
    departments: {
        table: "system_departments",
        sourceTable: "employee_records",
        sourceColumn: "Department"
    },
    designations: {
        table: "system_designations",
        sourceTable: "employee_records",
        sourceColumn: "Designations"
    },
    offices: {
        table: "system_offices",
        sourceTable: "employee_records",
        sourceColumn: "Office_Location"
    },
    "employment-types": {
        table: "system_employment_types",
        sourceTable: "employee_records",
        sourceColumn: "Status"
    },
    "blood-groups": {
        table: "system_blood_groups",
        sourceTable: "employee_records",
        sourceColumn: "Blood_Group"
    },
    religions: {
        table: "system_religions",
        sourceTable: "employee_records",
        sourceColumn: "Relagion"
    },
    "marital-statuses": { table: "system_marital_statuses" },
};

// Check if user has admin access
function hasAdminAccess(user) {
    if (!user) return false;
    const roles = (Array.isArray(user.roles) ? user.roles : []).map((r) =>
        String(r).toLowerCase()
    );
    return (
        roles.includes("super_admin") ||
        roles.includes("admin") ||
        roles.includes("hr") ||
        roles.includes("developer")
    );
}

/**
 * Auto-initialize table if it doesn't exist
 */
async function ensureTableExists(type) {
    const config = SETTINGS_CONFIG[type];
    if (!config) throw new Error(`Invalid type: ${type}`);

    const tableName = config.table;
    const conn = await pool.getConnection();

    try {
        // 1. Check if table exists using INFORMATION_SCHEMA (More reliable than SHOW TABLES with placeholders)
        const [tables] = await conn.query(
            "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
            [tableName]
        );

        if (tables.length === 0) {
            console.log(`🚀 Auto-creating table: ${tableName}`);

            // Create table based on type
            let createSql = "";
            if (type === "offices") {
                createSql = `
          CREATE TABLE \`${tableName}\` (
            \`id\` INT AUTO_INCREMENT PRIMARY KEY,
            \`name\` VARCHAR(100) NOT NULL UNIQUE,
            \`address\` TEXT NULL,
            \`city\` VARCHAR(50) NULL,
            \`country\` VARCHAR(50) NULL,
            \`is_active\` TINYINT(1) DEFAULT 1,
            \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            \`created_by\` INT NULL
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `;
            } else if (["departments", "designations", "employment-types"].includes(type)) {
                createSql = `
          CREATE TABLE \`${tableName}\` (
            \`id\` INT AUTO_INCREMENT PRIMARY KEY,
            \`name\` VARCHAR(100) NOT NULL UNIQUE,
            \`description\` TEXT NULL,
            \`is_active\` TINYINT(1) DEFAULT 1,
            \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            \`created_by\` INT NULL
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `;
            } else {
                createSql = `
          CREATE TABLE \`${tableName}\` (
            \`id\` INT AUTO_INCREMENT PRIMARY KEY,
            \`name\` VARCHAR(50) NOT NULL UNIQUE,
            \`is_active\` TINYINT(1) DEFAULT 1,
            \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `;
            }

            await conn.query(createSql);

            // 2. Auto-migrate data if source exists
            if (config.sourceTable && config.sourceColumn) {
                console.log(`📁 Auto-migrating data for ${type}...`);
                await conn.query(`
          INSERT IGNORE INTO \`${tableName}\` (name, is_active)
          SELECT DISTINCT TRIM(\`${config.sourceColumn}\`), 1
          FROM \`${config.sourceTable}\`
          WHERE \`${config.sourceColumn}\` IS NOT NULL AND TRIM(\`${config.sourceColumn}\`) != ''
        `);
            }

            // 3. Add default data for specific types if migrate didn't already happen
            if (type === "blood-groups") {
                await conn.query(`INSERT IGNORE INTO \`${tableName}\` (name) VALUES ('A+'), ('A-'), ('B+'), ('B-'), ('AB+'), ('AB-'), ('O+'), ('O-')`);
            } else if (type === "religions") {
                await conn.query(`INSERT IGNORE INTO \`${tableName}\` (name) VALUES ('Islam'), ('Christianity'), ('Hinduism'), ('Buddhism'), ('Sikhism'), ('Judaism'), ('Other')`);
            } else if (type === "marital-statuses") {
                await conn.query(`INSERT IGNORE INTO \`${tableName}\` (name) VALUES ('Single'), ('Married'), ('Divorced'), ('Widowed')`);
            }
        }
    } finally {
        conn.release();
    }
}

/**
 * GET /api/v1/settings/:type
 * List all items for a specific dropdown type
 */
async function listSettings(req, res) {
    const { type } = req.params;
    try {
        const { active_only } = req.query;

        // Ensure table exists (Auto-Migration)
        await ensureTableExists(type);

        const tableName = SETTINGS_CONFIG[type].table;
        let sql = `SELECT * FROM \`${tableName}\``;

        if (active_only === "1" || active_only === "true") {
            sql += " WHERE is_active = 1";
        }

        sql += " ORDER BY name ASC";

        const [rows] = await pool.query(sql);
        return res.json(rows);
    } catch (err) {
        console.error("listSettings error:", err);
        // Log to file for debugging
        try {
            const path = require("path");
            const fs = require("fs");
            const logMsg = `\n[${new Date().toISOString()}] SYSTEM SETTINGS ERROR\nType: ${type}\nError: ${err.message}\nStack: ${err.stack}\n${"-".repeat(50)}\n`;
            fs.appendFileSync(path.join(__dirname, "..", "..", "debug_requests.log"), logMsg);
        } catch (e) {
            console.error("Failed to write to debug_requests.log", e);
        }
        return res.status(500).json({
            message: "Failed to load system settings. This usually happens if database tables are missing on the live server.",
            error: err.message
        });
    }
}

/**
 * POST /api/v1/settings/:type
 */
async function createSetting(req, res) {
    const { type } = req.params;
    try {
        const sessionUser = req.session?.user;
        if (!hasAdminAccess(sessionUser)) return res.status(403).json({ message: "Admin access required" });

        await ensureTableExists(type);

        const { name, description, address, city, country } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ message: "Name is required" });

        const tableName = SETTINGS_CONFIG[type].table;
        let sql, params;

        if (type === "offices") {
            sql = `INSERT INTO \`${tableName}\` (name, address, city, country, is_active, created_by) VALUES (?, ?, ?, ?, 1, ?)`;
            params = [name.trim(), address || null, city || null, country || null, sessionUser.id];
        } else if (["departments", "designations", "employment-types"].includes(type)) {
            sql = `INSERT INTO \`${tableName}\` (name, description, is_active, created_by) VALUES (?, ?, 1, ?)`;
            params = [name.trim(), description || null, sessionUser.id];
        } else {
            sql = `INSERT INTO \`${tableName}\` (name, is_active) VALUES (?, 1)`;
            params = [name.trim()];
        }

        const [result] = await pool.execute(sql, params);

        await recordLog({
            actorId: sessionUser.id,
            action: `Created ${type} setting: ${name}`,
            category: "System",
            status: "Success",
            details: { type, name, id: result.insertId }
        });

        return res.status(201).json({ message: "Setting created successfully", id: result.insertId, name: name.trim() });
    } catch (err) {
        console.error("createSetting error:", err);
        return res.status(err.code === "ER_DUP_ENTRY" ? 400 : 500).json({ message: err.code === "ER_DUP_ENTRY" ? "This name already exists" : (err.message || "Server error") });
    }
}

/**
 * PATCH /api/v1/settings/:type/:id
 */
async function updateSetting(req, res) {
    const { type, id } = req.params;
    try {
        const sessionUser = req.session?.user;
        if (!hasAdminAccess(sessionUser)) return res.status(403).json({ message: "Admin access required" });

        await ensureTableExists(type);

        const { name, description, address, city, country, is_active } = req.body;
        const tableName = SETTINGS_CONFIG[type].table;
        const fields = [];
        const params = [];

        if (name !== undefined && name.trim()) { fields.push("name = ?"); params.push(name.trim()); }
        if (description !== undefined) { fields.push("description = ?"); params.push(description); }
        if (address !== undefined) { fields.push("address = ?"); params.push(address); }
        if (city !== undefined) { fields.push("city = ?"); params.push(city); }
        if (country !== undefined) { fields.push("country = ?"); params.push(country); }
        if (typeof is_active === "boolean" || is_active === 0 || is_active === 1) { fields.push("is_active = ?"); params.push(is_active ? 1 : 0); }

        if (fields.length === 0) return res.status(400).json({ message: "No fields to update" });

        const sql = `UPDATE \`${tableName}\` SET ${fields.join(", ")} WHERE id = ?`;
        params.push(id);
        await pool.execute(sql, params);

        await recordLog({
            actorId: sessionUser.id,
            action: `Updated ${type} setting (ID: ${id})`,
            category: "System",
            status: "Success",
            details: { type, id, updates: req.body }
        });

        return res.json({ message: "Setting updated successfully" });
    } catch (err) {
        console.error("updateSetting error:", err);
        return res.status(err.code === "ER_DUP_ENTRY" ? 400 : 500).json({ message: err.code === "ER_DUP_ENTRY" ? "This name already exists" : (err.message || "Server error") });
    }
}

/**
 * DELETE /api/v1/settings/:type/:id
 */
async function deleteSetting(req, res) {
    const { type, id } = req.params;
    try {
        const sessionUser = req.session?.user;
        if (!hasAdminAccess(sessionUser)) return res.status(403).json({ message: "Admin access required" });

        await ensureTableExists(type);

        const tableName = SETTINGS_CONFIG[type].table;
        const sql = `UPDATE \`${tableName}\` SET is_active = 0 WHERE id = ?`;
        await pool.execute(sql, [id]);

        await recordLog({
            actorId: sessionUser.id,
            action: `Deleted ${type} setting (ID: ${id})`,
            category: "System",
            status: "Success",
            details: { type, id }
        });

        return res.json({ message: "Setting deleted successfully" });
    } catch (err) {
        console.error("deleteSetting error:", err);
        return res.status(500).json({ message: err.message || "Server error" });
    }
}

module.exports = {
    listSettings,
    createSetting,
    updateSetting,
    deleteSetting,
};
