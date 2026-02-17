const { pool } = require("../../Utils/db");
const { recordLog } = require("../../Utils/AuditUtils");

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
 * POST /api/v1/payroll/salary
 * Employee enters their salary (ONE-TIME ONLY)
 */
const setSalary = async (req, res) => {
    try {
        const user = req.session?.user;
        if (!user?.id) return res.status(401).json({ message: "Unauthenticated" });

        const { basic_salary, allowances, effective_from } = req.body;

        if (!basic_salary || basic_salary <= 0) {
            return res.status(400).json({ message: "Valid basic salary is required" });
        }

        const conn = await pool.getConnection();

        try {
            await conn.beginTransaction();

            // Check if salary already exists and is locked
            const [existing] = await conn.execute(
                "SELECT id, is_locked FROM payroll_salaries WHERE employee_id = ?",
                [user.id]
            );

            if (existing.length > 0 && existing[0].is_locked === 1) {
                await conn.rollback();
                return res.status(403).json({
                    message: "Your salary has already been submitted and is now locked. It cannot be changed."
                });
            }

            // Insert or update salary (should only happen once)
            if (existing.length > 0) {
                await conn.execute(
                    `UPDATE payroll_salaries 
           SET basic_salary = ?, allowances = ?, effective_from = ?, is_locked = 1, updated_at = NOW()
           WHERE employee_id = ?`,
                    [basic_salary, allowances || 0, effective_from || new Date().toISOString().slice(0, 10), user.id]
                );
            } else {
                await conn.execute(
                    `INSERT INTO payroll_salaries (employee_id, basic_salary, allowances, effective_from, is_locked)
           VALUES (?, ?, ?, ?, 1)`,
                    [user.id, basic_salary, allowances || 0, effective_from || new Date().toISOString().slice(0, 10)]
                );
            }

            // Initialize increment reminder
            const effectiveDate = effective_from || new Date().toISOString().slice(0, 10);
            const nextReviewDate = new Date(effectiveDate);
            nextReviewDate.setFullYear(nextReviewDate.getFullYear() + 1);

            await conn.execute(
                `INSERT INTO increment_reminders (employee_id, last_increment_date, next_review_date, reminder_sent)
         VALUES (?, ?, ?, 0)
         ON DUPLICATE KEY UPDATE last_increment_date = ?, next_review_date = ?, reminder_sent = 0`,
                [user.id, effectiveDate, nextReviewDate.toISOString().slice(0, 10), effectiveDate, nextReviewDate.toISOString().slice(0, 10)]
            );

            await conn.commit();

            await recordLog({
                actorId: user.id,
                action: "Submitted salary information (locked)",
                category: "Payroll",
                status: "Success",
                details: { basic_salary, allowances }
            });

            return res.json({
                message: "Salary submitted successfully and is now locked",
                salary: { basic_salary, allowances, effective_from: effectiveDate, is_locked: true }
            });

        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }

    } catch (error) {
        console.error("setSalary error:", error);
        return res.status(500).json({ message: "Failed to set salary" });
    }
};

/**
 * GET /api/v1/payroll/salary/me
 * Get own salary information
 */
const getMySalary = async (req, res) => {
    try {
        const user = req.session?.user;
        if (!user?.id) return res.status(401).json({ message: "Unauthenticated" });

        const [rows] = await pool.execute(
            "SELECT * FROM payroll_salaries WHERE employee_id = ?",
            [user.id]
        );

        if (rows.length === 0) {
            return res.json({ salary: null, is_locked: false });
        }

        return res.json({
            salary: {
                basic_salary: rows[0].basic_salary,
                allowances: rows[0].allowances,
                effective_from: rows[0].effective_from,
                is_locked: rows[0].is_locked === 1
            }
        });

    } catch (error) {
        console.error("getMySalary error:", error);
        return res.status(500).json({ message: "Failed to get salary" });
    }
};

/**
 * GET /api/v1/payroll/salary/:employeeId
 * Admin/HR view employee salary (read-only)
 */
const getEmployeeSalary = async (req, res) => {
    try {
        const user = req.session?.user;
        if (!user?.id) return res.status(401).json({ message: "Unauthenticated" });
        if (!isAdminLike(user)) return res.status(403).json({ message: "Forbidden" });

        const { employeeId } = req.params;

        const [rows] = await pool.execute(
            `SELECT ps.*, e.Employee_Name as employee_name, e.Employee_ID as employee_code
       FROM payroll_salaries ps
       JOIN employee_records e ON e.id = ps.employee_id
       WHERE ps.employee_id = ?`,
            [employeeId]
        );

        if (rows.length === 0) {
            return res.json({ salary: null });
        }

        return res.json({
            salary: {
                employee_name: rows[0].employee_name,
                employee_code: rows[0].employee_code,
                basic_salary: rows[0].basic_salary,
                allowances: rows[0].allowances,
                effective_from: rows[0].effective_from,
                is_locked: rows[0].is_locked === 1
            }
        });

    } catch (error) {
        console.error("getEmployeeSalary error:", error);
        return res.status(500).json({ message: "Failed to get employee salary" });
    }
};

/**
 * POST /api/v1/payroll/increment/request
 * Employee requests increment
 */
const requestIncrement = async (req, res) => {
    try {
        const user = req.session?.user;
        if (!user?.id) return res.status(401).json({ message: "Unauthenticated" });

        const { request_type, requested_amount, requested_percentage, reason } = req.body;

        if (!request_type || !['AMOUNT', 'PERCENTAGE'].includes(request_type)) {
            return res.status(400).json({ message: "Invalid request type" });
        }

        if (request_type === 'AMOUNT' && (!requested_amount || requested_amount <= 0)) {
            return res.status(400).json({ message: "Valid increment amount is required" });
        }

        if (request_type === 'PERCENTAGE' && (!requested_percentage || requested_percentage <= 0)) {
            return res.status(400).json({ message: "Valid increment percentage is required" });
        }

        // Check if employee has salary set
        const [salary] = await pool.execute(
            "SELECT id FROM payroll_salaries WHERE employee_id = ? AND is_locked = 1",
            [user.id]
        );

        if (salary.length === 0) {
            return res.status(400).json({ message: "Please set your salary first before requesting an increment" });
        }

        await pool.execute(
            `INSERT INTO increment_requests 
       (employee_id, requested_amount, requested_percentage, request_type, reason, status)
       VALUES (?, ?, ?, ?, ?, 'PENDING')`,
            [user.id, requested_amount || null, requested_percentage || null, request_type, reason || null]
        );

        await recordLog({
            actorId: user.id,
            action: `Requested salary increment (${request_type})`,
            category: "Payroll",
            status: "Success",
            details: { request_type, requested_amount, requested_percentage }
        });

        return res.json({ message: "Increment request submitted successfully" });

    } catch (error) {
        console.error("requestIncrement error:", error);
        return res.status(500).json({ message: "Failed to request increment" });
    }
};

/**
 * GET /api/v1/payroll/increment/requests
 * Admin/HR view all pending increment requests
 */
const getIncrementRequests = async (req, res) => {
    try {
        const user = req.session?.user;
        if (!user?.id) return res.status(401).json({ message: "Unauthenticated" });
        if (!isAdminLike(user)) return res.status(403).json({ message: "Forbidden" });

        const { status } = req.query;
        const statusFilter = status || 'PENDING';

        const [rows] = await pool.execute(
            `SELECT ir.*, 
              e.Employee_Name as employee_name, 
              e.Employee_ID as employee_code,
              ps.basic_salary as current_salary,
              ps.allowances
       FROM increment_requests ir
       JOIN employee_records e ON e.id = ir.employee_id
       LEFT JOIN payroll_salaries ps ON ps.employee_id = ir.employee_id
       WHERE ir.status = ?
       ORDER BY ir.requested_at DESC`,
            [statusFilter]
        );

        const requests = rows.map(row => {
            const currentTotal = Number(row.current_salary || 0) + Number(row.allowances || 0);
            let newSalary = currentTotal;

            if (row.request_type === 'AMOUNT') {
                newSalary = currentTotal + Number(row.requested_amount || 0);
            } else if (row.request_type === 'PERCENTAGE') {
                newSalary = currentTotal + (currentTotal * Number(row.requested_percentage || 0) / 100);
            }

            return {
                id: row.id,
                employee_id: row.employee_id,
                employee_name: row.employee_name,
                employee_code: row.employee_code,
                current_salary: currentTotal,
                request_type: row.request_type,
                requested_amount: row.requested_amount,
                requested_percentage: row.requested_percentage,
                new_salary: newSalary,
                reason: row.reason,
                status: row.status,
                requested_at: row.requested_at,
                reviewed_at: row.reviewed_at,
                review_notes: row.review_notes
            };
        });

        return res.json({ requests });

    } catch (error) {
        console.error("getIncrementRequests error:", error);
        return res.status(500).json({ message: "Failed to get increment requests" });
    }
};

/**
 * POST /api/v1/payroll/increment/approve/:requestId
 * Admin/HR approve increment request
 */
const approveIncrement = async (req, res) => {
    try {
        const user = req.session?.user;
        if (!user?.id) return res.status(401).json({ message: "Unauthenticated" });
        if (!isAdminLike(user)) return res.status(403).json({ message: "Forbidden" });

        const { requestId } = req.params;
        const { review_notes } = req.body;

        const conn = await pool.getConnection();

        try {
            await conn.beginTransaction();

            // Get request details
            const [requests] = await conn.execute(
                `SELECT ir.*, ps.basic_salary, ps.allowances
         FROM increment_requests ir
         JOIN payroll_salaries ps ON ps.employee_id = ir.employee_id
         WHERE ir.id = ? AND ir.status = 'PENDING'`,
                [requestId]
            );

            if (requests.length === 0) {
                await conn.rollback();
                return res.status(404).json({ message: "Request not found or already processed" });
            }

            const request = requests[0];
            const currentSalary = Number(request.basic_salary) + Number(request.allowances);
            let newSalary = currentSalary;
            let incrementAmount = 0;
            let incrementPercentage = null;

            if (request.request_type === 'AMOUNT') {
                incrementAmount = Number(request.requested_amount);
                newSalary = currentSalary + incrementAmount;
            } else if (request.request_type === 'PERCENTAGE') {
                incrementPercentage = Number(request.requested_percentage);
                incrementAmount = currentSalary * (incrementPercentage / 100);
                newSalary = currentSalary + incrementAmount;
            }

            const newBasicSalary = Number(request.basic_salary) + incrementAmount;

            // Update salary
            await conn.execute(
                `UPDATE payroll_salaries 
         SET basic_salary = ?, updated_at = NOW()
         WHERE employee_id = ?`,
                [newBasicSalary, request.employee_id]
            );

            // Record increment history
            const effectiveDate = new Date().toISOString().slice(0, 10);
            await conn.execute(
                `INSERT INTO salary_increments 
         (employee_id, previous_salary, increment_amount, increment_percentage, new_salary, 
          increment_type, applied_by_employee_id, effective_date, reason)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    request.employee_id,
                    currentSalary,
                    request.request_type === 'AMOUNT' ? incrementAmount : null,
                    request.request_type === 'PERCENTAGE' ? incrementPercentage : null,
                    newSalary,
                    request.request_type,
                    user.id,
                    effectiveDate,
                    request.reason || review_notes
                ]
            );

            // Update increment reminder
            const nextReviewDate = new Date();
            nextReviewDate.setFullYear(nextReviewDate.getFullYear() + 1);
            await conn.execute(
                `UPDATE increment_reminders 
         SET last_increment_date = ?, next_review_date = ?, reminder_sent = 0
         WHERE employee_id = ?`,
                [effectiveDate, nextReviewDate.toISOString().slice(0, 10), request.employee_id]
            );

            // Update request status
            await conn.execute(
                `UPDATE increment_requests 
         SET status = 'APPROVED', reviewed_by_employee_id = ?, reviewed_at = NOW(), review_notes = ?
         WHERE id = ?`,
                [user.id, review_notes || null, requestId]
            );

            await conn.commit();

            await recordLog({
                actorId: user.id,
                action: `Approved increment request for employee ${request.employee_id}`,
                category: "Payroll",
                status: "Success",
                details: { requestId, newSalary, incrementAmount }
            });

            return res.json({
                message: "Increment approved successfully",
                new_salary: newSalary
            });

        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }

    } catch (error) {
        console.error("approveIncrement error:", error);
        return res.status(500).json({ message: "Failed to approve increment" });
    }
};

/**
 * POST /api/v1/payroll/increment/reject/:requestId
 * Admin/HR reject increment request
 */
const rejectIncrement = async (req, res) => {
    try {
        const user = req.session?.user;
        if (!user?.id) return res.status(401).json({ message: "Unauthenticated" });
        if (!isAdminLike(user)) return res.status(403).json({ message: "Forbidden" });

        const { requestId } = req.params;
        const { review_notes } = req.body;

        const [result] = await pool.execute(
            `UPDATE increment_requests 
       SET status = 'REJECTED', reviewed_by_employee_id = ?, reviewed_at = NOW(), review_notes = ?
       WHERE id = ? AND status = 'PENDING'`,
            [user.id, review_notes || null, requestId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Request not found or already processed" });
        }

        await recordLog({
            actorId: user.id,
            action: `Rejected increment request ${requestId}`,
            category: "Payroll",
            status: "Success",
            details: { requestId, review_notes }
        });

        return res.json({ message: "Increment request rejected" });

    } catch (error) {
        console.error("rejectIncrement error:", error);
        return res.status(500).json({ message: "Failed to reject increment" });
    }
};

/**
 * POST /api/v1/payroll/increment/grant
 * Admin/HR directly grant increment to employee
 */
const grantIncrement = async (req, res) => {
    try {
        const user = req.session?.user;
        if (!user?.id) return res.status(401).json({ message: "Unauthenticated" });
        if (!isAdminLike(user)) return res.status(403).json({ message: "Forbidden" });

        const { employee_id, increment_type, increment_amount, increment_percentage, fixed_salary, allowances, reason } = req.body;

        if (!employee_id) {
            return res.status(400).json({ message: "Employee ID is required" });
        }

        if (!increment_type || !['AMOUNT', 'PERCENTAGE', 'SET_FIXED'].includes(increment_type)) {
            return res.status(400).json({ message: "Invalid update type" });
        }

        const conn = await pool.getConnection();

        try {
            await conn.beginTransaction();

            // Get current salary
            const [salary] = await conn.execute(
                "SELECT basic_salary, allowances FROM payroll_salaries WHERE employee_id = ?",
                [employee_id]
            );

            // If SET_FIXED and no existing salary, we can still proceed
            if (salary.length === 0 && increment_type !== 'SET_FIXED') {
                await conn.rollback();
                return res.status(400).json({ message: "Employee has not set their salary yet" });
            }

            const currentBasic = salary.length > 0 ? Number(salary[0].basic_salary) : 0;
            const currentAllowances = salary.length > 0 ? Number(salary[0].allowances) : 0;
            const currentTotal = currentBasic + currentAllowances;

            let newBasicSalary = currentBasic;
            let newAllowances = currentAllowances;
            let actualIncrementAmount = 0;

            if (increment_type === 'AMOUNT') {
                actualIncrementAmount = Number(increment_amount || 0);
                newBasicSalary = currentBasic + actualIncrementAmount;
            } else if (increment_type === 'PERCENTAGE') {
                actualIncrementAmount = currentTotal * (Number(increment_percentage || 0) / 100);
                newBasicSalary = currentBasic + actualIncrementAmount;
            } else if (increment_type === 'SET_FIXED') {
                newBasicSalary = Number(fixed_salary || 0);
                newAllowances = Number(allowances || 0);
                actualIncrementAmount = (newBasicSalary + newAllowances) - currentTotal;
            }

            // Update or Insert salary
            if (salary.length > 0) {
                await conn.execute(
                    `UPDATE payroll_salaries 
                     SET basic_salary = ?, allowances = ?, is_locked = 1, updated_at = NOW()
                     WHERE employee_id = ?`,
                    [newBasicSalary, newAllowances, employee_id]
                );
            } else {
                await conn.execute(
                    `INSERT INTO payroll_salaries (employee_id, basic_salary, allowances, is_locked)
                     VALUES (?, ?, ?, 1)`,
                    [employee_id, newBasicSalary, newAllowances]
                );
            }

            // Record increment history
            const effectiveDate = new Date().toISOString().slice(0, 10);
            await conn.execute(
                `INSERT INTO salary_increments 
         (employee_id, previous_salary, increment_amount, increment_percentage, new_salary, 
          increment_type, applied_by_employee_id, effective_date, reason)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    employee_id,
                    currentTotal,
                    increment_type === 'SET_FIXED' ? null : actualIncrementAmount,
                    increment_type === 'PERCENTAGE' ? increment_percentage : null,
                    newBasicSalary + newAllowances,
                    increment_type,
                    user.id,
                    effectiveDate,
                    reason || (increment_type === 'SET_FIXED' ? 'Direct salary update' : null)
                ]
            );

            // Update increment reminder
            const nextReviewDate = new Date();
            nextReviewDate.setFullYear(nextReviewDate.getFullYear() + 1);
            await conn.execute(
                `INSERT INTO increment_reminders (employee_id, last_increment_date, next_review_date, reminder_sent)
         VALUES (?, ?, ?, 0)
         ON DUPLICATE KEY UPDATE last_increment_date = ?, next_review_date = ?, reminder_sent = 0`,
                [employee_id, effectiveDate, nextReviewDate.toISOString().slice(0, 10), effectiveDate, nextReviewDate.toISOString().slice(0, 10)]
            );

            await conn.commit();

            await recordLog({
                actorId: user.id,
                action: `Updated salary for employee ${employee_id} via ${increment_type}`,
                category: "Payroll",
                status: "Success",
                details: { employee_id, increment_type, newTotal: newBasicSalary + newAllowances }
            });

            return res.json({
                message: "Salary updated successfully",
                new_salary: newBasicSalary + newAllowances
            });

        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }

    } catch (error) {
        console.error("grantIncrement error:", error);
        return res.status(500).json({ message: "Failed to grant increment" });
    }
};

/**
 * GET /api/v1/payroll/increment/history/:employeeId
 * View increment history for employee
 */
const getIncrementHistory = async (req, res) => {
    try {
        const user = req.session?.user;
        if (!user?.id) return res.status(401).json({ message: "Unauthenticated" });

        const { employeeId } = req.params;

        // Users can view their own history, admins can view anyone's
        if (Number(employeeId) !== user.id && !isAdminLike(user)) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const [rows] = await pool.execute(
            `SELECT si.*, e.Employee_Name as applied_by_name
       FROM salary_increments si
       JOIN employee_records e ON e.id = si.applied_by_employee_id
       WHERE si.employee_id = ?
       ORDER BY si.applied_at DESC`,
            [employeeId]
        );

        return res.json({ history: rows });

    } catch (error) {
        console.error("getIncrementHistory error:", error);
        return res.status(500).json({ message: "Failed to get increment history" });
    }
};

/**
 * GET /api/v1/payroll/increment/reminders
 * Admin/HR view employees due for annual increment
 */
const getIncrementReminders = async (req, res) => {
    try {
        const user = req.session?.user;
        if (!user?.id) return res.status(401).json({ message: "Unauthenticated" });
        if (!isAdminLike(user)) return res.status(403).json({ message: "Forbidden" });

        const today = new Date().toISOString().slice(0, 10);
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

        const [rows] = await pool.execute(
            `SELECT ir.*, 
              e.Employee_Name as employee_name, 
              e.Employee_ID as employee_code,
              ps.basic_salary,
              ps.allowances
       FROM increment_reminders ir
       JOIN employee_records e ON e.id = ir.employee_id
       LEFT JOIN payroll_salaries ps ON ps.employee_id = ir.employee_id
       WHERE ir.next_review_date <= ? AND ir.next_review_date >= ?
       ORDER BY ir.next_review_date ASC`,
            [thirtyDaysLater.toISOString().slice(0, 10), today]
        );

        return res.json({ reminders: rows });

    } catch (error) {
        console.error("getIncrementReminders error:", error);
        return res.status(500).json({ message: "Failed to get increment reminders" });
    }
};

/**
 * POST /api/v1/payroll/calculate/:month/:year
 * Calculate monthly payroll with deductions
 */
const calculateMonthlyPayroll = async (req, res) => {
    try {
        const user = req.session?.user;
        if (!user?.id) return res.status(401).json({ message: "Unauthenticated" });
        if (!isAdminLike(user)) return res.status(403).json({ message: "Forbidden" });

        const { month, year } = req.params;
        const monthNum = parseInt(month);
        const yearNum = parseInt(year);

        if (!monthNum || !yearNum || monthNum < 1 || monthNum > 12) {
            return res.status(400).json({ message: "Invalid month or year" });
        }

        const conn = await pool.getConnection();

        try {
            await conn.beginTransaction();

            // Get all employees with salaries
            const [employees] = await conn.execute(
                `SELECT ps.employee_id, ps.basic_salary, ps.allowances, e.Employee_Name
                 FROM payroll_salaries ps
                 JOIN employee_records e ON e.id = ps.employee_id
                 WHERE ps.is_locked = 1 AND e.is_active = 1`
            );

            // Get grace period from attendance rules
            const [rules] = await conn.execute(
                "SELECT grace_minutes FROM attendance_rules WHERE is_active = 1 ORDER BY id DESC LIMIT 1"
            );
            const graceMinutes = rules.length > 0 ? Number(rules[0].grace_minutes) : 15;

            let processedCount = 0;

            for (const emp of employees) {
                const employeeId = emp.employee_id;
                const basicSalary = Number(emp.basic_salary);
                const allowances = Number(emp.allowances);
                const grossSalary = basicSalary + allowances;

                // Calculate deductions
                const [attendance] = await conn.execute(
                    `SELECT 
                        SUM(CASE WHEN status = 'LATE' AND late_minutes > ? THEN 1 ELSE 0 END) as late_days,
                        SUM(CASE WHEN status = 'ABSENT' THEN 1 ELSE 0 END) as absent_days
                     FROM attendance_daily
                     WHERE employee_id = ? AND MONTH(attendance_date) = ? AND YEAR(attendance_date) = ?`,
                    [graceMinutes, employeeId, monthNum, yearNum]
                );

                const lateDays = Number(attendance[0]?.late_days || 0);
                const absentDays = Number(attendance[0]?.absent_days || 0);

                let lateDaysDeduction = 0;
                let unauthorizedOffsDeduction = 0;

                // Apply deduction rules
                if (lateDays >= 4) {
                    lateDaysDeduction = 1000;
                }

                if (absentDays >= 2) {
                    unauthorizedOffsDeduction = 1000;
                }

                const totalDeduction = lateDaysDeduction + unauthorizedOffsDeduction;
                const netSalary = grossSalary - totalDeduction;

                // Insert/Update deductions record
                await conn.execute(
                    `INSERT INTO payroll_deductions 
                     (employee_id, month, year, late_days_count, late_days_deduction, 
                      unauthorized_offs_count, unauthorized_offs_deduction, total_deduction)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE 
                        late_days_count = ?, late_days_deduction = ?,
                        unauthorized_offs_count = ?, unauthorized_offs_deduction = ?,
                        total_deduction = ?`,
                    [
                        employeeId, monthNum, yearNum, lateDays, lateDaysDeduction,
                        absentDays, unauthorizedOffsDeduction, totalDeduction,
                        lateDays, lateDaysDeduction, absentDays, unauthorizedOffsDeduction, totalDeduction
                    ]
                );

                // Insert/Update monthly payroll record
                await conn.execute(
                    `INSERT INTO payroll_monthly 
                     (employee_id, month, year, basic_salary, allowances, gross_salary, 
                      total_deductions, net_salary, status)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'GENERATED')
                     ON DUPLICATE KEY UPDATE 
                        basic_salary = ?, allowances = ?, gross_salary = ?,
                        total_deductions = ?, net_salary = ?, generated_at = NOW()`,
                    [
                        employeeId, monthNum, yearNum, basicSalary, allowances, grossSalary,
                        totalDeduction, netSalary,
                        basicSalary, allowances, grossSalary, totalDeduction, netSalary
                    ]
                );

                processedCount++;
            }

            await conn.commit();

            await recordLog({
                actorId: user.id,
                action: `Generated payroll for ${monthNum}/${yearNum}`,
                category: "Payroll",
                status: "Success",
                details: { month: monthNum, year: yearNum, employeesProcessed: processedCount }
            });

            return res.json({
                message: `Payroll calculated successfully for ${processedCount} employees`,
                month: monthNum,
                year: yearNum,
                employees_processed: processedCount
            });

        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }

    } catch (error) {
        console.error("calculateMonthlyPayroll error:", error);
        return res.status(500).json({ message: "Failed to calculate payroll" });
    }
};

/**
 * GET /api/v1/payroll/history
 * Get payroll history for current user or all employees (admin)
 */
const getPayrollHistory = async (req, res) => {
    try {
        const user = req.session?.user;
        if (!user?.id) return res.status(401).json({ message: "Unauthenticated" });

        const { employee_id, month, year } = req.query;

        let query = `
            SELECT pm.*, e.Employee_Name as employee_name, e.Employee_ID as employee_code
            FROM payroll_monthly pm
            JOIN employee_records e ON e.id = pm.employee_id
            WHERE 1=1
        `;
        const params = [];

        // Non-admin users can only see their own payroll
        if (employee_id && isAdminLike(user)) {
            query += " AND pm.employee_id = ?";
            params.push(employee_id);
        } else if (!isAdminLike(user)) {
            query += " AND pm.employee_id = ?";
            params.push(user.id);
        }

        if (month) {
            query += " AND pm.month = ?";
            params.push(parseInt(month));
        }

        if (year) {
            query += " AND pm.year = ?";
            params.push(parseInt(year));
        }

        query += " ORDER BY pm.year DESC, pm.month DESC";

        const [rows] = await pool.execute(query, params);

        return res.json({ payroll: rows });

    } catch (error) {
        console.error("getPayrollHistory error:", error);
        return res.status(500).json({ message: "Failed to get payroll history" });
    }
};

/**
 * GET /api/v1/payroll/deductions/:month/:year
 * Get deductions breakdown for a specific month
 */
const getDeductions = async (req, res) => {
    try {
        const user = req.session?.user;
        if (!user?.id) return res.status(401).json({ message: "Unauthenticated" });

        const { month, year } = req.params;
        const { employee_id } = req.query;

        const monthNum = parseInt(month);
        const yearNum = parseInt(year);

        if (!monthNum || !yearNum) {
            return res.status(400).json({ message: "Invalid month or year" });
        }

        let query = `
            SELECT pd.*, e.Employee_Name as employee_name, e.Employee_ID as employee_code
            FROM payroll_deductions pd
            JOIN employee_records e ON e.id = pd.employee_id
            WHERE pd.month = ? AND pd.year = ?
        `;
        const params = [monthNum, yearNum];

        // Non-admin users can only see their own deductions
        if (employee_id && isAdminLike(user)) {
            query += " AND pd.employee_id = ?";
            params.push(employee_id);
        } else if (!isAdminLike(user)) {
            query += " AND pd.employee_id = ?";
            params.push(user.id);
        }

        const [rows] = await pool.execute(query, params);

        return res.json({ deductions: rows });

    } catch (error) {
        console.error("getDeductions error:", error);
        return res.status(500).json({ message: "Failed to get deductions" });
    }
};

/**
 * GET /api/v1/payroll/salaries/all
 * List all employees with their current salaries
 */
const listAllSalaries = async (req, res) => {
    try {
        const user = req.session?.user;
        if (!user?.id) return res.status(401).json({ message: "Unauthenticated" });
        if (!isAdminLike(user)) return res.status(403).json({ message: "Forbidden" });

        const [rows] = await pool.execute(`
            SELECT 
                e.id, e.Employee_Name, e.Employee_ID, e.Department, e.Designations,
                s.basic_salary, s.allowances, s.updated_at
            FROM employee_records e
            LEFT JOIN payroll_salaries s ON s.employee_id = e.id
            WHERE e.is_active = 1
            ORDER BY e.Employee_Name ASC
        `);

        return res.json({ salaries: rows });
    } catch (error) {
        console.error("listAllSalaries error:", error);
        return res.status(500).json({ message: "Failed to list salaries" });
    }
};

/**
 * POST /api/v1/payroll/salaries/bulk-update
 * Update salaries for multiple employees at once
 */
const bulkUpdateSalaries = async (req, res) => {
    try {
        const user = req.session?.user;
        if (!user?.id) return res.status(401).json({ message: "Unauthenticated" });
        if (!isAdminLike(user)) return res.status(403).json({ message: "Forbidden" });

        const { update_type, amount, percentage, employee_ids, reason } = req.body;

        if (!update_type || !['AMOUNT', 'PERCENTAGE'].includes(update_type)) {
            return res.status(400).json({ message: "Invalid update type" });
        }

        if (!employee_ids || !Array.isArray(employee_ids) || employee_ids.length === 0) {
            return res.status(400).json({ message: "No employees selected" });
        }

        const conn = await pool.getConnection();

        try {
            await conn.beginTransaction();

            const effectiveDate = new Date().toISOString().slice(0, 10);
            const nextReviewDate = new Date();
            nextReviewDate.setFullYear(nextReviewDate.getFullYear() + 1);
            const nextReviewStr = nextReviewDate.toISOString().slice(0, 10);

            for (const empId of employee_ids) {
                // Get current salary
                const [salary] = await conn.execute(
                    "SELECT basic_salary, allowances FROM payroll_salaries WHERE employee_id = ?",
                    [empId]
                );

                const currentBasic = salary.length > 0 ? Number(salary[0].basic_salary) : 0;
                const currentAllowances = salary.length > 0 ? Number(salary[0].allowances) : 0;
                const currentTotal = currentBasic + currentAllowances;

                let actualIncrementAmount = 0;
                if (update_type === 'AMOUNT') {
                    actualIncrementAmount = Number(amount || 0);
                } else if (update_type === 'PERCENTAGE') {
                    actualIncrementAmount = currentTotal * (Number(percentage || 0) / 100);
                }

                const newBasicSalary = currentBasic + actualIncrementAmount;

                // Update or Insert salary
                if (salary.length > 0) {
                    await conn.execute(
                        `UPDATE payroll_salaries SET basic_salary = ?, is_locked = 1, updated_at = NOW() WHERE employee_id = ?`,
                        [newBasicSalary, empId]
                    );
                } else {
                    await conn.execute(
                        `INSERT INTO payroll_salaries (employee_id, basic_salary, allowances, is_locked) VALUES (?, ?, ?, 1)`,
                        [empId, newBasicSalary, currentAllowances]
                    );
                }

                // Record history
                await conn.execute(
                    `INSERT INTO salary_increments 
                     (employee_id, previous_salary, increment_amount, increment_percentage, new_salary, 
                      increment_type, applied_by_employee_id, effective_date, reason)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        empId, currentTotal, actualIncrementAmount,
                        update_type === 'PERCENTAGE' ? percentage : null,
                        newBasicSalary + currentAllowances, update_type, user.id, effectiveDate,
                        reason || `Bulk ${update_type} update`
                    ]
                );

                // Update reminder
                await conn.execute(
                    `INSERT INTO increment_reminders (employee_id, last_increment_date, next_review_date, reminder_sent)
                     VALUES (?, ?, ?, 0)
                     ON DUPLICATE KEY UPDATE last_increment_date = ?, next_review_date = ?, reminder_sent = 0`,
                    [empId, effectiveDate, nextReviewStr, effectiveDate, nextReviewStr]
                );
            }

            await conn.commit();

            await recordLog({
                actorId: user.id,
                action: `Bulk updated salaries for ${employee_ids.length} employees`,
                category: "Payroll",
                status: "Success",
                details: { update_type, count: employee_ids.length }
            });

            return res.json({ message: `Successfully updated salaries for ${employee_ids.length} employees` });

        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }

    } catch (error) {
        console.error("bulkUpdateSalaries error:", error);
        return res.status(500).json({ message: "Failed to bulk update salaries" });
    }
};

module.exports = {
    setSalary,
    getMySalary,
    getEmployeeSalary,
    requestIncrement,
    getIncrementRequests,
    approveIncrement,
    rejectIncrement,
    grantIncrement,
    getIncrementHistory,
    getIncrementReminders,
    calculateMonthlyPayroll,
    getPayrollHistory,
    getDeductions,
    listAllSalaries,
    bulkUpdateSalaries
};
