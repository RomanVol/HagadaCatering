-- Migration: Add size support to order_items for Big/Small (ג/ק) measurements
-- Run this in Supabase SQL Editor AFTER running migration-kruv-asiati.sql

-- 1. Add size_type column to order_items for storing big/small
-- Instead of creating fake liter_size entries, we'll add a proper column
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS size_type TEXT CHECK (size_type IN ('big', 'small') OR size_type IS NULL);

-- 2. Update the order_items table to allow null liter_size_id for size-based items
-- (Already nullable, but let's make sure)
ALTER TABLE order_items 
ALTER COLUMN liter_size_id DROP NOT NULL;

-- 3. Comment explaining the storage pattern:
-- For liter-based items: liter_size_id is set, size_type is NULL
-- For size-based items: liter_size_id is NULL, size_type is 'big' or 'small'
-- For regular items: both are NULL

COMMENT ON COLUMN order_items.size_type IS 'For size-based measurement: big (ג) or small (ק). NULL for liter-based or regular items.';

-- 4. Create a check constraint to ensure either liter_size_id OR size_type is used, not both
-- (Allow both to be NULL for regular items)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'order_items_measurement_check'
  ) THEN
    ALTER TABLE order_items 
    ADD CONSTRAINT order_items_measurement_check 
    CHECK (NOT (liter_size_id IS NOT NULL AND size_type IS NOT NULL));
  END IF;
END $$;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'order_items'
ORDER BY ordinal_position;
