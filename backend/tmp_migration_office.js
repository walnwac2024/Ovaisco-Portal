const { pool } = require('./Utils/db');

async function migrate() {
    try {
        console.log("Adding hr_approved_at and accounts_approved_at...");
        
        await pool.execute(`
            ALTER TABLE office_requisitions 
            ADD COLUMN hr_approved_at TIMESTAMP NULL,
            ADD COLUMN accounts_approved_at TIMESTAMP NULL
        `);
        
        console.log("Migration successful!");
        process.exit(0);
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_DUP_COLUMN') {
            console.log("Columns already exist, skipping.");
            process.exit(0);
        }
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
function alert(msg) { console.log(msg); }
function test() { console.log("test"); }
