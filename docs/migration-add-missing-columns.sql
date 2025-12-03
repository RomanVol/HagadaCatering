-- Migration: Add missing columns to order_items table
-- Run this in Supabase SQL Editor

-- Add item_note column for free-text notes on each item
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS item_note TEXT;

-- Add size_type column for Big/Small measurements (ג/ק)
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS size_type TEXT CHECK (size_type IN ('big', 'small'));

-- Add preparation_id column for preparation options
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS preparation_id UUID REFERENCES food_item_preparations(id) ON DELETE SET NULL;

-- Add variation_id column for item variations (e.g., rice types)
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS variation_id UUID REFERENCES food_item_variations(id) ON DELETE SET NULL;

-- Add comments
COMMENT ON COLUMN order_items.item_note IS 'Free-text note for this specific item';
COMMENT ON COLUMN order_items.size_type IS 'Size type: big (ג) or small (ק)';
COMMENT ON COLUMN order_items.preparation_id IS 'Selected preparation option for this item';
COMMENT ON COLUMN order_items.variation_id IS 'Selected variation for this item (e.g., rice type)';

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'order_items'
ORDER BY ordinal_position;
