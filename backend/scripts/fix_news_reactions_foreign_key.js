const { pool } = require('../Utils/db');

async function fixNewsReactionsForeignKey() {
    try {
        console.log('Fixing news_reactions foreign key constraint...');

        // Drop the incorrect foreign key
        await pool.execute(`
            ALTER TABLE news_reactions DROP FOREIGN KEY fk_user_id
        `);
        console.log('✅ Dropped incorrect foreign key');

        // Add the correct foreign key
        await pool.execute(`
            ALTER TABLE news_reactions 
            ADD CONSTRAINT fk_user_id 
            FOREIGN KEY (user_id) REFERENCES employee_records(id) ON DELETE CASCADE
        `);
        console.log('✅ Added correct foreign key');

        // Verify
        const [constraints] = await pool.query(`
            SELECT 
                CONSTRAINT_NAME,
                TABLE_NAME,
                COLUMN_NAME,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'news_reactions'
            AND CONSTRAINT_NAME = 'fk_user_id'
        `);

        console.log('Current foreign key:', constraints[0]);
        console.log('✅ Foreign key fixed successfully!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error fixing foreign key:', error);
        process.exit(1);
    }
}

fixNewsReactionsForeignKey();
