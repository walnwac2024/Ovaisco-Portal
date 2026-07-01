const { pool } = require("../../Utils/db");
const { hasFullAccess } = require("../../middlewares/middleware");
const { recordLog } = require("../../Utils/AuditUtils");

const VALID_PRIORITIES = new Set(["low", "medium", "high", "urgent"]);
const VALID_STATUSES = new Set(["open", "in_progress", "resolved", "closed", "rejected"]);

async function ensureComplaintTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS complaints (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ticket_no VARCHAR(50) NULL UNIQUE,
      employee_id INT NOT NULL,
      subject VARCHAR(180) NOT NULL,
      category VARCHAR(80) NOT NULL DEFAULT 'General',
      priority ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
      description TEXT NOT NULL,
      status ENUM('open','in_progress','resolved','closed','rejected') NOT NULL DEFAULT 'open',
      admin_comment TEXT NULL,
      handled_by INT NULL,
      resolved_at DATETIME NULL,
      company_id INT NOT NULL DEFAULT 1,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_complaints_company_status (company_id, status),
      INDEX idx_complaints_employee_company (employee_id, company_id),
      INDEX idx_complaints_created (created_at)
    )
  `);
}

function canManageComplaints(user) {
  if (hasFullAccess(user)) return true;
  const features = new Set((user?.features || []).map((feature) => String(feature).toLowerCase()));
  return features.has("complaint_manage") || features.has("complaint_view_all");
}

function normalizePriority(priority) {
  const value = String(priority || "medium").trim().toLowerCase();
  return VALID_PRIORITIES.has(value) ? value : "medium";
}

function sanitizeCategory(category) {
  const value = String(category || "General").trim();
  return value.slice(0, 80) || "General";
}

function buildTicketNo(user, complaintId) {
  const companyCode = String(user?.company_code || user?.tenant?.company_code || "portal")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8) || "PORTAL";
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `CMP-${companyCode}-${year}${month}-${String(complaintId).padStart(5, "0")}`;
}

async function findAdminLikeUsers(companyId, excludeUserId) {
  const [rows] = await pool.execute(
    `SELECT DISTINCT e.id AS employee_id
       FROM employee_records e
       JOIN employee_user_types eut ON eut.employee_id = e.id
       JOIN users_types ut ON ut.id = eut.user_type_id
       LEFT JOIN user_type_permission up ON up.user_type_id = eut.user_type_id
       LEFT JOIN permissions p ON p.id = up.permission_id
      WHERE e.company_id = ?
        AND (eut.company_id = e.company_id OR eut.company_id IS NULL OR eut.company_id = 0)
        AND e.id <> ?
        AND COALESCE(e.is_active, 1) = 1
        AND (
          COALESCE(ut.permission_level, 0) >= 7
          OR LOWER(REPLACE(ut.type, ' ', '_')) IN ('admin', 'super_admin', 'hr', 'human_resources', 'developer')
          OR p.code IN ('complaint_manage', 'complaint_view_all')
          OR LOWER(COALESCE(e.Department, '')) LIKE '%human resource%'
          OR LOWER(COALESCE(e.Department, '')) = 'hr'
        )`,
    [companyId, excludeUserId || 0]
  );
  return rows.map((row) => row.employee_id).filter(Boolean);
}

async function notifyUsers(userIds, title, message, type, referenceId, companyId) {
  if (!userIds.length) return;
  const values = [...new Set(userIds)].map((userId) => [
    userId,
    title,
    message,
    type,
    referenceId,
    companyId,
    new Date(),
  ]);

  await pool.query(
    "INSERT INTO notifications (user_id, title, message, type, reference_id, company_id, created_at) VALUES ?",
    [values]
  );
}

function selectComplaintSql() {
  return `
    SELECT
      c.*,
      e.Employee_Name AS requester_name,
      e.Employee_ID AS requester_code,
      e.Department AS requester_department,
      h.Employee_Name AS handled_by_name
    FROM complaints c
    JOIN employee_records e ON e.id = c.employee_id AND e.company_id = c.company_id
    LEFT JOIN employee_records h ON h.id = c.handled_by AND h.company_id = c.company_id
  `;
}

async function createComplaint(req, res) {
  try {
    await ensureComplaintTable();

    const user = req.session?.user;
    if (!user?.id) return res.status(401).json({ message: "Unauthenticated" });

    const subject = String(req.body?.subject || "").trim();
    const description = String(req.body?.description || "").trim();
    const category = sanitizeCategory(req.body?.category);
    const priority = normalizePriority(req.body?.priority);
    const companyId = req.company_id || user.company_id || 1;

    if (!subject || !description) {
      return res.status(400).json({ message: "Subject and description are required." });
    }

    const [result] = await pool.execute(
      `INSERT INTO complaints
       (employee_id, subject, category, priority, description, status, company_id)
       VALUES (?, ?, ?, ?, ?, 'open', ?)`,
      [user.id, subject.slice(0, 180), category, priority, description, companyId]
    );

    const complaintId = result.insertId;
    const ticketNo = buildTicketNo(user, complaintId);

    await pool.execute(
      "UPDATE complaints SET ticket_no = ? WHERE id = ? AND company_id = ?",
      [ticketNo, complaintId, companyId]
    );

    try {
      const admins = await findAdminLikeUsers(companyId, user.id);
      await notifyUsers(
        admins,
        "New Complaint Ticket",
        `${user.name || "An employee"} submitted ${ticketNo}: ${subject}`,
        "Complaint",
        complaintId,
        companyId
      );
    } catch (notifyErr) {
      console.error("complaint notification error:", notifyErr);
    }

    await recordLog({
      actorId: user.id,
      action: `Created complaint ticket ${ticketNo}`,
      category: "Complaint",
      status: "Success",
      details: { complaintId, ticketNo, companyId },
    });

    return res.status(201).json({
      message: "Complaint registered successfully.",
      complaint: { id: complaintId, ticket_no: ticketNo },
    });
  } catch (err) {
    console.error("createComplaint error:", err);
    return res.status(500).json({ message: "Failed to register complaint" });
  }
}

async function listComplaints(req, res) {
  try {
    await ensureComplaintTable();

    const user = req.session?.user;
    if (!user?.id) return res.status(401).json({ message: "Unauthenticated" });

    const companyId = req.company_id || user.company_id || 1;
    const scope = String(req.query?.scope || "mine").toLowerCase();
    const status = String(req.query?.status || "").trim().toLowerCase();
    const params = [companyId];

    let query = `${selectComplaintSql()} WHERE c.company_id = ?`;

    const manage = canManageComplaints(user);
    if (!manage || scope !== "all") {
      query += " AND c.employee_id = ?";
      params.push(user.id);
    }

    if (VALID_STATUSES.has(status)) {
      query += " AND c.status = ?";
      params.push(status);
    }

    query += " ORDER BY c.created_at DESC, c.id DESC";

    const [rows] = await pool.execute(query, params);
    return res.json({ complaints: rows, canManage: manage });
  } catch (err) {
    console.error("listComplaints error:", err);
    return res.status(500).json({ message: "Failed to load complaints" });
  }
}

async function getComplaintById(req, res) {
  try {
    await ensureComplaintTable();

    const user = req.session?.user;
    if (!user?.id) return res.status(401).json({ message: "Unauthenticated" });

    const companyId = req.company_id || user.company_id || 1;
    const params = [companyId, req.params.id];
    let query = `${selectComplaintSql()} WHERE c.company_id = ? AND c.id = ?`;

    if (!canManageComplaints(user)) {
      query += " AND c.employee_id = ?";
      params.push(user.id);
    }

    const [rows] = await pool.execute(query, params);
    if (!rows.length) return res.status(404).json({ message: "Complaint not found" });
    return res.json({ complaint: rows[0], canManage: canManageComplaints(user) });
  } catch (err) {
    console.error("getComplaintById error:", err);
    return res.status(500).json({ message: "Failed to load complaint" });
  }
}

async function updateComplaintStatus(req, res) {
  try {
    await ensureComplaintTable();

    const user = req.session?.user;
    if (!user?.id) return res.status(401).json({ message: "Unauthenticated" });
    if (!canManageComplaints(user)) return res.status(403).json({ message: "Forbidden" });

    const status = String(req.body?.status || "").trim().toLowerCase();
    const comment = String(req.body?.admin_comment || req.body?.comment || "").trim();
    if (!VALID_STATUSES.has(status)) {
      return res.status(400).json({ message: "Invalid complaint status." });
    }

    const companyId = req.company_id || user.company_id || 1;
    const [[existing]] = await pool.execute(
      "SELECT id, employee_id, ticket_no, subject FROM complaints WHERE id = ? AND company_id = ? LIMIT 1",
      [req.params.id, companyId]
    );

    if (!existing) return res.status(404).json({ message: "Complaint not found" });

    await pool.execute(
      `UPDATE complaints
          SET status = ?,
              admin_comment = ?,
              handled_by = ?,
              resolved_at = CASE WHEN ? IN ('resolved','closed','rejected') THEN NOW() ELSE resolved_at END
        WHERE id = ? AND company_id = ?`,
      [status, comment || null, user.id, status, req.params.id, companyId]
    );

    try {
      await notifyUsers(
        [existing.employee_id],
        "Complaint Ticket Updated",
        `${existing.ticket_no} has been marked ${status.replace("_", " ")}.`,
        "Complaint",
        existing.id,
        companyId
      );
    } catch (notifyErr) {
      console.error("complaint status notification error:", notifyErr);
    }

    await recordLog({
      actorId: user.id,
      action: `Updated complaint ticket ${existing.ticket_no} to ${status}`,
      category: "Complaint",
      status: "Success",
      details: { complaintId: existing.id, ticketNo: existing.ticket_no, companyId },
    });

    return res.json({ message: "Complaint status updated successfully." });
  } catch (err) {
    console.error("updateComplaintStatus error:", err);
    return res.status(500).json({ message: "Failed to update complaint" });
  }
}

module.exports = {
  createComplaint,
  listComplaints,
  getComplaintById,
  updateComplaintStatus,
  ensureComplaintTable,
};
