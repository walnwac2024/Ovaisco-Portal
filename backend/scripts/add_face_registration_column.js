const { pool } = require('../Utils/db');

async function migrate() {
    try {
        console.log('Starting migration: adding face_registration column...');
        await pool.execute("ALTER TABLE employee_records ADD COLUMN face_registration VARCHAR(255) DEFAULT NULL AFTER profile_img;");
        console.log('Migration successful: face_registration column added.');
        process.exit(0);
    } catch (err) {
        if (err.code === 'ER_DUP_COLUMN') {
            console.log('Column face_registration already exists.');
            process.exit(0);
        } else {
            console.error('Migration failed:', err);
            process.exit(1);
        }
    }
}

migrate();
