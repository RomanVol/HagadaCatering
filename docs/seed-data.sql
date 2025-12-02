-- Seed Data for Kitchen Order Management System
-- מערכת ניהול הזמנות למטבח
-- Run this after initial migration

-- ============================================
-- 1. Categories
-- ============================================
INSERT INTO categories (id, name, name_en, max_selection, sort_order) VALUES
  (gen_random_uuid(), 'סלטים', 'salads', 10, 1),
  (gen_random_uuid(), 'מנות ביניים', 'middle_courses', 2, 2),
  (gen_random_uuid(), 'תוספות', 'sides', 3, 3),
  (gen_random_uuid(), 'עיקריות', 'mains', 3, 4),
  (gen_random_uuid(), 'אקסטרות', 'extras', NULL, 5)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 2. Liter Sizes
-- ============================================
INSERT INTO liter_sizes (id, size, label, sort_order) VALUES
  (gen_random_uuid(), 1.5, '1.5L', 1),
  (gen_random_uuid(), 2.5, '2.5L', 2),
  (gen_random_uuid(), 3.0, '3L', 3),
  (gen_random_uuid(), 4.5, '4.5L', 4)
ON CONFLICT (size) DO NOTHING;

-- ============================================
-- 3. Food Items - Salads (סלטים)
-- ============================================
INSERT INTO food_items (id, category_id, name, has_liters, is_active, sort_order)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM categories WHERE name_en = 'salads'),
  name,
  TRUE,
  TRUE,
  sort_order
FROM (VALUES
  (1, 'מטבוחה'),
  (2, 'חציל מטוגן'),
  (3, 'חציל במיונז'),
  (4, 'חציל זעלוק'),
  (5, 'חציל בלאדי'),
  (6, 'סלק'),
  (7, 'גזר מבושל'),
  (8, 'גזר חי'),
  (9, 'פלפל חריף'),
  (10, 'חומוס'),
  (11, 'טחינה'),
  (12, 'ערבי'),
  (13, 'ירקות'),
  (14, 'חסה'),
  (15, 'כרוב'),
  (16, 'חמוצי הבית'),
  (17, 'זיתים'),
  (18, 'מלפפון בשמיר'),
  (19, 'קונסולו'),
  (20, 'כרוב אדום במיונז'),
  (21, 'כרוב אדום חמוץ'),
  (22, 'תירס ופטריות'),
  (23, 'פול'),
  (24, 'מיונז'),
  (25, 'טאבולה'),
  (26, 'ירוק'),
  (27, 'לימון צ''רמלה'),
  (28, 'ירק פיצוחים')
) AS t(sort_order, name)
ON CONFLICT (name, category_id) DO NOTHING;

-- ============================================
-- 4. Food Items - Middle Courses (מנות ביניים)
-- ============================================
INSERT INTO food_items (id, category_id, name, has_liters, is_active, sort_order)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM categories WHERE name_en = 'middle_courses'),
  name,
  FALSE,
  TRUE,
  sort_order
FROM (VALUES
  (1, 'פילה מושט מזרחי'),
  (2, 'פילה מושט מטוגן'),
  (3, 'סול מטוגן'),
  (4, 'סלומון מזרחי'),
  (5, 'סלמון בעשבי תיבול'),
  (6, 'גסיכה'),
  (7, 'בורקס רוטב פטריות'),
  (8, 'מאפה השף'),
  (9, 'רול בשר'),
  (10, 'רול ירקות'),
  (11, 'חמין')
) AS t(sort_order, name)
ON CONFLICT (name, category_id) DO NOTHING;

-- ============================================
-- 5. Food Items - Sides (תוספות)
-- ============================================
INSERT INTO food_items (id, category_id, name, has_liters, is_active, sort_order)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM categories WHERE name_en = 'sides'),
  name,
  FALSE,
  TRUE,
  sort_order
FROM (VALUES
  (1, 'אורז'),
  (2, 'תפו"א אפויים'),
  (3, 'זיתים מרוקאים'),
  (4, 'ארטישוק ופטריות'),
  (5, 'אפונה וגזר'),
  (6, 'אפונה וארטישוק'),
  (7, 'ירקות מוקפצים'),
  (8, 'שעועית ברוטב'),
  (9, 'שעועית מוקפצת'),
  (10, 'קוסקוס'),
  (11, 'ירקות לקוסקוס')
) AS t(sort_order, name)
ON CONFLICT (name, category_id) DO NOTHING;

-- ============================================
-- 6. Food Items - Mains (עיקריות)
-- ============================================
INSERT INTO food_items (id, category_id, name, has_liters, is_active, sort_order)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM categories WHERE name_en = 'mains'),
  name,
  FALSE,
  TRUE,
  sort_order
FROM (VALUES
  (1, 'כרעיים אפוי'),
  (2, 'חצאי כרעיים'),
  (3, 'פרגיות'),
  (4, 'שניצל מטוגן'),
  (5, 'חצאי שניצל'),
  (6, 'בשר ברוטב'),
  (7, 'לשון ברוטב'),
  (8, 'אסאדו'),
  (9, 'שיפודי קבב'),
  (10, 'שיפודי עוף'),
  (11, 'חזה עוף')
) AS t(sort_order, name)
ON CONFLICT (name, category_id) DO NOTHING;

-- ============================================
-- 7. Default Print Layout
-- ============================================
INSERT INTO print_layouts (id, name, template, is_default) VALUES
(
  gen_random_uuid(),
  'ברירת מחדל',
  '{
    "showHeader": true,
    "headerText": "בס\"ד",
    "showOrderNumber": true,
    "showCustomerInfo": true,
    "showDate": true,
    "showTime": true,
    "showAddress": true,
    "showNotes": true,
    "sections": [
      { "category": "salads", "show": true, "order": 1 },
      { "category": "middle_courses", "show": true, "order": 2 },
      { "category": "sides", "show": true, "order": 3 },
      { "category": "mains", "show": true, "order": 4 },
      { "category": "extras", "show": true, "order": 5 }
    ],
    "fontSize": "medium",
    "orientation": "portrait",
    "showUnselectedItems": false,
    "showCategoryTitles": true
  }'::jsonb,
  TRUE
),
(
  gen_random_uuid(),
  'מטבח - מקוצר',
  '{
    "showHeader": true,
    "headerText": "בס\"ד",
    "showOrderNumber": true,
    "showCustomerInfo": false,
    "showDate": true,
    "showTime": true,
    "showAddress": false,
    "showNotes": true,
    "sections": [
      { "category": "salads", "show": true, "order": 1 },
      { "category": "middle_courses", "show": true, "order": 2 },
      { "category": "sides", "show": true, "order": 3 },
      { "category": "mains", "show": true, "order": 4 },
      { "category": "extras", "show": true, "order": 5 }
    ],
    "fontSize": "large",
    "orientation": "portrait",
    "showUnselectedItems": false,
    "showCategoryTitles": true
  }'::jsonb,
  FALSE
)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 8. App Settings
-- ============================================
INSERT INTO settings (id, key, value) VALUES
(
  gen_random_uuid(),
  'app_name',
  '{"he": "מערכת ניהול הזמנות", "en": "Order Management System"}'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- Verification Queries (optional - run to verify)
-- ============================================

-- Count items per category
-- SELECT c.name, COUNT(f.id) as item_count
-- FROM categories c
-- LEFT JOIN food_items f ON c.id = f.category_id
-- GROUP BY c.id, c.name, c.sort_order
-- ORDER BY c.sort_order;

-- Expected results:
-- סלטים: 28
-- מנות ביניים: 11
-- תוספות: 11
-- עיקריות: 11
-- אקסטרות: 0

-- List all salads
-- SELECT sort_order, name FROM food_items 
-- WHERE category_id = (SELECT id FROM categories WHERE name_en = 'salads')
-- ORDER BY sort_order;
