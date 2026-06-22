// src/db.js
// const mysql = require('mysql2/promise');
// require('dotenv').config();

// const pool = mysql.createPool({
//   host: process.env.DB_HOST,
//   port: Number(process.env.DB_PORT || 3306),
//   user: process.env.DB_USER,
//   password: process.env.DB_PASS,
//   database: process.env.DB_NAME,
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
// });

// module.exports = { pool };


require('dotenv').config();
const mysql = require('mysql2/promise');
const { AsyncLocalStorage } = require('async_hooks');

const defaultPool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 50,
  queueLimit: 0,
});

const tenantStorage = new AsyncLocalStorage();

function getActivePool() {
  const store = tenantStorage.getStore();
  return store?.pool || defaultPool;
}

const pool = new Proxy({}, {
  get(_target, prop) {
    const activePool = getActivePool();
    const value = activePool[prop];
    return typeof value === 'function' ? value.bind(activePool) : value;
  }
});

function runWithDbPool(dbPool, callback) {
  return tenantStorage.run({ pool: dbPool }, callback);
}

module.exports = { pool, defaultPool, runWithDbPool };

