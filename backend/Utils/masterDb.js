require('dotenv').config();
const mysql = require('mysql2/promise');

const masterPool = mysql.createPool({
  host: process.env.MASTER_DB_HOST || process.env.DB_HOST,
  port: Number(process.env.MASTER_DB_PORT || process.env.DB_PORT || 3306),
  user: process.env.MASTER_DB_USER || process.env.DB_USER,
  password: process.env.MASTER_DB_PASS ?? process.env.DB_PASS,
  database: process.env.MASTER_DB_NAME || 'hrm_master',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function findCompanyByCode(companyCode) {
  const code = String(companyCode || '').trim().toLowerCase();
  if (!code) return null;

  const [rows] = await masterPool.execute(
    `SELECT id, company_name, company_code, db_name, db_host, db_port, db_user, db_password, status
       FROM companies
      WHERE LOWER(company_code) = ?
      LIMIT 1`,
    [code]
  );

  return rows[0] || null;
}

module.exports = { masterPool, findCompanyByCode };
