-- Migration: Add portion size information for food items
-- Run this in Supabase SQL Editor

-- 1. Add portion size columns to food_items table
ALTER TABLE food_items
ADD COLUMN IF NOT EXISTS portion_multiplier DECIMAL(10, 2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS portion_unit TEXT DEFAULT NULL;

-- portion_multiplier: The number to multiply by quantity (e.g., 2 for חצי שניצל, 3 for קציצות, 100 for 100g portions)
-- portion_unit: The unit to display (e.g., 'יחידות', 'קציצות', 'גרם', 'ק״ג')

-- Add comments
COMMENT ON COLUMN food_items.portion_multiplier IS 'Multiplier for calculating total portion (e.g., 2 for half schnitzel, 3 for meatballs, 100 for 100g portions)';
COMMENT ON COLUMN food_items.portion_unit IS 'Unit to display for portion calculation (e.g., יחידות, קציצות, גרם, ק״ג)';

-- 2. Update existing items with portion information
-- חצאי שניצל - Each portion is half a schnitzel, so multiply by 2 to get full count
UPDATE food_items SET portion_multiplier = 2, portion_unit = 'חצאים' WHERE name = 'חצאי שניצל';

-- חצאי כרעיים - Each portion is half a leg, so multiply by 2
UPDATE food_items SET portion_multiplier = 2, portion_unit = 'חצאים' WHERE name = 'חצאי כרעיים';

-- If you have קציצות ברוטב, uncomment this:
-- UPDATE food_items SET portion_multiplier = 3, portion_unit = 'קציצות' WHERE name = 'קציצות ברוטב';

-- If you have קוביות בשר, uncomment and adjust:
-- UPDATE food_items SET portion_multiplier = 100, portion_unit = 'גרם' WHERE name LIKE '%קוביות בשר%';

-- 3. Verify the changes
SELECT 
  id, 
  name, 
  portion_multiplier, 
  portion_unit 
FROM food_items 
WHERE category_id IN (
  SELECT id FROM categories WHERE name_en = 'mains'
)
ORDER BY sort_order;
