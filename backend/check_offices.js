const { pool } = require("./Utils/db");

async function checkOffices() {
    try {
        console.log("--- Offices ---");
        const [rows] = await pool.execute("SELECT id, name, latitude, longitude FROM offices");
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkOffices();
