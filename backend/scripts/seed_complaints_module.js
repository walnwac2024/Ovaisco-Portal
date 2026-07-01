const { masterPool } = require("../Utils/masterDb");
const { getTenantPool } = require("../Utils/tenantDb");

const CREATE_COMPLAINTS_TABLE = `
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
`;

const PERMISSIONS = [
  { module: "Complaints", action: "View Company Complaints", code: "complaint_view_all" },
  { module: "Complaints", action: "Manage Complaints", code: "complaint_manage" },
];

async function ensurePermission(pool, permission) {
  const [rows] = await pool.execute(
    "SELECT id FROM permissions WHERE code = ? LIMIT 1",
    [permission.code]
  );

  if (rows.length) {
    await pool.execute(
      "UPDATE permissions SET module = ?, action = ? WHERE code = ?",
      [permission.module, permission.action, permission.code]
    );
    return "updated";
  }

  await pool.execute(
    "INSERT INTO permissions (module, action, code) VALUES (?, ?, ?)",
    [permission.module, permission.action, permission.code]
  );
  return "inserted";
}

async function main() {
  const [companies] = await masterPool.execute(
    "SELECT * FROM companies WHERE status = 'active' ORDER BY id"
  );

  for (const company of companies) {
    const code = String(company.company_code || "").trim();
    const tenantPool = getTenantPool(company);

    await tenantPool.execute(CREATE_COMPLAINTS_TABLE);
    const permissionResults = [];
    for (const permission of PERMISSIONS) {
      const result = await ensurePermission(tenantPool, permission);
      permissionResults.push(`${permission.code}:${result}`);
    }

    console.log(`${code} (${company.db_name}): complaints table ready, ${permissionResults.join(", ")}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Failed to seed complaints module:", err);
    process.exit(1);
  });
