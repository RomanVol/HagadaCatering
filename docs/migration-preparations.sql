-- Migration: Add preparation options for food items
-- Run this in Supabase SQL Editor

-- 1. Create the food_item_preparations table
CREATE TABLE IF NOT EXISTS food_item_preparations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_food_item_id UUID NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_preparations_parent_food_item ON food_item_preparations(parent_food_item_id);

-- 2. Add preparation_id column to order_items
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS preparation_id UUID REFERENCES food_item_preparations(id) ON DELETE SET NULL;

-- 3. Enable RLS on the new table
ALTER TABLE food_item_preparations ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access on food_item_preparations"
  ON food_item_preparations
  FOR SELECT
  TO public
  USING (true);

-- Create policy for authenticated insert/update/delete
CREATE POLICY "Allow authenticated write access on food_item_preparations"
  ON food_item_preparations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Also allow anon to write (for development)
CREATE POLICY "Allow anon write access on food_item_preparations"
  ON food_item_preparations
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE food_item_preparations IS 'Preparation options for food items (e.g., עשבי תיבול, ברוטב מזרחי)';
COMMENT ON COLUMN order_items.preparation_id IS 'Selected preparation option for this order item';

-- 4. Example: Add preparations for דג לברק (you'll need the actual food_item_id)
-- First, find the דג לברק food item
-- SELECT id FROM food_items WHERE name = 'דג לברק';
-- Then insert preparations using that id:
-- INSERT INTO food_item_preparations (parent_food_item_id, name, sort_order) VALUES
--   ('REPLACE_WITH_ACTUAL_ID', 'עשבי תיבול', 1),
--   ('REPLACE_WITH_ACTUAL_ID', 'ברוטב מזרחי', 2),
--   ('REPLACE_WITH_ACTUAL_ID', 'להשאיר רגיל', 3);

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'order_items'
ORDER BY ordinal_position;
