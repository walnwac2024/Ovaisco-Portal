const { pool } = require('../../Utils/db');

// Helper to get a setting
async function getSetting(key, companyId = 1) {
    const [rows] = await pool.query("SELECT setting_value FROM settings WHERE setting_key = ? AND company_id = ?", [key, companyId]);
    return rows.length ? rows[0].setting_value : null;
}

// Helper to set a setting
async function saveSetting(key, value, companyId = 1) {
    await pool.query(
        "INSERT INTO settings (setting_key, setting_value, company_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE setting_value = ?",
        [key, value, companyId, value]
    );
}

// GET /settings/branding
async function getBranding(req, res) {
    try {
        const companyId = req.company_id || 1;
        const colorsStr = await getSetting('brand_colors', companyId);
        const logoStr = await getSetting('brand_logo', companyId);

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
        const companyId = req.company_id || 1;
        if (colors) {
            let colorsToSave = colors;
            if (typeof colors === 'object') {
                colorsToSave = JSON.stringify(colors);
            }
            await saveSetting('brand_colors', colorsToSave, companyId);
        }

        if (file) {
            const logoPath = `/uploads/${file.filename}`;
            await saveSetting('brand_logo', logoPath, companyId);
        }

        res.json({ message: "Branding updated successfully" });
    } catch (err) {
        console.error("updateBranding error:", err);
        res.status(500).json({ message: "Server error" });
    }
}

module.exports = { getBranding, updateBranding };
