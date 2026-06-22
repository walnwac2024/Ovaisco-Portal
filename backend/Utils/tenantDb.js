require('dotenv').config();
const mysql = require('mysql2/promise');
const { runWithDbPool } = require('./db');

const tenantPools = new Map();

function getTenantPool(company) {
  if (!company?.db_name) {
    throw new Error('Tenant database name is missing');
  }

  const key = [
    company.db_host || process.env.DB_HOST,
    company.db_port || process.env.DB_PORT || 3306,
    company.db_user || process.env.DB_USER,
    company.db_name
  ].join(':');

  if (!tenantPools.has(key)) {
    tenantPools.set(key, mysql.createPool({
      host: company.db_host || process.env.DB_HOST,
      port: Number(company.db_port || process.env.DB_PORT || 3306),
      user: company.db_user || process.env.DB_USER,
      password: company.db_password ?? process.env.DB_PASS,
      database: company.db_name,
      waitForConnections: true,
      connectionLimit: 50,
      queueLimit: 0,
    }));
  }

  return tenantPools.get(key);
}

function runWithTenant(company, callback) {
  return runWithDbPool(getTenantPool(company), callback);
}

module.exports = { getTenantPool, runWithTenant };
