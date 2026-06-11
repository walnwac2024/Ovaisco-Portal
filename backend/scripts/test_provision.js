const { pool } = require("../Utils/db");
const bcrypt = require("bcryptjs");

async function test() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Step 1: Company
    console.log("Testing company insert...");
    const [compRes] = await conn.execute(
      "INSERT INTO companies (company_name, email, status) VALUES (?, ?, 'active')",
      ["TEST_DEBUG_CORP", "debug@test.com"]
    );
    const companyId = compRes.insertId;
    console.log("✅ Company OK, id:", companyId);

    // Step 2: Leave types
    console.log("Testing leave type insert...");
    await conn.execute(
      "INSERT INTO leave_types (name, entitlement_days, color_code, company_id, is_active) VALUES (?, ?, ?, ?, 1)",
      ["Annual", 15, "#4CAF50", companyId]
    );
    console.log("✅ Leave type OK");

    // Step 3: Attendance rule
    console.log("Testing attendance rule insert...");
    await conn.execute(
      "INSERT INTO attendance_rules (grace_minutes, notify_employee, notify_hr_admin, block_vpn, is_active, company_id) VALUES (?, ?, ?, ?, 1, ?)",
      [15, 1, 1, 1, companyId]
    );
    console.log("✅ Attendance rule OK");

    // Step 4: Shift
    console.log("Testing shift insert...");
    await conn.execute(
      "INSERT INTO attendance_shifts (name, start_time, end_time, effective_from, effective_to, color, company_id, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)",
      ["SUMMER", "10:00:00", "19:00:00", "2026-03-31", "2026-10-30", "#3b82f6", companyId]
    );
    console.log("✅ Shift OK");

    // Step 5: Super admin employee
    console.log("Testing employee insert...");
    const hash = await bcrypt.hash("testpass", 10);
    const [empRes] = await conn.execute(
      `INSERT INTO employee_records 
       (Employee_ID, Employee_Name, Official_Email, password_hash, can_login, is_active, company_id) 
       VALUES ('ADMIN-001', 'Super Admin', ?, ?, 1, 1, ?)`,
      ["debug@test.com", hash, companyId]
    );
    const adminId = empRes.insertId;
    console.log("✅ Employee OK, id:", adminId);

    // Step 6: Role
    console.log("Testing role assignment...");
    const [roleRows] = await conn.execute("SELECT id FROM users_types WHERE type = 'super_admin' LIMIT 1");
    if (roleRows.length > 0) {
      await conn.execute(
        "INSERT INTO employee_user_types (employee_id, user_type_id, is_primary) VALUES (?, ?, 1)",
        [adminId, roleRows[0].id]
      );
      console.log("✅ Role assigned OK");
    } else {
      console.log("⚠️ super_admin role not found in users_types");
    }

    await conn.rollback();
    console.log("\n🎉 ALL STEPS PASSED (rolled back, nothing committed)");

  } catch (err) {
    await conn.rollback();
    console.error("\n❌ ERROR at step:", err.message);
    if (err.sql) console.error("SQL:", err.sql);
    if (err.sqlMessage) console.error("SQL Message:", err.sqlMessage);
  } finally {
    conn.release();
    process.exit(0);
  }
}

test();
