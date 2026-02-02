const { pool } = require("../../Utils/db");
const { recordLog } = require("../../Utils/AuditUtils");

/**
 * List evaluations for an employee or all (for HR/Manager)
 */
async function listEvaluations(req, res) {
    try {
        const { employee_id, cycle_id } = req.query;
        const user = req.session?.user;
        const roles = user.roles || [];
        const isHR = roles.includes('hr') || roles.includes('super_admin') || roles.includes('admin');

        let sql = `
            SELECT e.*, c.name as cycle_name, er.Employee_Name as employee_name, er.Employee_ID as employee_code
            FROM performance_evaluations e
            JOIN performance_cycles c ON e.cycle_id = c.id
            JOIN employee_records er ON e.employee_id = er.id
        `;
        const params = [];
        const where = [];

        if (!isHR) {
            // Managers see their team, Employees see themselves
            // For now, let's keep it simple: Employee sees self
            if (!employee_id || Number(employee_id) === Number(user.id)) {
                where.push("e.employee_id = ?");
                params.push(user.id);
            } else {
                // TODO: Manager logic
                where.push("e.employee_id = ?");
                params.push(employee_id);
            }
        } else {
            if (employee_id) {
                where.push("e.employee_id = ?");
                params.push(employee_id);
            }
            if (cycle_id) {
                where.push("e.cycle_id = ?");
                params.push(cycle_id);
            }
        }

        if (where.length > 0) {
            sql += " WHERE " + where.join(" AND ");
        }

        sql += " ORDER BY c.start_date DESC";

        const [rows] = await pool.execute(sql, params);
        res.json(rows);
    } catch (err) {
        console.error("listEvaluations error:", err);
        res.status(500).json({ message: "Server error" });
    }
}

/**
 * Start/Initiate an evaluation for an employee in a cycle
 */
async function initiateEvaluation(req, res) {
    const { cycle_id, employee_id } = req.body;

    try {
        const [existing] = await pool.execute(
            "SELECT id FROM performance_evaluations WHERE cycle_id = ? AND employee_id = ?",
            [cycle_id, employee_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: "Evaluation already initiated for this cycle." });
        }

        const [result] = await pool.execute(
            "INSERT INTO performance_evaluations (cycle_id, employee_id, status) VALUES (?, ?, 'self_evaluation')",
            [cycle_id, employee_id]
        );

        res.status(201).json({ id: result.insertId, message: "Evaluation initiated." });
    } catch (err) {
        console.error("initiateEvaluation error:", err);
        res.status(500).json({ message: "Server error" });
    }
}

/**
 * Submit evaluation items (Self or Reviewer)
 */
async function submitEvaluationItems(req, res) {
    const { evaluation_id, items, status, final_comments } = req.body;

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Check evaluation status and cycle status
        const [evalData] = await conn.execute(`
            SELECT e.*, c.status as cycle_status 
            FROM performance_evaluations e
            JOIN performance_cycles c ON e.cycle_id = c.id
            WHERE e.id = ?
        `, [evaluation_id]);

        if (evalData.length === 0) throw new Error("Evaluation not found.");
        if (['locked', 'closed'].includes(evalData[0].cycle_status)) {
            throw new Error("Cycle is locked or closed. Cannot edit evaluation.");
        }

        // 2. Clear old items for this evaluation (or update them)
        // For simplicity, we'll delete and re-insert or use INSERT ... ON DUPLICATE KEY UPDATE
        // But performance_evaluation_items doesn't have a unique key for (evaluation_id, kpi_id) yet.
        // Let's assume the items array contains all KPIs for this evaluation.

        for (const item of items) {
            const { kpi_id, score, comments, evidence_path, evidence_link } = item;

            const [check] = await conn.execute(
                "SELECT id FROM performance_evaluation_items WHERE evaluation_id = ? AND kpi_id = ?",
                [evaluation_id, kpi_id]
            );

            if (check.length > 0) {
                await conn.execute(
                    `UPDATE performance_evaluation_items 
                     SET score = ?, comments = ?, evidence_path = ?, evidence_link = ? 
                     WHERE id = ?`,
                    [score, comments, evidence_path || null, evidence_link || null, check[0].id]
                );
            } else {
                await conn.execute(
                    `INSERT INTO performance_evaluation_items 
                     (evaluation_id, kpi_id, score, comments, evidence_path, evidence_link)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [evaluation_id, kpi_id, score, comments, evidence_path || null, evidence_link || null]
                );
            }
        }

        // 3. Update evaluation status and total score
        if (status) {
            // Calculate total score if it's the final stage or reviewer stage
            let totalScore = 0;
            // Fetch weightage for each KPI
            const [kpis] = await conn.execute("SELECT id, weightage FROM performance_kpi_templates");
            const kpiWeights = {};
            kpis.forEach(k => kpiWeights[k.id] = k.weightage);

            let weightedSum = 0;
            let totalWeight = 0;

            for (const item of items) {
                const weight = parseFloat(kpiWeights[item.kpi_id] || 0);
                weightedSum += (parseFloat(item.score || 0) * weight);
                totalWeight += weight;
            }

            totalScore = totalWeight > 0 ? (weightedSum / totalWeight) : 0;

            // Simple grading logic from settings (could be more complex)
            let grade = 'F';
            if (totalScore >= 90) grade = 'A';
            else if (totalScore >= 75) grade = 'B';
            else if (totalScore >= 60) grade = 'C';
            else if (totalScore >= 40) grade = 'D';

            await conn.execute(
                "UPDATE performance_evaluations SET status = ?, total_score = ?, grade = ?, final_comments = ? WHERE id = ?",
                [status, totalScore, grade, final_comments || null, evaluation_id]
            );
        }

        await conn.commit();
        res.json({ message: "Evaluation items submitted successfully." });
    } catch (err) {
        await conn.rollback();
        console.error("submitEvaluationItems error:", err);
        res.status(500).json({ message: err.message || "Server error" });
    } finally {
        conn.release();
    }
}

/**
 * Get evaluation details including items
 */
async function getEvaluationDetails(req, res) {
    const { id } = req.params;

    try {
        const [evalData] = await pool.execute(`
            SELECT e.*, c.name as cycle_name, er.Employee_Name as employee_name, er.Employee_ID as employee_code
            FROM performance_evaluations e
            JOIN performance_cycles c ON e.cycle_id = c.id
            JOIN employee_records er ON e.employee_id = er.id
            WHERE e.id = ?
        `, [id]);

        if (evalData.length === 0) {
            return res.status(404).json({ message: "Evaluation not found." });
        }

        const [items] = await pool.execute(`
            SELECT i.*, k.title, k.description, k.type, k.weightage, k.evidence_required
            FROM performance_evaluation_items i
            JOIN performance_kpi_templates k ON i.kpi_id = k.id
            WHERE i.evaluation_id = ?
        `, [id]);

        res.json({ ...evalData[0], items });
    } catch (err) {
        console.error("getEvaluationDetails error:", err);
        res.status(500).json({ message: "Server error" });
    }
}

module.exports = {
    listEvaluations,
    initiateEvaluation,
    submitEvaluationItems,
    getEvaluationDetails
};
