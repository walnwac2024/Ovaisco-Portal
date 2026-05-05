const { pool } = require("../../Utils/db");
const fs = require('fs');
const path = require('path');

/**
 * GET /api/v1/news
 */
async function listNews(req, res) {
    try {
        const user = req.session?.user || {};
        const userRoles = Array.isArray(user.roles) ? user.roles : (user.role ? [user.role] : []);
        const isAdmin = userRoles.some(r => ["admin", "super_admin", "hr", "developer"].includes(String(r).toLowerCase())) || (Array.isArray(user.features) && user.features.includes("news_manage"));

        let query = `
            SELECT n.*, e.Employee_Name as author_name 
            FROM news n 
            LEFT JOIN employee_records e ON n.author_id = e.id
        `;

        if (!isAdmin) {
            query += " WHERE n.is_published = 1";
        }
        query += " ORDER BY n.created_at DESC";

        const [rows] = await pool.execute(query);

        // Fetch reactions for these news items
        if (rows.length > 0) {
            const newsIds = rows.map(r => r.id);
            const [reactions] = await pool.query(
                "SELECT news_id, emoji, COUNT(*) as count, GROUP_CONCAT(user_id) as user_ids FROM news_reactions WHERE news_id IN (?) GROUP BY news_id, emoji",
                [newsIds]
            );

            // Attach reactions to each news item
            rows.forEach(item => {
                const itemReactions = reactions.filter(r => r.news_id === item.id);
                item.reactions = itemReactions.map(r => {
                    const reactUserIds = r.user_ids ? r.user_ids.toString().split(',').map(Number) : [];
                    return {
                        emoji: r.emoji,
                        count: parseInt(r.count) || 0,
                        me: user.id ? reactUserIds.includes(Number(user.id)) : false
                    };
                });
            });
        }

        return res.json(rows);
    } catch (err) {
        console.error("listNews error:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

/**
 * POST /api/v1/news
 */
async function createNews(req, res) {
    const { title, content, is_published, post_type = 'text' } = req.body;
    const authorId = req.session?.user?.id;
    const imageUrl = req.file ? `/uploads/news/${req.file.filename}` : null;

    console.log("Create News Debug:", {
        title,
        post_type,
        hasFile: !!req.file,
        fileName: req.file?.filename,
        is_published_raw: is_published
    });

    // Validation based on post type
    if (!title) {
        return res.status(400).json({ message: "Title is required" });
    }

    if (post_type === 'text' && !content) {
        return res.status(400).json({ message: "Content is required for text posts" });
    }

    if (post_type === 'image' && !imageUrl) {
        return res.status(400).json({ message: "Image is required for image posts" });
    }

    try {
        const isPublishedVal = is_published === 'true' || is_published === '1' || is_published === true;
        const [result] = await pool.execute(
            "INSERT INTO news (title, content, post_type, image_url, author_id, is_published) VALUES (?, ?, ?, ?, ?, ?)",
            [title, content || '', post_type, imageUrl, authorId, isPublishedVal ? 1 : 0]
        );

        const newsId = result.insertId;

        // Better truthiness check for FormData values
        const shouldPublish = is_published === 'true' || is_published === '1' || is_published === true;

        console.log("Publishing news...");

        // ✅ Real-time Push Notification to all staff - only if published
        if (shouldPublish) {
            const { sendNotificationToAll } = require("../UserDeatils/PushController");
            sendNotificationToAll({
                title: `📢 ${title}`,
                body: content ? content.substring(0, 100) + '...' : 'Click to see details',
                data: { url: '/news' }
            });
        }

        return res.status(201).json({ message: "News created", id: newsId });
    } catch (err) {
        console.error("createNews error:", err);
        // Clean up uploaded file if database insert fails
        if (req.file) {
            fs.unlink(req.file.path, () => { });
        }
        return res.status(500).json({ message: "Server error" });
    }
}

/**
 * PATCH /api/v1/news/:id
 */
async function updateNews(req, res) {
    const { id } = req.params;
    const { title, content, is_published, removeImage, post_type } = req.body;
    const newImageUrl = req.file ? `/uploads/news/${req.file.filename}` : null;

    try {
        const [existing] = await pool.execute("SELECT is_published, image_url, post_type FROM news WHERE id = ?", [id]);
        if (existing.length === 0) return res.status(404).json({ message: "News not found" });

        const wasPublished = existing[0].is_published;
        const oldImageUrl = existing[0].image_url;
        const currentPostType = post_type || existing[0].post_type;

        // Validation based on post type
        if (currentPostType === 'text' && !content) {
            return res.status(400).json({ message: "Content is required for text posts" });
        }

        // Determine final image URL
        let finalImageUrl = oldImageUrl;
        if (removeImage === 'true') {
            finalImageUrl = null;
        } else if (newImageUrl) {
            finalImageUrl = newImageUrl;
        }

        if (currentPostType === 'image' && !finalImageUrl) {
            return res.status(400).json({ message: "Image is required for image posts" });
        }

        const isPublishedVal = is_published === 'true' || is_published === '1' || is_published === true;
        await pool.execute(
            "UPDATE news SET title = ?, content = ?, post_type = ?, image_url = ?, is_published = ? WHERE id = ?",
            [title, content || '', currentPostType, finalImageUrl, isPublishedVal ? 1 : 0, id]
        );

        // Delete old image if replaced or removed
        if (oldImageUrl && (newImageUrl || removeImage === 'true')) {
            const oldImagePath = path.join(__dirname, '../../', oldImageUrl);
            fs.unlink(oldImagePath, (err) => {
                if (err) console.error('Failed to delete old image:', err);
            });
        }

        console.log("Publishing news update...");

        // ✅ Real-time Push Notification to all staff - only if published
        if (isPublishedVal) {
            const { sendNotificationToAll } = require("../UserDeatils/PushController");
            sendNotificationToAll({
                title: `📢 ${title}`,
                body: content ? content.substring(0, 100) + '...' : 'Click to see details',
                data: { url: '/news' }
            });
        }

        return res.json({ message: "News updated" });
    } catch (err) {
        console.error("updateNews error:", err);
        // Clean up new uploaded file if update fails
        if (req.file) {
            fs.unlink(req.file.path, () => { });
        }
        return res.status(500).json({ message: "Server error" });
    }
}

/**
 * DELETE /api/v1/news/:id
 */
async function deleteNews(req, res) {
    const { id } = req.params;
    try {
        // Get image URL before deleting
        const [existing] = await pool.execute("SELECT image_url FROM news WHERE id = ?", [id]);
        const imageUrl = existing.length > 0 ? existing[0].image_url : null;

        await pool.execute("DELETE FROM news WHERE id = ?", [id]);

        // Delete associated image file
        if (imageUrl) {
            const imagePath = path.join(__dirname, '../../', imageUrl);
            fs.unlink(imagePath, (err) => {
                if (err) console.error('Failed to delete image:', err);
            });
        }

        return res.json({ message: "News deleted" });
    } catch (err) {
        console.error("deleteNews error:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

/**
 * POST /api/v1/news/:id/react
 */
async function toggleReaction(req, res) {
    const { id: newsId } = req.params;
    const { emoji } = req.body;
    const userId = req.session?.user?.id;

    if (!emoji) return res.status(400).json({ message: "Emoji is required" });
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    try {
        // Check if reaction exists
        const [existing] = await pool.execute(
            "SELECT id FROM news_reactions WHERE news_id = ? AND user_id = ? AND emoji COLLATE utf8mb4_unicode_ci = ?",
            [newsId, userId, emoji]
        );

        if (existing.length > 0) {
            // Remove it
            await pool.execute("DELETE FROM news_reactions WHERE id = ?", [existing[0].id]);
            req.io.emit("news_reaction_updated", { newsId, emoji });
            return res.json({ action: "removed", emoji });
        } else {
            // Add it
            try {
                await pool.execute(
                    "INSERT INTO news_reactions (news_id, user_id, emoji) VALUES (?, ?, ?)",
                    [newsId, userId, emoji]
                );
                req.io.emit("news_reaction_updated", { newsId, emoji });
                return res.json({ action: "added", emoji });
            } catch (insErr) {
                if (insErr.code === 'ER_DUP_ENTRY') {
                    return res.json({ action: "exists", emoji });
                }
                throw insErr;
            }
        }
    } catch (err) {
        console.error("toggleReaction error:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

/**
 * GET /api/v1/news/reactions
 */
async function getNewsReactions(req, res) {
    try {
        const userId = req.session?.user?.id;

        const [reactions] = await pool.query(
            "SELECT news_id, emoji, COUNT(*) as count, GROUP_CONCAT(user_id) as user_ids FROM news_reactions GROUP BY news_id, emoji"
        );

        // Group by news_id
        const result = {};
        reactions.forEach(r => {
            if (!result[r.news_id]) result[r.news_id] = [];

            const reactUserIds = r.user_ids ? r.user_ids.toString().split(',').map(Number) : [];
            result[r.news_id].push({
                emoji: r.emoji,
                count: parseInt(r.count) || 0,
                me: userId ? reactUserIds.includes(Number(userId)) : false
            });
        });

        return res.json(result);
    } catch (err) {
        console.error("getNewsReactions error:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

/**
 * GET /api/v1/news/:id/comments
 */
async function listComments(req, res) {
    const { id: newsId } = req.params;
    try {
        const query = `
            SELECT c.*, e.Employee_Name as author_name, e.profile_img
            FROM news_comments c
            LEFT JOIN employee_records e ON c.user_id = e.id
            WHERE c.news_id = ?
            ORDER BY c.created_at ASC
        `;
        const [rows] = await pool.execute(query, [newsId]);
        return res.json(rows);
    } catch (err) {
        console.error("listComments error:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

/**
 * POST /api/v1/news/:id/comments
 */
async function addComment(req, res) {
    const { id: newsId } = req.params;
    const { comment } = req.body;
    const userId = req.session?.user?.id;

    if (!comment) return res.status(400).json({ message: "Comment is required" });
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    try {
        const [result] = await pool.execute(
            "INSERT INTO news_comments (news_id, user_id, comment) VALUES (?, ?, ?)",
            [newsId, userId, comment]
        );

        // Emit socket event for real-time updates
        if (req.io) {
            req.io.emit("news_comment_updated", { newsId });
        }

        return res.status(201).json({ message: "Comment added", id: result.insertId });
    } catch (err) {
        console.error("addComment error:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

/**
 * DELETE /api/v1/news/comments/:commentId
 */
async function deleteComment(req, res) {
    const { commentId } = req.params;
    const userId = req.session?.user?.id;
    const user = req.session?.user || {};
    const userRoles = Array.isArray(user.roles) ? user.roles : (user.role ? [user.role] : []);
    const isAdmin = userRoles.some(r => ["admin", "super_admin", "hr", "developer"].includes(String(r).toLowerCase()));

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    try {
        // Fetch comment to check ownership
        const [rows] = await pool.execute("SELECT user_id, news_id FROM news_comments WHERE id = ?", [commentId]);
        if (rows.length === 0) return res.status(404).json({ message: "Comment not found" });

        const comment = rows[0];
        if (comment.user_id !== userId && !isAdmin) {
            return res.status(403).json({ message: "Forbidden: You cannot delete this comment" });
        }

        await pool.execute("DELETE FROM news_comments WHERE id = ?", [commentId]);

        // Emit socket event
        if (req.io) {
            req.io.emit("news_comment_updated", { newsId: comment.news_id });
        }

        return res.json({ message: "Comment deleted" });
    } catch (err) {
        console.error("deleteComment error:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

module.exports = {
    listNews,
    createNews,
    updateNews,
    deleteNews,
    toggleReaction,
    getNewsReactions,
    listComments,
    addComment,
    deleteComment,
};
