const { pool } = require("../../Utils/db");
const { recordLog } = require("../../Utils/AuditUtils");

/**
 * Helper to generate shifts for an employee based on a pattern
 */
async function generateShifts(conn, employeeId, patternId, startDate, daysToGenerate = 90) {
    // 1. Get pattern details
    const [patternDays] = await conn.execute(
        "SELECT day_number, shift_id FROM shift_rotation_pattern_days WHERE pattern_id = ? ORDER BY day_number ASC",
        [patternId]
    );
    if (!patternDays.length) return;

    const cycleLength = patternDays.length;
    const start = new Date(startDate);

    // 2. Clear existing non-override shifts for the range
    const endDate = new Date(start);
    endDate.setDate(start.getDate() + daysToGenerate);

    await conn.execute(
        "DELETE FROM employee_scheduled_shifts WHERE employee_id = ? AND date >= ? AND date <= ? AND is_override = 0",
        [employeeId, start.toISOString().slice(0, 10), endDate.toISOString().slice(0, 10)]
    );

    // 3. Generate new shifts
    const insertValues = [];
    for (let i = 0; i < daysToGenerate; i++) {
        const currentPathDate = new Date(start);
        currentPathDate.setDate(start.getDate() + i);
        const dateStr = currentPathDate.toISOString().slice(0, 10);

        // Calculate which day of the pattern we are on
        // This assumes pattern Day 1 is on startDate
        const patternIdx = i % cycleLength;
        const shiftId = patternDays[patternIdx].shift_id;

        insertValues.push([employeeId, dateStr, shiftId, 0]);
    }

    if (insertValues.length > 0) {
        await conn.query(
            "INSERT IGNORE INTO employee_scheduled_shifts (employee_id, date, shift_id, is_override) VALUES ?",
            [insertValues]
        );
    }
}

const getPatterns = async (req, res) => {
    try {
        const [patterns] = await pool.execute("SELECT * FROM shift_rotation_patterns WHERE is_active = 1");

        // Fetch days for each pattern
        for (const p of patterns) {
            const [days] = await pool.execute(
                "SELECT day_number, shift_id FROM shift_rotation_pattern_days WHERE pattern_id = ? ORDER BY day_number ASC",
                [p.id]
            );
            p.days = days;
        }

        return res.json({ patterns });
    } catch (err) {
        console.error("getPatterns error:", err);
        return res.status(500).json({ message: "Failed to load rotation patterns" });
    }
};

const savePattern = async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { id, name, description, days } = req.body || {};
        if (!name || !days || !Array.isArray(days) || days.length === 0) {
            return res.status(400).json({ message: "Name and at least one day are required" });
        }

        await conn.beginTransaction();

        let patternId = id;
        if (id) {
            // Update existing
            await conn.execute(
                "UPDATE shift_rotation_patterns SET name = ?, description = ?, cycle_days = ? WHERE id = ?",
                [name, description || null, days.length, id]
            );
            // Clear old days
            await conn.execute("DELETE FROM shift_rotation_pattern_days WHERE pattern_id = ?", [id]);
        } else {
            // Create new
            const [result] = await conn.execute(
                "INSERT INTO shift_rotation_patterns (name, description, cycle_days) VALUES (?, ?, ?)",
                [name, description || null, days.length]
            );
            patternId = result.insertId;
        }

        // Insert days
        const dayValues = days.map((d, idx) => [patternId, idx + 1, d.shift_id || null]);
        await conn.query(
            "INSERT INTO shift_rotation_pattern_days (pattern_id, day_number, shift_id) VALUES ?",
            [dayValues]
        );

        await conn.commit();
        return res.json({ message: "Rotation pattern saved", id: patternId });
    } catch (err) {
        if (conn) await conn.rollback();
        console.error("savePattern error:", err);
        return res.status(500).json({ message: "Failed to save rotation pattern" });
    } finally {
        conn.release();
    }
};

const assignRotation = async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { employee_id, pattern_id, start_date } = req.body || {};
        if (!employee_id || !pattern_id || !start_date) {
            return res.status(400).json({ message: "employee_id, pattern_id, and start_date are required" });
        }

        await conn.beginTransaction();

        // 1. Deactivate old assignments for this employee
        await conn.execute(
            "UPDATE employee_rotation_assignments SET is_active = 0 WHERE employee_id = ?",
            [employee_id]
        );

        // 2. Insert new assignment
        await conn.execute(
            "INSERT INTO employee_rotation_assignments (employee_id, pattern_id, start_date) VALUES (?, ?, ?)",
            [employee_id, pattern_id, start_date]
        );

        // 3. Generate shifts for next 180 days
        await generateShifts(conn, employee_id, pattern_id, start_date, 180);

        await conn.commit();

        await recordLog({
            actorId: req.session?.user?.id,
            action: `Assigned rotation pattern ${pattern_id} to employee ${employee_id}`,
            category: "Attendance",
            status: "Success"
        });

        return res.json({ message: "Rotation assigned and schedule generated" });
    } catch (err) {
        if (conn) await conn.rollback();
        console.error("assignRotation error:", err);
        return res.status(500).json({ message: "Failed to assign rotation" });
    } finally {
        conn.release();
    }
};

const getSchedule = async (req, res) => {
    try {
        const { employee_id, start_date, end_date } = req.query || {};
        if (!employee_id || !start_date || !end_date) {
            return res.status(400).json({ message: "employee_id, start_date, and end_date are required" });
        }

        const [rows] = await pool.execute(
            `SELECT s.id, s.date, s.shift_id, s.is_override, ts.name as shift_name, ts.start_time, ts.end_time, ts.color
       FROM employee_scheduled_shifts s
       LEFT JOIN attendance_shifts ts ON s.shift_id = ts.id
       WHERE s.employee_id = ? AND s.date BETWEEN ? AND ?
       ORDER BY s.date ASC`,
            [employee_id, start_date, end_date]
        );

        return res.json({ schedule: rows });
    } catch (err) {
        console.error("getSchedule error:", err);
        return res.status(500).json({ message: "Failed to load schedule" });
    }
};

const saveOverride = async (req, res) => {
    try {
        const { employee_id, date, shift_id } = req.body || {};
        if (!employee_id || !date) {
            return res.status(400).json({ message: "employee_id and date are required" });
        }

        await pool.execute(
            `INSERT INTO employee_scheduled_shifts (employee_id, date, shift_id, is_override, created_by)
       VALUES (?, ?, ?, 1, ?)
       ON DUPLICATE KEY UPDATE shift_id = VALUES(shift_id), is_override = 1, created_by = VALUES(created_by)`,
            [employee_id, date, shift_id || null, req.session?.user?.id]
        );

        return res.json({ message: "Shift override saved" });
    } catch (err) {
        console.error("saveOverride error:", err);
        return res.status(500).json({ message: "Failed to save manual override" });
    }
};

module.exports = {
    getPatterns,
    savePattern,
    assignRotation,
    getSchedule,
    saveOverride,
};
