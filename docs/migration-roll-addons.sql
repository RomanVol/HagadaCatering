-- Migration: Add add-ons for רול items in salads category
-- Run this in Supabase SQL Editor

-- 1. Create the food_item_add_ons table (if not exists)
CREATE TABLE IF NOT EXISTS food_item_add_ons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_food_item_id UUID NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  measurement_type TEXT NOT NULL DEFAULT 'none', -- 'liters', 'size', 'none'
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_add_ons_parent_food_item ON food_item_add_ons(parent_food_item_id);

-- 2. Enable RLS on the new table
ALTER TABLE food_item_add_ons ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public read access on food_item_add_ons" ON food_item_add_ons;
DROP POLICY IF EXISTS "Allow anon write access on food_item_add_ons" ON food_item_add_ons;

-- Create policies for access
CREATE POLICY "Allow public read access on food_item_add_ons"
  ON food_item_add_ons
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow anon write access on food_item_add_ons"
  ON food_item_add_ons
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- 3. Add add_on_id column to order_items for tracking selected add-ons
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS add_on_id UUID REFERENCES food_item_add_ons(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS parent_order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE;

-- Add comment
COMMENT ON TABLE food_item_add_ons IS 'Add-on items that appear when parent item is selected (e.g., רוטב לרול when רול is selected)';
COMMENT ON COLUMN order_items.add_on_id IS 'Reference to the add-on if this order item is an add-on selection';
COMMENT ON COLUMN order_items.parent_order_item_id IS 'Reference to the parent order item if this is an add-on';

-- 4. Insert add-ons for all רול items in סלטים category
-- First, let's find all רול items and add the add-ons

-- Insert add-ons for each רול item
INSERT INTO food_item_add_ons (parent_food_item_id, name, measurement_type, sort_order)
SELECT 
  f.id,
  addon.name,
  'none',
  addon.sort_order
FROM food_items f
CROSS JOIN (
  VALUES 
    ('רוטב לרול', 1),
    ('שקדים וצימוקים', 2)
) AS addon(name, sort_order)
WHERE f.name LIKE '%רול%'
  AND f.category_id IN (SELECT id FROM categories WHERE name_en = 'salads')
ON CONFLICT DO NOTHING;

-- 5. Verify the add-ons were created
SELECT 
  f.name as food_item_name,
  a.name as addon_name,
  a.sort_order
FROM food_item_add_ons a
JOIN food_items f ON f.id = a.parent_food_item_id
ORDER BY f.name, a.sort_order;
