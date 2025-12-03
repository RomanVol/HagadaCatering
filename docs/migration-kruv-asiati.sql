-- Migration: Add כרוב אסייתי salad with add-ons support
-- Run this in Supabase SQL Editor

-- 1. Create the food_item_add_ons table for conditional add-ons
CREATE TABLE IF NOT EXISTS food_item_add_ons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_food_item_id UUID NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  measurement_type TEXT NOT NULL DEFAULT 'liters' CHECK (measurement_type IN ('liters', 'size', 'none')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_add_ons_parent ON food_item_add_ons(parent_food_item_id);

-- 2. Add measurement_type column to food_items if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'food_items' AND column_name = 'measurement_type'
  ) THEN
    ALTER TABLE food_items ADD COLUMN measurement_type TEXT DEFAULT 'none';
  END IF;
END $$;

-- Update existing salad items to have 'liters' measurement type
UPDATE food_items 
SET measurement_type = 'liters' 
WHERE has_liters = true AND (measurement_type IS NULL OR measurement_type = 'none');

-- 3. Insert כרוב אסייתי salad with 'size' measurement type
INSERT INTO food_items (id, category_id, name, has_liters, measurement_type, is_active, sort_order)
SELECT 
  gen_random_uuid(),
  c.id,
  'כרוב אסייתי',
  true,
  'size',
  true,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM food_items WHERE category_id = c.id)
FROM categories c
WHERE c.name_en = 'salads'
ON CONFLICT DO NOTHING;

-- 4. Get the ID of כרוב אסייתי and insert its add-ons
DO $$
DECLARE
  kruv_id UUID;
BEGIN
  -- Get the כרוב אסייתי ID
  SELECT id INTO kruv_id FROM food_items WHERE name = 'כרוב אסייתי' LIMIT 1;
  
  IF kruv_id IS NOT NULL THEN
    -- Insert גזר מגורד add-on (measured in liters)
    INSERT INTO food_item_add_ons (parent_food_item_id, name, measurement_type, sort_order)
    VALUES (kruv_id, 'גזר מגורד', 'liters', 1)
    ON CONFLICT DO NOTHING;
    
    -- Insert מלפפון מגורד add-on (measured in liters)
    INSERT INTO food_item_add_ons (parent_food_item_id, name, measurement_type, sort_order)
    VALUES (kruv_id, 'מלפפון מגורד', 'liters', 2)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- 5. Enable RLS on the new table
ALTER TABLE food_item_add_ons ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access on food_item_add_ons"
  ON food_item_add_ons
  FOR SELECT
  TO public
  USING (true);

-- Create policy for authenticated insert/update/delete
CREATE POLICY "Allow authenticated write access on food_item_add_ons"
  ON food_item_add_ons
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Also allow anon to write (for development)
CREATE POLICY "Allow anon write access on food_item_add_ons"
  ON food_item_add_ons
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Verify the insertion
SELECT 
  fi.name as salad_name,
  fi.measurement_type,
  fia.name as addon_name,
  fia.measurement_type as addon_measurement
FROM food_items fi
LEFT JOIN food_item_add_ons fia ON fi.id = fia.parent_food_item_id
WHERE fi.name = 'כרוב אסייתי';
