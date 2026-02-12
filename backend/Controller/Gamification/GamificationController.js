const { pool } = require("../../Utils/db");
const { recordLog } = require("../../Utils/AuditUtils");

/**
 * GET /api/v1/gamification/leaderboard
 */
async function getLeaderboard(req, res) {
    try {
        // 1. Punctuality Leaderboard (Last 30 days)
        const [punctuality] = await pool.execute(`
            SELECT 
                e.id, 
                e.Employee_Name as name, 
                SUM(ad.late_minutes) as total_late_minutes,
                COUNT(CASE WHEN ad.status = 'PRESENT' AND ad.late_minutes = 0 THEN 1 END) as on_time_count
            FROM employee_records e
            JOIN attendance_daily ad ON e.id = ad.employee_id
            WHERE ad.attendance_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY e.id, e.Employee_Name
            ORDER BY on_time_count DESC, total_late_minutes ASC
            LIMIT 10
        `);

        // 2. Performance Leaderboard (Last Cycle)
        const [performance] = await pool.execute(`
            SELECT 
                e.id, 
                e.Employee_Name as name, 
                pe.total_score,
                pe.grade
            FROM employee_records e
            JOIN performance_evaluations pe ON e.id = pe.employee_id
            WHERE pe.status = 'completed'
            ORDER BY pe.total_score DESC
            LIMIT 10
        `);

        return res.json({
            punctuality,
            performance
        });
    } catch (err) {
        console.error("getLeaderboard error:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

/**
 * GET /api/v1/gamification/badges/me
 */
async function getMyBadges(req, res) {
    const userId = req.session?.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    try {
        const [rows] = await pool.execute(`
            SELECT b.name, b.description, b.icon, b.type, eb.awarded_at
            FROM employee_badges eb
            JOIN badges b ON eb.badge_id = b.id
            WHERE eb.employee_id = ?
            ORDER BY eb.awarded_at DESC
        `, [userId]);

        return res.json(rows);
    } catch (err) {
        console.error("getMyBadges error:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

/**
 * GET /api/v1/gamification/badges/:employeeId
 */
async function getEmployeeBadges(req, res) {
    const { employeeId } = req.params;
    try {
        const [rows] = await pool.execute(`
            SELECT b.name, b.description, b.icon, b.type, eb.awarded_at
            FROM employee_badges eb
            JOIN badges b ON eb.badge_id = b.id
            WHERE eb.employee_id = ?
            ORDER BY eb.awarded_at DESC
        `, [employeeId]);

        return res.json(rows);
    } catch (err) {
        console.error("getEmployeeBadges error:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

module.exports = {
    getLeaderboard,
    getMyBadges,
    getEmployeeBadges
};
