-- Migration: Add custom liter sizes per food item
-- This allows adding custom liter options (like 1L) to specific salad items

-- Table for custom liter sizes per food item
CREATE TABLE IF NOT EXISTS food_item_custom_liters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  food_item_id UUID NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
  size DECIMAL(3,1) NOT NULL,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Each food item can only have one custom liter of each size
  CONSTRAINT food_item_custom_liters_unique UNIQUE (food_item_id, size)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_food_item_custom_liters_food_item ON food_item_custom_liters(food_item_id);
CREATE INDEX IF NOT EXISTS idx_food_item_custom_liters_sort ON food_item_custom_liters(sort_order);

-- Enable Row Level Security
ALTER TABLE food_item_custom_liters ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Allow all operations for authenticated users on food_item_custom_liters"
  ON food_item_custom_liters
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
