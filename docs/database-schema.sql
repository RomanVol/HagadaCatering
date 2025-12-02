-- Kitchen Orders Database Schema
-- Run this in your Supabase SQL Editor

-- =============================================
-- 1. CUSTOMERS TABLE (unique by phone)
-- =============================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  name TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT customers_phone_unique UNIQUE (phone)
);

-- Index for phone lookups
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers (phone);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers (name);

COMMENT ON TABLE customers IS 'Customers identified by unique phone number';

-- =============================================
-- 2. CATEGORIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_en TEXT NOT NULL,
  max_selection INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT categories_name_unique UNIQUE (name),
  CONSTRAINT categories_name_en_unique UNIQUE (name_en)
);

CREATE INDEX IF NOT EXISTS idx_categories_sort ON categories (sort_order);

-- =============================================
-- 3. LITER SIZES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS liter_sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  size DECIMAL(3,1) NOT NULL,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT liter_sizes_size_unique UNIQUE (size)
);

CREATE INDEX IF NOT EXISTS idx_liter_sizes_sort ON liter_sizes (sort_order);

-- =============================================
-- 4. FOOD ITEMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS food_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  has_liters BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT food_items_name_category_unique UNIQUE (name, category_id)
);

CREATE INDEX IF NOT EXISTS idx_food_items_category ON food_items (category_id);
CREATE INDEX IF NOT EXISTS idx_food_items_active ON food_items (is_active);
CREATE INDEX IF NOT EXISTS idx_food_items_sort ON food_items (category_id, sort_order);

-- =============================================
-- 5. ORDERS TABLE (references customers)
-- =============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number SERIAL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  order_date DATE NOT NULL,
  order_time TIME,
  delivery_address TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT orders_status_check CHECK (status IN ('draft', 'active', 'completed', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_orders_date ON orders (order_date);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_updated ON orders (updated_at);

-- =============================================
-- 6. ORDER ITEMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  food_item_id UUID NOT NULL REFERENCES food_items(id) ON DELETE RESTRICT,
  liter_size_id UUID REFERENCES liter_sizes(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT order_items_quantity_positive CHECK (quantity > 0),
  CONSTRAINT order_items_unique_combo UNIQUE (order_id, food_item_id, liter_size_id)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_food ON order_items (food_item_id);

-- =============================================
-- 7. UPDATED_AT TRIGGER FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to customers
DROP TRIGGER IF EXISTS customers_updated_at ON customers;
CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to orders
DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 8. ROW LEVEL SECURITY (Optional - for public access)
-- =============================================
-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE liter_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Allow public access (or change to 'authenticated' if you need auth)
CREATE POLICY "Allow all for anon" ON customers FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON categories FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON liter_sizes FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON food_items FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON orders FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON order_items FOR ALL TO anon USING (true) WITH CHECK (true);

-- =============================================
-- 9. SEED DATA - Categories
-- =============================================
INSERT INTO categories (name, name_en, max_selection, sort_order) VALUES
  ('סלטים', 'salads', 10, 1),
  ('מנות ביניים', 'middle_courses', 2, 2),
  ('תוספות', 'sides', 3, 3),
  ('עיקריות', 'mains', 3, 4),
  ('אקסטרות', 'extras', NULL, 5)
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- 10. SEED DATA - Liter Sizes
-- =============================================
INSERT INTO liter_sizes (size, label, sort_order) VALUES
  (4.5, '4.5L', 1),
  (3.0, '3L', 2),
  (2.5, '2.5L', 3),
  (1.5, '1.5L', 4)
ON CONFLICT (size) DO NOTHING;

-- =============================================
-- 11. SEED DATA - Food Items (Salads)
-- =============================================
INSERT INTO food_items (category_id, name, has_liters, sort_order)
SELECT c.id, s.name, true, s.sort_order
FROM categories c
CROSS JOIN (VALUES 
  ('חומוס', 1),
  ('טחינה', 2),
  ('חצילים', 3),
  ('מטבוחה', 4),
  ('סלט ירקות', 5),
  ('סלט חצילים', 6),
  ('פלפל קלוי', 7),
  ('כרוב סגול', 8),
  ('כרוב לבן', 9),
  ('גזר מרוקאי', 10),
  ('סלט תפוחי אדמה', 11),
  ('חמוצים', 12),
  ('סלט טונה', 13),
  ('סלט ביצים', 14),
  ('טבולה', 15),
  ('סלט קוסקוס', 16),
  ('סלט פסטה', 17),
  ('סלט עגבניות', 18),
  ('סלט מלפפונים', 19),
  ('פטריות', 20),
  ('סלט בורגול', 21),
  ('סלט אורז', 22),
  ('סלט קינואה', 23),
  ('סלט עדשים', 24),
  ('סלט גרגירי חומוס', 25),
  ('סלט סלק', 26),
  ('סלט כרובית', 27),
  ('סלט ברוקולי', 28)
) AS s(name, sort_order)
WHERE c.name_en = 'salads'
ON CONFLICT (name, category_id) DO NOTHING;

-- =============================================
-- 12. SEED DATA - Food Items (Middle Courses)
-- =============================================
INSERT INTO food_items (category_id, name, has_liters, sort_order)
SELECT c.id, s.name, false, s.sort_order
FROM categories c
CROSS JOIN (VALUES 
  ('פילה מושט מזרחי', 1),
  ('קציצות דגים', 2),
  ('פילה אמנון', 3),
  ('דג סלמון', 4),
  ('קרפיון', 5),
  ('פילה בורי', 6),
  ('דניס', 7),
  ('לוקוס', 8),
  ('פילה מושט פריך', 9)
) AS s(name, sort_order)
WHERE c.name_en = 'middle_courses'
ON CONFLICT (name, category_id) DO NOTHING;

-- =============================================
-- 13. SEED DATA - Food Items (Sides)
-- =============================================
INSERT INTO food_items (category_id, name, has_liters, sort_order)
SELECT c.id, s.name, false, s.sort_order
FROM categories c
CROSS JOIN (VALUES 
  ('אורז לבן', 1),
  ('אורז אדום', 2),
  ('פתיתים', 3),
  ('קוסקוס', 4),
  ('פירה', 5),
  ('צ''יפס', 6),
  ('תפוחי אדמה אפויים', 7),
  ('ירקות מוקפצים', 8),
  ('ירקות בגריל', 9),
  ('סלט ירוק', 10),
  ('לחם', 11)
) AS s(name, sort_order)
WHERE c.name_en = 'sides'
ON CONFLICT (name, category_id) DO NOTHING;

-- =============================================
-- 14. SEED DATA - Food Items (Mains)
-- =============================================
INSERT INTO food_items (category_id, name, has_liters, sort_order)
SELECT c.id, s.name, false, s.sort_order
FROM categories c
CROSS JOIN (VALUES 
  ('עוף בגריל', 1),
  ('שניצל', 2),
  ('כרעיים', 3),
  ('פרגית', 4),
  ('סטייק פרגית', 5),
  ('שיפודי פרגית', 6),
  ('המבורגר', 7),
  ('קבב', 8),
  ('שווארמה', 9),
  ('צלי בקר', 10),
  ('אנטריקוט', 11)
) AS s(name, sort_order)
WHERE c.name_en = 'mains'
ON CONFLICT (name, category_id) DO NOTHING;

-- =============================================
-- DONE! Your database is ready.
-- =============================================
