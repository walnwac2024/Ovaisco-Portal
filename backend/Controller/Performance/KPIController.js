const { pool } = require("../../Utils/db");
const { recordLog } = require("../../Utils/AuditUtils");

/**
 * List all KPI templates
 */
async function listKPITemplates(req, res) {
    try {
        const { department } = req.query;
        let sql = "SELECT * FROM performance_kpi_templates";
        const params = [];

        if (department) {
            sql += " WHERE department = ? OR department IS NULL";
            params.push(department);
        }

        sql += " ORDER BY id DESC";

        const [rows] = await pool.execute(sql, params);
        res.json(rows);
    } catch (err) {
        console.error("listKPITemplates error:", err);
        res.status(500).json({ message: "Server error" });
    }
}

/**
 * Create a new KPI template
 */
async function createKPITemplate(req, res) {
    const { title, description, type, weightage, evidence_required, department } = req.body;

    if (!title || !type) {
        return res.status(400).json({ message: "Title and type are required." });
    }

    try {
        const sql = `
            INSERT INTO performance_kpi_templates 
            (title, description, type, weightage, evidence_required, department)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const params = [
            title,
            description || null,
            type,
            weightage || 1.0,
            evidence_required ? 1 : 0,
            department || null
        ];

        const [result] = await pool.execute(sql, params);

        await recordLog({
            actorId: req.session?.user?.id,
            action: `Created KPI template: ${title}`,
            category: "Performance",
            status: "Success",
            details: { id: result.insertId, title, department }
        });

        res.status(201).json({ id: result.insertId, message: "KPI Template created successfully." });
    } catch (err) {
        console.error("createKPITemplate error:", err);
        res.status(500).json({ message: "Server error" });
    }
}

/**
 * Update a KPI template
 */
async function updateKPITemplate(req, res) {
    const { id } = req.params;
    const { title, description, type, weightage, evidence_required, department } = req.body;

    try {
        const [existing] = await pool.execute("SELECT * FROM performance_kpi_templates WHERE id = ?", [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: "KPI Template not found." });
        }

        const sql = `
            UPDATE performance_kpi_templates 
            SET title = ?, description = ?, type = ?, weightage = ?, evidence_required = ?, department = ?
            WHERE id = ?
        `;
        const params = [
            title || existing[0].title,
            description !== undefined ? description : existing[0].description,
            type || existing[0].type,
            weightage !== undefined ? weightage : existing[0].weightage,
            evidence_required !== undefined ? (evidence_required ? 1 : 0) : existing[0].evidence_required,
            department !== undefined ? department : existing[0].department,
            id
        ];

        await pool.execute(sql, params);

        await recordLog({
            actorId: req.session?.user?.id,
            action: `Updated KPI template: ${title || existing[0].title}`,
            category: "Performance",
            status: "Success",
            details: { id, title }
        });

        res.json({ message: "KPI Template updated successfully." });
    } catch (err) {
        console.error("updateKPITemplate error:", err);
        res.status(500).json({ message: "Server error" });
    }
}

/**
 * Delete a KPI template
 */
async function deleteKPITemplate(req, res) {
    const { id } = req.params;

    try {
        const [existing] = await pool.execute("SELECT title FROM performance_kpi_templates WHERE id = ?", [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: "KPI Template not found." });
        }

        await pool.execute("DELETE FROM performance_kpi_templates WHERE id = ?", [id]);

        await recordLog({
            actorId: req.session?.user?.id,
            action: `Deleted KPI template: ${existing[0].title}`,
            category: "Performance",
            status: "Success",
            details: { id }
        });

        res.json({ message: "KPI Template deleted successfully." });
    } catch (err) {
        console.error("deleteKPITemplate error:", err);
        res.status(500).json({ message: "Server error" });
    }
}

module.exports = {
    listKPITemplates,
    createKPITemplate,
    updateKPITemplate,
    deleteKPITemplate
};
