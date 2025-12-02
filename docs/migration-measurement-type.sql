-- Add measurement_type column to food_items table
-- This supports different measurement types for salads:
-- 'liters' = 1.5L, 2.5L, 3L, 4.5L (existing behavior)
-- 'size' = Big (ג) / Small (ק) with quantities
-- 'none' = just regular quantity (for non-salad items)

-- Create the enum type for measurement
DO $$ BEGIN
    CREATE TYPE measurement_type AS ENUM ('liters', 'size', 'none');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add the column with default value based on existing has_liters
ALTER TABLE food_items 
ADD COLUMN IF NOT EXISTS measurement_type measurement_type DEFAULT 'none';

-- Update existing items: if has_liters is true, set to 'liters'
UPDATE food_items 
SET measurement_type = 'liters' 
WHERE has_liters = true AND measurement_type = 'none';

-- For items that should use size measurement, you can update them like this:
-- UPDATE food_items SET measurement_type = 'size' WHERE name = 'שם הסלט';

-- Example: If you want to add a new salad with 'size' measurement type:
-- INSERT INTO food_items (id, category_id, name, has_liters, measurement_type, is_active, sort_order)
-- VALUES (
--   gen_random_uuid(),
--   (SELECT id FROM categories WHERE name_en = 'salads'),
--   'סלט חדש עם גדלים',
--   true,
--   'size',
--   true,
--   99
-- );

COMMENT ON COLUMN food_items.measurement_type IS 'Type of measurement: liters (1.5L, 2.5L, etc.), size (Big ג / Small ק), or none (regular quantity)';
