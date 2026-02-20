const { pool } = require("../../Utils/db");
const { recordLog } = require("../../Utils/AuditUtils");
const xlsx = require("xlsx");

/**
 * Helper: Check if user is admin/HR
 */
function isAdminLike(user) {
    const level = Number(user?.flags?.level || 0);
    const roles = (Array.isArray(user?.roles) ? user.roles : []).map(r => String(r).toLowerCase());
    return (
        level > 6 ||
        roles.includes("super_admin") ||
        roles.includes("admin") ||
        roles.includes("hr") ||
        roles.includes("developer")
    );
}

/**
 * 1. SALARY SETUP & LOCKING
 * POST /api/v1/payroll/lock-salary
 */
const lockSalary = async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const user = req.session?.user;
        if (!isAdminLike(user)) return res.status(403).json({ message: "Forbidden" });

        const {
            employee_id,
            contractual_pay = 0,
            transport_allowance = 0,
            attendance_bonus = 0,
            mobile_allowance = 0,
            tardiness_allowance = 0,
            night_allowance = 0,
            house_allowance = 0,
            fuel_allowance = 0,
            adhoc_allowance = 0,
            misc_allowance = 0,
            relocation_allowance = 0,
            food_deduction = 0,
            health_deduction = 0
        } = req.body;

        if (!employee_id) return res.status(400).json({ message: "Missing employee ID" });

        // Calculate total gross (allowances only, not deductions)
        const monthly_salary =
            Number(contractual_pay) +
            Number(transport_allowance) +
            Number(attendance_bonus) +
            Number(mobile_allowance) +
            Number(tardiness_allowance) +
            Number(night_allowance) +
            Number(house_allowance) +
            Number(fuel_allowance) +
            Number(adhoc_allowance) +
            Number(misc_allowance) +
            Number(relocation_allowance);

        await conn.beginTransaction();

        // 1. Update/Insert into payroll_base_settings
        await conn.execute(`
            INSERT INTO payroll_base_settings (
                employee_id, contractual_pay, transport_allowance, attendance_bonus,
                mobile_allowance, tardiness_allowance, night_allowance, house_allowance,
                fuel_allowance, adhoc_allowance, misc_allowance, relocation_allowance,
                food_deduction, health_deduction,
                is_locked, locked_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())
            ON DUPLICATE KEY UPDATE
                contractual_pay = VALUES(contractual_pay),
                transport_allowance = VALUES(transport_allowance),
                attendance_bonus = VALUES(attendance_bonus),
                mobile_allowance = VALUES(mobile_allowance),
                tardiness_allowance = VALUES(tardiness_allowance),
                night_allowance = VALUES(night_allowance),
                house_allowance = VALUES(house_allowance),
                fuel_allowance = VALUES(fuel_allowance),
                adhoc_allowance = VALUES(adhoc_allowance),
                misc_allowance = VALUES(misc_allowance),
                relocation_allowance = VALUES(relocation_allowance),
                food_deduction = VALUES(food_deduction),
                health_deduction = VALUES(health_deduction),
                is_locked = 1,
                locked_at = NOW()
        `, [
            employee_id, contractual_pay, transport_allowance, attendance_bonus,
            mobile_allowance, tardiness_allowance, night_allowance, house_allowance,
            fuel_allowance, adhoc_allowance, misc_allowance, relocation_allowance,
            food_deduction, health_deduction
        ]);

        // 2. Update employee_records
        await conn.execute(
            "UPDATE employee_records SET monthly_salary = ?, salary_locked = 1, salary_locked_at = NOW() WHERE id = ?",
            [monthly_salary, employee_id]
        );

        await conn.commit();

        await recordLog({
            actorId: user.id,
            action: `Locked detailed salary for employee ID ${employee_id}. Total Gross: Rs. ${monthly_salary}`,
            category: "Payroll",
            status: "Success"
        });

        return res.json({ message: "Salary locked successfully.", monthly_salary });
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("lockSalary error:", error);
        return res.status(500).json({ message: error.message || "Server error" });
    } finally {
        if (conn) conn.release();
    }
};

/**
 * GET Detailed Salary base settings
 * GET /api/v1/payroll/base-settings/:employeeId
 */
const getSalaryDetails = async (req, res) => {
    try {
        const user = req.session?.user;
        const { employeeId } = req.params;

        // Permission check: admin or self
        if (!isAdminLike(user) && Number(user?.id) !== Number(employeeId)) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const [rows] = await pool.execute(
            "SELECT * FROM payroll_base_settings WHERE employee_id = ? LIMIT 1",
            [employeeId]
        );

        return res.json(rows[0] || null);
    } catch (error) {
        console.error("getSalaryDetails error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

/**
 * 2. PAYROLL GENERATION (ADMIN)
 * POST /api/v1/payroll/generate
 */
const generatePayroll = async (req, res) => {
    try {
        const user = req.session?.user;
        if (!isAdminLike(user)) return res.status(403).json({ message: "Forbidden" });

        const { month, year } = req.body;
        if (!month || !year) return res.status(400).json({ message: "Month and Year required" });

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // Fetch active employees with locked salary
            const [employees] = await conn.execute(
                "SELECT id, monthly_salary FROM employee_records WHERE is_active = 1 AND salary_locked = 1"
            );

            for (const emp of employees) {
                // Fetch attendance stats for the month
                const [attendance] = await conn.execute(`
                    SELECT 
                        COUNT(CASE WHEN status IN ('ABSENT', 'UNPAID_LEAVE', 'NOT_MARKED') THEN 1 END) as leave_days,
                        COUNT(CASE WHEN status = 'LATE' THEN 1 END) as late_days
                    FROM attendance_daily 
                    WHERE employee_id = ? AND MONTH(attendance_date) = ? AND YEAR(attendance_date) = ?
                `, [emp.id, month, year]);

                const leaves = Number(attendance[0].leave_days || 0);
                const lates = Number(attendance[0].late_days || 0);

                const salary = Number(emp.monthly_salary || 0);
                const dailyRate = salary > 0 ? (salary / 30) : 0;

                // Rules: 2 Paid Leaves allowed per month
                const deductibleLeaves = Math.max(0, leaves - 2);
                const leaveDeduction = deductibleLeaves * dailyRate;

                // New Late Rule: No deduction for first 4 lates. Every late after 4th cuts 1 day.
                const deductibleLates = Math.max(0, lates - 4);
                const lateDeduction = deductibleLates * dailyRate;

                const totalDeductions = Math.round(leaveDeduction + lateDeduction);
                const netSalary = Math.max(0, salary - totalDeductions);

                console.log(`[PayrollGen] ID:${emp.id} Sal:${salary} Lvs:${leaves} Lts:${lates} Ded:${totalDeductions} Net:${netSalary}`);

                const refNum = `PS-${emp.id}-${month}${year}-${Date.now().toString().slice(-4)}`;

                await conn.execute(`
                    INSERT INTO payroll_records (
                        employee_id, month, year, reference_number,
                        attendance_late_days, attendance_leave_days,
                        gross_salary, late_deduction, leave_deduction, total_deductions, net_salary,
                        status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT')
                    ON DUPLICATE KEY UPDATE
                        attendance_late_days = VALUES(attendance_late_days),
                        attendance_leave_days = VALUES(attendance_leave_days),
                        gross_salary = VALUES(gross_salary),
                        late_deduction = VALUES(late_deduction),
                        leave_deduction = VALUES(leave_deduction),
                        total_deductions = VALUES(total_deductions),
                        net_salary = VALUES(net_salary),
                        updated_at = NOW()
                `, [
                    emp.id, month, year, refNum,
                    lates, leaves,
                    salary, lateDeduction, leaveDeduction, totalDeductions, netSalary
                ]);
            }

            await conn.commit();
            return res.json({ message: `Draft payroll generated for ${employees.length} employees.` });
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("generatePayroll error:", error);
        return res.status(500).json({ message: "Failed to generate payroll" });
    }
};

/**
 * 3. FINALIZE PAYROLL
 * POST /api/v1/payroll/finalize
 */
const finalizePayroll = async (req, res) => {
    try {
        const user = req.session?.user;
        if (!isAdminLike(user)) return res.status(403).json({ message: "Forbidden" });

        const { month, year } = req.body;
        await pool.execute(
            "UPDATE payroll_records SET status = 'FINAL', transfer_date = CURDATE() WHERE month = ? AND year = ? AND status = 'DRAFT'",
            [month, year]
        );

        return res.json({ message: `Payroll for ${month}/${year} has been finalized.` });
    } catch (error) {
        console.error("finalizePayroll error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

/**
 * 4. INCREMENT SYSTEM
 * POST /api/v1/payroll/increment
 */
const applyIncrement = async (req, res) => {
    try {
        const user = req.session?.user;
        if (!isAdminLike(user)) return res.status(403).json({ message: "Forbidden" });

        const { employee_id, increment_type, value, notes, effective_date } = req.body;

        const [emp] = await pool.execute("SELECT monthly_salary FROM employee_records WHERE id = ?", [employee_id]);
        if (!emp.length) return res.status(404).json({ message: "Employee not found" });

        const oldSalary = Number(emp[0].monthly_salary);
        let newSalary = oldSalary;

        if (increment_type === 'FIXED') {
            newSalary = oldSalary + Number(value);
        } else {
            newSalary = oldSalary + (oldSalary * Number(value) / 100);
        }

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // Update main table
            await conn.execute("UPDATE employee_records SET monthly_salary = ? WHERE id = ?", [newSalary, employee_id]);

            // record history
            await conn.execute(`
                INSERT INTO increment_history (employee_id, old_salary, new_salary, increment_type, increment_value, effective_date, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [employee_id, oldSalary, newSalary, increment_type, value, effective_date || new Date(), notes]);

            await conn.commit();
            return res.json({ message: "Increment applied successfully.", new_salary: newSalary });
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("applyIncrement error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

/**
 * 5. SELF-SERVICE
 */
const getMyPayrollList = async (req, res) => {
    try {
        const user = req.session?.user;
        const [rows] = await pool.execute(
            "SELECT id, month, year, net_salary, status, created_at FROM payroll_records WHERE employee_id = ? AND status = 'FINAL' ORDER BY year DESC, month DESC",
            [user.id]
        );
        return res.json(rows);
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};

const getPayrollDetail = async (req, res) => {
    try {
        const user = req.session?.user;
        const { id } = req.params;
        const [rows] = await pool.execute(`
            SELECT 
                pr.*, 
                e.Employee_Name as name, e.Official_Email as email, e.Designations as designation, e.Department as department,
                pb.contractual_pay, pb.transport_allowance, pb.attendance_bonus, pb.mobile_allowance,
                pb.tardiness_allowance, pb.night_allowance, pb.house_allowance, pb.fuel_allowance,
                pb.adhoc_allowance, pb.misc_allowance, pb.relocation_allowance,
                pb.food_deduction, pb.health_deduction
            FROM payroll_records pr
            JOIN employee_records e ON e.id = pr.employee_id
            LEFT JOIN payroll_base_settings pb ON e.id = pb.employee_id
            WHERE pr.id = ?
        `, [id]);

        if (!rows.length) return res.status(404).json({ message: "Record not found" });

        // Security check
        if (rows[0].employee_id !== user.id && !isAdminLike(user)) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        return res.json(rows[0]);
    } catch (error) {
        console.error("getPayrollDetail error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const listAllPayroll = async (req, res) => {
    try {
        const user = req.session?.user;
        if (!isAdminLike(user)) return res.status(403).json({ message: "Forbidden" });

        const { month, year } = req.query;
        const [rows] = await pool.execute(`
            SELECT pr.*, e.Employee_Name as name, e.Employee_ID as code
            FROM payroll_records pr
            JOIN employee_records e ON e.id = pr.employee_id
            WHERE pr.month = ? AND pr.year = ?
        `, [month, year]);

        return res.json(rows);
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};

const getIncrementHistory = async (req, res) => {
    try {
        const user = req.session?.user;
        const { employeeId } = req.params;

        if (!isAdminLike(user) && Number(user?.id) !== Number(employeeId)) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const [rows] = await pool.execute(
            "SELECT * FROM increment_history WHERE employee_id = ? ORDER BY created_at DESC",
            [employeeId]
        );

        return res.json(rows);
    } catch (error) {
        console.error("getIncrementHistory error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const updatePayrollRecord = async (req, res) => {
    try {
        const user = req.session?.user;
        if (!isAdminLike(user)) return res.status(403).json({ message: "Forbidden" });

        const { id } = req.params;
        const { net_salary, total_deductions, attendance_late_days, attendance_leave_days } = req.body;

        // Ensure record exists and is in DRAFT status
        const [existing] = await pool.execute(
            "SELECT status FROM payroll_records WHERE id = ?",
            [id]
        );

        if (!existing[0]) return res.status(404).json({ message: "Record not found" });
        if (existing[0].status !== 'DRAFT') return res.status(400).json({ message: "Only drafts can be updated manually" });

        await pool.execute(`
            UPDATE payroll_records 
            SET net_salary = ?, total_deductions = ?, 
                attendance_late_days = ?, attendance_leave_days = ?,
                updated_at = NOW()
            WHERE id = ?
        `, [net_salary, total_deductions, attendance_late_days, attendance_leave_days, id]);

        return res.json({ message: "Payroll draft updated successfully" });
    } catch (error) {
        console.error("updatePayrollRecord error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const listAllSalaryDetails = async (req, res) => {
    try {
        const user = req.session?.user;
        if (!isAdminLike(user)) return res.status(403).json({ message: "Forbidden" });

        const [rows] = await pool.execute(`
            SELECT 
                e.id, e.Employee_Name as name, e.Employee_ID as code, e.Designations as designation, 
                e.Department as department, e.monthly_salary as total_gross, e.salary_locked,
                pb.contractual_pay, pb.transport_allowance, pb.attendance_bonus, pb.mobile_allowance,
                pb.tardiness_allowance, pb.night_allowance, pb.house_allowance, pb.fuel_allowance,
                pb.adhoc_allowance, pb.misc_allowance, pb.relocation_allowance,
                pb.food_deduction, pb.health_deduction
            FROM employee_records e
            LEFT JOIN payroll_base_settings pb ON e.id = pb.employee_id
            WHERE e.is_active = 1
            ORDER BY e.Employee_Name ASC
        `);

        return res.json(rows);
    } catch (error) {
        console.error("listAllSalaryDetails error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const exportSalaryReport = async (req, res) => {
    try {
        const user = req.session?.user;
        if (!isAdminLike(user)) return res.status(403).json({ message: "Forbidden" });

        const [rows] = await pool.execute(`
            SELECT 
                e.Employee_ID as "Employee Code", e.Employee_Name as "Name", e.Designations as "Designation", 
                e.Department as "Department",
                pb.contractual_pay as "Contractual Pay", pb.transport_allowance as "Transport", 
                pb.attendance_bonus as "Att. Bonus", pb.mobile_allowance as "Mobile",
                pb.tardiness_allowance as "Tardiness", pb.night_allowance as "Night", 
                pb.house_allowance as "House", pb.fuel_allowance as "Fuel",
                pb.adhoc_allowance as "Ad-Hoc", pb.misc_allowance as "Misc", 
                pb.relocation_allowance as "Relocation",
                pb.food_deduction as "Food Deduction", pb.health_deduction as "Health Deduction",
                e.monthly_salary as "Total Gross Salary"
            FROM employee_records e
            LEFT JOIN payroll_base_settings pb ON e.id = pb.employee_id
            WHERE e.is_active = 1
            ORDER BY e.Employee_Name ASC
        `);

        const workbook = xlsx.utils.book_new();
        const worksheet = xlsx.utils.json_to_sheet(rows);
        xlsx.utils.book_append_sheet(workbook, worksheet, "Salary Breakdown");

        const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", "attachment; filename=Salary_Breakdown_Report.xlsx");
        return res.send(buffer);
    } catch (error) {
        console.error("exportSalaryReport error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const deletePayrollRecord = async (req, res) => {
    try {
        const user = req.session?.user;
        if (!isAdminLike(user)) return res.status(403).json({ message: "Forbidden" });

        const { id } = req.params;

        // Ensure record exists and is in DRAFT status
        const [existing] = await pool.execute(
            "SELECT status FROM payroll_records WHERE id = ?",
            [id]
        );

        if (!existing[0]) return res.status(404).json({ message: "Record not found" });
        if (existing[0].status !== 'DRAFT') return res.status(400).json({ message: "Only drafts can be deleted" });

        await pool.execute("DELETE FROM payroll_records WHERE id = ?", [id]);

        return res.json({ message: "Payroll record deleted successfully" });
    } catch (error) {
        console.error("deletePayrollRecord error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

/**
 * 4b. BULK INCREMENT
 * POST /api/v1/payroll/bulk-increment
 */
const applyBulkIncrement = async (req, res) => {
    let conn;
    try {
        const user = req.session?.user;
        if (!isAdminLike(user)) return res.status(403).json({ message: "Forbidden" });

        const { employee_ids, increment_type, value, notes, effective_date } = req.body;
        if (!Array.isArray(employee_ids) || employee_ids.length === 0) {
            return res.status(400).json({ message: "No employees selected" });
        }

        conn = await pool.getConnection();
        await conn.beginTransaction();

        for (const empId of employee_ids) {
            const [emp] = await conn.execute("SELECT monthly_salary FROM employee_records WHERE id = ?", [empId]);
            if (!emp.length) continue;

            const oldSalary = Number(emp[0].monthly_salary);
            let newSalary = oldSalary;

            if (increment_type === 'FIXED') {
                newSalary = oldSalary + Number(value);
            } else {
                newSalary = oldSalary + (oldSalary * Number(value) / 100);
            }

            await conn.execute("UPDATE employee_records SET monthly_salary = ? WHERE id = ?", [newSalary, empId]);

            await conn.execute(`
                INSERT INTO increment_history (employee_id, old_salary, new_salary, increment_type, increment_value, effective_date, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [empId, oldSalary, newSalary, increment_type, value, effective_date || new Date(), notes]);
        }

        await conn.commit();
        return res.json({ message: `Bulk increment applied to ${employee_ids.length} employees.` });
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("applyBulkIncrement error:", error);
        return res.status(500).json({ message: "Server error" });
    } finally {
        if (conn) conn.release();
    }
};

module.exports = {
    lockSalary,
    getSalaryDetails,
    getIncrementHistory,
    generatePayroll,
    finalizePayroll,
    applyIncrement,
    applyBulkIncrement,
    getMyPayrollList,
    getPayrollDetail,
    listAllPayroll,
    listAllSalaryDetails,
    exportSalaryReport,
    updatePayrollRecord,
    deletePayrollRecord
};
