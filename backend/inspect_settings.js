const { pool } = require('./Utils/db');

async function inspectSettings() {
    try {
        const [columns] = await pool.query("DESCRIBE settings");
        console.log("Schema:", columns);
        const [rows] = await pool.query("SELECT * FROM settings LIMIT 5");
        console.log("Data:", rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

inspectSettings();
