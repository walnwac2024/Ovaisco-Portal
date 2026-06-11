const { pool } = require('../Utils/db');

async function search() {
    const [rows] = await pool.query("SELECT id, Employee_Name, Date_of_Birth FROM employee_records WHERE Date_of_Birth LIKE '%1997%' OR Date_of_Birth LIKE '%14/05%'");
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
}

search();
