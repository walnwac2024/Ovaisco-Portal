const { pool } = require("../../Utils/db");
const { recordLog } = require("../../Utils/AuditUtils");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");
const xlsx = require("xlsx");

/**
 * Columns for employees list
 */
const EMP_LIST_FIELDS = `
  id,
  profile_img       AS profile_picture,
  Employee_ID       AS employeeCode,
  Employee_Name     AS name,
  CNIC              AS cnic,
  login_email       AS userName,
  Office_Location   AS station,
  Department        AS department,
  Designations      AS designation,
  Status            AS employmentStatus,
  Official_Email    AS officialEmail,
  Email             AS personalEmail,
  Contact           AS contact,
  Gender            AS gender,
  is_active         AS isActive,
  can_login         AS canLogin,
  Date_of_Joining   AS dateOfJoining,
  Date_of_Birth     AS dateOfBirth,
  monthly_salary,
  salary_locked
`;

/* ------------------------------------------------------------------
 * Helper: full access check (admin/super_admin OR permission level)
 * ------------------------------------------------------------------ */
function hasFullAccess(user) {
  if (!user) return false;

  const level = Number(user.flags?.level || 0);
  if (level > 6) return true;

  const roles = (Array.isArray(user.roles) ? user.roles : []).map((r) =>
    String(r).toLowerCase()
  );
  if (roles.includes("super_admin")) return true;
  if (roles.includes("admin")) return true;
  if (roles.includes("hr")) return true;
  if (roles.includes("developer")) return true;

  return false;
}

/* ------------------------------------------------------------------
 * Helper: permission check to view employee
 * ------------------------------------------------------------------ */
function canViewEmployee(sessionUser, requestedId) {
  if (!sessionUser?.id) return false;

  const myId = Number(sessionUser.id);
  const reqId = Number(requestedId);

  const features = sessionUser.features || [];
  const canViewEmployees =
    hasFullAccess(sessionUser) || features.includes("employee_view");

  // can always view self; others require employee_view/full access
  if (reqId === myId) return true;
  return !!canViewEmployees;
}

/* ------------------------------------------------------------------
 * Helpers: file paths
 * ------------------------------------------------------------------ */
function backendRootDir() {
  return path.join(__dirname, "..", ".."); // -> backend/
}

function resolveUploadedAbsPath(docPath) {
  // docPath like "/uploads/documents/xxx.pdf"
  const safeRel = String(docPath || "").replace(/^\//, "");
  return path.join(backendRootDir(), safeRel);
}

function safeUnlink(absPath) {
  try {
    if (absPath && fs.existsSync(absPath)) fs.unlinkSync(absPath);
  } catch (e) {
    console.warn("Could not delete file:", absPath, e?.message);
  }
}

/* ------------------------------------------------------------------
 * CREATE EMPLOYEE  (POST /api/v1/employees)
 * ------------------------------------------------------------------ */
async function createEmployee(req, res) {
  // Debug Log
  const fs = require('fs');
  const path = require('path');
  try {
    fs.appendFileSync(path.join(__dirname, '..', '..', 'leave_debug.log'), `[${new Date().toISOString()}] createEmployee CALLED\n`);
  } catch (e) { console.error("Log failed", e); }

  const {
    // employment
    employeeCode,
    fullName,
    designation,
    department,
    station,
    status,

    // personal
    dateOfBirth,
    gender,
    bloodGroup,
    religion,
    maritalStatus,
    address,
    cnic,

    // job & contact
    dateOfJoining,
    personalContact,
    officialContact,
    emergencyContact,
    emergencyRelation,
    reportingTo,

    // optional HR fields
    offerLetter,
    probation,

    // login
    officialEmail,
    personalEmail,
    allowPortalLogin,
    password,
    userType,
    shiftId,
  } = req.body || {};

  try {
    // --- basic validation ---
    if (!fullName || !designation || !department || !station || !status) {
      return res
        .status(400)
        .json({ message: "Missing required employment fields." });
    }

    if (!dateOfJoining) {
      return res.status(400).json({ message: "Date of joining is required." });
    }

    if (!officialEmail) {
      return res.status(400).json({ message: "Official email is required." });
    }

    if (allowPortalLogin) {
      if (!password || String(password).trim().length < 6) {
        return res.status(400).json({
          message:
            "Password (min 6 characters) is required when portal login is allowed.",
        });
      }
    }

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // --- auto-generate Employee_ID if empty ---
      let finalEmployeeCode = (employeeCode || "").trim();
      if (!finalEmployeeCode) {
        const [rows] = await conn.query(
          "SELECT MAX(id) AS maxId FROM employee_records WHERE company_id = ?",
          [req.company_id || 1]
        );
        const next = (rows[0]?.maxId || 0) + 1;
        finalEmployeeCode = `EM/${String(next).padStart(3, "0")}`;
      }

      // --- login-related fields ---
      let passwordHash = null;
      let canLogin = 0;
      let mustChangePassword = 0;

      if (allowPortalLogin) {
        passwordHash = await bcrypt.hash(String(password).trim(), 10);
        canLogin = 1;
        mustChangePassword = 1;
      }

      // --- INSERT into employee_records ---
      const sql = `
        INSERT INTO employee_records (
          Employee_ID,
          Employee_Name,
          Designations,
          Department,
          Status,
          Office_Location,
          Offer_Letter,
          Date_of_Joining,
          Probation,
          \`Status.1\`,
          Reporting,
          Gender,
          Date_of_Birth,
          CNIC,
          Email,
          Contact,
          Blood_Group,
          Relagion,
          \`Status.2\`,
          Emergency_Contact,
          Relation,
          Address,
          Official_Email,
          password_hash,
          can_login,
          is_active,
          last_login_at,
          must_change_password,
          Offical_Contact,
          profile_img,
          company_id
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?
        )
      `;

      const avatarFile = req.files?.avatar?.[0];
      const profileImgPath = avatarFile ? `/uploads/profile-img/${avatarFile.filename}` : null;

      const params = [
        finalEmployeeCode,
        fullName,
        designation,
        department,
        status,
        station,

        offerLetter || "",
        dateOfJoining || "",
        probation || "",
        "", // Status.1
        reportingTo || "",
        gender || "",
        dateOfBirth || "",
        cnic || "",
        personalEmail || null, // Email (personal)
        personalContact || "",
        bloodGroup || "",
        religion || "",
        maritalStatus || "",
        emergencyContact || "",
        emergencyRelation || "",
        address || "",
        officialEmail || "",
        passwordHash,
        canLogin,
        1, // is_active (ACTIVE by default)
        null, // last_login_at
        mustChangePassword,
        officialContact || "",
        profileImgPath, // profile_img
        req.company_id || 1, // company_id
      ];

      const [insertResult] = await conn.execute(sql, params);
      const newEmployeeId = insertResult.insertId;

      // --- link userType via employee_user_types ---
      if (allowPortalLogin && userType) {
        try {
          const [types] = await conn.execute(
            "SELECT id FROM users_types WHERE type = ? LIMIT 1",
            [userType]
          );
          if (types.length) {
            const userTypeId = types[0].id;
            await conn.execute(
              "INSERT INTO employee_user_types (employee_id, user_type_id, is_primary, company_id) VALUES (?, ?, 1, ?)",
              [newEmployeeId, userTypeId, req.company_id || 1]
            );
          }
        } catch (linkErr) {
          console.error("createEmployee: could not link userType", linkErr);
        }
      }

      // --- assign shift ---
      if (shiftId) {
        try {
          await conn.execute(
            "INSERT INTO employee_shift_assignments (employee_id, shift_id, effective_from, company_id) VALUES (?, ?, ?, ?)",
            [newEmployeeId, shiftId, dateOfJoining || new Date().toISOString().slice(0, 10), req.company_id || 1]
          );
        } catch (shiftErr) {
          console.error("createEmployee: could not assign shift", shiftErr);
          // we don't rollback here as employee is already created 
          // or we could rollback if we want it to be atomic.
          // In this case, let's keep it atomic if it fits the flow.
          throw shiftErr;
        }
      }

      // --- ✅ NEW: Auto-create Leave Balances for Current Year ---
      try {
        const [activeTypes] = await conn.execute(
          "SELECT id, entitlement_days FROM leave_types WHERE is_active = 1 AND company_id = ?",
          [req.company_id || 1]
        );
        const currentYear = new Date().getFullYear();

        for (const type of activeTypes) {
          await conn.execute(
            `INSERT INTO leave_balances (employee_id, leave_type_id, year, entitlement, balance, used, company_id, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, 0, ?, NOW(), NOW())`,
            [newEmployeeId, type.id, currentYear, type.entitlement_days, type.entitlement_days, req.company_id || 1]
          );
        }

        // Log success for debugging
        const fs = require('fs');
        const path = require('path');
        fs.appendFileSync(path.join(__dirname, '..', '..', 'leave_debug.log'),
          `[${new Date().toISOString()}] Created balances for EmpID ${newEmployeeId}\n`);

      } catch (leaveErr) {
        console.error("createEmployee: could not create leave balances", leaveErr);
        const fs = require('fs');
        const path = require('path');
        fs.appendFileSync(path.join(__dirname, '..', '..', 'leave_debug.log'),
          `[${new Date().toISOString()}] ERROR creating balances for EmpID ${newEmployeeId}: ${leaveErr.message}\n`);
      }

      await conn.commit();

      // Audit Log for Creating Employee
      await recordLog({
        actorId: req.session?.user?.id,
        action: `Created new employee: ${fullName} (${finalEmployeeCode})`,
        category: "System",
        status: "Success",
        details: { fullName, finalEmployeeCode, department, designation, officialEmail }
      });

      const [rows2] = await conn.execute(
        "SELECT * FROM employee_records WHERE id = ? LIMIT 1",
        [newEmployeeId]
      );
      const emp = rows2[0];

      return res.status(201).json({
        id: emp.id,
        employeeCode: emp.Employee_ID,
        name: emp.Employee_Name,
      });
    } catch (err) {
      if (conn) await conn.rollback();
      console.error("createEmployee error:", err);
      const msg = err.code === 'ER_DUP_ENTRY'
        ? "An employee with this email or ID already exists."
        : (err.message || "Server error");
      return res.status(500).json({ message: msg });
    } finally {
      if (conn) conn.release();
    }
  } catch (outerErr) {
    console.error("createEmployee outer error:", outerErr);
    return res.status(500).json({ message: "Server error" });
  }
}

/* ------------------------------------------------------------------
 * EMPLOYEE LIST (GET /api/v1/employees)
 *  - Normal users: ONLY active
 *  - Admin/Super Admin: can include inactive with ?include_inactive=1
 * ------------------------------------------------------------------ */
async function listEmployees(req, res) {
  try {
    const sessionUser = req.session?.user;
    if (!sessionUser?.id) return res.status(401).json({ message: "Unauthenticated" });

    const {
      station,
      department,

      employeeCode,
      employee_code,

      employeeName,
      employee_name,

      userName,
      user_name,

      employee_group,
      designation,

      status,
      cnic,
      search,

      include_inactive, // ✅ NEW
    } = req.query;

    const employeeCodeFilter = employeeCode || employee_code || "";
    const employeeNameFilter = employeeName || employee_name || "";
    const userNameFilter = userName || user_name || "";
    const employeeGroupFilter = employee_group || "";
    const designationFilter = designation || "";

    const where = [];
    const params = [];

    // ✅ default behavior: hide inactive
    const wantsInactive =
      String(include_inactive || "").trim() === "1" ||
      String(include_inactive || "").trim().toLowerCase() === "true";

    const allowSeeInactive = wantsInactive && hasFullAccess(sessionUser);

    // ✅ Multi-Tenant Isolation
    where.push("company_id = ?");
    params.push(req.company_id || 1);

    if (!allowSeeInactive) {
      where.push("is_active = 1");
    }

    if (station) {
      where.push("Office_Location = ?");
      params.push(station);
    }

    if (department) {
      where.push("Department = ?");
      params.push(department);
    }

    if (employeeGroupFilter) {
      where.push("TRIM(SUBSTRING_INDEX(Department, '-', -1)) = ?");
      params.push(employeeGroupFilter);
    }

    if (designationFilter) {
      where.push("Designations = ?");
      params.push(designationFilter);
    }

    if (employeeCodeFilter) {
      where.push("Employee_ID LIKE ?");
      params.push(`%${employeeCodeFilter}%`);
    }

    if (employeeNameFilter) {
      where.push("Employee_Name LIKE ?");
      params.push(`%${employeeNameFilter}%`);
    }

    if (userNameFilter) {
      where.push("login_email LIKE ?");
      params.push(`%${userNameFilter}%`);
    }

    if (status) {
      where.push("Status = ?");
      params.push(status);
    }

    if (cnic) {
      where.push("CNIC LIKE ?");
      params.push(`%${cnic}%`);
    }

    if (search) {
      const s = `%${search}%`;
      where.push(
        `(
          Employee_ID     LIKE ? OR
          Employee_Name   LIKE ? OR
          login_email     LIKE ? OR
          Office_Location LIKE ? OR
          Department      LIKE ? OR
          Designations    LIKE ? OR
          CNIC            LIKE ? OR
          Official_Email  LIKE ? OR
          Email           LIKE ? OR
          Contact         LIKE ?
        )`
      );
      params.push(s, s, s, s, s, s, s, s, s, s);
    }

    let sql = `
      SELECT ${EMP_LIST_FIELDS}
      FROM employee_records
    `;

    if (where.length) {
      sql += " WHERE " + where.join(" AND ");
    }

    sql += " ORDER BY id DESC";

    const [rows] = await pool.execute(sql, params);
    return res.json(rows);
  } catch (err) {
    console.error("listEmployees error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/* ------------------------------------------------------------------
 * SINGLE EMPLOYEE (GET /api/v1/employees/:id)
 * ------------------------------------------------------------------ */
async function getEmployeeById(req, res) {
  try {
    const sessionUser = req.session?.user;
    if (!sessionUser?.id) {
      return res.status(401).json({ message: "Unauthenticated" });
    }

    const requestedId = Number(req.params.id);

    if (!canViewEmployee(sessionUser, requestedId)) {
      return res
        .status(403)
        .json({ message: "Forbidden: cannot view other employees" });
    }

    const [rows] = await pool.execute(
      `
      SELECT e.*, ut.type AS userType
      FROM employee_records e
      LEFT JOIN employee_user_types eut ON eut.employee_id = e.id AND eut.is_primary = 1
      LEFT JOIN users_types ut ON ut.id = eut.user_type_id
      WHERE e.id = ? AND e.company_id = ?
      LIMIT 1
      `,
      [requestedId, req.company_id || 1]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const emp = rows[0];

    const normalized = {
      id: emp.id,
      employeeCode: emp.Employee_ID,
      name: emp.Employee_Name,

      designation: emp.Designations,
      department: emp.Department,
      status: emp.Status,
      station: emp.Office_Location,

      dateOfJoining: emp.Date_of_Joining,
      dateOfBirth: emp.Date_of_Birth,

      cnic: emp.CNIC,
      gender: emp.Gender,
      bloodGroup: emp.Blood_Group,

      emailPersonal: emp.Email,
      personalEmail: emp.Email, // Unified field
      emailOfficial: emp.Official_Email,
      officialEmail: emp.Official_Email, // Unified field
      contact: emp.Contact,
      emergencyContact: emp.Emergency_Contact,
      address: emp.Address,

      canLogin: !!emp.can_login,
      isActive: !!emp.is_active,

      userType: emp.userType || null,

      profile_img: emp.profile_img || null,
      probation: emp.Probation || "",
      religion: emp.Relagion || "",
      maritalStatus: emp["Status.2"] || "",
    };

    return res.json(normalized);
  } catch (err) {
    console.error("getEmployeeById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/* ------------------------------------------------------------------
 * UPDATE EMPLOYEE (PATCH /api/v1/employees/:id)
 * ------------------------------------------------------------------ */
async function updateEmployee(req, res) {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const sessionUser = req.session?.user;

    // ✅ If NOT admin/hr/developer, restrict which fields can be updated
    const isEditingSelf = Number(id) === Number(sessionUser.id);
    const fullAccess = hasFullAccess(sessionUser);

    if (!fullAccess && !isEditingSelf) {
      return res.status(403).json({ message: "Forbidden: You can only edit your own profile." });
    }

    if (!fullAccess) {
      // These are strictly personal fields. All other fields from req.body will be ignored.
      const allowed = ["emailPersonal", "personalEmail", "contact", "emergencyContact", "address"];
      Object.keys(body).forEach(key => {
        if (!allowed.includes(key)) {
          delete body[key];
        }
      });
    }

    const {
      employeeCode,
      name,
      department,
      designation,
      station,
      status,
      dateOfJoining,
      dateOfBirth,
      cnic,
      gender,
      bloodGroup,
      emailPersonal,
      personalEmail,
      emailOfficial,
      officialEmail,
      contact,
      emergencyContact,
      address,
      probation,
      religion,
      maritalStatus,
    } = body;

    const fields = [];
    const params = [];

    if (employeeCode !== undefined) {
      fields.push("Employee_ID = ?");
      params.push(employeeCode);
    }
    if (name !== undefined) {
      fields.push("Employee_Name = ?");
      params.push(name);
    }
    if (department !== undefined) {
      fields.push("Department = ?");
      params.push(department);
    }
    if (designation !== undefined) {
      fields.push("Designations = ?");
      params.push(designation);
    }
    if (station !== undefined) {
      fields.push("Office_Location = ?");
      params.push(station);
    }
    if (status !== undefined) {
      fields.push("Status = ?");
      params.push(status);
    }
    if (dateOfJoining !== undefined) {
      fields.push("Date_of_Joining = ?");
      params.push(dateOfJoining || null);
    }
    if (dateOfBirth !== undefined) {
      fields.push("Date_of_Birth = ?");
      params.push(dateOfBirth || null);
    }
    if (cnic !== undefined) {
      fields.push("CNIC = ?");
      params.push(cnic);
    }
    if (gender !== undefined) {
      fields.push("Gender = ?");
      params.push(gender);
    }
    if (bloodGroup !== undefined) {
      fields.push("Blood_Group = ?");
      params.push(bloodGroup);
    }
    if (emailPersonal !== undefined || personalEmail !== undefined) {
      fields.push("Email = ?");
      params.push(personalEmail ?? emailPersonal);
    }
    if (emailOfficial !== undefined || officialEmail !== undefined) {
      fields.push("Official_Email = ?");
      params.push(officialEmail ?? emailOfficial);
    }
    if (contact !== undefined) {
      fields.push("Contact = ?");
      params.push(contact);
    }
    if (emergencyContact !== undefined) {
      fields.push("Emergency_Contact = ?");
      params.push(emergencyContact);
    }
    if (address !== undefined) {
      fields.push("Address = ?");
      params.push(address);
    }
    if (probation !== undefined) {
      fields.push("Probation = ?");
      params.push(probation);
    }
    if (religion !== undefined) {
      fields.push("Relagion = ?");
      params.push(religion);
    }
    if (maritalStatus !== undefined) {
      fields.push("`Status.2` = ?");
      params.push(maritalStatus);
    }

    if (!fields.length) {
      return res.status(400).json({ message: "No fields to update" });
    }

    const sql = `
      UPDATE employee_records
      SET ${fields.join(", ")}
      WHERE id = ? AND company_id = ?
    `;
    params.push(id, req.company_id || 1);

    await pool.execute(sql, params);

    // Audit Log for Updating Employee
    await recordLog({
      actorId: sessionUser.id,
      action: `Updated employee profile (ID: ${id})`,
      category: "System",
      status: "Success",
      details: { employeeId: id, updatedFields: Object.keys(body) }
    });

    return res.json({ message: "Employee updated successfully" });
  } catch (err) {
    console.error("updateEmployee error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/* ------------------------------------------------------------------
 * UPDATE EMPLOYEE LOGIN (PUT /api/v1/employees/:id/login)
 * ------------------------------------------------------------------ */
async function updateEmployeeLogin(req, res) {
  try {
    const { id } = req.params;
    const { officialEmail, canLogin, password, userType } = req.body || {};

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const fields = [];
      const params = [];

      if (officialEmail !== undefined) {
        fields.push("Official_Email = ?");
        params.push(officialEmail);
      }
      if (typeof canLogin === "boolean") {
        fields.push("can_login = ?");
        params.push(canLogin ? 1 : 0);
      }

      if (password && String(password).trim().length > 0) {
        const hash = await bcrypt.hash(String(password).trim(), 10);
        fields.push("password_hash = ?");
        params.push(hash);
        fields.push("must_change_password = 1");
      }

      if (fields.length) {
        const sql = `
          UPDATE employee_records
          SET ${fields.join(", ")}
          WHERE id = ? AND company_id = ?
        `;
        params.push(id, req.company_id || 1);
        await conn.execute(sql, params);
      }

      if (userType) {
        try {
          const [types] = await conn.execute(
            "SELECT id FROM users_types WHERE type = ? LIMIT 1",
            [userType]
          );

          if (types.length) {
            const userTypeId = types[0].id;

            await conn.execute(
              "DELETE FROM employee_user_types WHERE employee_id = ? AND company_id = ?",
              [id, req.company_id || 1]
            );

            await conn.execute(
              `
              INSERT INTO employee_user_types (employee_id, user_type_id, is_primary, company_id)
              VALUES (?, ?, 1, ?)
              `,
              [id, userTypeId, req.company_id || 1]
            );
          }
        } catch (linkErr) {
          console.error("updateEmployeeLogin: could not link userType", linkErr);
        }
      }

      await conn.commit();

      // Audit Log for Updating Employee Login
      await recordLog({
        actorId: req.session?.user?.id,
        action: `Updated login credentials for employee ID: ${id}`,
        category: "System",
        status: "Success",
        details: { employeeId: id, officialEmail, canLogin, userTypeUpdated: !!userType }
      });

      return res.json({ message: "Employee login updated successfully" });
    } catch (err) {
      if (conn) await conn.rollback();
      console.error("updateEmployeeLogin error:", err);
      const msg = err.code === "ER_DUP_ENTRY"
        ? "An employee with this email or ID already exists."
        : (err.message || "Server error");
      return res.status(500).json({ message: msg });
    } finally {
      if (conn) conn.release();
    }
  } catch (outerErr) {
    console.error("updateEmployeeLogin outer error:", outerErr);
    return res.status(500).json({ message: "Server error" });
  }
}

/* ------------------------------------------------------------------
 * UPDATE EMPLOYEE STATUS (PATCH /api/v1/employees/:id/status)
 *  Supports:
 *   - { is_active: 0/1 }
 *   - { isActive: true/false } (backward compatible)
 *   - { is_active: "y"/"n" } (optional)
 * ------------------------------------------------------------------ */
async function updateEmployeeStatus(req, res) {
  try {
    const { id } = req.params;
    const { is_active, isActive, status } = req.body || {};

    const fields = [];
    const params = [];

    // normalize active flag
    let nextActive = undefined;

    if (is_active !== undefined) {
      if (typeof is_active === "string") {
        const v = is_active.trim().toLowerCase();
        if (v === "y") nextActive = 1;
        else if (v === "n") nextActive = 0;
        else nextActive = Number(is_active);
      } else {
        nextActive = Number(is_active);
      }
    } else if (typeof isActive === "boolean") {
      nextActive = isActive ? 1 : 0;
    }

    if (nextActive !== undefined) {
      if (![0, 1].includes(nextActive)) {
        return res.status(400).json({ message: "is_active must be 0 or 1" });
      }
      fields.push("is_active = ?");
      params.push(nextActive);
    }

    if (status !== undefined) {
      fields.push("Status = ?");
      params.push(status);
    }

    if (!fields.length) {
      return res.status(400).json({ message: "No status fields to update" });
    }

    const sql = `
      UPDATE employee_records
      SET ${fields.join(", ")}
      WHERE id = ? AND company_id = ?
    `;
    params.push(id, req.company_id || 1);

    const [result] = await pool.execute(sql, params);

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Employee not found" });
    }

    return res.json({
      message: "Employee status updated successfully",
      id: Number(id),
      is_active: nextActive,
    });
  } catch (err) {
    console.error("updateEmployeeStatus error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/* ------------------------------------------------------------------
 * ADD EMPLOYEE DOCUMENTS (POST /api/v1/employees/:id/documents)
 * ------------------------------------------------------------------ */
async function addEmployeeDocuments(req, res) {
  try {
    const employeeId = Number(req.params.id);

    if (!employeeId || Number.isNaN(employeeId)) {
      return res.status(400).json({ message: "Invalid employee id" });
    }

    const files = req.files || [];
    if (!files.length) {
      return res
        .status(400)
        .json({ message: "No documents uploaded (max 10 allowed)." });
    }

    // Normalize values: form-data may send string OR array
    const normArr = (v) => (Array.isArray(v) ? v : v ? [v] : []);

    const titles = normArr(req.body?.titles);
    const types = normArr(req.body?.types);
    const issued_at = normArr(req.body?.issued_at);
    const expires_at = normArr(req.body?.expires_at);

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const title = titles[i] || file.originalname;
        const type = types[i] || "";
        const issuedAt = issued_at[i] || null;
        const expiresAt = expires_at[i] || null;

        // stored path for static serving
        const relPath = `/uploads/documents/${file.filename}`;

        await conn.execute(
          `
          INSERT INTO employee_documents 
            (employee_id, title, type, path, issued_at, expires_at, company_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
          `,
          [employeeId, title, type, relPath, issuedAt, expiresAt, req.company_id || 1]
        );
      }

      await conn.commit();

      return res.status(201).json({
        message: "Documents uploaded successfully",
        count: files.length,
      });
    } catch (err) {
      await conn.rollback();
      console.error("addEmployeeDocuments error:", err);
      return res.status(500).json({ message: "Server error" });
    } finally {
      conn.release();
    }
  } catch (outerErr) {
    console.error("addEmployeeDocuments outer error:", outerErr);
    return res.status(500).json({ message: "Server error" });
  }
}

/* ------------------------------------------------------------------
 * LIST EMPLOYEE DOCUMENTS (GET /api/v1/employees/:id/documents)
 * ------------------------------------------------------------------ */
async function listEmployeeDocuments(req, res) {
  try {
    const sessionUser = req.session?.user;
    if (!sessionUser?.id) {
      return res.status(401).json({ message: "Unauthenticated" });
    }

    const employeeId = Number(req.params.id);
    if (!employeeId || Number.isNaN(employeeId)) {
      return res.status(400).json({ message: "Invalid employee id" });
    }

    if (!canViewEmployee(sessionUser, employeeId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const [rows] = await pool.execute(
      `
      SELECT 
        id,
        employee_id,
        title,
        type,
        path,
        issued_at AS issuedAt,
        expires_at AS expiresAt,
        created_at AS createdAt
      FROM employee_documents
      WHERE employee_id = ? AND company_id = ?
      ORDER BY id DESC
      `,
      [employeeId, req.company_id || 1]
    );

    const docs = rows.map((d) => ({
      ...d,
      fileName: d.path ? path.basename(d.path) : null,
    }));

    return res.json(docs);
  } catch (err) {
    console.error("listEmployeeDocuments error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/* ------------------------------------------------------------------
 * UPDATE DOCUMENT META (PATCH /api/v1/employees/:id/documents/:docId)
 * ------------------------------------------------------------------ */
async function updateEmployeeDocument(req, res) {
  try {
    const sessionUser = req.session?.user;
    if (!sessionUser?.id) return res.status(401).json({ message: "Unauthenticated" });

    const employeeId = Number(req.params.id);
    const docId = Number(req.params.docId);
    if (!employeeId || Number.isNaN(employeeId)) {
      return res.status(400).json({ message: "Invalid employee id" });
    }
    if (!docId || Number.isNaN(docId)) {
      return res.status(400).json({ message: "Invalid document id" });
    }

    if (!canViewEmployee(sessionUser, employeeId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { title, type, issuedAt, expiresAt } = req.body || {};

    const fields = [];
    const params = [];

    if (title !== undefined) {
      fields.push("title = ?");
      params.push(title || "");
    }
    if (type !== undefined) {
      fields.push("type = ?");
      params.push(type || "");
    }
    if (issuedAt !== undefined) {
      fields.push("issued_at = ?");
      params.push(issuedAt || null);
    }
    if (expiresAt !== undefined) {
      fields.push("expires_at = ?");
      params.push(expiresAt || null);
    }

    if (!fields.length) {
      return res.status(400).json({ message: "No fields to update" });
    }

    fields.push("updated_at = NOW()");

    const [result] = await pool.execute(
      `
      UPDATE employee_documents
      SET ${fields.join(", ")}
      WHERE id = ? AND employee_id = ? AND company_id = ?
      `,
      [...params, docId, employeeId, req.company_id || 1]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Document not found" });
    }

    return res.json({ message: "Document updated successfully" });
  } catch (err) {
    console.error("updateEmployeeDocument error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/* ------------------------------------------------------------------
 * DELETE DOCUMENT (DELETE /api/v1/employees/:id/documents/:docId)
 * ------------------------------------------------------------------ */
async function deleteEmployeeDocument(req, res) {
  let conn;
  try {
    const sessionUser = req.session?.user;
    if (!sessionUser?.id) return res.status(401).json({ message: "Unauthenticated" });

    const employeeId = Number(req.params.id);
    const docId = Number(req.params.docId);
    if (!employeeId || Number.isNaN(employeeId)) {
      return res.status(400).json({ message: "Invalid employee id" });
    }
    if (!docId || Number.isNaN(docId)) {
      return res.status(400).json({ message: "Invalid document id" });
    }

    if (!canViewEmployee(sessionUser, employeeId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [rows] = await conn.execute(
      `
      SELECT id, employee_id, path
      FROM employee_documents
      WHERE id = ? AND employee_id = ? AND company_id = ?
      LIMIT 1
      `,
      [docId, employeeId, req.company_id || 1]
    );

    if (!rows.length) {
      await conn.rollback();
      return res.status(404).json({ message: "Document not found" });
    }

    const doc = rows[0];

    await conn.execute(
      `DELETE FROM employee_documents WHERE id = ? AND employee_id = ? AND company_id = ?`,
      [docId, employeeId, req.company_id || 1]
    );

    await conn.commit();

    if (doc.path) {
      const absPath = resolveUploadedAbsPath(doc.path);
      safeUnlink(absPath);
    }

    return res.json({ message: "Document deleted successfully" });
  } catch (err) {
    try {
      if (conn) await conn.rollback();
    } catch { }
    console.error("deleteEmployeeDocument error:", err);
    return res.status(500).json({ message: "Server error" });
  } finally {
    try {
      if (conn) conn.release();
    } catch { }
  }
}

/* ------------------------------------------------------------------
 * REPLACE DOCUMENT FILE (PUT /api/v1/employees/:id/documents/:docId/file)
 * ------------------------------------------------------------------ */
async function replaceEmployeeDocumentFile(req, res) {
  let conn;
  try {
    const sessionUser = req.session?.user;
    if (!sessionUser?.id) return res.status(401).json({ message: "Unauthenticated" });

    const employeeId = Number(req.params.id);
    const docId = Number(req.params.docId);
    if (!employeeId || Number.isNaN(employeeId)) {
      return res.status(400).json({ message: "Invalid employee id" });
    }
    if (!docId || Number.isNaN(docId)) {
      return res.status(400).json({ message: "Invalid document id" });
    }

    if (!canViewEmployee(sessionUser, employeeId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [rows] = await conn.execute(
      `
      SELECT id, employee_id, path
      FROM employee_documents
      WHERE id = ? AND employee_id = ? AND company_id = ?
      LIMIT 1
      `,
      [docId, employeeId, req.company_id || 1]
    );

    if (!rows.length) {
      await conn.rollback();
      return res.status(404).json({ message: "Document not found" });
    }

    const old = rows[0];
    const newRelPath = `/uploads/documents/${file.filename}`;

    await conn.execute(
      `
      UPDATE employee_documents
      SET path = ?, updated_at = NOW()
      WHERE id = ? AND employee_id = ? AND company_id = ?
      `,
      [newRelPath, docId, employeeId, req.company_id || 1]
    );

    await conn.commit();

    if (old.path) {
      const absOld = resolveUploadedAbsPath(old.path);
      safeUnlink(absOld);
    }

    return res.json({ message: "Document file replaced successfully", path: newRelPath });
  } catch (err) {
    try {
      if (conn) await conn.rollback();
    } catch { }
    console.error("replaceEmployeeDocumentFile error:", err);
    return res.status(500).json({ message: "Server error" });
  } finally {
    try {
      if (conn) conn.release();
    } catch { }
  }
}

/* ------------------------------------------------------------------
 * DOWNLOAD DOCUMENT (GET /api/v1/employees/:id/documents/:docId/download)
 * ------------------------------------------------------------------ */
async function downloadEmployeeDocument(req, res) {
  try {
    const sessionUser = req.session?.user;
    if (!sessionUser?.id) {
      return res.status(401).json({ message: "Unauthenticated" });
    }

    const employeeId = Number(req.params.id);
    const docId = Number(req.params.docId);

    if (!employeeId || Number.isNaN(employeeId)) {
      return res.status(400).json({ message: "Invalid employee id" });
    }
    if (!docId || Number.isNaN(docId)) {
      return res.status(400).json({ message: "Invalid document id" });
    }

    if (!canViewEmployee(sessionUser, employeeId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const [rows] = await pool.execute(
      `
      SELECT id, employee_id, title, type, path
      FROM employee_documents
      WHERE id = ? AND employee_id = ? AND company_id = ?
      LIMIT 1
      `,
      [docId, employeeId, req.company_id || 1]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Document not found" });
    }

    const doc = rows[0];

    const absPath = resolveUploadedAbsPath(doc.path);

    if (!fs.existsSync(absPath)) {
      return res.status(404).json({ message: "File missing on server" });
    }

    const ext = path.extname(absPath) || "";
    const base = (doc.title || "document")
      .toString()
      .trim()
      .replace(/[^\w\- ]+/g, "");
    const fileName = `${base || "document"}${ext}`;

    return res.download(absPath, fileName);
  } catch (err) {
    console.error("downloadEmployeeDocument error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/* ------------------------------------------------------------------
 * LOOKUPS
 * ------------------------------------------------------------------ */
async function lookupUserTypes(req, res) {
  try {
    const [rows] = await pool.execute(
      `
      SELECT type AS value
      FROM users_types
      WHERE del != 'Y' OR del IS NULL
      ORDER BY type
      `
    );
    res.json(rows.map((r) => r.value));
  } catch (err) {
    console.error("lookupUserTypes error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

async function lookupStations(req, res) {
  try {
    // Try new system tables first
    const [rows] = await pool.execute("SELECT name AS value FROM system_offices WHERE is_active = 1 ORDER BY name ASC");
    if (rows.length > 0) return res.json(rows.map(r => r.value));

    // Fallback to legacy
    const [legacy] = await pool.execute(`
      SELECT DISTINCT TRIM(Office_Location) AS value
      FROM employee_records
      WHERE Office_Location IS NOT NULL AND Office_Location <> '' AND company_id = ?
      ORDER BY value
    `, [req.company_id || 1]);
    res.json(legacy.map((r) => r.value));
  } catch (err) {
    // If table doesn't exist, fallback to legacy
    try {
      const [legacy] = await pool.execute(`
        SELECT DISTINCT TRIM(Office_Location) AS value
        FROM employee_records
        WHERE Office_Location IS NOT NULL AND Office_Location <> ''
        ORDER BY value
      `);
      return res.json(legacy.map((r) => r.value));
    } catch (e) {
      console.error("lookupStations error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
}

async function lookupDepartments(req, res) {
  try {
    // Try new system tables first
    const [rows] = await pool.execute("SELECT name AS value FROM system_departments WHERE is_active = 1 ORDER BY name ASC");
    if (rows.length > 0) return res.json(rows.map(r => r.value));

    // Fallback
    const [legacy] = await pool.execute(`
      SELECT DISTINCT TRIM(Department) AS value
      FROM employee_records
      WHERE Department IS NOT NULL AND Department <> ''
      ORDER BY value
    `);
    res.json(legacy.map((r) => r.value));
  } catch (err) {
    try {
      const [legacy] = await pool.execute(`
        SELECT DISTINCT TRIM(Department) AS value
        FROM employee_records
        WHERE Department IS NOT NULL AND Department <> ''
        ORDER BY value
      `);
      return res.json(legacy.map((r) => r.value));
    } catch (e) {
      console.error("lookupDepartments error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
}

async function lookupGroups(req, res) {
  try {
    const [rows] = await pool.execute(
      `
      SELECT DISTINCT TRIM(SUBSTRING_INDEX(Department, '-', -1)) AS value
      FROM employee_records
      WHERE Department IS NOT NULL
        AND Department <> ''
        AND Department LIKE '%-%'
      ORDER BY value
      `
    );
    res.json(rows.map((r) => r.value));
  } catch (err) {
    console.error("lookupGroups error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

async function lookupDesignations(req, res) {
  try {
    // Try new system tables first
    const [rows] = await pool.execute("SELECT name AS value FROM system_designations WHERE is_active = 1 ORDER BY name ASC");
    if (rows.length > 0) return res.json(rows.map(r => r.value));

    // Fallback
    const [legacy] = await pool.execute(`
      SELECT DISTINCT TRIM(Designations) AS value
      FROM employee_records
      WHERE Designations IS NOT NULL AND Designations <> ''
      ORDER BY value
    `);
    res.json(legacy.map((r) => r.value));
  } catch (err) {
    try {
      const [legacy] = await pool.execute(`
        SELECT DISTINCT TRIM(Designations) AS value
        FROM employee_records
        WHERE Designations IS NOT NULL AND Designations <> ''
        ORDER BY value
      `);
      return res.json(legacy.map((r) => r.value));
    } catch (e) {
      console.error("lookupDesignations error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
}

async function lookupStatuses(req, res) {
  try {
    // Try new system tables first
    const [rows] = await pool.execute("SELECT name AS value FROM system_employment_types WHERE is_active = 1 ORDER BY name ASC");
    if (rows.length > 0) return res.json(rows.map(r => r.value));

    // Fallback
    const [legacy] = await pool.execute(`
      SELECT DISTINCT Status AS value
      FROM employee_records
      WHERE Status IS NOT NULL AND Status <> ''
      ORDER BY Status
    `);
    res.json(legacy.map((r) => r.value));
  } catch (err) {
    try {
      const [legacy] = await pool.execute(`
        SELECT DISTINCT Status AS value
        FROM employee_records
        WHERE Status IS NOT NULL AND Status <> ''
        ORDER BY Status
      `);
      return res.json(legacy.map((r) => r.value));
    } catch (e) {
      console.error("lookupStatuses error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
}

async function updateEmployeeAvatar(req, res) {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ message: "No image uploaded" });

    const relPath = `/uploads/profile-img/${req.file.filename}`;

    await pool.execute(
      "UPDATE employee_records SET profile_img = ? WHERE id = ? AND company_id = ? LIMIT 1",
      [relPath, id, req.company_id || 1]
    );

    return res.json({ message: "Avatar updated", profile_img: relPath });
  } catch (err) {
    console.error("updateEmployeeAvatar error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function lookupRoleTemplates(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT type AS value FROM users_types WHERE del != 'Y' OR del IS NULL ORDER BY type`
    );
    res.json(rows.map((r) => r.value));
  } catch (err) {
    console.error("lookupRoleTemplates error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  createEmployee,
  listEmployees,
  getEmployeeById,
  lookupStations,
  lookupDepartments,
  lookupGroups,
  lookupDesignations,
  lookupStatuses,
  lookupRoleTemplates,
  updateEmployee,
  updateEmployeeLogin,
  updateEmployeeStatus,
  lookupUserTypes,
  addEmployeeDocuments,

  // ✅ documents
  listEmployeeDocuments,
  downloadEmployeeDocument,
  updateEmployeeDocument,
  deleteEmployeeDocument,
  replaceEmployeeDocumentFile,
  updateEmployeeAvatar,
  importEmployees,
  deleteEmployee,
  exportEmployees,
  getImportTemplate,
  sendCredentials,
  listBasicEmployees,
};

async function listBasicEmployees(req, res) {
  try {
    const [rows] = await pool.execute(
      "SELECT id, Employee_Name, Employee_ID FROM employee_records WHERE is_active = 1 AND company_id = ? ORDER BY Employee_Name ASC",
      [req.company_id || 1]
    );
    return res.json(rows);
  } catch (err) {
    console.error("listBasicEmployees error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function deleteEmployee(req, res) {
  let conn;
  try {
    const sessionUser = req.session?.user;
    if (!sessionUser?.id) return res.status(401).json({ message: "Unauthenticated" });
    if (!hasFullAccess(sessionUser)) return res.status(403).json({ message: "Forbidden" });

    const { id } = req.params;
    const empId = Number(id);

    if (!empId || Number.isNaN(empId)) {
      return res.status(400).json({ message: "Invalid employee id" });
    }

    conn = await pool.getConnection();

    // 1. Get employee info for file cleanup
    const [empRows] = await conn.execute(
      "SELECT Employee_Name, Employee_ID, profile_img FROM employee_records WHERE id = ? AND company_id = ? LIMIT 1",
      [empId, req.company_id || 1]
    );

    if (!empRows.length) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const employee = empRows[0];

    // 2. Get all document paths for cleanup
    const [docRows] = await conn.execute(
      "SELECT path FROM employee_documents WHERE employee_id = ? AND company_id = ?",
      [empId, req.company_id || 1]
    );

    await conn.beginTransaction();

    // 3. Delete from dependent tables
    // Attendance related
    await conn.execute("DELETE FROM attendance_alert_logs WHERE employee_id = ? AND company_id = ?", [empId, req.company_id || 1]);
    await conn.execute("DELETE FROM attendance_punches WHERE (employee_id = ? OR marked_by_employee_id = ?) AND company_id = ?", [empId, empId, req.company_id || 1]);
    await conn.execute("DELETE FROM attendance_daily WHERE employee_id = ? AND company_id = ?", [empId, req.company_id || 1]);
    await conn.execute("DELETE FROM employee_shift_assignments WHERE employee_id = ? AND company_id = ?", [empId, req.company_id || 1]);
    await conn.execute("DELETE FROM attendance_security_violations WHERE employee_id = ? AND company_id = ?", [empId, req.company_id || 1]);

    // Employee related
    await conn.execute("DELETE FROM employee_user_types WHERE employee_id = ? AND company_id = ?", [empId, req.company_id || 1]);
    await conn.execute("DELETE FROM employee_documents WHERE employee_id = ? AND company_id = ?", [empId, req.company_id || 1]);
    await conn.execute("DELETE FROM employee_info_requests WHERE employee_id = ? AND company_id = ?", [empId, req.company_id || 1]);
    await conn.execute("DELETE FROM employee_transfers WHERE employee_id = ? AND company_id = ?", [empId, req.company_id || 1]);

    // Leaves
    await conn.execute("DELETE FROM leave_balances WHERE employee_id = ? AND company_id = ?", [empId, req.company_id || 1]);
    await conn.execute("DELETE FROM leave_applications WHERE employee_id = ? AND company_id = ?", [empId, req.company_id || 1]);

    // Other social/notif
    await conn.execute("DELETE FROM news_reactions WHERE user_id = ? AND company_id = ?", [empId, req.company_id || 1]);
    await conn.execute("DELETE FROM notifications WHERE user_id = ? AND company_id = ?", [empId, req.company_id || 1]);
    await conn.execute("DELETE FROM chat_messages WHERE (sender_id = ? OR receiver_id = ?) AND company_id = ?", [empId, empId, req.company_id || 1]);
    await conn.execute("DELETE FROM chat_read_receipts WHERE user_id = ? AND company_id = ?", [empId, req.company_id || 1]);

    // 4. Delete the main record
    await conn.execute("DELETE FROM employee_records WHERE id = ? AND company_id = ? LIMIT 1", [empId, req.company_id || 1]);

    await conn.commit();

    // 5. Cleanup Files
    if (employee.profile_img) {
      safeUnlink(resolveUploadedAbsPath(employee.profile_img));
    }
    for (const doc of docRows) {
      if (doc.path) {
        safeUnlink(resolveUploadedAbsPath(doc.path));
      }
    }

    // Audit Log
    await recordLog({
      actorId: sessionUser.id,
      action: `Permanently deleted employee: ${employee.Employee_Name} (${employee.Employee_ID})`,
      category: "System",
      status: "Success",
      details: { employee_id: empId, name: employee.Employee_Name, code: employee.Employee_ID }
    });

    return res.json({ message: "Employee and all associated data deleted successfully" });

  } catch (err) {
    if (conn) await conn.rollback();
    console.error("deleteEmployee error:", err);
    return res.status(500).json({ message: "Server error during deletion: " + (err.message || "Unknown error") });
  } finally {
    if (conn) conn.release();
  }
}

/* ------------------------------------------------------------------
 * EXPORT EMPLOYEES (GET /api/v1/employees/export)
 * ------------------------------------------------------------------ */
async function exportEmployees(req, res) {
  try {
    const sessionUser = req.session?.user;
    if (!sessionUser?.id) return res.status(401).json({ message: "Unauthenticated" });

    // For simplicity, we export ALL active employees for now.
    // Ideally we would reuse the filters from listEmployees.

    // Check permissions
    const canSeeAll = hasFullAccess(sessionUser) || (sessionUser.features || []).includes("employee_view");

    let sql = `
       SELECT 
          Employee_ID AS employeeCode,
          Employee_Name AS name,
          login_email AS userName,
          Department AS department,
          Designations AS designation,
          Office_Location AS station,
          Status AS employmentStatus,
          Date_of_Joining AS dateOfJoining,
          Contact AS contact,
          Official_Email AS officialEmail,
          Email AS personalEmail,
          CNIC AS cnic,
          Emergency_Contact AS emergencyContact,
          Relation AS emergencyRelation,
          Address AS address,
          Probation AS probation,
          Relagion AS religion,
          \`Status.2\` AS maritalStatus,
          Reporting AS reportingTo,
          Offical_Contact AS officialContact
       FROM employee_records 
    `;

    // Normal users only see themselves? Or fail?
    // Let's assume export is Admin/HR feature for now.
    if (!canSeeAll) {
      sql += " WHERE id = " + sessionUser.id;
    } else {
    // Multi-tenant filter
    if (sql.includes("WHERE")) {
      sql += " AND company_id = " + (req.company_id || 1);
    } else {
      sql += " WHERE company_id = " + (req.company_id || 1);
    }
    sql += " ORDER BY id DESC";
    }

    const [rows] = await pool.execute(sql);

    // Map to Excel friendly format
    const data = rows.map(r => ({
      "Employee ID": r.employeeCode,
      "Name": r.name,
      "Official Email": r.officialEmail,
      "Department": r.department,
      "Designation": r.designation,
      "Station": r.station,
      "Status": r.employmentStatus,
      "Joining Date": r.dateOfJoining,
      "Phone": r.contact,
      "Official Contact": r.officialContact,
      "Personal Email": r.personalEmail,
      "CNIC": r.cnic,
      "Emergency Contact": r.emergencyContact,
      "Emergency Relation": r.emergencyRelation,
      "Address": r.address,
      "Probation": r.probation,
      "Religion": r.religion,
      "Marital Status": r.maritalStatus,
      "Reporting To": r.reportingTo
    }));

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(wb, ws, "Employees");

    const buf = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", 'attachment; filename="employees_export.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buf);

  } catch (err) {
    console.error("exportEmployees error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

/* ------------------------------------------------------------------
 * GET IMPORT TEMPLATE (GET /api/v1/employees/import-template)
 * ------------------------------------------------------------------ */
async function getImportTemplate(req, res) {
  try {
    // Define headers that matched import logic
    // We create a dummy object with empty strings to prompt headers
    const headers = [
      {
        "Employee ID": "EM/001",
        "Name": "John Doe",
        "Department": "Management",
        "Designation": "Manager",
        "Station": "Head Office",
        "Status": "Permanent",
        "Joining Date": "2023-01-01",
        "Official Email": "john@example.com",
        "Personal Email": "",
        "CNIC": "42101-...",
        "Contact": "0300-...",
        "Official Contact": "",
        "Emergency Contact": "",
        "Emergency Relation": "",
        "Address": "",
        "Probation": "3 Months",
        "Religion": "Islam",
        "Marital Status": "Single",
        "Reporting To": ""
      }
    ];

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(headers);
    xlsx.utils.book_append_sheet(wb, ws, "Template");

    const buf = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", 'attachment; filename="employees_template.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buf);

  } catch (err) {
    console.error("getImportTemplate error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

/* ------------------------------------------------------------------
 * SEND CREDENTIALS (POST /api/v1/employees/send-credentials)
 * ------------------------------------------------------------------ */
async function sendCredentials(req, res) {
  try {
    const { station, department, group, employee, employee_id } = req.body || {};

    // Stub logic
    console.log("Send Creds Request:", req.body);

    // Simulate processing time
    await new Promise(r => setTimeout(r, 1000));

    return res.json({ message: "Credentials sent successfully (Mock)." });
  } catch (err) {
    console.error("sendCredentials error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/* ------------------------------------------------------------------
 * IMPORT EMPLOYEES (POST /api/v1/employees/import)
 * ------------------------------------------------------------------ */
async function importEmployees(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  try {
    const workbook = xlsx.read(req.file.path, { type: "file" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    // cleanup temp file if path exists (multer diskStorage)
    safeUnlink(req.file.path);

    if (!data.length) {
      return res.status(400).json({ message: "Excel file is empty" });
    }

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      let created = 0;
      let updated = 0;

      for (const row of data) {
        // Normalization helpers
        const getVal = (keys) => {
          for (const k of keys) {
            if (row[k] !== undefined) return String(row[k]).trim();
          }
          return null;
        };

        // Identify key fields
        const employeeCode = getVal(["Employee_ID", "Employee Code", "ID", "Code"]);
        const email = getVal(["Email", "Official_Email", "Personal Email", "Official Email"]);
        const cnic = getVal(["CNIC", "Cnic"]);

        // We NEED at least one identifier (Code or Email or CNIC)
        if (!employeeCode && !email && !cnic) {
          continue; // skip invalid rows
        }

        // Check existence
        // Priority: Employee_ID > Email > CNIC
        let existingId = null;

        if (employeeCode) {
          const [rows] = await conn.execute("SELECT id FROM employee_records WHERE Employee_ID = ? AND company_id = ? LIMIT 1", [employeeCode, req.company_id || 1]);
          if (rows.length) existingId = rows[0].id;
        }

        if (!existingId && email) {
          const [rows] = await conn.execute("SELECT id FROM employee_records WHERE (Official_Email = ? OR Email = ?) AND company_id = ? LIMIT 1", [email, email, req.company_id || 1]);
          if (rows.length) existingId = rows[0].id;
        }

        if (!existingId && cnic) {
          const [rows] = await conn.execute("SELECT id FROM employee_records WHERE CNIC = ? AND company_id = ? LIMIT 1", [cnic, req.company_id || 1]);
          if (rows.length) existingId = rows[0].id;
        }

        // Map fields to DB columns
        // We only map fields that are present in the row
        // This effectively implements "Merge" logic (only update provided fields)

        const dbFields = {
          "Employee_Name": ["Employee Name", "Name", "Full Name", "Employee_Name"],
          "Designations": ["Designation", "Designations", "Title"],
          "Department": ["Department", "Dept"],
          "Office_Location": ["Station", "Location", "Office_Location", "Office Location"],
          "Status": ["Status", "Employment Status"],
          "Date_of_Joining": ["Date of Joining", "Joining Date", "DOJ", "Date_of_Joining"],
          "Date_of_Birth": ["Date of Birth", "DOB", "Date_of_Birth"],
          "CNIC": ["CNIC", "Cnic"],
          "Gender": ["Gender", "Sex"],
          "Blood_Group": ["Blood Group", "Blood_Group"],
          "Contact": ["Contact", "Phone", "Mobile", "Personal Contact"],
          "Official_Email": ["Official Email", "Official_Email"],
          "Email": ["Personal Email", "Email"],
          "Address": ["Address"],
          "Emergency_Contact": ["Emergency Contact", "Emergency_Contact"],
          "Probation": ["Probation", "Probation Period", "Probation_Period"],
          "Relagion": ["Religion", "Relagion"],
          "Status.2": ["Marital Status", "MaritalStatus", "Marital"],
          "Reporting": ["Reporting To", "ReportingTo", "Reporting", "Manager"],
          "Relation": ["Emergency Relation", "Relation"],
          "Offical_Contact": ["Official Contact", "Official Phone", "Offical_Contact"],
        };

        const fieldsToUpdate = {};

        // If we have an ID, we update. If not, we create (Insert)
        if (existingId) {
          // Update mode
          for (const [dbCol, excelKeys] of Object.entries(dbFields)) {
            const val = getVal(excelKeys);
            if (val !== null) fieldsToUpdate[dbCol] = val;
          }

          if (Object.keys(fieldsToUpdate).length > 0) {
            const setClause = Object.keys(fieldsToUpdate).map(k => `${k} = ?`).join(", ");
            const params = Object.values(fieldsToUpdate);
            params.push(existingId, req.company_id || 1);

            await conn.execute(`UPDATE employee_records SET ${setClause} WHERE id = ? AND company_id = ?`, params);
            updated++;
          }

        } else {
          // Create mode (Insert)
          // Determine Employee ID if missing
          let finalCode = employeeCode;
          if (!finalCode) {
            // Auto-generate rudimentary ID if creating new
            const [maxRows] = await conn.query("SELECT MAX(id) AS maxId FROM employee_records WHERE company_id = ?", [req.company_id || 1]);
            const next = (maxRows[0]?.maxId || 0) + 1000 + created + 1; // +created to look ahead in this batch
            finalCode = `EM/${String(next).padStart(3, "0")}`;
          }

          // Fill defaults
          fieldsToUpdate["Employee_ID"] = finalCode;
          fieldsToUpdate["is_active"] = 1;
          fieldsToUpdate["company_id"] = req.company_id || 1;

          for (const [dbCol, excelKeys] of Object.entries(dbFields)) {
            const val = getVal(excelKeys);
            if (val !== null) fieldsToUpdate[dbCol] = val;
          }

          // Ensure required fields for INSERT
          // (Relax these if you want partial inserts, but let's try to be safe)
          if (!fieldsToUpdate["Employee_Name"]) fieldsToUpdate["Employee_Name"] = "Unknown";

          const cols = Object.keys(fieldsToUpdate).join(", ");
          const placeholders = Object.keys(fieldsToUpdate).map(() => "?").join(", ");
          const params = Object.values(fieldsToUpdate);

          await conn.execute(`INSERT INTO employee_records (${cols}) VALUES (${placeholders})`, params);
          created++;
        }
      }

      await conn.commit();
      return res.json({ message: `Import complete. Created: ${created}, Updated: ${updated}` });

    } catch (err) {
      if (conn) await conn.rollback();
      console.error("importEmployees error:", err);
      return res.status(500).json({ message: "DB Error during import: " + err.message });
    } finally {
      if (conn) conn.release();
    }

  } catch (err) {
    console.error("importEmployees processing error:", err);
    return res.status(500).json({ message: "Failed to process Excel file" });
  }
}
