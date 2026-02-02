const { pool } = require("../Utils/db");

async function migrate() {
    const permissions = [
        { module: 'Attendance', action: 'Manage Rotation', code: 'attendance_manage_rotation' }
    ];

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        for (const p of permissions) {
            const [existing] = await conn.execute("SELECT id FROM permissions WHERE code = ?", [p.code]);
            if (existing.length === 0) {
                await conn.execute(
                    "INSERT INTO permissions (module, action, code) VALUES (?, ?, ?)",
                    [p.module, p.action, p.code]
                );
                console.log(`Inserted permission: ${p.code}`);
            }
        }

        await conn.commit();
        process.exit(0);
    } catch (err) {
        if (conn) await conn.rollback();
        console.error(err);
        process.exit(1);
    } finally {
        if (conn) conn.release();
    }
}

migrate();
