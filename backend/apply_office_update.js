const { pool } = require("./Utils/db");

async function updateOffice() {
    try {
        console.log("Updating Islamabad Square (ID: 8) location...");
        const [result] = await pool.execute(
            "UPDATE offices SET latitude = ?, longitude = ? WHERE id = 8",
            ['33.6861368', '72.8376706']
        );
        console.log("Update successful. Rows affected:", result.affectedRows);
        process.exit(0);
    } catch (err) {
        console.error("Update failed:", err);
        process.exit(1);
    }
}

updateOffice();
