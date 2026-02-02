const { pool } = require("../../Utils/db");

/**
 * Record sales metrics
 */
async function recordSalesMetrics(req, res) {
    const { employee_id, date, revenue, leads_assigned, leads_contacted, leads_closed, pipeline_value, calls, meetings, demos, follow_ups } = req.body;

    try {
        const sql = `
            INSERT INTO performance_sales_metrics 
            (employee_id, date, revenue, leads_assigned, leads_contacted, leads_closed, pipeline_value, calls, meetings, demos, follow_ups)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            employee_id,
            date || new Date().toISOString().slice(0, 10),
            revenue || 0,
            leads_assigned || 0,
            leads_contacted || 0,
            leads_closed || 0,
            pipeline_value || 0,
            calls || 0,
            meetings || 0,
            demos || 0,
            follow_ups || 0
        ];

        await pool.execute(sql, params);
        res.status(201).json({ message: "Sales metrics recorded successfully." });
    } catch (err) {
        console.error("recordSalesMetrics error:", err);
        res.status(500).json({ message: "Server error" });
    }
}

/**
 * Get sales performance summary
 */
async function getSalesSummary(req, res) {
    const { employee_id, start_date, end_date } = req.query;

    try {
        let sql = `
            SELECT 
                SUM(revenue) as total_revenue,
                SUM(leads_assigned) as total_leads_assigned,
                SUM(leads_contacted) as total_leads_contacted,
                SUM(leads_closed) as total_leads_closed,
                SUM(pipeline_value) as total_pipeline_value,
                SUM(calls) as total_calls,
                SUM(meetings) as total_meetings,
                SUM(demos) as total_demos,
                SUM(follow_ups) as total_follow_ups
            FROM performance_sales_metrics
        `;
        const params = [];
        const where = [];

        if (employee_id) {
            where.push("employee_id = ?");
            params.push(employee_id);
        }
        if (start_date) {
            where.push("date >= ?");
            params.push(start_date);
        }
        if (end_date) {
            where.push("date <= ?");
            params.push(end_date);
        }

        if (where.length > 0) {
            sql += " WHERE " + where.join(" AND ");
        }

        const [rows] = await pool.execute(sql, params);
        res.json(rows[0]);
    } catch (err) {
        console.error("getSalesSummary error:", err);
        res.status(500).json({ message: "Server error" });
    }
}

module.exports = {
    recordSalesMetrics,
    getSalesSummary
};
