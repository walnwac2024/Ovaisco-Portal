const { pool } = require('../../Utils/db');
const { findCompanyByCode } = require('../../Utils/masterDb');
const { getTenantPool } = require('../../Utils/tenantDb');
const { getUploadedFileUrl } = require('../../Utils/uploadPaths');

// Helper to get a setting
async function getSetting(key, companyId = 1) {
    const [rows] = await pool.query("SELECT setting_value FROM settings WHERE setting_key = ? AND company_id = ?", [key, companyId]);
    return rows.length ? rows[0].setting_value : null;
}

async function getSettingFromPool(dbPool, key, companyId = 1) {
    const [rows] = await dbPool.query("SELECT setting_value FROM settings WHERE setting_key = ? AND company_id = ?", [key, companyId]);
    return rows.length ? rows[0].setting_value : null;
}

// Helper to set a setting
async function saveSetting(key, value, companyId = 1) {
    await pool.query(
        "INSERT INTO settings (setting_key, setting_value, company_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE setting_value = ?",
        [key, value, companyId, value]
    );
}

function normalizeCompanyCode(code) {
    const normalized = String(code || "").trim().toLowerCase();
    return normalized === "ovaisco" ? "ovisco" : normalized;
}

function getPublicCompanyName(companyName, companyCode) {
    const code = normalizeCompanyCode(companyCode);
    if (code === "ovisco") return "Ovaisco";
    return companyName;
}

// GET /settings/branding
async function getBranding(req, res) {
    try {
        let colorsStr;
        let logoStr;
        let faviconStr;
        let companyName = null;
        let companyCode = null;

        const publicCompanyCode = normalizeCompanyCode(req.query.companyCode || req.query.company_code);
        if (publicCompanyCode) {
            const company = await findCompanyByCode(publicCompanyCode);
            if (!company || company.status !== "active") {
                return res.status(404).json({ message: "Company branding not found" });
            }

            companyName = getPublicCompanyName(company.company_name, company.company_code);
            companyCode = company.company_code;
            const tenantPool = getTenantPool(company);
            colorsStr = await getSettingFromPool(tenantPool, 'brand_colors', 1);
            logoStr = await getSettingFromPool(tenantPool, 'brand_logo', 1);
            faviconStr = await getSettingFromPool(tenantPool, 'brand_favicon', 1);
        } else {
            const companyId = req.company_id || 1;
            companyName = getPublicCompanyName(req.session?.user?.company_name || null, req.session?.user?.company_code || null);
            companyCode = req.session?.user?.company_code || null;
            colorsStr = await getSetting('brand_colors', companyId);
            logoStr = await getSetting('brand_logo', companyId);
            faviconStr = await getSetting('brand_favicon', companyId);
        }

        const colors = colorsStr ? JSON.parse(colorsStr) : { primary: '#E02D3D' };
        const logo = logoStr || null;
        const favicon = faviconStr || null;

        res.json({ colors, logo, favicon, companyName, companyCode });
    } catch (err) {
        console.error("getBranding error:", err);
        res.status(500).json({ message: "Server error" });
    }
}

// POST /settings/branding
async function updateBranding(req, res) {
    const { colors } = req.body || {};
    const logoFile = req.files?.logo?.[0] || req.file || null;
    const faviconFile = req.files?.favicon?.[0] || null;

    try {
        const companyId = req.company_id || 1;
        if (colors) {
            let colorsToSave = colors;
            if (typeof colors === 'object') {
                colorsToSave = JSON.stringify(colors);
            }
            await saveSetting('brand_colors', colorsToSave, companyId);
        }

        if (logoFile) {
            const logoPath = getUploadedFileUrl(logoFile, 'logo');
            await saveSetting('brand_logo', logoPath, companyId);
        }

        if (faviconFile) {
            const faviconPath = getUploadedFileUrl(faviconFile, 'logo');
            await saveSetting('brand_favicon', faviconPath, companyId);
        }

        res.json({ message: "Branding updated successfully" });
    } catch (err) {
        console.error("updateBranding error:", err);
        res.status(500).json({ message: "Server error" });
    }
}

module.exports = { getBranding, updateBranding };
