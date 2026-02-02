const { pool } = require("../../Utils/db");
const { recordLog } = require("../../Utils/AuditUtils");

/**
 * List PIP plans
 */
async function listPIP(req, res) {
    try {
        const { employee_id, status } = req.query;
        let sql = `
            SELECT p.*, er.Employee_Name as employee_name
            FROM performance_pip p
            JOIN employee_records er ON p.employee_id = er.id
        `;
        const params = [];
        const where = [];

        if (employee_id) {
            where.push("p.employee_id = ?");
            params.push(employee_id);
        }
        if (status) {
            where.push("p.outcome = ?");
            params.push(status);
        }

        if (where.length > 0) {
            sql += " WHERE " + where.join(" AND ");
        }

        sql += " ORDER BY p.created_at DESC";

        const [rows] = await pool.execute(sql, params);
        res.json(rows);
    } catch (err) {
        console.error("listPIP error:", err);
        res.status(500).json({ message: "Server error" });
    }
}

/**
 * Create a new PIP
 */
async function createPIP(req, res) {
    const { employee_id, start_date, duration_days, objectives, check_in_dates, notes } = req.body;

    try {
        const sql = `
            INSERT INTO performance_pip (employee_id, creator_id, start_date, duration_days, objectives, check_in_dates, notes, outcome)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'processing')
        `;
        const params = [
            employee_id,
            req.session?.user?.id,
            start_date || new Date().toISOString().slice(0, 10),
            duration_days || 30,
            objectives || null,
            check_in_dates ? JSON.stringify(check_in_dates) : null,
            notes || null
        ];

        const [result] = await pool.execute(sql, params);

        await recordLog({
            actorId: req.session?.user?.id,
            action: `Created PIP for employee ID: ${employee_id}`,
            category: "Performance",
            status: "Success",
            details: { id: result.insertId, employee_id }
        });

        res.status(201).json({ id: result.insertId, message: "PIP created successfully." });
    } catch (err) {
        console.error("createPIP error:", err);
        res.status(500).json({ message: "Server error" });
    }
}

/**
 * Update PIP outcome
 */
async function updatePIPOutcome(req, res) {
    const { id } = req.params;
    const { outcome, notes } = req.body;

    try {
        await pool.execute(
            "UPDATE performance_pip SET outcome = ?, notes = COALESCE(?, notes) WHERE id = ?",
            [outcome, notes || null, id]
        );
        res.json({ message: "PIP outcome updated successfully." });
    } catch (err) {
        console.error("updatePIPOutcome error:", err);
        res.status(500).json({ message: "Server error" });
    }
}

module.exports = {
    listPIP,
    createPIP,
    updatePIPOutcome
};
