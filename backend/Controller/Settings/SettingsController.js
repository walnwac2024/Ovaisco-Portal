const { pool } = require('../../Utils/db');

// Helper to get a setting
async function getSetting(key) {
    const [rows] = await pool.query("SELECT setting_value FROM settings WHERE setting_key = ?", [key]);
    return rows.length ? rows[0].setting_value : null;
}

// Helper to set a setting
async function saveSetting(key, value) {
    await pool.query(
        "INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?",
        [key, value, value]
    );
}

// GET /settings/branding
async function getBranding(req, res) {
    try {
        const colorsStr = await getSetting('brand_colors');
        const logoStr = await getSetting('brand_logo');

        const colors = colorsStr ? JSON.parse(colorsStr) : { primary: '#E02D3D' };
        const logo = logoStr || null;

        res.json({ colors, logo });
    } catch (err) {
        console.error("getBranding error:", err);
        res.status(500).json({ message: "Server error" });
    }
}

// POST /settings/branding
async function updateBranding(req, res) {
    const { colors } = req.body || {};
    const file = req.file; // From uploadMiddleware

    try {
        if (colors) {
            let colorsToSave = colors;
            if (typeof colors === 'object') {
                colorsToSave = JSON.stringify(colors);
            }
            // If it's a string (from FormData), it's likely already JSON or just a raw string. 
            // We expect JSON string if using my frontend logic.

            await saveSetting('brand_colors', colorsToSave);
        }

        if (file) {
            const logoPath = `/uploads/${file.filename}`; // Adjusted path based on mw
            await saveSetting('brand_logo', logoPath);
        }

        res.json({ message: "Branding updated successfully" });
    } catch (err) {
        console.error("updateBranding error:", err);
        res.status(500).json({ message: "Server error" });
    }
}

module.exports = { getBranding, updateBranding };
