const path = require("path");
const fs = require("fs");

const uploadsRoot = path.join(__dirname, "..", "uploads");

function sanitizePathSegment(value, fallback = "shared") {
  const safe = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return safe || fallback;
}

function getRequestCompanyCode(req) {
  return sanitizePathSegment(
    req?.session?.user?.company_code ||
    req?.session?.user?.tenant?.company_code ||
    req?.company_code ||
    "shared"
  );
}

function getTenantUploadDir(req, category = "") {
  const companyCode = getRequestCompanyCode(req);
  const safeCategory = category ? sanitizePathSegment(category) : "";
  const dir = path.join(uploadsRoot, companyCode, safeCategory);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return dir;
}

function getUploadedFileUrl(file, fallbackSubdir = "") {
  if (!file) return null;
  if (file.relativeUrl) return file.relativeUrl;

  if (file.path) {
    const relative = path.relative(uploadsRoot, file.path).replace(/\\/g, "/");
    return `/uploads/${relative}`;
  }

  const safeSubdir = fallbackSubdir ? `${sanitizePathSegment(fallbackSubdir)}/` : "";
  return `/uploads/${safeSubdir}${file.filename}`;
}

module.exports = {
  uploadsRoot,
  getRequestCompanyCode,
  getTenantUploadDir,
  getUploadedFileUrl,
};
