-- Migration: Add extra_order_items tables for storing extra items with custom prices
-- This allows users to add items from mains/sides/middle_courses as extras with custom pricing

-- Main table for extra order items
CREATE TABLE IF NOT EXISTS extra_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  source_food_item_id UUID NOT NULL REFERENCES food_items(id),
  source_category TEXT NOT NULL CHECK (source_category IN ('mains', 'sides', 'middle_courses')),
  name TEXT NOT NULL,

  -- Quantity fields (based on source category)
  quantity INTEGER DEFAULT 0,
  size_big INTEGER DEFAULT 0,
  size_small INTEGER DEFAULT 0,

  -- Price (required)
  price DECIMAL(10,2) NOT NULL,

  -- Optional fields
  note TEXT,
  preparation_name TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- For variations (sides with multiple types like rice)
CREATE TABLE IF NOT EXISTS extra_order_item_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extra_order_item_id UUID NOT NULL REFERENCES extra_order_items(id) ON DELETE CASCADE,
  variation_id UUID REFERENCES food_item_variations(id),
  name TEXT NOT NULL,
  size_big INTEGER DEFAULT 0,
  size_small INTEGER DEFAULT 0
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_extra_order_items_order_id ON extra_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_extra_order_item_variations_extra_id ON extra_order_item_variations(extra_order_item_id);

-- Enable Row Level Security
ALTER TABLE extra_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE extra_order_item_variations ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow all operations for authenticated users on extra_order_items"
  ON extra_order_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users on extra_order_item_variations"
  ON extra_order_item_variations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
