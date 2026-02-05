// backend/Controller/UserDeatils/NotificationController.js
const { pool } = require("../../Utils/db");

/**
 * GET /api/v1/notifications
 * List all notifications for the logged-in user
 */
async function listMyNotifications(req, res) {
    const userId = req.session?.user?.id;
    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const [rows] = await pool.execute(
            `SELECT id, title, message, type, is_read, created_at 
             FROM notifications 
             WHERE user_id = ? 
             ORDER BY 
                CASE WHEN type = 'Leave' THEN 1 ELSE 2 END ASC,
                created_at DESC 
             LIMIT 100`,
            [userId]
        );
        return res.json(rows);
    } catch (err) {
        console.error("listMyNotifications error:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

/**
 * PATCH /api/v1/notifications/:id/read
 * Mark a specific notification as read
 */
async function markAsRead(req, res) {
    const userId = req.session?.user?.id;
    const { id } = req.params;

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        await pool.execute(
            "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
            [id, userId]
        );
        return res.json({ message: "Notification marked as read" });
    } catch (err) {
        console.error("markAsRead error:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

/**
 * PATCH /api/v1/notifications/read-all
 * Mark all notifications for the user as read
 */
async function markAllAsRead(req, res) {
    const userId = req.session?.user?.id;

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        await pool.execute(
            "UPDATE notifications SET is_read = 1 WHERE user_id = ?",
            [userId]
        );
        return res.json({ message: "All notifications marked as read" });
    } catch (err) {
        console.error("markAllAsRead error:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

module.exports = {
    listMyNotifications,
    markAsRead,
    markAllAsRead,
};
