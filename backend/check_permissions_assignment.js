const { pool } = require('./Utils/db');

async function check() {
    try {
        console.log("--- User Types ---");
        const [types] = await pool.execute("SELECT id, type FROM users_types");
        types.forEach(t => console.log(`${t.id}: ${t.type}`));

        console.log("\n--- 'Office Management' Permissions ---");
        const [perms] = await pool.execute("SELECT id, code FROM permissions WHERE module = 'Office Management'");
        perms.forEach(p => console.log(`${p.id}: ${p.code}`));

        console.log("\n--- Active Assignments for Office Management ---");
        const [mapping] = await pool.execute(`
            SELECT ut.type, p.code 
            FROM user_type_permission utp
            JOIN users_types ut ON utp.user_type_id = ut.id
            JOIN permissions p ON utp.permission_id = p.id
            WHERE p.module = 'Office Management'
        `);
        mapping.forEach(m => console.log(`${m.type} -> ${m.code}`));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
