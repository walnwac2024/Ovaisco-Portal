-- COMPREHENSIVE FIX for news_reactions collation error
-- This fixes: Illegal mix of collations (latin1_swedish_ci,IMPLICIT) and (utf8mb4_unicode_ci,COERCIBLE)

-- Step 1: Convert the entire table to utf8mb4
ALTER TABLE news_reactions CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Step 2: Explicitly set each text column to utf8mb4 (just to be sure)
ALTER TABLE news_reactions 
MODIFY COLUMN emoji VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

-- Step 3: Verify the fix
SELECT 
    COLUMN_NAME, 
    CHARACTER_SET_NAME, 
    COLLATION_NAME,
    COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'news_reactions';
