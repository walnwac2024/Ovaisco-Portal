const { pool } = require('../Utils/db');

async function check() {
    try {
        const [rows] = await pool.execute("SELECT id, Employee_Name, face_registration FROM employee_records WHERE face_registration IS NOT NULL");
        console.log('Registered Faces:', rows.length);
        rows.forEach(r => console.log(`ID: ${r.id}, Name: ${r.Employee_Name}, Path: ${r.face_registration}`));
        process.exit(0);
    } catch (err) {
        console.error('Check failed:', err);
        process.exit(1);
    }
}

check();
