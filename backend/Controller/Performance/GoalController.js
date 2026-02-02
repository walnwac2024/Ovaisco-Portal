const { pool } = require("../../Utils/db");
const { recordLog } = require("../../Utils/AuditUtils");

/**
 * List goals/OKRs
 */
async function listGoals(req, res) {
    try {
        const { employee_id, status, department } = req.query;
        let sql = `
            SELECT g.*, er.Employee_Name as employee_name
            FROM performance_goals g
            JOIN employee_records er ON g.employee_id = er.id
        `;
        const params = [];
        const where = [];

        if (employee_id) {
            where.push("g.employee_id = ?");
            params.push(employee_id);
        }
        if (status) {
            where.push("g.status = ?");
            params.push(status);
        }
        if (department) {
            where.push("g.department = ?");
            params.push(department);
        }

        if (where.length > 0) {
            sql += " WHERE " + where.join(" AND ");
        }

        sql += " ORDER BY g.end_date ASC";

        const [rows] = await pool.execute(sql, params);
        res.json(rows);
    } catch (err) {
        console.error("listGoals error:", err);
        res.status(500).json({ message: "Server error" });
    }
}

/**
 * Create a new goal/OKR
 */
async function createGoal(req, res) {
    const { employee_id, title, description, department, start_date, end_date } = req.body;

    try {
        const sql = `
            INSERT INTO performance_goals (employee_id, title, description, owner_id, department, start_date, end_date, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'not_started')
        `;
        const params = [
            employee_id,
            title,
            description || null,
            req.session?.user?.id,
            department || null,
            start_date || null,
            end_date || null
        ];

        const [result] = await pool.execute(sql, params);

        res.status(201).json({ id: result.insertId, message: "Goal created successfully." });
    } catch (err) {
        console.error("createGoal error:", err);
        res.status(500).json({ message: "Server error" });
    }
}

/**
 * Update goal progress
 */
async function updateGoalProgress(req, res) {
    const { id } = req.params;
    const { progress, status } = req.body;

    try {
        const fields = [];
        const params = [];

        if (progress !== undefined) {
            fields.push("progress = ?");
            params.push(progress);
        }
        if (status) {
            fields.push("status = ?");
            params.push(status);
        }

        if (fields.length === 0) return res.status(400).json({ message: "No data to update." });

        params.push(id);
        await pool.execute(`UPDATE performance_goals SET ${fields.join(", ")} WHERE id = ?`, params);

        res.json({ message: "Goal progress updated successfully." });
    } catch (err) {
        console.error("updateGoalProgress error:", err);
        res.status(500).json({ message: "Server error" });
    }
}

module.exports = {
    listGoals,
    createGoal,
    updateGoalProgress
};
