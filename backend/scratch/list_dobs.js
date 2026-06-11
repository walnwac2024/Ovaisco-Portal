const { pool } = require('../Utils/db');

async function listDobs() {
    try {
        const [rows] = await pool.query("SELECT id, Employee_Name, Date_of_Birth FROM employee_records WHERE Date_of_Birth IS NOT NULL AND Date_of_Birth != '' ORDER BY id DESC LIMIT 100");
        console.log(JSON.stringify(rows, null, 2));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

listDobs();
