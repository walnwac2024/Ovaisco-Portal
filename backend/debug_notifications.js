const { pool } = require("./Utils/db");

async function debugNotifications() {
    try {
        console.log("--- DEBUGGING NOTIFICATIONS FOR USER-2 ---");

        // 1. Get user-2 ID
        const [users] = await pool.execute("SELECT id FROM employee_records WHERE Employee_Name = 'user-2' LIMIT 1");
        if (users.length === 0) {
            console.log("User-2 not found");
            process.exit(0);
        }
        const userId = users[0].id;
        console.log(`Checking notifications for User ID: ${userId}`);

        // 2. Count notifications by type
        const [counts] = await pool.execute(
            `SELECT type, COUNT(*) as count 
             FROM notifications 
             WHERE user_id = ? 
             GROUP BY type`,
            [userId]
        );
        console.table(counts);

        // 3. Show last 5 created notifications
        const [last5] = await pool.execute(
            `SELECT id, title, type, is_read, created_at 
             FROM notifications 
             WHERE user_id = ? 
             ORDER BY created_at DESC LIMIT 5`,
            [userId]
        );
        console.log("\nLast 5 Notifications:");
        console.table(last5);

        // 4. Check for ANY 'Leave' type notification
        const [leaves] = await pool.execute(
            `SELECT * FROM notifications WHERE user_id = ? AND type = 'Leave' LIMIT 1`,
            [userId]
        );

        if (leaves.length === 0) {
            console.log("\n❌ NO 'Leave' notifications found for this user!");
        } else {
            console.log("\n✅ Found at least one 'Leave' notification (might be old or read).");
        }

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

debugNotifications();
