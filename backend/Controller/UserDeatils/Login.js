// backend/Controller/UserDeatils/Login.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../../Utils/db");
const { recordLog } = require("../../Utils/AuditUtils");

const JWT_SECRET = process.env.JWT_SECRET || "change_me";

// Disable self-registration – HR/admin manages employees
const register = async (req, res) => {
  return res
    .status(405)
    .json({ message: "Registration is managed by HR. Please contact admin." });
};

// POST /auth/login
const login = async (req, res) => {
  try {
    let { email, password } = req.body ?? {};
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "email and password are required" });
    }

    email = String(email).trim();

    // 1) find employee in employee_records (only can_login=1)
    const [empRows] = await pool.execute(
      `SELECT 
          e.id,
          e.Employee_ID,
          e.Employee_Name,
          e.Official_Email,
          e.password_hash,
          e.can_login,
          e.is_active,
          e.profile_img,
          e.Department,
          e.company_id
       FROM employee_records e
       WHERE e.can_login = 1
         AND e.Official_Email = ?
       LIMIT 1`,
      [email]
    );

    if (!empRows.length) {
      await recordLog({
        action: `Failed login attempt (email: ${email})`,
        category: "Login Attempts",
        status: "Failed",
        details: { email }
      });
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const emp = empRows[0];

    // ✅ inactive block (clear message)
    if (Number(emp.is_active) !== 1) {
      await recordLog({
        actorId: emp.id,
        action: "Login blocked: Account inactive",
        category: "Login Attempts",
        status: "Failed",
        details: { email: emp.Official_Email }
      });
      return res
        .status(403)
        .json({ message: "Account is inactive. Contact admin." });
    }

    if (!emp.password_hash) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, emp.password_hash);
    if (!ok) {
      await recordLog({
        actorId: emp.id,
        action: "Login failed: Incorrect password",
        category: "Login Attempts",
        status: "Failed",
        details: { email: emp.Official_Email }
      });
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 2) primary role for this employee via employee_user_types
    const [roleRows] = await pool.execute(
      `SELECT ut.id,
              ut.type,
              ut.permission_level,
              ut.Create_permission AS can_create,
              ut.Edit_permission   AS can_edit,
              ut.View_permission   AS can_view
         FROM employee_user_types eut
         JOIN users_types ut ON ut.id = eut.user_type_id
        WHERE eut.employee_id = ?
          AND eut.is_primary = 1`,
      [emp.id]
    );

    let roles = roleRows.map((r) => r.type);

    // fall back to neutral "guest"
    if (!roles.length) {
      roles = ["guest"];
    }

    let level = 0;
    let canCreate = false;
    let canEdit = false;
    let canView = false;

    let exactCreate = null;
    let exactEdit = null;
    let exactView = null;

    for (const r of roleRows) {
      level = Math.max(level, Number(r.permission_level) || 0);
      if (Number(r.can_create) > 0) canCreate = true;
      if (Number(r.can_edit) > 0) canEdit = true;
      if (Number(r.can_view) > 0) canView = true;

      exactCreate = r.can_create;
      exactEdit = r.can_edit;
      exactView = r.can_view;
    }

    if (level > 6) {
      canCreate = true;
      canEdit = true;
      canView = true;
    }

    // 3) feature codes (permissions) from user_type_permission + permissions
    const [permRows] = await pool.execute(
      `SELECT DISTINCT p.code
         FROM user_type_permission up
         JOIN permissions p ON p.id = up.permission_id
         JOIN employee_user_types eut ON eut.user_type_id = up.user_type_id
        WHERE eut.employee_id = ?
          AND eut.is_primary = 1`,
      [emp.id]
    );

    let features = permRows.map((r) => r.code);

    // ✅ Developer gets ALL permissions (safe-lock prevention)
    const isDeveloper = roles.some(r => String(r).toLowerCase() === 'developer');
    if (level >= 10 || isDeveloper) {
      const [allPerms] = await pool.execute("SELECT code FROM permissions");
      features = [...new Set([...features, ...allPerms.map(p => p.code)])];
    }

    const avatarPath = emp.profile_img || null;

    const payload = {
      id: emp.id,
      company_id: emp.company_id,
      employeeCode: emp.Employee_ID,
      name: emp.Employee_Name,
      email: emp.Official_Email,

      profile_img: avatarPath,
      profile_picture: avatarPath,

      role: roles[0] || null,
      roles,
      Department: emp.Department,

      flags: {
        level,
        create: canCreate,
        edit: canEdit,
        view: canView,
        exact_create: exactCreate,
        exact_edit: exactEdit,
        exact_view: exactView,
      },
      features,
    };

    req.session.regenerate((regenErr) => {
      if (regenErr) {
        console.error("Session regenerate error:", regenErr);
        return res.status(500).json({ message: "Server error" });
      }

      req.session.user = payload;

      const token = jwt.sign(
        {
          sub: emp.id,
          company_id: emp.company_id,
          roles,
          features,
          flags: payload.flags,
        },
        JWT_SECRET,
        { expiresIn: "8h" }
      );

      req.session.save(async (saveErr) => {
        if (saveErr) {
          console.error("Session save error:", saveErr);
          return res.status(500).json({ message: "Server error" });
        }
        await recordLog({
          actorId: emp.id,
          action: "Login successful",
          category: "Login Attempts",
          status: "Success",
          details: { email: emp.Official_Email }
        });
        return res
          .status(200)
          .json({ message: "Login successful", user: payload, token });
      });
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET /auth/me
const me = async (req, res) => {
  const sessionUser = req.session?.user;
  if (!sessionUser?.id) {
    return res.status(200).json({ user: null });
  }

  try {
    const empId = sessionUser.id;

    // 1) Fetch primary role
    const [roleRows] = await pool.execute(
      `SELECT ut.id,
              ut.type,
              ut.permission_level,
              ut.Create_permission AS can_create,
              ut.Edit_permission   AS can_edit,
              ut.View_permission   AS can_view
         FROM employee_user_types eut
         JOIN users_types ut ON ut.id = eut.user_type_id
        WHERE eut.employee_id = ?
          AND eut.is_primary = 1`,
      [empId]
    );

    let roles = roleRows.map((r) => r.type);
    if (!roles.length) roles = ["guest"];

    let level = 0;
    let canCreate = false;
    let canEdit = false;
    let canView = false;

    let exactCreate = null;
    let exactEdit = null;
    let exactView = null;

    for (const r of roleRows) {
      level = Math.max(level, Number(r.permission_level) || 0);
      if (Number(r.can_create) > 0) canCreate = true;
      if (Number(r.can_edit) > 0) canEdit = true;
      if (Number(r.can_view) > 0) canView = true;

      exactCreate = r.can_create;
      exactEdit = r.can_edit;
      exactView = r.can_view;
    }

    if (level > 6) {
      canCreate = true;
      canEdit = true;
      canView = true;
    }

    // 2) Fetch permissions
    const [permRows] = await pool.execute(
      `SELECT DISTINCT p.code
         FROM user_type_permission up
         JOIN permissions p ON p.id = up.permission_id
         JOIN employee_user_types eut ON eut.user_type_id = up.user_type_id
        WHERE eut.employee_id = ?
          AND eut.is_primary = 1`,
      [empId]
    );

    let features = permRows.map((r) => r.code);

    // ✅ Developer gets ALL permissions (safe-lock prevention)
    const isDeveloper = roles.some(r => String(r).toLowerCase() === 'developer');
    if (level >= 10 || isDeveloper) {
      const [allPerms] = await pool.execute("SELECT code FROM permissions");
      features = [...new Set([...features, ...allPerms.map(p => p.code)])];
    }

    // 3) Update session and save
    req.session.user = {
      ...sessionUser,
      role: roles[0] || null,
      roles,
      flags: {
        level,
        create: canCreate,
        edit: canEdit,
        view: canView,
        exact_create: exactCreate,
        exact_edit: exactEdit,
        exact_view: exactView,
      },
      features,
    };

    req.session.save((saveErr) => {
      if (saveErr) console.error("Session save error in /auth/me:", saveErr);
      return res.status(200).json({ user: req.session.user });
    });
  } catch (err) {
    console.error("Error refreshing permissions in /auth/me:", err);
    // Fallback to existing session if DB fails
    return res.status(200).json({ user: sessionUser });
  }
};

// POST /auth/logout
async function logout(req, res) {
  try {
    const cookieName = "sid";
    req.session.destroy((err) => {
      res.clearCookie(cookieName);
      if (err) {
        console.error("Logout destroy error:", err);
        return res.status(500).json({ message: "Failed to log out" });
      }
      return res.status(200).json({ message: "Logged out successfully" });
    });
  } catch (e) {
    console.error("Logout error:", e);
    return res.status(500).json({ message: "Server error" });
  }
}

// POST /auth/change-password
async function changePassword(req, res) {
  try {
    const sessionUser = req.session.user;
    if (!sessionUser?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current password and new password are required" });
    }

    const [rows] = await pool.execute(
      `SELECT id, password_hash, can_login, is_active
         FROM employee_records
        WHERE id = ?
        LIMIT 1`,
      [sessionUser.id]
    );

    if (!rows.length || !rows[0].password_hash) {
      return res
        .status(400)
        .json({ message: "Current password is incorrect" });
    }

    const emp = rows[0];

    if (!emp.can_login || !emp.is_active) {
      return res
        .status(400)
        .json({ message: "Account is not allowed to login" });
    }

    const ok = await bcrypt.compare(currentPassword, emp.password_hash);
    if (!ok) {
      return res
        .status(400)
        .json({ message: "Current password is incorrect" });
    }

    const hash = await bcrypt.hash(String(newPassword).trim(), 10);

    await pool.execute(
      `UPDATE employee_records
          SET password_hash = ?, must_change_password = 0
        WHERE id = ?`,
      [hash, sessionUser.id]
    );

    return res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("changePassword error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// POST /auth/me/avatar
async function uploadAvatar(req, res) {
  try {
    const sessionUser = req.session.user;
    if (!sessionUser?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const relPath = `/uploads/profile-img/${req.file.filename}`;

    await pool.execute(
      `UPDATE employee_records
         SET profile_img = ?
       WHERE id = ?
       LIMIT 1`,
      [relPath, sessionUser.id]
    );

    const updatedUser = {
      ...sessionUser,
      profile_img: relPath,
      profile_picture: relPath,
    };
    req.session.user = updatedUser;

    return res.status(200).json({
      message: "Avatar updated",
      profile_img: relPath,
      profile_picture: relPath,
      user: updatedUser,
    });
  } catch (err) {
    console.error("uploadAvatar error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * POST /api/v1/auth/heartbeat
 * Update last_login_at to show user is active
 */
async function heartbeat(req, res) {
  const userId = req.session?.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    await pool.execute(
      "UPDATE employee_records SET last_login_at = NOW() WHERE id = ?",
      [userId]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error("heartbeat error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  login,
  logout,
  me,
  register,
  heartbeat,
  changePassword,
  uploadAvatar,
};
