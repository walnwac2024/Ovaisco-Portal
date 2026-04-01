const { pool } = require('./Utils/db');

async function check() {
  try {
    const [cols] = await pool.execute("DESCRIBE employee_records");
    console.log("EMPLOYEE_RECORDS:", cols.map(c => c.Field));
    
    const [pcols] = await pool.execute("DESCRIBE user_type_permission");
    console.log("USER_TYPE_PERMISSION:", pcols.map(c => c.Field));

    const [tcols] = await pool.execute("DESCRIBE users_types");
    console.log("USERS_TYPES:", tcols.map(c => c.Field));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
