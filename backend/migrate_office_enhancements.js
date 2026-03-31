const { pool } = require('./Utils/db');

async function migrate() {
    console.log("Starting migration for Office Requisition enhancements...");
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        console.log("Adding assigned_accounts_id to office_requisitions...");
        await conn.execute(`
            ALTER TABLE office_requisitions 
            ADD COLUMN assigned_accounts_id INT NULL AFTER accounts_approved_by,
            ADD CONSTRAINT fk_assigned_accounts FOREIGN KEY (assigned_accounts_id) REFERENCES employee_records(id) ON DELETE SET NULL
        `);

        console.log("Adding unit_price to office_requisition_items...");
        await conn.execute(`
            ALTER TABLE office_requisition_items 
            ADD COLUMN unit_price DECIMAL(12, 2) DEFAULT 0.00 AFTER qty
        `);

        await conn.commit();
        console.log("Migration completed successfully.");
    } catch (err) {
        await conn.rollback();
        console.error("Migration failed:", err);
    } finally {
        conn.release();
        process.exit();
    }
}

migrate();
