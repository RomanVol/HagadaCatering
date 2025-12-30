-- Migration: Add linked_food_item_id to food_item_add_ons
-- This allows add-ons to reference existing food items (e.g., טחינה add-on links to טחינה salad)

-- Add linked_food_item_id column
ALTER TABLE food_item_add_ons
ADD COLUMN linked_food_item_id UUID REFERENCES food_items(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_food_item_add_ons_linked
ON food_item_add_ons(linked_food_item_id);
