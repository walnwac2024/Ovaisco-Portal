const webpush = require('web-push');
const { pool } = require('../../Utils/db');

// VAPID keys should ideally be in .env
// Sanitize VAPID keys to remove potential quotes or whitespace from environment variables
const publicVapidKey = (process.env.VAPID_PUBLIC_KEY || '').replace(/^["']|["']$/g, '').trim();
const privateVapidKey = (process.env.VAPID_PRIVATE_KEY || '').replace(/^["']|["']$/g, '').trim();

if (publicVapidKey && privateVapidKey) {
    try {
        webpush.setVapidDetails(
            'mailto:support@yourdomain.com',
            publicVapidKey,
            privateVapidKey
        );
        console.log("VAPID details set successfully");
    } catch (err) {
        console.error("Failed to set VAPID details:", err.message);
        console.error("Key lengths - Public:", publicVapidKey.length, "Private:", privateVapidKey.length);
    }
} else {
    console.warn("VAPID keys missing in environment variables. Push notifications will not work.");
}

/**
 * POST /api/v1/push/subscribe
 * Saves a push subscription to the database.
 */
async function subscribe(req, res) {
    const { subscription } = req.body;
    const userId = req.session?.user?.id;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!subscription) return res.status(400).json({ message: 'Subscription missing' });

    try {
        const { endpoint, keys } = subscription;
        const { p256dh, auth } = keys;

        // Check if subscription already exists for this endpoint
        const [existing] = await pool.execute(
            'SELECT id FROM push_subscriptions WHERE endpoint = ?',
            [endpoint]
        );

        if (existing.length > 0) {
            // Update user_id in case it changed (shouldn't really happen but for safety)
            await pool.execute(
                'UPDATE push_subscriptions SET user_id = ?, p256dh = ?, auth = ? WHERE id = ?',
                [userId, p256dh, auth, existing[0].id]
            );
        } else {
            await pool.execute(
                'INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)',
                [userId, endpoint, p256dh, auth]
            );
        }

        res.status(201).json({ message: 'Subscribed successfully' });
    } catch (err) {
        console.error('Subscribe error:', err);
        res.status(500).json({ message: 'Failed to subscribe' });
    }
}

/**
 * POST /api/v1/push/unsubscribe
 * Removes a push subscription from the database.
 */
async function unsubscribe(req, res) {
    const { endpoint } = req.body;
    if (!endpoint) return res.status(400).json({ message: 'Endpoint missing' });

    try {
        await pool.execute('DELETE FROM push_subscriptions WHERE endpoint = ?', [endpoint]);
        res.json({ message: 'Unsubscribed successfully' });
    } catch (err) {
        console.error('Unsubscribe error:', err);
        res.status(500).json({ message: 'Failed to unsubscribe' });
    }
}

/**
 * Utility function to send notification to a user
 */
async function sendNotificationToUser(userId, payload) {
    try {
        const [subscriptions] = await pool.execute(
            'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?',
            [userId]
        );

        const promises = subscriptions.map(sub => {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            };
            return webpush.sendNotification(pushSubscription, JSON.stringify(payload))
                .catch(err => {
                    if (err.statusCode === 404 || err.statusCode === 410) {
                        // Dead subscription, cleanup
                        console.log('Cleanup dead subscription:', sub.endpoint);
                        return pool.execute('DELETE FROM push_subscriptions WHERE endpoint = ?', [sub.endpoint]);
                    }
                    console.error('Push error for endpoint:', sub.endpoint, err);
                });
        });

        await Promise.all(promises);
    } catch (err) {
        console.error('sendNotificationToUser error:', err);
    }
}

/**
 * Utility function to send notification to all users
 */
async function sendNotificationToAll(payload) {
    try {
        const [subscriptions] = await pool.query('SELECT endpoint, p256dh, auth FROM push_subscriptions');

        const promises = subscriptions.map(sub => {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            };
            return webpush.sendNotification(pushSubscription, JSON.stringify(payload))
                .catch(err => {
                    if (err.statusCode === 404 || err.statusCode === 410) {
                        return pool.execute('DELETE FROM push_subscriptions WHERE endpoint = ?', [sub.endpoint]);
                    }
                });
        });

        await Promise.all(promises);
    } catch (err) {
        console.error('sendNotificationToAll error:', err);
    }
}

module.exports = {
    subscribe,
    unsubscribe,
    sendNotificationToUser,
    sendNotificationToAll
};
