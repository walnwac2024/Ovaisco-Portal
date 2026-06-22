const { pool } = require("./db");

/**
 * Record a system log entry.
 * @param {Object} options 
 * @param {number} options.actorId - ID of the person performing the action
 * @param {string} options.action - Description of what happened
 * @param {string} options.category - 'Access Changes', 'Permission Updates', 'Login Attempts', 'System'
 * @param {string} options.status - 'Success', 'Failed'
 * @param {Object} [options.details] - JSON context
 * @param {number} [options.targetUserId] - ID of the subject user (if any)
 */
async function recordLog({ actorId = null, action, category, status, details = {}, targetUserId = null }) {
    try {
        let actorName = "System";
        let actorDepartment = "General";
        let companyId = 1;
        if (actorId) {
            const [userRows] = await pool.execute(
                "SELECT Employee_Name, Department, company_id FROM employee_records WHERE id = ? LIMIT 1",
                [actorId]
            );
            if (userRows.length > 0) {
                actorName = userRows[0].Employee_Name || "System";
                actorDepartment = userRows[0].Department || "General";
                companyId = userRows[0].company_id || 1;
            }
        }

        await pool.execute(
            `INSERT INTO audit_logs 
            (user_id, actor_id, actor_name, actor_department, action, category, status, details, company_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                targetUserId ?? null,
                actorId ?? null,
                actorName || "System",
                actorDepartment || "General",
                action || "Unknown action",
                category || "System",
                status || "Success",
                JSON.stringify(details || {}),
                companyId || 1
            ]
        );
    } catch (err) {
        console.error("recordLog Error:", err);
    }
}

module.exports = { recordLog };
