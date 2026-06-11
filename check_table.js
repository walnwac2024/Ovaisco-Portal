const { pool } = require('./backend/Utils/db');

async function check() {
  try {
    const [rows] = await pool.execute("SHOW CREATE TABLE attendance_daily");
    console.log(rows[0]['Create Table']);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
