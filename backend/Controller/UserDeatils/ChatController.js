// backend/Controller/UserDeatils/ChatController.js
const { pool } = require("../../Utils/db");
const { getUploadedFileUrl } = require("../../Utils/uploadPaths");

/**
 * GET /api/v1/chat/messages/:roomId
 * Fetch messages for a specific room
 */
async function getMessages(req, res) {
    const { roomId } = req.params;
    const userId = req.session?.user?.id;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Security check: 
    // - DEPT_ rooms: User must be in that department (or Admin/HR)
    // - AUTH_ rooms: User must be that user (AUTH_<userId>) OR Admin/HR
    const isDeptRoom = roomId.startsWith("DEPT_");
    const isAuthRoom = roomId.startsWith("AUTH_");

    // Get user's department for check
    const [empRows] = await pool.execute("SELECT Department FROM employee_records WHERE id = ?", [userId]);
    const userDept = empRows[0]?.Department;
    const userRoles = req.session?.user?.roles || [];
    const isAdmin = userRoles.some(r => ["admin", "super_admin", "hr"].includes(r.toLowerCase()));

    if (isDeptRoom) {
        const deptName = roomId.replace("DEPT_", "");
        const isGeneral = deptName.toLowerCase() === 'general';
        if (!isAdmin && !isGeneral && userDept !== deptName) {
            return res.status(403).json({ message: "Access denied to this department chat" });
        }
    } else if (isAuthRoom) {
        const targetUserId = roomId.replace("AUTH_", "");
        if (!isAdmin && String(userId) !== targetUserId) {
            return res.status(403).json({ message: "Access denied to this private chat" });
        }
    }

    try {
        const [rows] = await pool.execute(
            `SELECT cm.id, cm.message, cm.created_at, cm.sender_id, cm.file_url, cm.file_type, cm.file_name,
                e.Employee_Name as sender_name, e.profile_img as sender_image,
                (SELECT COUNT(*) FROM chat_read_receipts crr WHERE crr.message_id = cm.id AND crr.user_id != cm.sender_id) > 0 as seen
             FROM chat_messages cm
             JOIN employee_records e ON cm.sender_id = e.id
             WHERE cm.room_id = ?
             ORDER BY cm.created_at ASC`,
            [roomId]
        );
        return res.json(rows);
    } catch (err) {
        console.error("getMessages error:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

/**
 * POST /api/v1/chat/send
 * Send a message
 */
async function sendMessage(req, res) {
    const { roomId, message } = req.body;
    const userId = req.session?.user?.id;

    if (!userId || !roomId || (!message && !req.file)) {
        return res.status(400).json({ message: "Missing required fields (text or file)" });
    }

    // Same security checks as getMessages
    const isDeptRoom = roomId.startsWith("DEPT_");
    const isAuthRoom = roomId.startsWith("AUTH_");

    const [empRows] = await pool.execute("SELECT Department FROM employee_records WHERE id = ?", [userId]);
    const userDept = empRows[0]?.Department;
    const userRoles = req.session?.user?.roles || [];
    const isAdmin = userRoles.some(r => ["admin", "super_admin", "hr"].includes(r.toLowerCase()));

    if (isDeptRoom) {
        const deptName = roomId.replace("DEPT_", "");
        const isGeneral = deptName.toLowerCase() === 'general';
        if (!isAdmin && !isGeneral && userDept !== deptName) {
            return res.status(403).json({ message: "Access denied" });
        }
    } else if (isAuthRoom) {
        const targetUserId = roomId.replace("AUTH_", "");
        if (!isAdmin && String(userId) !== targetUserId) {
            return res.status(403).json({ message: "Access denied" });
        }
    }

    try {
        const file = req.file;
        let fileUrl = null;
        let fileType = null;
        let fileName = null;

        if (file) {
            fileUrl = getUploadedFileUrl(file, 'chat');
            fileType = file.mimetype;
            fileName = file.originalname;
        }

        const [result] = await pool.execute(
            "INSERT INTO chat_messages (sender_id, room_id, message, file_url, file_type, file_name) VALUES (?, ?, ?, ?, ?, ?)",
            [userId, roomId, message || "", fileUrl, fileType, fileName]
        );

        const messageId = result.insertId;

        // Fetch the full message data for emission
        const [fullMsgRows] = await pool.execute(
            `SELECT cm.id, cm.message, cm.created_at, cm.sender_id, cm.room_id, cm.file_url, cm.file_type, cm.file_name,
                e.Employee_Name as sender_name, e.profile_img as sender_image
             FROM chat_messages cm
             JOIN employee_records e ON cm.sender_id = e.id
             WHERE cm.id = ?`,
            [messageId]
        );
        const fullMsg = fullMsgRows[0];

        if (fullMsg) {
            req.io.emit("chat_message", { ...fullMsg, seen: false });
        }

        // --- DASHBOARD NOTIFICATIONS ---
        const [senderRows] = await pool.execute("SELECT Employee_Name FROM employee_records WHERE id = ?", [userId]);
        const senderName = senderRows[0]?.Employee_Name || "Someone";

        if (isDeptRoom) {
            const deptName = roomId.replace("DEPT_", "");
            // Notify all members of this department except sender
            const [members] = await pool.execute(
                "SELECT id FROM employee_records WHERE Department = ? AND id != ?",
                [deptName, userId]
            );
            for (const m of members) {
                await pool.execute(
                    "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'chat')",
                    [m.id, `New message in ${deptName}`, `${senderName} sent a message in ${deptName} chat.`]
                );
            }
        } else if (isAuthRoom) {
            const targetUserId = roomId.replace("AUTH_", "");

            if (isAdmin && String(userId) !== targetUserId) {
                // Admin sent message TO employee
                await pool.execute(
                    "INSERT INTO notifications (user_id, title, message, type) VALUES (?, 'Message from Authority', ?, 'chat')",
                    [targetUserId, `${senderName} (Admin/HR) sent you a message.`]
                );
            } else if (!isAdmin) {
                // Employee sent message TO authorities
                // Notify all users with permission_level >= 10
                const [admins] = await pool.execute(
                    `SELECT DISTINCT e.id FROM employee_records e 
                     JOIN employee_user_types eut ON e.id = eut.employee_id 
                     JOIN users_types ut ON ut.id = eut.user_type_id 
                     WHERE ut.permission_level >= 10`
                );
                for (const adm of admins) {
                    await pool.execute(
                        "INSERT INTO notifications (user_id, title, message, type) VALUES (?, 'New Support Message', ?, 'chat')",
                        [adm.id, `${senderName} sent a message to authorities.`]
                    );
                }
            }
        }

        return res.json({ success: true, messageId, fileUrl, fileType, fileName });
    } catch (err) {
        console.error("sendMessage error:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

/**
 * GET /api/v1/chat/authority-rooms
 * For Admins/HR to see active support threads
 */
async function getAuthorityRooms(req, res) {
    const userRoles = req.session?.user?.roles || [];
    const isAdmin = userRoles.some(r => ["admin", "super_admin", "hr"].includes(r.toLowerCase()));

    if (!isAdmin) return res.status(403).json({ message: "Forbidden" });

    try {
        // Robust query: join by checking if room_id equals AUTH_ + employee.id
        const [rows] = await pool.execute(
            `SELECT 
                cm.room_id, 
                e.Employee_Name as user_name, 
                e.profile_img, 
                e.Department as department,
                e.Designations as designation,
                MAX(cm.created_at) as last_msg_at
             FROM chat_messages cm
             JOIN employee_records e ON CONCAT('AUTH_', e.id) = cm.room_id
             WHERE cm.room_id LIKE 'AUTH_%'
             GROUP BY cm.room_id, e.Employee_Name, e.profile_img, e.Department, e.Designations
             ORDER BY last_msg_at DESC`
        );

        return res.json(rows);
    } catch (err) {
        console.error("getAuthorityRooms error:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

/**
 * GET /chat/unread?roomIds=DEPT_IT,AUTH_5&lastIds=101,50
 * Returns unread counts for requested rooms
 */
async function getUnreadCounts(req, res) {
    const userId = req.session?.user?.id;
    const { roomIds, lastIds } = req.query;

    if (!userId || !roomIds) return res.status(400).json({ message: "Invalid request" });

    const rooms = roomIds.split(",");
    const lasts = (lastIds || "").split(",");

    try {
        const results = {};
        const userRoles = req.session?.user?.roles || [];
        const isAdmin = userRoles.some(r => ["admin", "super_admin", "hr"].includes(r.toLowerCase()));

        for (let i = 0; i < rooms.length; i++) {
            const roomId = rooms[i];
            const lastId = Number(lasts[i]) || 0;

            if (roomId === "TOTAL_AUTH" && isAdmin) {
                // Special case for admins: count all unread messages across all AUTH_ rooms
                const [rows] = await pool.execute(
                    "SELECT COUNT(*) as unread FROM chat_messages WHERE room_id LIKE 'AUTH_%' AND id > ? AND sender_id != ?",
                    [lastId, userId]
                );
                results[roomId] = rows[0].unread;
            } else {
                const [rows] = await pool.execute(
                    "SELECT COUNT(*) as unread FROM chat_messages WHERE room_id = ? AND id > ? AND sender_id != ?",
                    [roomId, lastId, userId]
                );
                results[roomId] = rows[0].unread;
            }
        }
        return res.json(results);
    } catch (err) {
        console.error("getUnreadCounts error:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

/**
 * POST /api/v1/chat/read/:roomId
 */
async function markAsRead(req, res) {
    const { roomId } = req.params;
    const userId = req.session?.user?.id;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    try {
        const [unreadMessages] = await pool.execute(
            `SELECT cm.id 
             FROM chat_messages cm
             LEFT JOIN chat_read_receipts crr ON cm.id = crr.message_id AND crr.user_id = ?
             WHERE cm.room_id = ? AND cm.sender_id != ? AND crr.id IS NULL`,
            [userId, roomId, userId]
        );

        if (unreadMessages.length > 0) {
            const values = unreadMessages.map(m => `(${m.id}, ${userId})`).join(",");
            await pool.execute(
                `INSERT IGNORE INTO chat_read_receipts (message_id, user_id) VALUES ${values}`
            );

            // Notify sender(s) that their messages were read
            req.io.emit("chat_read", { roomId, readerId: userId });
        }

        return res.json({ success: true });
    } catch (err) {
        console.error("markAsRead error:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

module.exports = {
    getMessages,
    sendMessage,
    getAuthorityRooms,
    getUnreadCounts,
    markAsRead,
};
