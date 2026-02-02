const { pool } = require("../../Utils/db");
const { recordLog } = require("../../Utils/AuditUtils");

/**
 * List all performance cycles
 */
async function listCycles(req, res) {
    try {
        const [rows] = await pool.execute("SELECT * FROM performance_cycles ORDER BY start_date DESC");
        res.json(rows);
    } catch (err) {
        console.error("listCycles error:", err);
        res.status(500).json({ message: "Server error" });
    }
}

/**
 * Create a new performance cycle
 */
async function createCycle(req, res) {
    const { name, start_date, end_date, departments } = req.body;

    if (!name || !start_date || !end_date) {
        return res.status(400).json({ message: "Name, start date, and end date are required." });
    }

    try {
        const sql = `
            INSERT INTO performance_cycles (name, start_date, end_date, departments, status)
            VALUES (?, ?, ?, ?, 'draft')
        `;
        const params = [name, start_date, end_date, departments ? JSON.stringify(departments) : null];

        const [result] = await pool.execute(sql, params);

        await recordLog({
            actorId: req.session?.user?.id,
            action: `Created Performance Cycle: ${name}`,
            category: "Performance",
            status: "Success",
            details: { id: result.insertId, name }
        });

        res.status(201).json({ id: result.insertId, message: "Performance Cycle created successfully." });
    } catch (err) {
        console.error("createCycle error:", err);
        res.status(500).json({ message: "Server error" });
    }
}

/**
 * Update cycle status
 */
async function updateCycleStatus(req, res) {
    const { id } = req.params;
    const { status } = req.body;

    if (!['draft', 'open', 'locked', 'closed'].includes(status)) {
        return res.status(400).json({ message: "Invalid status." });
    }

    try {
        await pool.execute("UPDATE performance_cycles SET status = ? WHERE id = ?", [status, id]);

        await recordLog({
            actorId: req.session?.user?.id,
            action: `Updated Performance Cycle status to ${status}`,
            category: "Performance",
            status: "Success",
            details: { id, status }
        });

        res.json({ message: "Cycle status updated successfully." });
    } catch (err) {
        console.error("updateCycleStatus error:", err);
        res.status(500).json({ message: "Server error" });
    }
}

module.exports = {
    listCycles,
    createCycle,
    updateCycleStatus
};
