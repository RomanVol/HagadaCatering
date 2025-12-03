-- Migration: Add item_note column to order_items for free-text notes per item
-- Run this in Supabase SQL Editor

-- 1. Add item_note column to order_items
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS item_note TEXT;

-- 2. Add comment explaining the field
COMMENT ON COLUMN order_items.item_note IS 'Free-text note for this order item (e.g., special preparation instructions for a salad)';

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'order_items'
ORDER BY ordinal_position;
