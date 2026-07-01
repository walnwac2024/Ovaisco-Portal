const { masterPool } = require("../Utils/masterDb");
const { getTenantPool } = require("../Utils/tenantDb");

const SHORT_LEAVE = {
  name: "Short Leave",
  entitlement: 2,
  color: "#F59E0B",
};

async function getTenantCompanyIds(pool) {
  const [rows] = await pool.execute(`
    SELECT DISTINCT company_id
    FROM employee_records
    WHERE company_id IS NOT NULL
    UNION
    SELECT DISTINCT company_id
    FROM leave_types
    WHERE company_id IS NOT NULL
    ORDER BY company_id
  `);

  return rows.map((row) => Number(row.company_id)).filter(Boolean);
}

async function ensureShortLeaveForCompany(pool, companyId) {
  const [existingRows] = await pool.execute(
    "SELECT id, entitlement_days FROM leave_types WHERE LOWER(name) = LOWER(?) AND company_id = ? LIMIT 1",
    [SHORT_LEAVE.name, companyId]
  );

  let leaveTypeId;
  let entitlement = SHORT_LEAVE.entitlement;

  if (existingRows.length) {
    leaveTypeId = existingRows[0].id;
    entitlement = Number(existingRows[0].entitlement_days) > 0
      ? Number(existingRows[0].entitlement_days)
      : SHORT_LEAVE.entitlement;

    await pool.execute(
      "UPDATE leave_types SET entitlement_days = ?, color_code = COALESCE(color_code, ?), is_active = 1 WHERE id = ? AND company_id = ?",
      [entitlement, SHORT_LEAVE.color, leaveTypeId, companyId]
    );
  } else {
    const [insertResult] = await pool.execute(
      "INSERT INTO leave_types (name, entitlement_days, color_code, is_active, company_id) VALUES (?, ?, ?, 1, ?)",
      [SHORT_LEAVE.name, SHORT_LEAVE.entitlement, SHORT_LEAVE.color, companyId]
    );
    leaveTypeId = insertResult.insertId;
  }

  const currentYear = new Date().getFullYear();
  const [employees] = await pool.execute(
    "SELECT id FROM employee_records WHERE is_active = 1 AND company_id = ?",
    [companyId]
  );

  let balancesCreated = 0;
  for (const employee of employees) {
    const [balanceRows] = await pool.execute(
      `SELECT id
       FROM leave_balances
       WHERE employee_id = ? AND leave_type_id = ? AND year = ? AND company_id = ?
       LIMIT 1`,
      [employee.id, leaveTypeId, currentYear, companyId]
    );

    if (balanceRows.length) continue;

    await pool.execute(
      `INSERT INTO leave_balances
       (employee_id, leave_type_id, year, entitlement, balance, used, company_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 0, ?, NOW(), NOW())`,
      [employee.id, leaveTypeId, currentYear, entitlement, entitlement, companyId]
    );
    balancesCreated += 1;
  }

  return { leaveTypeId, balancesCreated };
}

async function main() {
  const [companies] = await masterPool.execute(
    "SELECT * FROM companies WHERE status = 'active' ORDER BY id"
  );

  for (const company of companies) {
    const code = String(company.company_code || "").trim();
    const tenantPool = getTenantPool(company);
    const companyIds = await getTenantCompanyIds(tenantPool);

    for (const companyId of companyIds) {
      const result = await ensureShortLeaveForCompany(tenantPool, companyId);
      console.log(
        `${code} (${company.db_name}) company_id=${companyId}: Short Leave type ${result.leaveTypeId}, balances created ${result.balancesCreated}`
      );
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Failed to seed Short Leave:", err);
    process.exit(1);
  });
