const { pool } = require('../Utils/db');

async function dumpAll() {
    const [rows] = await pool.query("SELECT id, Employee_Name, Date_of_Birth FROM employee_records");
    rows.forEach(e => {
        if (e.Date_of_Birth) {
            console.log(`${e.id} | ${e.Employee_Name} | ${e.Date_of_Birth}`);
        }
    });
    process.exit(0);
}

dumpAll();
