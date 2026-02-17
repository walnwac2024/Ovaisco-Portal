const { pool } = require("../Utils/db");

async function migrate() {
    const permissions = [
        // Payroll
        { module: 'Payroll', action: 'View Payroll Tab', code: 'payroll_view' },
        { module: 'Payroll', action: 'View Own Salary', code: 'payroll_view_own' },
        { module: 'Payroll', action: 'View All Salaries', code: 'payroll_view_all' },
        { module: 'Payroll', action: 'Manage Salaries', code: 'payroll_manage_salary' },
        { module: 'Payroll', action: 'Request Increment', code: 'payroll_request_increment' },
        { module: 'Payroll', action: 'Manage Increments', code: 'payroll_manage_increments' },
        { module: 'Payroll', action: 'Calculate Payroll', code: 'payroll_calculate' },
        { module: 'Payroll', action: 'View Payroll Reports', code: 'payroll_view_reports' },
        // News
        { module: 'News', action: 'View News', code: 'news_view' },
        { module: 'News', action: 'Manage News', code: 'news_manage' },
        { module: 'News', action: 'Post Reactions', code: 'news_react' },
        { module: 'News', action: 'Post Comments', code: 'news_comment' },
        { module: 'News', action: 'Manage Comments', code: 'news_manage_comments' },
        // Timeline
        { module: 'Timeline', action: 'View Timeline', code: 'timeline_view' },
        { module: 'Timeline', action: 'Manage Events', code: 'timeline_manage' },
        // Branding
        { module: 'Branding', action: 'View Branding', code: 'branding_view' },
        { module: 'Branding', action: 'Manage Branding', code: 'branding_manage' },
        // Attendance
        { module: 'Attendance', action: 'View All Attendance', code: 'attendance_view_all' },
        { module: 'Attendance', action: 'Manage Settings', code: 'attendance_manage_settings' },
        { module: 'Attendance', action: 'Attendance Audit', code: 'attendance_audit' }
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
                // Update action name if it changed
                await conn.execute(
                    "UPDATE permissions SET module = ?, action = ? WHERE code = ?",
                    [p.module, p.action, p.code]
                );
                console.log(`Updated permission: ${p.code}`);
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
