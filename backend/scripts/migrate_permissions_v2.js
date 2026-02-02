const { pool } = require("../Utils/db");

async function migrate() {
    const permissions = [
        { module: 'Audit', action: 'View Logs', code: 'audit_view' },
        { module: 'Timeline', action: 'View Timeline', code: 'timeline_view' },
        { module: 'Timeline', action: 'Manage Events', code: 'timeline_manage' },
        { module: 'News', action: 'Manage News', code: 'news_manage' },
        { module: 'WhatsApp', action: 'Manage Integration', code: 'whatsapp_manage' },
        { module: 'Attendance', action: 'Manage Shifts', code: 'attendance_manage_shifts' },
        { module: 'Attendance', action: 'Manage Rules', code: 'attendance_manage_rules' },
        { module: 'Leave', action: 'Manage Types', code: 'leave_manage_types' },
        { module: 'Permissions', action: 'Manage Roles', code: 'permissions_edit' }
    ];

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        for (const p of permissions) {
            // Check if code already exists
            const [existing] = await conn.execute("SELECT id FROM permissions WHERE code = ?", [p.code]);
            if (existing.length === 0) {
                await conn.execute(
                    "INSERT INTO permissions (module, action, code) VALUES (?, ?, ?)",
                    [p.module, p.action, p.code]
                );
                console.log(`Inserted permission: ${p.code}`);
            } else {
                console.log(`Permission already exists: ${p.code}`);
            }
        }

        await conn.commit();
        console.log("Migration completed successfully.");
        process.exit(0);
    } catch (err) {
        if (conn) await conn.rollback();
        console.error("Migration failed:", err);
        process.exit(1);
    } finally {
        if (conn) conn.release();
    }
}

migrate();
