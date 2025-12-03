-- Migration: Fix unique constraint on order_items
-- Run this in Supabase SQL Editor

-- Drop the old constraint that doesn't account for add-ons, size_type, and variations
ALTER TABLE order_items 
DROP CONSTRAINT IF EXISTS order_items_unique_combo;

-- Create a new constraint that includes all the relevant columns
-- This allows the same food_item to appear multiple times with different add-ons, sizes, or variations
ALTER TABLE order_items 
ADD CONSTRAINT order_items_unique_combo 
UNIQUE (order_id, food_item_id, liter_size_id, size_type, add_on_id, variation_id);

-- Verify the constraint was updated
SELECT conname, contype, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'order_items'::regclass;
