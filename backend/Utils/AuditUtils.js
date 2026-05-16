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
async function recordLog({ actorId, action, category, status, details = {}, targetUserId = null }) {
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
                actorName = userRows[0].Employee_Name;
                actorDepartment = userRows[0].Department;
                companyId = userRows[0].company_id;
            }
        }

        await pool.execute(
            `INSERT INTO audit_logs 
            (user_id, actor_id, actor_name, actor_department, action, category, status, details, company_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                targetUserId,
                actorId,
                actorName,
                actorDepartment,
                action,
                category,
                status,
                JSON.stringify(details),
                companyId
            ]
        );
    } catch (err) {
        console.error("recordLog Error:", err);
    }
}

module.exports = { recordLog };
