const { pool } = require('../Utils/db');

async function fix() {
    const tables = [
        { name: 'system_departments', col: 'name' },
        { name: 'system_designations', col: 'name' },
        { name: 'system_offices', col: 'name' },
        { name: 'system_employment_types', col: 'name' },
        { name: 'system_blood_groups', col: 'name' },
        { name: 'system_religions', col: 'name' },
        { name: 'system_marital_statuses', col: 'name' },
        { name: 'users_types', col: 'type' },
        { name: 'permissions', col: 'code' }
    ];

    for (const table of tables) {
        try {
            console.log(`Fixing table: ${table.name}`);
            const [indexes] = await pool.execute(`SHOW INDEX FROM \`${table.name}\``);
            
            // Find unique index on the specific column
            const uniIndex = indexes.find(i => i.Non_unique === 0 && i.Column_name === table.col && i.Key_name !== 'PRIMARY');
            
            if (uniIndex) {
                console.log(`Dropping index: ${uniIndex.Key_name}`);
                await pool.execute(`ALTER TABLE \`${table.name}\` DROP INDEX \`${uniIndex.Key_name}\``);
            }

            console.log(`Adding multi-tenant unique index uq_${table.name}_tenant on (${table.col}, company_id)`);
            await pool.execute(`ALTER TABLE \`${table.name}\` ADD UNIQUE INDEX \`uq_${table.name}_tenant\` (\`${table.col}\`, \`company_id\`)`);
        } catch (e) {
            console.error(`Failed for table ${table.name}:`, e.message);
        }
    }
    console.log('Schema fix complete.');
    process.exit(0);
}

fix();
