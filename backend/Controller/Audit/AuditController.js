const { pool } = require("../../Utils/db");

/**
 * GET /api/v1/audit/logs
 * List audit logs with filters.
 */
async function listLogs(req, res) {
    try {
        const { category, department, startDate, endDate, search } = req.query;
        let page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;

        let query = `
            SELECT 
                al.*, 
                e.profile_img as actor_avatar 
            FROM audit_logs al
            LEFT JOIN employee_records e ON al.actor_id = e.id
            WHERE al.company_id = ?
        `;
        let params = [req.company_id || 1];

        if (category && category !== "") {
            query += " AND al.category = ?";
            params.push(category);
        }
        if (department && department !== "") {
            query += " AND al.actor_department = ?";
            params.push(department);
        }
        if (startDate && startDate !== "") {
            query += " AND al.created_at >= ?";
            params.push(`${startDate} 00:00:00`);
        }
        if (endDate && endDate !== "") {
            query += " AND al.created_at <= ?";
            params.push(`${endDate} 23:59:59`);
        }
        if (search && search !== "") {
            query += " AND (al.actor_name LIKE ? OR al.action LIKE ?)";
            params.push(`%${search}%`, `%${search}%`);
        }

        query += " ORDER BY al.created_at DESC LIMIT ? OFFSET ?";
        params.push(limit, offset);

        // Using pool.query instead of pool.execute for LIMIT/OFFSET safety in some MySQL versions
        const [rows] = await pool.query(query, params);

        // Get total count for pagination
        let countQuery = "SELECT COUNT(*) as total FROM audit_logs WHERE company_id = ?";
        let countParams = [req.company_id || 1];
        if (category && category !== "") { countQuery += " AND category = ?"; countParams.push(category); }
        if (department && department !== "") { countQuery += " AND actor_department = ?"; countParams.push(department); }
        if (startDate && startDate !== "") { countQuery += " AND created_at >= ?"; countParams.push(`${startDate} 00:00:00`); }
        if (endDate && endDate !== "") { countQuery += " AND created_at <= ?"; countParams.push(`${endDate} 23:59:59`); }
        if (search && search !== "") { countQuery += " AND (actor_name LIKE ? OR action LIKE ?)"; countParams.push(`%${search}%`, `%${search}%`); }

        const [[{ total }]] = await pool.query(countQuery, countParams);

        return res.json({
            logs: rows,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error("listLogs Error:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

/**
 * GET /api/v1/audit/filters
 * List unique categories and departments for filters.
 */
async function listLogFilters(req, res) {
    try {
        const [categories] = await pool.query("SELECT DISTINCT category FROM audit_logs WHERE category IS NOT NULL AND company_id = ?", [req.company_id || 1]);

        // Fetch departments from both audit logs AND employee records to ensure a full list
        const [departments] = await pool.query(`
            SELECT DISTINCT actor_department as dept 
            FROM audit_logs 
            WHERE actor_department IS NOT NULL AND actor_department <> '' AND company_id = ?
            UNION
            SELECT DISTINCT Department as dept 
            FROM employee_records 
            WHERE Department IS NOT NULL AND Department <> '' AND company_id = ?
            ORDER BY dept
        `, [req.company_id || 1, req.company_id || 1]);

        return res.json({
            categories: categories.map(c => c.category),
            departments: departments.map(d => d.dept)
        });
    } catch (err) {
        console.error("listLogFilters Error:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

module.exports = {
    listLogs,
    listLogFilters
};
