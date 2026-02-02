const { pool } = require("../../Utils/db");

/**
 * Helper to record a timeline event
 */
async function recordEvent({
    employee_id,
    event_type,
    category,
    title,
    description = "",
    actioned_by = null,
    event_date = new Date(),
    internal_notes = null,
    visibility = 'ALL',
    attachments = [],
    metadata = {},
    is_system_generated = 1
}) {
    try {
        const sql = `
            INSERT INTO employee_timeline 
            (employee_id, event_type, category, title, description, actioned_by, event_date, internal_notes, visibility, attachments, metadata, is_system_generated)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await pool.execute(sql, [
            employee_id,
            event_type,
            category,
            title,
            description,
            actioned_by,
            event_date,
            internal_notes,
            visibility,
            JSON.stringify(attachments),
            JSON.stringify(metadata),
            is_system_generated
        ]);
        return result.insertId;
    } catch (err) {
        console.error("Error recording timeline event:", err);
        return null;
    }
}

/**
 * GET /api/v1/employees/:id/timeline
 */
async function getTimeline(req, res) {
    try {
        const employeeId = req.params.id;
        const { category, startDate, endDate, search } = req.query;
        const currentUser = req.session.user; // Assuming session has user info

        // Role-based visibility logic
        // HR/Admin see everything
        // Managers see up to 'MANAGERS_ONLY'
        // Employees see only 'ALL'
        let visibilityFilter = "visibility = 'ALL'";
        const userRoles = req.session.user?.roles || [];
        if (userRoles.some(r => ['admin', 'super_admin', 'hr', 'developer'].includes(r.toLowerCase()))) {
            visibilityFilter = "1=1"; // Full access
        } else if (userRoles.includes('manager')) {
            visibilityFilter = "visibility IN ('ALL', 'MANAGERS_ONLY')";
        }

        let query = `
            SELECT 
                t.*,
                e.Employee_Name as actioned_by_name,
                e.profile_img as actioned_by_avatar
            FROM employee_timeline t
            LEFT JOIN employee_records e ON t.actioned_by = e.id
            WHERE t.employee_id = ? AND (${visibilityFilter})
        `;
        let params = [employeeId];

        if (category) {
            query += " AND t.category = ?";
            params.push(category);
        }
        if (startDate) {
            query += " AND t.event_date >= ?";
            params.push(`${startDate} 00:00:00`);
        }
        if (endDate) {
            query += " AND t.event_date <= ?";
            params.push(`${endDate} 23:59:59`);
        }
        if (search) {
            query += " AND (t.title LIKE ? OR t.description LIKE ?)";
            params.push(`%${search}%`, `%${search}%`);
        }

        query += " ORDER BY t.event_date DESC, t.created_at DESC";

        const [rows] = await pool.execute(query, params);

        return res.json(rows);
    } catch (err) {
        console.error("getTimeline Error:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

/**
 * POST /api/v1/employees/:id/timeline
 * Manual event entry by HR
 */
async function addEvent(req, res) {
    try {
        const employeeId = req.params.id;
        const {
            event_type,
            category,
            title,
            description,
            event_date,
            internal_notes,
            visibility,
            metadata
        } = req.body;

        const actioned_by = req.session.user?.id;

        const eventId = await recordEvent({
            employee_id: employeeId,
            event_type,
            category,
            title,
            description,
            actioned_by,
            event_date: event_date || new Date(),
            internal_notes,
            visibility: visibility || 'ALL',
            is_system_generated: 0,
            metadata: metadata || {}
        });

        if (eventId) {
            return res.status(201).json({ message: "Event added", eventId });
        } else {
            return res.status(400).json({ message: "Failed to add event" });
        }
    } catch (err) {
        console.error("addEvent Error:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

module.exports = {
    recordEvent,
    getTimeline,
    addEvent
};
