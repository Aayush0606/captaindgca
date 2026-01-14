-- Migration: Make topic.category_id nullable
-- This allows topics to be created without categories
-- Topics can be linked to categories later via the Content Manager

-- Step 1: Drop the NOT NULL constraint on category_id
ALTER TABLE public.topics ALTER COLUMN category_id DROP NOT NULL;

-- Note: The UNIQUE constraint on (category_id, slug) will still work
-- Multiple topics with the same slug but NULL category_id are allowed
-- This is the expected behavior in PostgreSQL
