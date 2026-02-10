const { pool } = require('../Utils/db');

async function fixNewsReactionsCollation() {
    try {
        console.log('Fixing news_reactions table collation...');

        // Fix the emoji column collation
        await pool.execute(`
            ALTER TABLE news_reactions 
            MODIFY COLUMN emoji VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
        `);

        console.log('✅ news_reactions table collation fixed successfully!');

        // Verify the change
        const [columns] = await pool.query(`
            SELECT COLUMN_NAME, CHARACTER_SET_NAME, COLLATION_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'news_reactions' 
            AND COLUMN_NAME = 'emoji'
        `);

        console.log('Current emoji column collation:', columns[0]);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error fixing collation:', error);
        process.exit(1);
    }
}

fixNewsReactionsCollation();
