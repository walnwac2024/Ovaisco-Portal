const { pool } = require("../../Utils/db");
const { recordLog } = require("../../Utils/AuditUtils");
const https = require("https");
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
console.log('[Attendance] fs and path modules loaded:', !!fs, !!path);

/**
 * Fetch real network time to prevent system clock manipulation
 * Returns a Date object from a reliable network source
 */
async function getNetworkTime() {
  return new Promise((resolve) => {
    // We try WorldTimeAPI first as it's dedicated for this
    const req = https.get("https://worldtimeapi.org/api/timezone/Etc/UTC", (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          if (json && json.datetime) {
            return resolve(new Date(json.datetime));
          }
          resolve(null);
        } catch (e) {
          resolve(null);
        }
      });
    });

    req.on("error", () => resolve(null));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(null);
    });
  });
}

/**
 * Shift resolver: RAMADAN > SUMMER > WINTER (by date range)
 * Uses attendance_shifts table.
 */
async function resolveShiftForDate(dateStr) {
  const [rows] = await pool.execute(
    `
    SELECT id, name, start_time, end_time
    FROM attendance_shifts
    WHERE is_active = 1
      AND ? BETWEEN effective_from AND effective_to
    ORDER BY
      CASE name
        WHEN 'RAMADAN' THEN 1
        WHEN 'SUMMER' THEN 2
        WHEN 'WINTER' THEN 3
        ELSE 99
      END
    LIMIT 1
    `,
    [dateStr]
  );

  if (rows.length) return rows[0];

  // fallback: pick any active (prefer WINTER)
  const [fallback] = await pool.execute(
    `
    SELECT id, name, start_time, end_time
    FROM attendance_shifts
    WHERE is_active = 1
    ORDER BY
      CASE name
        WHEN 'WINTER' THEN 1
        WHEN 'SUMMER' THEN 2
        WHEN 'RAMADAN' THEN 3
        ELSE 99
      END
    LIMIT 1
    `
  );

  return fallback[0] || null;
}

async function getActiveRule() {
  try {
    const [rows] = await pool.execute(
      `SELECT id, grace_minutes, notify_employee, notify_hr_admin, block_vpn
       FROM attendance_rules
       WHERE is_active = 1
       ORDER BY id DESC
       LIMIT 1`
    );
    return rows[0] || { grace_minutes: 15, notify_employee: 1, notify_hr_admin: 1, block_vpn: 0 };
  } catch (err) {
    if (err.message && err.message.includes("Unknown column 'block_vpn'")) {
      // Fallback for missing column
      const [rows] = await pool.execute(
        `SELECT id, grace_minutes, notify_employee, notify_hr_admin
          FROM attendance_rules
          WHERE is_active = 1
          ORDER BY id DESC
          LIMIT 1`
      );
      const rule = rows[0] || { grace_minutes: 15, notify_employee: 1, notify_hr_admin: 1 };
      rule.block_vpn = 0; // default value
      return rule;
    }
    throw err;
  }
}

function toYMD(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function isAdminLike(user) {
  const level = Number(user?.flags?.level || 0);
  const roles = (Array.isArray(user?.roles) ? user.roles : []).map(r => String(r).toLowerCase());
  return (
    level > 6 ||
    roles.includes("super_admin") ||
    roles.includes("admin") ||
    roles.includes("hr")
  );
}

/**
 * Haversine formula to calculate distance between two points in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Check if an IP address is a VPN or Proxy
 * Uses headers and ip-api.com
 */
async function checkVPN(ip, reqHeaders = {}) {
  // 1. Check for common proxy headers
  const proxyHeaders = [
    'via',
    'x-proxy-id',
    'proxy-connection',
    'x-forwarded-proto',
    'forwarded'
  ];

  for (const h of proxyHeaders) {
    if (reqHeaders[h]) return true;
  }

  // 2. IP Intelligence check (ip-api.com)
  // Note: ip-api.com free tier allows 45 requests per minute
  if (!ip || ip === '::1' || ip === '127.0.0.1') return false;

  return new Promise((resolve) => {
    const req = https.get(`https://demo.ip-api.com/json/${ip}?fields=proxy,hosting`, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          // if proxy or hosting (datacenter) is true, it's likely a VPN/Proxy
          resolve(!!(json.proxy || json.hosting));
        } catch (e) {
          resolve(false);
        }
      });
    });

    req.on("error", () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * GET /attendance/offices
 */
const listOffices = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, name, code, latitude, longitude, allowed_radius_meters
       FROM offices
       WHERE is_active = 1
       ORDER BY id ASC`
    );
    return res.json({ offices: rows });
  } catch (e) {
    console.error("listOffices error:", e);
    return res.status(500).json({ message: "Failed to load offices" });
  }
};

/**
 * GET /attendance/today
 */
const getToday = async (req, res) => {
  try {
    const user = req.session?.user;
    const employeeId = user?.id;
    if (!employeeId) return res.status(401).json({ message: "Unauthenticated" });

    const today = toYMD(new Date());
    const shift = await resolveShiftForDate(today);
    const rule = await getActiveRule();

    const [dailyRows] = await pool.execute(
      `
      SELECT *
      FROM attendance_daily
      WHERE employee_id = ? AND attendance_date = ?
      LIMIT 1
      `,
      [employeeId, today]
    );

    return res.json({
      date: today,
      serverTime: new Date(),
      shift: shift
        ? { id: shift.id, name: shift.name, start_time: shift.start_time, end_time: shift.end_time }
        : null,
      grace_minutes: Number(rule.grace_minutes || 0),
      attendance: dailyRows[0] || null,
    });
  } catch (e) {
    console.error("getToday error:", e);
    return res.status(500).json({ message: "Failed to load today's attendance" });
  }
};

/**
 * POST /attendance/punch
 * body: { office_id, punch_type: 'IN'|'OUT', employee_id? (admin only), note? }
 */
const punch = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const sessionUser = req.session?.user;
    if (!sessionUser?.id) return res.status(401).json({ message: "Unauthenticated" });

    const { office_id, punch_type, employee_id, note, clientTime, latitude, longitude, photo } = req.body || {};

    if (!office_id) return res.status(400).json({ message: "office_id is required" });
    if (!punch_type || !["IN", "OUT"].includes(punch_type)) {
      return res.status(400).json({ message: "punch_type must be IN or OUT" });
    }

    // Admin can punch for others; normal user only for self
    const targetEmployeeId =
      employee_id && isAdminLike(sessionUser) ? Number(employee_id) : Number(sessionUser.id);

    const now = new Date();

    // --- SECURITY CHECK 2: SERVER CLOCK MANIPULATION ---
    // If the server itself is running on a machine with a fooled clock, we check vs Network Time
    const netTime = await getNetworkTime();
    if (netTime) {
      const serverDriftMs = Math.abs(now.getTime() - netTime.getTime());
      const serverDriftMin = serverDriftMs / 60000;

      if (serverDriftMin > 10) { // 10 minutes tolerance for server vs network
        return res.status(403).json({
          message: "Critical Security Error: The server system clock is not synchronized with the network time. Attendance cannot be marked until the server clock is corrected.",
          serverTime: now,
          networkTime: netTime,
          drift: Math.round(serverDriftMin)
        });
      }
    }

    // --- SECURITY CHECK 1: CLIENT CLOCK MANIPULATION ---
    if (clientTime) {
      const cTime = new Date(clientTime);
      const diffMs = Math.abs(now.getTime() - cTime.getTime());
      const diffMin = diffMs / 60000;

      if (diffMin > 5) {
        try {
          await conn.execute(
            `INSERT INTO attendance_security_violations 
              (employee_id, server_time, client_time, drift_minutes, punch_type)
             VALUES (?, ?, ?, ?, ?)`,
            [targetEmployeeId, now, cTime, Math.round(diffMin), punch_type]
          );
        } catch (logErr) {
          console.error("Failed to log security violation:", logErr);
        }

        return res.status(403).json({
          message: "Security violation detected: Your system clock is not synchronized with the server. Please set your device time to 'Automatic' using internet time settings and try again.",
          serverTime: now,
          clientTime: cTime,
          drift: Math.round(diffMin)
        });
      }
    }

    // Audit Log for Punch Security Violation (if detected)
    // Note: This is already logged to attendance_security_violations table, but adding to audit_logs for unified visibility
    if (clientTime && Math.abs(now.getTime() - new Date(clientTime).getTime()) > 5 * 60000) {
      await recordLog({
        actorId: targetEmployeeId,
        action: `Attendance security violation (clock drift: ${Math.round(Math.abs(now.getTime() - new Date(clientTime).getTime()) / 60000)}m)`,
        category: "System",
        status: "Failed",
        details: { punch_type, clientTime, serverTime: now }
      });
    }

    // --- SECURITY CHECK 3: VPN / PROXY DETECTION ---
    const rule = await getActiveRule();
    if (rule.block_vpn && !isAdminLike(sessionUser)) {
      const clientIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const isVpnDetected = await checkVPN(clientIp, req.headers);

      if (isVpnDetected) {
        // Log restriction attempt
        try {
          await conn.execute(
            `INSERT INTO attendance_security_violations 
              (employee_id, server_time, client_time, drift_minutes, punch_type, note)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [targetEmployeeId, now, now, 0, punch_type, `VPN/Proxy Detected: ${clientIp}`]
          );
        } catch (logErr) {
          console.error("Failed to log VPN security violation:", logErr);
        }

        return res.status(403).json({
          message: "Security Restriction: VPN or Proxy usage detected. Please disable your VPN/Proxy and use a direct internet connection to mark attendance.",
          ip: clientIp
        });
      }
    }

    // --- SECURITY CHECK 4: LIVE PHOTO VERIFICATION ---
    // User requested mandatory photo for security
    if (!photo && !isAdminLike(sessionUser)) {
      return res.status(400).json({ message: "Live photo is required to mark attendance. Access to camera is mandatory." });
    }

    let photoPath = null;
    if (photo) {
      try {
        const base64Data = photo.replace(/^data:image\/\w+;base64,/, "");
        const extMatch = photo.match(/^data:image\/(\w+);base64,/);
        const ext = (extMatch && extMatch[1]) || 'png';
        const buffer = Buffer.from(base64Data, "base64");
        const filename = `punch-${targetEmployeeId}-${Date.now()}.${ext}`;
        const dir = path.join(__dirname, "..", "..", "uploads", "attendance");
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        photoPath = `uploads/attendance/${filename}`;
        fs.writeFileSync(path.join(__dirname, "..", "..", photoPath), buffer);
      } catch (err) {
        console.error("Failed to save punch photo:", err);
      }
    }

    // --- GPS VALIDATION ---
    const [allOffices] = await conn.execute(
      "SELECT id, name, latitude, longitude, allowed_radius_meters FROM offices WHERE is_active = 1"
    );

    const targetOffice = allOffices.find(o => o.id === Number(office_id));
    if (!targetOffice) return res.status(400).json({ message: "Invalid office selection" });

    let isInside = false;
    let distToTarget = Infinity;
    const officeLat = Number(targetOffice.latitude);
    const officeLng = Number(targetOffice.longitude);

    // ✅ SOLUTION: If office has no coordinates, BYPASS Geofence (Smart Bypass)
    if (!officeLat || !officeLng) {
      isInside = true;
      console.log(`[Attendance] Geofence BYPASS for office: ${targetOffice.name} (No coordinates)`);
    } else if (latitude && longitude) {
      distToTarget = calculateDistance(latitude, longitude, officeLat, officeLng);
      if (distToTarget <= (targetOffice.allowed_radius_meters || 200)) {
        isInside = true;
      }
    }

    // If not admin and not inside the selected office, reject
    const isAdmin = isAdminLike(sessionUser);
    if (!isAdmin && !isInside) {
      // Log rejection
      try {
        await conn.execute(
          `INSERT INTO attendance_rejections (employee_id, latitude, longitude, reason)
           VALUES (?, ?, ?, ?)`,
          [
            targetEmployeeId,
            latitude || null,
            longitude || null,
            latitude ? `Outside radius for ${targetOffice.name}` : "Missing GPS coordinates"
          ]
        );
      } catch (logErr) {
        console.error("Failed to log rejection:", logErr);
      }

      let msg = "";
      if (!latitude || !longitude) {
        msg = "Location permission is required to mark attendance.";
      } else {
        msg = `You are not within the authorized radius for ${targetOffice.name}. (Distance: ${Math.round(distToTarget)}m). Please move closer to this office to mark attendance.`;
      }

      return res.status(403).json({ message: msg });
    }

    // ------------------------------------------
    const today = toYMD(now);
    const shift = await resolveShiftForDate(today);
    if (!shift) return res.status(400).json({ message: "No active shift configured" });

    // rule is already fetched above for VPN check
    const grace = Number(rule.grace_minutes || 0);

    await conn.beginTransaction();

    // 1) Insert punch event
    await conn.execute(
      `
      INSERT INTO attendance_punches
        (employee_id, office_id, punch_type, punched_at, source, marked_by_employee_id, note, latitude, longitude, distance_from_office, matched_office_id, punch_photo)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        targetEmployeeId,
        Number(office_id),
        punch_type,
        now,
        isAdmin ? "ADMIN" : "WEB",
        isAdmin ? sessionUser.id : null,
        note ? String(note).slice(0, 255) : null,
        latitude || null,
        longitude || null,
        isInside ? distToTarget : null,
        isInside ? targetOffice.id : null,
        photoPath
      ]
    );

    // 2) Ensure daily row exists
    const [dailyRows] = await conn.execute(
      `
      SELECT *
      FROM attendance_daily
      WHERE employee_id = ? AND attendance_date = ?
      LIMIT 1
      FOR UPDATE
      `,
      [targetEmployeeId, today]
    );

    if (!dailyRows.length) {
      await conn.execute(
        `
        INSERT INTO attendance_daily (employee_id, attendance_date, shift_id, status)
        VALUES (?, ?, ?, 'NOT_MARKED')
        `,
        [targetEmployeeId, today, shift.id]
      );
    }

    // Lock row
    const [daily2] = await conn.execute(
      `
      SELECT *
      FROM attendance_daily
      WHERE employee_id = ? AND attendance_date = ?
      LIMIT 1
      FOR UPDATE
      `,
      [targetEmployeeId, today]
    );

    const daily = daily2[0];
    const shiftStart = new Date(`${today}T${shift.start_time}`);

    if (punch_type === "IN") {
      if (daily.first_in) {
        await conn.rollback();
        return res.status(409).json({ message: "Already checked in today" });
      }

      // late calculation
      const lateMs = now.getTime() - shiftStart.getTime();
      const lateMinutesRaw = Math.floor(lateMs / 60000);
      const lateMinutes = lateMinutesRaw > grace ? lateMinutesRaw : 0;

      const status = lateMinutes > 0 ? "LATE" : "PRESENT";

      await conn.execute(
        `
        UPDATE attendance_daily
        SET first_in = ?,
            office_id_first_in = ?,
            photo_in = ?,
            late_minutes = ?,
            status = ?
        WHERE id = ?
        `,
        [now, Number(office_id), photoPath, lateMinutes, status, daily.id]
      );
    } else {
      if (!daily.first_in) {
        await conn.rollback();
        return res.status(409).json({ message: "Cannot check out before check in" });
      }
      if (daily.last_out) {
        await conn.rollback();
        return res.status(409).json({ message: "Already checked out today" });
      }

      const workedMs = now.getTime() - new Date(daily.first_in).getTime();
      const workedMinutes = Math.max(0, Math.floor(workedMs / 60000));

      const finalStatus = daily.status === "NOT_MARKED" ? "PRESENT" : daily.status;

      await conn.execute(
        `
        UPDATE attendance_daily
        SET last_out = ?,
            office_id_last_out = ?,
            photo_out = ?,
            worked_minutes = ?,
            status = ?
        WHERE id = ?
        `,
        [now, Number(office_id), photoPath, workedMinutes, finalStatus, daily.id]
      );
    }

    await conn.commit();

    // Audit Log for Successful Punch
    await recordLog({
      actorId: sessionUser.id,
      action: `${punch_type} punch for ${targetEmployeeId === sessionUser.id ? "self" : `employee_id: ${targetEmployeeId}`}`,
      category: "System",
      status: "Success",
      details: { office_id, punch_type, targetEmployeeId, latitude, longitude }
    });

    const [updatedDaily] = await pool.execute(
      `
      SELECT *
      FROM attendance_daily
      WHERE employee_id = ? AND attendance_date = ?
      LIMIT 1
      `,
      [targetEmployeeId, today]
    );

    return res.json({
      message: "Punch saved",
      date: today,
      shift: { id: shift.id, name: shift.name, start_time: shift.start_time, end_time: shift.end_time },
      grace_minutes: grace,
      attendance: updatedDaily[0] || null,
    });
  } catch (e) {
    try { await conn.rollback(); } catch { }
    console.error("punch error:", e);
    return res.status(500).json({ message: "Failed to punch attendance" });
  } finally {
    conn.release();
  }
};

/**
 * GET /attendance/admin/missing?date=YYYY-MM-DD
 */
const adminMissing = async (req, res) => {
  try {
    const user = req.session?.user;
    if (!isAdminLike(user)) return res.status(403).json({ message: "Forbidden" });

    const date = (req.query?.date && String(req.query.date)) || toYMD(new Date());

    const [rows] = await pool.execute(
      `
      SELECT
        e.id AS employee_id,
        e.Employee_ID,
        e.Employee_Name,
        e.Department,
        e.Designation,
        d.attendance_date,
        d.first_in,
        d.last_out,
        d.status,
        d.late_minutes
      FROM employee_records e
      LEFT JOIN attendance_daily d
        ON d.employee_id = e.id AND d.attendance_date = ?
      WHERE e.is_active = 1
        AND (
          d.id IS NULL
          OR d.first_in IS NULL
          OR (d.first_in IS NOT NULL AND d.last_out IS NULL)
        )
      ORDER BY e.Employee_Name ASC
      `,
      [date]
    );

    return res.json({ date, rows });
  } catch (e) {
    console.error("adminMissing error:", e);
    return res.status(500).json({ message: "Failed to load missing attendance" });
  }
};

/**
 * GET /attendance/summary/personal
 * Returns counts (Present, Absent, Leave, etc.) and missing records for current month
 */
const getPersonalSummary = async (req, res) => {
  try {
    const user = req.session?.user;
    if (!user?.id) return res.status(401).json({ message: "Unauthenticated" });

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;

    // 1. Get Summary Counts
    const [counts] = await pool.execute(
      `
      SELECT status, COUNT(*) as count
      FROM attendance_daily
      WHERE employee_id = ? 
        AND YEAR(attendance_date) = ? 
        AND MONTH(attendance_date) = ?
      GROUP BY status
      `,
      [user.id, year, month]
    );

    // 2. Get Missing/Incomplete Attendance
    // We look for rows where first_in is NULL or last_out is NULL for dates <= today
    const [missing] = await pool.execute(
      `
      SELECT attendance_date as date, first_in as \`in\`, last_out as \`out\`, status
      FROM attendance_daily
      WHERE employee_id = ?
        AND YEAR(attendance_date) = ?
        AND MONTH(attendance_date) = ?
        AND attendance_date <= CURRENT_DATE
        AND (first_in IS NULL OR last_out IS NULL)
      ORDER BY attendance_date DESC
      `,
      [user.id, year, month]
    );

    return res.json({
      summary: counts,
      missing: missing
    });
  } catch (e) {
    console.error("getPersonalSummary error:", e);
    return res.status(500).json({ message: "Failed to load attendance summary" });
  }
};

/**
 * GET /attendance/report/monthly?employee_id=X&year=YYYY&month=M
 * Accessible to self AND Authorities
 */
const getMonthlyReport = async (req, res) => {
  try {
    const sessionUser = req.session?.user;
    if (!sessionUser?.id) return res.status(401).json({ message: "Unauthenticated" });

    let { employee_id, year, month } = req.query;
    const targetId = employee_id ? Number(employee_id) : sessionUser.id;

    if (targetId !== sessionUser.id && !isAdminLike(sessionUser)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const y = Number(year) || new Date().getFullYear();
    const m = Number(month) || (new Date().getMonth() + 1);

    // 1. Get existing attendance records
    const [rows] = await pool.execute(
      `
      SELECT 
        d.id,
        d.attendance_date,
        d.first_in,
        d.last_out,
        d.status,
        d.late_minutes,
        d.worked_minutes,
        s.name as shift_name,
        o_in.name as office_in,
        o_out.name as office_out
      FROM attendance_daily d
      LEFT JOIN attendance_shifts s ON d.shift_id = s.id
      LEFT JOIN offices o_in ON d.office_id_first_in = o_in.id
      LEFT JOIN offices o_out ON d.office_id_last_out = o_out.id
      WHERE d.employee_id = ? 
        AND YEAR(d.attendance_date) = ? 
        AND MONTH(d.attendance_date) = ?
      ORDER BY d.attendance_date ASC
      `,
      [targetId, y, m]
    );

    // 2. Get Approved Leaves for this month
    const [leaves] = await pool.execute(
      `SELECT start_date, end_date, leave_type_id FROM leave_applications 
         WHERE employee_id = ? AND status = 'approved' 
         AND (
            (YEAR(start_date) = ? AND MONTH(start_date) = ?) OR 
            (YEAR(end_date) = ? AND MONTH(end_date) = ?)
         )`,
      [targetId, y, m, y, m]
    );

    // Helper to check if a date is on leave
    const isLeave = (dateObj) => {
      return leaves.some(l => {
        const start = new Date(l.start_date);
        const end = new Date(l.end_date);
        // reset times for comparison
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        return dateObj >= start && dateObj <= end;
      });
    };

    // 3. Generate all dates for the month
    const totalDays = new Date(y, m, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const report = [];
    const existingMap = new Map();
    rows.forEach(r => {
      const dateStr = toYMD(new Date(r.attendance_date));
      existingMap.set(dateStr, r);
    });

    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(y, m - 1, day);
      const dateStr = toYMD(date);

      if (existingMap.has(dateStr)) {
        const record = existingMap.get(dateStr);

        // Refine Status: Missing Checkout
        // If first_in exists, but last_out is NULL, and date is BEFORE today (or worked_minutes is 0/null)
        // If it's today, they might still be working.

        let finalStatus = record.status;

        // Check for missing checkout on PAST days
        if (record.first_in && !record.last_out && date < today) {
          finalStatus = "MISSING_CHECKOUT";
        }

        report.push({
          ...record,
          status: finalStatus
        });

      } else {
        // No attendance record found
        let status = 'UNMARKED';

        if (date < today) {
          // Check for Leave
          if (isLeave(date)) {
            status = 'LEAVE';
          } else {
            status = 'ABSENT';
          }
        }
        // If date >= today, it remains 'UNMARKED' (or 'UPCOMING' if preferred, but user asked about Unmarked)
        // Actually, user wants future dates to be Unmarked (implied), but past to be Absent/Leave.

        // Handling 'Today' specifically? 
        // If today and no record, it's Unmarked (yet to come) or Absent (if shift over). 
        // Let's stick to Unmarked for Today if no record yet.

        report.push({
          id: `virtual-${dateStr}`,
          attendance_date: dateStr,
          first_in: null,
          last_out: null,
          status: status,
          late_minutes: 0,
          worked_minutes: 0,
          shift_name: null,
          office_in: null,
          office_out: null
        });
      }
    }

    return res.json({
      employee_id: targetId,
      year: y,
      month: m,
      report: report
    });
  } catch (e) {
    console.error("getMonthlyReport error:", e);
    return res.status(500).json({ message: "Failed to generate monthly report" });
  }
};



// ... existing code ...

/**
 * GET /attendance/report/monthly/all?year=YYYY&month=M
 * Admin only
 */
const getMonthlyReportAll = async (req, res) => {
  try {
    const sessionUser = req.session?.user;
    if (!isAdminLike(sessionUser)) return res.status(403).json({ message: "Forbidden" });

    const y = Number(req.query.year) || new Date().getFullYear();
    const m = Number(req.query.month) || (new Date().getMonth() + 1);

    console.log(`[getMonthlyReportAll] Generating report for ${y}-${m}`);

    // Calculate Start and End Date for the month to use Index-friendly BETWEEN query
    const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const endDate = `${y}-${String(m).padStart(2, '0')}-${lastDay}`;

    // 1. Fetch All Active Employees
    const [employees] = await pool.execute(
      `SELECT id, Employee_ID, Employee_Name, Department FROM employee_records WHERE is_active = 1 ORDER BY Employee_ID`
    );

    // 2. Fetch All Attendance for the Month (Optimized)
    const [attendanceRows] = await pool.execute(
      `
        SELECT d.*, s.name as shift_name
        FROM attendance_daily d
        LEFT JOIN attendance_shifts s ON d.shift_id = s.id
        WHERE d.attendance_date BETWEEN ? AND ?
        `,
      [startDate, endDate]
    );

    // 3. Fetch All Approved Leaves (Optimized overlaps)
    const [leaveRows] = await pool.execute(
      `SELECT employee_id, start_date, end_date, leave_type_id FROM leave_applications 
         WHERE status = 'approved' 
         AND (start_date <= ? AND end_date >= ?)`,
      [endDate, startDate]
    );

    // Index Data for fast lookup
    // Map<employeeId, Map<dateStr, attendanceRecord>>
    const attMap = new Map();
    attendanceRows.forEach(r => {
      const d = toYMD(new Date(r.attendance_date));
      if (!attMap.has(r.employee_id)) attMap.set(r.employee_id, new Map());
      attMap.get(r.employee_id).set(d, r);
    });

    const leaveMap = new Map(); // Map<employeeId, Array<leave>>
    leaveRows.forEach(l => {
      if (!leaveMap.has(l.employee_id)) leaveMap.set(l.employee_id, []);
      leaveMap.get(l.employee_id).push(l);
    });

    const isLeave = (empId, dateObj) => {
      const empLeaves = leaveMap.get(empId) || [];
      return empLeaves.some(l => {
        const s = new Date(l.start_date);
        const e = new Date(l.end_date);
        s.setHours(0, 0, 0, 0);
        e.setHours(0, 0, 0, 0);
        return dateObj >= s && dateObj <= e;
      });
    };

    const totalDays = new Date(y, m, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dataForSheet = [];

    // Loop Employees -> Days
    for (const emp of employees) {
      for (let day = 1; day <= totalDays; day++) {
        const date = new Date(y, m - 1, day);
        const dateStr = toYMD(date);
        const empAtt = attMap.get(emp.id)?.get(dateStr);

        let status = "UNMARKED";
        let inTime = "";
        let outTime = "";
        let worked = 0;
        let late = 0;
        let shift = "";

        if (empAtt) {
          status = empAtt.status;
          shift = empAtt.shift_name || "";
          if (empAtt.first_in) inTime = new Date(empAtt.first_in).toLocaleTimeString();
          if (empAtt.last_out) outTime = new Date(empAtt.last_out).toLocaleTimeString();
          worked = empAtt.worked_minutes || 0;
          late = empAtt.late_minutes || 0;

          // Refine Missing Checkout logic
          if (empAtt.first_in && !empAtt.last_out && date < today) {
            status = "MISSING_CHECKOUT";
          }
        } else {
          if (date < today) {
            if (isLeave(emp.id, date)) {
              status = "LEAVE";
            } else {
              status = "ABSENT";
            }
          }
        }

        dataForSheet.push({
          "Employee ID": emp.Employee_ID,
          "Name": emp.Employee_Name,
          "Department": emp.Department,
          "Date": dateStr,
          "Status": status,
          "Shift": shift,
          "Check In": inTime,
          "Check Out": outTime,
          "Worked Mins": worked,
          "Late Mins": late
        });
      }
    }

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(dataForSheet);
    xlsx.utils.book_append_sheet(wb, ws, "Monthly Report");

    const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", `attachment; filename="Monthly_Report_ALL_${y}_${m}.xlsx"`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    return res.send(buffer);

  } catch (e) {
    console.error("getMonthlyReportAll error:", e);
    return res.status(500).json({ message: "Failed to generate bulk report" });
  }
};

/**
 * GET /attendance/logs?date=YYYY-MM-DD&format=json|excel
 * Returns attendance logs for all employees on a specific date
 * Admin/HR only
 */
const getAttendanceLogs = async (req, res) => {
  try {
    const user = req.session?.user;
    if (!isAdminLike(user)) return res.status(403).json({ message: "Forbidden" });

    const date = req.query?.date || toYMD(new Date());
    const format = req.query?.format || 'json';

    // Fetch all active employees with their attendance for the date
    const [rows] = await pool.execute(
      `
      SELECT 
        e.id,
        e.Employee_ID as employeeCode,
        e.Employee_Name as employeeName,
        e.Department as department,
        e.Designations as designation,
        d.attendance_date as date,
        d.first_in as checkIn,
        d.last_out as checkOut,
        d.photo_in as photoIn,
        d.photo_out as photoOut,
        d.status,
        d.late_minutes as lateMinutes,
        d.worked_minutes as workedMinutes,
        s.name as shiftName,
        o_in.name as officeIn,
        o_out.name as officeOut
      FROM employee_records e
      LEFT JOIN attendance_daily d ON d.employee_id = e.id AND d.attendance_date = ?
      LEFT JOIN attendance_shifts s ON d.shift_id = s.id
      LEFT JOIN offices o_in ON d.office_id_first_in = o_in.id
      LEFT JOIN offices o_out ON d.office_id_last_out = o_out.id
      WHERE e.is_active = 1
      ORDER BY 
        CASE 
          WHEN d.first_in IS NOT NULL THEN 0
          ELSE 1
        END,
        d.first_in DESC,
        e.Employee_Name ASC
      `,
      [date]
    );

    // Process rows to add computed fields
    const processedRows = rows.map(row => ({
      ...row,
      status: row.status || 'NOT_MARKED',
      checkIn: row.checkIn ? new Date(row.checkIn).toLocaleTimeString('en-US', { hour12: false }) : null,
      checkOut: row.checkOut ? new Date(row.checkOut).toLocaleTimeString('en-US', { hour12: false }) : null,
      lateMinutes: row.lateMinutes || 0,
      workedMinutes: row.workedMinutes || 0,
    }));

    // If Excel format requested
    if (format === 'excel') {
      const dataForSheet = processedRows.map(row => ({
        "Employee Code": row.employeeCode,
        "Employee Name": row.employeeName,
        "Department": row.department || '',
        "Designation": row.designation || '',
        "Date": date,
        "Check In": row.checkIn || '',
        "Check Out": row.checkOut || '',
        "Status": row.status,
        "Late Minutes": row.lateMinutes,
        "Worked Minutes": row.workedMinutes,
        "Shift": row.shiftName || '',
        "Office In": row.officeIn || '',
        "Office Out": row.officeOut || '',
      }));

      const wb = xlsx.utils.book_new();
      const ws = xlsx.utils.json_to_sheet(dataForSheet);
      xlsx.utils.book_append_sheet(wb, ws, "Attendance Logs");

      const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

      res.setHeader("Content-Disposition", `attachment; filename="Attendance_Logs_${date}.xlsx"`);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      return res.send(buffer);
    }

    // Return JSON
    return res.json({
      date,
      logs: processedRows,
      summary: {
        total: processedRows.length,
        present: processedRows.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length,
        late: processedRows.filter(r => r.status === 'LATE').length,
        notMarked: processedRows.filter(r => r.status === 'NOT_MARKED').length,
      }
    });
  } catch (e) {
    console.error("getAttendanceLogs error:", e);
    return res.status(500).json({ message: "Failed to load attendance logs" });
  }
};

/**
 * GET /attendance/audit-locations
 * List all punches with GPS coordinates for HR audit
 */
const listLocationAudit = async (req, res) => {
  try {
    const user = req.session?.user;
    if (!isAdminLike(user)) return res.status(403).json({ message: "Forbidden" });

    const [rows] = await pool.execute(`
      SELECT 
        ap.id,
        ap.punched_at,
        ap.punch_type,
        ap.latitude,
        ap.longitude,
        ap.distance_from_office,
        e.Employee_Name as name,
        e.Employee_ID as employeeCode,
        o.name as officeName
      FROM attendance_punches ap
      JOIN employee_records e ON ap.employee_id = e.id
      JOIN offices o ON ap.office_id = o.id
      ORDER BY ap.punched_at DESC
      LIMIT 100
    `);

    return res.json(rows);
  } catch (e) {
    console.error("listLocationAudit error:", e);
    return res.status(500).json({ message: "Failed to load location audit data" });
  }
};

module.exports = {
  listOffices,
  getToday,
  punch,
  adminMissing,
  getPersonalSummary,
  getMonthlyReport,
  getMonthlyReportAll,
  getAttendanceLogs,
  listLocationAudit,
};
