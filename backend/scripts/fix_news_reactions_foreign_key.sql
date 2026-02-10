-- Fix news_reactions foreign key constraint
-- The table is referencing 'users' but should reference 'employee_records'

-- Step 1: Drop the incorrect foreign key constraint
ALTER TABLE news_reactions DROP FOREIGN KEY fk_user_id;

-- Step 2: Add the correct foreign key constraint
ALTER TABLE news_reactions 
ADD CONSTRAINT fk_user_id 
FOREIGN KEY (user_id) REFERENCES employee_records(id) ON DELETE CASCADE;

-- Verify the fix
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'news_reactions'
AND CONSTRAINT_NAME = 'fk_user_id';
