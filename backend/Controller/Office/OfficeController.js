const { pool } = require("../../Utils/db");
const { recordLog } = require("../../Utils/AuditUtils");

/**
 * POST /api/v1/office/requisitions
 * Submit a new requisition
 */
async function createRequisition(req, res) {
    const conn = await pool.getConnection();
    try {
        const user = req.session.user;
        const {
            employee_name_manual,
            employee_code_manual,
            designation,
            department,
            office_location,
            line_manager_name,
            assigned_accounts_id,
            items
        } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "At least one item is required" });
        }

        await conn.beginTransaction();

        const [reqResult] = await conn.execute(
            `INSERT INTO office_requisitions 
            (employee_id, employee_name_manual, employee_code_manual, designation, department, office_location, line_manager_name, assigned_accounts_id, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending_hr')`,
            [user.id, employee_name_manual, employee_code_manual, designation, department, office_location, line_manager_name, assigned_accounts_id || null]
        );

        const requisitionId = reqResult.insertId;

        for (const item of items) {
            await conn.execute(
                `INSERT INTO office_requisition_items (requisition_id, sr_no, type_of_particular, description, qty, unit_price) 
                VALUES (?, ?, ?, ?, ?, ?)`,
                [requisitionId, item.sr_no, item.type_of_particular, item.description, item.qty, item.unit_price || 0.00]
            );
        }

        await conn.commit();
        await recordLog({
            actorId: user.id,
            action: `Submitted new office requisition ID: ${requisitionId}`,
            category: "Office Requisition",
            status: "Success"
        });

        res.status(201).json({ message: "Requisition submitted successfully", id: requisitionId });
    } catch (err) {
        if (conn) await conn.rollback();
        console.error("createRequisition error:", err);
        res.status(500).json({ message: "Server error" });
    } finally {
        if (conn) conn.release();
    }
}

/**
 * GET /api/v1/office/requisitions
 * List requisitions based on role/permissions
 */
async function listRequisitions(req, res) {
    try {
        const user = req.session.user;
        const { status } = req.query;
        const features = new Set(user.features || []);

        let query = `
            SELECT r.*, e.Employee_Name as requester_name 
            FROM office_requisitions r
            JOIN employee_records e ON r.employee_id = e.id
        `;
        let params = [];
        let conditions = [];

        // Visibility Logic
        const role = String(user.role || '').toLowerCase();
        const dept = (user.Department || user.department || '').trim();
        const isSeniorOrManager = (user.flags?.level >= 6) || ['manager', 'admin', 'super_admin', 'developer'].includes(role);
        
        const accountsDepts = [
            'finance and accounts department -hoe',
            'accounts & finance',
            'accounts',
            'finance'
        ];
        const isAccounts = accountsDepts.includes(dept.toLowerCase());
        const isHR = dept.toLowerCase().includes('human resource');

        if (features.has('office_req_view_all')) {
            // Admin can see all
        } else {
            // 1. Requisitions I created myself
            let visibility = ["r.employee_id = ?"];
            params.push(user.id);

            // 2. Requisitions assigned to me (Always visible to the assigned person)
            visibility.push("r.assigned_accounts_id = ?");
            params.push(user.id);

            // 3. HR Approval visibility
            if (features.has('office_req_approve_hr') || isHR) {
                visibility.push("r.status = 'pending_hr'", "r.hr_approved_by = ?");
                params.push(user.id);
            } 
            
            // 4. Accounts Approval visibility (STRICT)
            if (features.has('office_req_approve_accounts') || (isAccounts && isSeniorOrManager)) {
                // If I have accounts clearance, show me:
                // - General pending accounts (where nobody is assigned)
                // - OR Requisitions I already approved
                visibility.push("(r.status = 'pending_accounts' AND r.assigned_accounts_id IS NULL)", "r.accounts_approved_by = ?");
                params.push(user.id);
            }

            conditions.push("(" + visibility.join(" OR ") + ")");
        }

        if (status) {
            conditions.push("r.status = ?");
            params.push(status);
        }

        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
        }

        query += " ORDER BY r.created_at DESC";

        const [rows] = await pool.execute(query, params);
        res.json(rows);
    } catch (err) {
        console.error("listRequisitions error:", err);
        res.status(500).json({ message: "Server error" });
    }
}

/**
 * GET /api/v1/office/requisitions/:id
 */
async function getRequisitionById(req, res) {
    try {
        const { id } = req.params;
        const [reqRows] = await pool.execute(
            `SELECT r.*, e.Employee_Name as requester_name, e.Employee_ID as requester_code,
                    hr.Employee_Name as hr_approver_name,
                    acc.Employee_Name as accounts_approver_name,
                    assigned.Employee_Name as assigned_accounts_name
             FROM office_requisitions r
             JOIN employee_records e ON r.employee_id = e.id
             LEFT JOIN employee_records hr ON r.hr_approved_by = hr.id
             LEFT JOIN employee_records acc ON r.accounts_approved_by = acc.id
             LEFT JOIN employee_records assigned ON r.assigned_accounts_id = assigned.id
             WHERE r.id = ?`,
            [id]
        );

        if (reqRows.length === 0) {
            return res.status(404).json({ message: "Requisition not found" });
        }

        const [itemRows] = await pool.execute(
            "SELECT * FROM office_requisition_items WHERE requisition_id = ? ORDER BY sr_no ASC",
            [id]
        );

        res.json({ ...reqRows[0], items: itemRows });
    } catch (err) {
        console.error("getRequisitionById error:", err);
        res.status(500).json({ message: "Server error" });
    }
}

/**
 * PATCH /api/v1/office/requisitions/:id/approve-hr
 */
async function approveHR(req, res) {
    try {
        const { id } = req.params;
        const { status, remarks } = req.body; // status: 'pending_accounts' or 'rejected'
        const user = req.session.user;

        if (!['pending_accounts', 'rejected'].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        await pool.execute(
            `UPDATE office_requisitions 
             SET status = ?, hr_remarks = ?, hr_approved_by = ?, hr_approved_at = CURRENT_TIMESTAMP 
             WHERE id = ? AND status = 'pending_hr'`,
            [status, remarks, user.id, id]
        );

        await recordLog({
            actorId: user.id,
            action: `HR ${status === 'rejected' ? 'Rejected' : 'Approved'} requisition ID: ${id}`,
            category: "Office Requisition",
            status: "Success"
        });

        res.json({ message: `Requisition ${status === 'rejected' ? 'rejected' : 'approved'} by HR` });
    } catch (err) {
        console.error("approveHR error:", err);
        res.status(500).json({ message: "Server error" });
    }
}

/**
 * PATCH /api/v1/office/requisitions/:id/approve-accounts
 */
async function approveAccounts(req, res) {
    try {
        const { id } = req.params;
        const { status, remarks, items } = req.body; // status: 'approved' or 'rejected', items: [{id, qty_issued}]
        const user = req.session.user;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            await conn.execute(
                `UPDATE office_requisitions 
                 SET status = ?, accounts_remarks = ?, accounts_approved_by = ?, accounts_approved_at = CURRENT_TIMESTAMP 
                 WHERE id = ? AND status = 'pending_accounts' 
                 AND (assigned_accounts_id IS NULL OR assigned_accounts_id = ?)`,
                [status, remarks, user.id, id, user.id]
            );

            if (status === 'approved' && items && Array.isArray(items)) {
                for (const item of items) {
                    await conn.execute(
                        "UPDATE office_requisition_items SET qty_issued = ? WHERE id = ? AND requisition_id = ?",
                        [item.qty_issued, item.id, id]
                    );
                }
            }

            await conn.commit();
            await recordLog({
                actorId: user.id,
                action: `Accounts ${status === 'rejected' ? 'Rejected' : 'Approved'} requisition ID: ${id}`,
                category: "Office Requisition",
                status: "Success"
            });

            res.json({ message: `Requisition ${status === 'rejected' ? 'rejected' : 'approved'} by Accounts` });
        } catch (innerErr) {
            await conn.rollback();
            throw innerErr;
        } finally {
            conn.release();
        }
    } catch (err) {
        console.error("approveAccounts error:", err);
        res.status(500).json({ message: "Server error" });
    }
}

/**
 * GET /api/v1/office/accounts-employees
 * List all employees from Accounts/Finance for assignment dropdown
 */
async function listAccountsEmployees(req, res) {
    try {
        const [rows] = await pool.execute(
            `SELECT id, Employee_Name, Employee_ID 
             FROM employee_records 
             WHERE is_active = 1 
               AND (LOWER(Department) LIKE '%accounts%' 
                 OR LOWER(Department) LIKE '%finance%'
                 OR LOWER(Department) LIKE '%finance and accounts department -hoe%')
             ORDER BY Employee_Name ASC`
        );
        res.json(rows);
    } catch (err) {
        console.error("listAccountsEmployees error:", err);
        res.status(500).json({ message: "Server error" });
    }
}

module.exports = {
    createRequisition,
    listRequisitions,
    getRequisitionById,
    listAccountsEmployees,
    approveHR,
    approveAccounts
};
