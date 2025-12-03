-- Migration: Add rice variations feature
-- Run this in Supabase SQL Editor

-- 1. Create the food_item_variations table for items like אורז that have multiple types
CREATE TABLE IF NOT EXISTS food_item_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_food_item_id UUID NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_variations_parent_food_item ON food_item_variations(parent_food_item_id);

-- 2. Enable RLS on the new table
ALTER TABLE food_item_variations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access on food_item_variations" ON food_item_variations;
DROP POLICY IF EXISTS "Allow anon write access on food_item_variations" ON food_item_variations;

-- Create policies for access
CREATE POLICY "Allow public read access on food_item_variations"
  ON food_item_variations
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow anon write access on food_item_variations"
  ON food_item_variations
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- 3. Add variation_id column to order_items for tracking selected variations
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS variation_id UUID REFERENCES food_item_variations(id) ON DELETE SET NULL;

-- Add comment
COMMENT ON TABLE food_item_variations IS 'Variations of food items (e.g., אורז לבן, אורז אדום, אורז ירוק)';
COMMENT ON COLUMN order_items.variation_id IS 'Reference to the variation if this order item uses a variation';

-- 4. Rename "אורז לבן" to "אורז" in food_items (in תוספות category)
UPDATE food_items 
SET name = 'אורז'
WHERE name = 'אורז לבן' 
  AND category_id IN (SELECT id FROM categories WHERE name_en = 'sides');

-- 5. Insert rice variations for the אורז item
INSERT INTO food_item_variations (parent_food_item_id, name, sort_order)
SELECT 
  f.id,
  variation.name,
  variation.sort_order
FROM food_items f
CROSS JOIN (
  VALUES 
    ('לבן', 1),
    ('ירוק', 2),
    ('אשפלו', 3),
    ('אדום', 4),
    ('לבנוני', 5)
) AS variation(name, sort_order)
WHERE f.name = 'אורז'
  AND f.category_id IN (SELECT id FROM categories WHERE name_en = 'sides')
ON CONFLICT DO NOTHING;

-- 6. Verify the variations were created
SELECT 
  f.name as food_item_name,
  v.name as variation_name,
  v.sort_order
FROM food_item_variations v
JOIN food_items f ON f.id = v.parent_food_item_id
ORDER BY f.name, v.sort_order;
