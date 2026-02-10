-- COMPLETE FIX for all news-related tables collation
-- Run ALL these queries on your live database

-- Fix news table
ALTER TABLE news CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Fix news_reactions table
ALTER TABLE news_reactions CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Explicitly fix all text columns in news table
ALTER TABLE news 
MODIFY COLUMN title VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
MODIFY COLUMN content TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY COLUMN post_type VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'text';

-- Explicitly fix emoji column in news_reactions
ALTER TABLE news_reactions 
MODIFY COLUMN emoji VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

-- Verify all columns
SELECT 
    TABLE_NAME,
    COLUMN_NAME, 
    CHARACTER_SET_NAME, 
    COLLATION_NAME
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME IN ('news', 'news_reactions')
AND CHARACTER_SET_NAME IS NOT NULL
ORDER BY TABLE_NAME, COLUMN_NAME;
