// backend/Controller/Attendance/AttendanceSettings.js
const { pool } = require("../../Utils/db");

const ensureAttendanceRulesReady = async () => {
  try {
    const [cols] = await pool.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attendance_rules' AND COLUMN_NAME = 'block_vpn'"
    );
    if (cols.length === 0) {
      console.log("🛠️ Patching attendance_rules: adding block_vpn");
      await pool.query("ALTER TABLE attendance_rules ADD COLUMN block_vpn TINYINT(1) DEFAULT 0 AFTER notify_hr_admin");
    }
  } catch (err) {
    console.error("ensureAttendanceRulesReady error:", err);
  }
};

const getShifts = async (req, res) => {
  try {
    const company_id = req.company_id;
    const [rows] = await pool.query(
      `
      SELECT id, name, start_time, end_time, effective_from, effective_to, is_active, created_at
      FROM attendance_shifts
      WHERE company_id = ?
      ORDER BY
        CASE name
          WHEN 'RAMADAN' THEN 1
          WHEN 'SUMMER' THEN 2
          WHEN 'WINTER' THEN 3
          ELSE 99
        END,
        effective_from DESC
      `,
      [company_id]
    );
    return res.json({ shifts: rows });
  } catch (e) {
    console.error("getShifts error:", e);
    return res.status(500).json({ message: "Failed to load shifts" });
  }
};

const updateShift = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const company_id = req.company_id;
    const { start_time, end_time, effective_from, effective_to, is_active } = req.body || {};

    if (!id) return res.status(400).json({ message: "Invalid shift id" });
    if (!start_time || !end_time) return res.status(400).json({ message: "start_time and end_time are required" });
    if (!effective_from || !effective_to) return res.status(400).json({ message: "effective_from and effective_to are required" });

    await pool.execute(
      `
      UPDATE attendance_shifts
      SET start_time = ?,
          end_time = ?,
          effective_from = ?,
          effective_to = ?,
          is_active = ?
      WHERE id = ? AND company_id = ?
      `,
      [start_time, end_time, effective_from, effective_to, is_active ? 1 : 0, id, company_id]
    );

    const [rows] = await pool.execute(
      `SELECT id, name, start_time, end_time, effective_from, effective_to, is_active
       FROM attendance_shifts WHERE id = ? AND company_id = ? LIMIT 1`,
      [id, company_id]
    );

    return res.json({ message: "Shift updated", shift: rows[0] || null });
  } catch (e) {
    console.error("updateShift error:", e);
    return res.status(500).json({ message: "Failed to update shift" });
  }
};

const getRules = async (req, res) => {
  try {
    const company_id = req.company_id;
    await ensureAttendanceRulesReady();
    const [rows] = await pool.query(
      `
      SELECT id, grace_minutes, notify_employee, notify_hr_admin, block_vpn, is_active, created_at
      FROM attendance_rules
      WHERE company_id = ?
      ORDER BY id DESC
      LIMIT 10
      `,
      [company_id]
    );
    return res.json({ rules: rows });
  } catch (e) {
    console.error("getRules error:", e);
    return res.status(500).json({ message: "Failed to load rules" });
  }
};

const updateActiveRule = async (req, res) => {
  try {
    const company_id = req.company_id;
    const { grace_minutes, notify_employee, notify_hr_admin, block_vpn } = req.body || {};
    const g = Number(grace_minutes);

    if (!Number.isFinite(g) || g < 0 || g > 240) {
      return res.status(400).json({ message: "grace_minutes must be a number (0-240)" });
    }

    // Deactivate only this company's rules
    await pool.query(`UPDATE attendance_rules SET is_active = 0 WHERE is_active = 1 AND company_id = ?`, [company_id]);

    await pool.execute(
      `
      INSERT INTO attendance_rules (grace_minutes, notify_employee, notify_hr_admin, block_vpn, is_active, company_id)
      VALUES (?, ?, ?, ?, 1, ?)
      `,
      [g, notify_employee ? 1 : 0, notify_hr_admin ? 1 : 0, block_vpn ? 1 : 0, company_id]
    );

    return res.json({ message: "Rule updated" });
  } catch (e) {
    console.error("updateActiveRule error:", e);
    return res.status(500).json({ message: "Failed to update rule" });
  }
};

const bulkAssignShift = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { shift_id } = req.body || {};
    const sid = Number(shift_id);

    if (!sid) {
      return res.status(400).json({ message: "shift_id is required" });
    }

    // Verify shift exists and is active
    const [shiftRows] = await conn.execute(
      "SELECT id, name FROM attendance_shifts WHERE id = ? AND is_active = 1",
      [sid]
    );
    if (!shiftRows.length) {
      return res.status(404).json({ message: "Active shift not found" });
    }
    const shiftName = shiftRows[0].name;

    await conn.beginTransaction();

    const today = new Date().toISOString().slice(0, 10);

    // 1. End current assignments for all active employees
    await conn.execute(
      `UPDATE employee_shift_assignments esa
       JOIN employee_records e ON e.id = esa.employee_id
       SET esa.effective_to = ?
       WHERE e.is_active = 1 AND (esa.effective_to IS NULL OR esa.effective_to > ?)`,
      [today, today]
    );

    // 2. Fetch active employees of THIS company only
    const [employees] = await conn.execute(
      "SELECT id FROM employee_records WHERE is_active = 1 AND company_id = ?",
      [req.company_id]
    );

    // 3. Insert new assignments
    if (employees.length > 0) {
      const values = employees.map(emp => [emp.id, sid, today]);
      await conn.query(
        "INSERT INTO employee_shift_assignments (employee_id, shift_id, effective_from) VALUES ?",
        [values]
      );
    }

    await conn.commit();

    // Audit Log
    await recordLog({
      actorId: req.session?.user?.id,
      action: `Bulk assigned shift '${shiftName}' to ${employees.length} active employees`,
      category: "Attendance",
      status: "Success",
      details: { shift_id: sid, attendee_count: employees.length }
    });

    return res.json({
      message: `Successfully assigned ${shiftName} shift to ${employees.length} employees.`,
      count: employees.length
    });

  } catch (e) {
    if (conn) await conn.rollback();
    console.error("bulkAssignShift error:", e);
    return res.status(500).json({ message: "Failed to perform bulk shift assignment" });
  } finally {
    if (conn) conn.release();
  }
};

module.exports = {
  getShifts,
  updateShift,
  getRules,
  updateActiveRule,
  bulkAssignShift,
};
