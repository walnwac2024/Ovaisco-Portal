// backend/middlewares/middleware.js
const fs = require("fs");
const path = require("path");

function isAuthenticated(req, res, next) {
  const user = req.session?.user;
  const logMsg = `[AUTH DEBUG] ${new Date().toISOString()} - ${req.method} ${req.originalUrl} - User: ${user?.id || "none"}\n`;
  fs.appendFileSync(path.join(__dirname, "..", "auth_debug.log"), logMsg);

  if (!user) {
    return res.status(401).json({ message: "Unauthenticated" });
  }

  req.company_id = user.company_id || 1;
  next();
}

function hasFullAccess(user) {
  if (!user) return false;

  const level = Number(user.flags?.level || user.permission_level || 0);
  if (level > 6) return true;

  const userRoles = (Array.isArray(user.roles) ? user.roles : []).map((r) =>
    String(r).toLowerCase()
  );

  return (
    userRoles.includes("developer") ||
    userRoles.includes("super_admin") ||
    userRoles.includes("admin") ||
    userRoles.includes("hr")
  );
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const user = req.session?.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthenticated" });
    }

    if (hasFullAccess(user)) {
      return next();
    }

    const userRoles = (Array.isArray(user.roles) ? user.roles : []).map((r) =>
      String(r).toLowerCase()
    );
    const ok = allowedRoles.some((r) =>
      userRoles.includes(String(r).toLowerCase())
    );

    if (!ok) {
      return res.status(403).json({ message: "Forbidden (insufficient role)" });
    }

    next();
  };
}

function requireFeatures(...neededCodes) {
  return (req, res, next) => {
    const user = req.session?.user;
    if (!user) return res.status(401).json({ message: "Unauthenticated" });
    if (hasFullAccess(user)) return next();

    const feats = new Set(user.features || []);
    if (neededCodes.every((code) => feats.has(code))) return next();

    return res.status(403).json({ message: "Forbidden (missing feature)" });
  };
}

function requireRoleOrAnyFeature(allowedRoles = [], allowedFeatures = []) {
  return (req, res, next) => {
    const user = req.session?.user;
    if (!user) return res.status(401).json({ message: "Unauthenticated" });
    if (hasFullAccess(user)) return next();

    const userRoles = (Array.isArray(user.roles) ? user.roles : []).map((role) =>
      String(role).toLowerCase()
    );
    const roleOk = allowedRoles.some((role) =>
      userRoles.includes(String(role).toLowerCase())
    );
    if (roleOk) return next();

    const feats = new Set((user.features || []).map((feature) => String(feature).toLowerCase()));
    const featureOk = allowedFeatures.some((feature) =>
      feats.has(String(feature).toLowerCase())
    );
    if (featureOk) return next();

    return res.status(403).json({ message: "Forbidden (insufficient role or feature)" });
  };
}

function requireFeaturesOrSelf(featureCode, idParam = "id") {
  return (req, res, next) => {
    const user = req.session?.user;
    if (!user) return res.status(401).json({ message: "Unauthenticated" });
    if (hasFullAccess(user)) return next();

    const requestedId = String(req.params[idParam]);
    if (String(user.id) === requestedId) return next();

    const feats = new Set(user.features || []);
    if (feats.has(featureCode)) return next();

    return res.status(403).json({ message: "Forbidden (access denied)" });
  };
}

module.exports = {
  isAuthenticated,
  requireRole,
  requireFeatures,
  requireRoleOrAnyFeature,
  requireFeaturesOrSelf,
  hasFullAccess,
};
