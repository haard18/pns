-- Migration: Remove UNIQUE constraint on name column
-- This allows multiple domains with empty or duplicate names
-- since name_hash is the true unique identifier

-- Drop the UNIQUE constraint on name column
ALTER TABLE domains DROP CONSTRAINT IF EXISTS domains_name_key;

-- Optional: Clean up duplicate empty names (keep only the first one)
-- Uncomment if you want to remove duplicates, but this is not necessary
-- since we're removing the constraint

-- DELETE FROM domains 
-- WHERE id NOT IN (
--     SELECT MIN(id) 
--     FROM domains 
--     WHERE name = '' 
--     GROUP BY name_hash
-- ) AND name = '';

-- Verify the change
SELECT 
    COUNT(*) as total_domains,
    COUNT(DISTINCT name_hash) as unique_name_hashes,
    COUNT(CASE WHEN name = '' THEN 1 END) as empty_names
FROM domains;
