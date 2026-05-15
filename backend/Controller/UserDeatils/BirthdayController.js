const { pool } = require('../../Utils/db');

/**
 * BirthdayController handles wishing logic using employee_timeline table
 */
const sendWish = async (req, res) => {
    const senderId = req.session.user.id;
    const { receiverId, message } = req.body;

    if (!receiverId) {
        return res.status(400).json({ message: "Receiver ID is required" });
    }

    try {
        // Check if already wished today in timeline
        const [existing] = await pool.execute(
            `SELECT id FROM employee_timeline 
             WHERE actioned_by = ? AND employee_id = ? 
             AND event_type = 'BIRTHDAY_WISH' 
             AND DATE(event_date) = CURDATE()`,
            [senderId, receiverId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: "You have already wished this person today!" });
        }

        // Insert wish into employee_timeline
        const sql = `
            INSERT INTO employee_timeline 
            (employee_id, event_type, category, title, description, actioned_by, event_date, visibility, is_system_generated)
            VALUES (?, 'BIRTHDAY_WISH', 'Social', 'Birthday Wish', ?, ?, NOW(), 'ALL', 0)
        `;
        await pool.execute(sql, [receiverId, message || "Happy Birthday!", senderId]);

        // Optional: Emit socket event for real-time notification
        if (req.io) {
            req.io.emit('new_birthday_wish', { receiverId });
        }

        return res.json({ message: "Wish sent successfully!" });
    } catch (error) {
        console.error("Error sending birthday wish:", error);
        return res.status(500).json({ message: "Failed to send wish" });
    }
};

const getWishesReceived = async (req, res) => {
    const userId = req.session.user.id;

    try {
        const [wishes] = await pool.execute(
            `SELECT t.id, t.actioned_by as sender_id, t.description as message, t.created_at,
                    e.Employee_Name as sender_name, e.profile_img as sender_img
             FROM employee_timeline t
             JOIN employee_records e ON t.actioned_by = e.id
             WHERE t.employee_id = ? 
               AND t.event_type = 'BIRTHDAY_WISH' 
               AND DATE(t.event_date) = CURDATE()
             ORDER BY t.created_at DESC`,
            [userId]
        );

        return res.json(wishes);
    } catch (error) {
        console.error("Error fetching birthday wishes:", error);
        return res.status(500).json({ message: "Failed to fetch wishes" });
    }
};

module.exports = {
    sendWish,
    getWishesReceived
};
