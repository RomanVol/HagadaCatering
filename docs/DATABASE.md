# Database Documentation
# מערכת ניהול הזמנות למטבח

## 1. Overview

### 1.1 Database System
- **Cloud Database**: Supabase (PostgreSQL)
- **Local Database**: PowerSync (SQLite)
- **Sync**: Bi-directional via PowerSync

### 1.2 Schema Design Principles
- UUID primary keys for sync compatibility
- Timestamps for conflict resolution
- Soft deletes where appropriate
- Hebrew text stored as UTF-8

---

## 2. Entity Relationship Diagram

```
┌──────────────────┐       ┌──────────────────┐
│    categories    │       │   liter_sizes    │
├──────────────────┤       ├──────────────────┤
│ id (PK)          │       │ id (PK)          │
│ name             │       │ size             │
│ name_en          │       │ label            │
│ max_selection    │       │ sort_order       │
│ sort_order       │       └────────┬─────────┘
│ created_at       │                │
└────────┬─────────┘                │
         │                          │
         │ 1:N                      │
         ▼                          │
┌──────────────────┐                │
│   food_items     │                │
├──────────────────┤                │
│ id (PK)          │                │
│ category_id (FK) │                │
│ name             │                │
│ has_liters       │                │
│ is_active        │                │
│ sort_order       │                │
│ created_at       │                │
└────────┬─────────┘                │
         │                          │
         │                          │
         │ 1:N                      │ 1:N
         │                          │
         ▼                          ▼
┌──────────────────────────────────────────┐
│              order_items                  │
├──────────────────────────────────────────┤
│ id (PK)                                  │
│ order_id (FK)                            │
│ food_item_id (FK)                        │
│ liter_size_id (FK) - nullable            │
│ quantity                                  │
│ created_at                               │
└────────────────────┬─────────────────────┘
                     │
                     │ N:1
                     ▼
┌──────────────────────────────────────────┐
│                orders                     │
├──────────────────────────────────────────┤
│ id (PK)                                  │
│ order_number                             │
│ customer_name                            │
│ phone                                    │
│ order_date                               │
│ order_time                               │
│ address                                  │
│ notes                                    │
│ status                                   │
│ created_at                               │
│ updated_at                               │
└──────────────────────────────────────────┘

┌──────────────────┐
│  print_layouts   │
├──────────────────┤
│ id (PK)          │
│ name             │
│ template (JSONB) │
│ is_default       │
│ created_at       │
└──────────────────┘

┌──────────────────┐
│     settings     │
├──────────────────┤
│ id (PK)          │
│ key              │
│ value (JSONB)    │
│ updated_at       │
└──────────────────┘
```

---

## 3. Table Definitions

### 3.1 categories

Stores food categories (סלטים, מנות ביניים, etc.)

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_en TEXT NOT NULL,
  max_selection INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT categories_name_unique UNIQUE (name),
  CONSTRAINT categories_name_en_unique UNIQUE (name_en)
);

-- Index for sorting
CREATE INDEX idx_categories_sort ON categories (sort_order);

-- Comments
COMMENT ON TABLE categories IS 'Food categories like salads, mains, sides';
COMMENT ON COLUMN categories.name IS 'Hebrew category name';
COMMENT ON COLUMN categories.name_en IS 'English category name for code reference';
COMMENT ON COLUMN categories.max_selection IS 'Maximum items allowed from this category (NULL = unlimited)';
```

**Sample Data:**

| id | name | name_en | max_selection | sort_order |
|----|------|---------|---------------|------------|
| uuid-1 | סלטים | salads | 10 | 1 |
| uuid-2 | מנות ביניים | middle_courses | 2 | 2 |
| uuid-3 | תוספות | sides | 3 | 3 |
| uuid-4 | עיקריות | mains | 3 | 4 |
| uuid-5 | אקסטרות | extras | NULL | 5 |

---

### 3.2 liter_sizes

Stores available liter sizes for salad containers.

```sql
CREATE TABLE liter_sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  size DECIMAL(3,1) NOT NULL,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT liter_sizes_size_unique UNIQUE (size)
);

-- Index for sorting
CREATE INDEX idx_liter_sizes_sort ON liter_sizes (sort_order);

COMMENT ON TABLE liter_sizes IS 'Available container sizes for salads';
COMMENT ON COLUMN liter_sizes.size IS 'Numeric size in liters';
COMMENT ON COLUMN liter_sizes.label IS 'Display label (e.g., "2.5L")';
```

**Sample Data:**

| id | size | label | sort_order |
|----|------|-------|------------|
| uuid-l1 | 1.5 | 1.5L | 1 |
| uuid-l2 | 2.5 | 2.5L | 2 |
| uuid-l3 | 3.0 | 3L | 3 |
| uuid-l4 | 4.5 | 4.5L | 4 |

---

### 3.3 food_items

Stores all food items across categories.

```sql
CREATE TABLE food_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  has_liters BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT food_items_name_category_unique UNIQUE (name, category_id)
);

-- Indexes
CREATE INDEX idx_food_items_category ON food_items (category_id);
CREATE INDEX idx_food_items_active ON food_items (is_active);
CREATE INDEX idx_food_items_sort ON food_items (category_id, sort_order);

COMMENT ON TABLE food_items IS 'Individual food items that can be ordered';
COMMENT ON COLUMN food_items.has_liters IS 'True if item uses liter sizes (salad-type items)';
COMMENT ON COLUMN food_items.is_active IS 'False to hide item from order form without deleting';
```

---

### 3.4 orders

Stores order header information.

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number SERIAL,
  customer_name TEXT,
  phone TEXT,
  order_date DATE NOT NULL,
  order_time TIME,
  address TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT orders_status_check CHECK (status IN ('draft', 'active', 'completed'))
);

-- Indexes
CREATE INDEX idx_orders_date ON orders (order_date);
CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_orders_customer ON orders (customer_name);
CREATE INDEX idx_orders_updated ON orders (updated_at);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE orders IS 'Customer orders';
COMMENT ON COLUMN orders.status IS 'Order lifecycle: draft → active → completed';
```

---

### 3.5 order_items

Stores individual line items within an order.

```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  food_item_id UUID NOT NULL REFERENCES food_items(id) ON DELETE RESTRICT,
  liter_size_id UUID REFERENCES liter_sizes(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT order_items_quantity_positive CHECK (quantity > 0),
  CONSTRAINT order_items_unique_combo UNIQUE (order_id, food_item_id, liter_size_id)
);

-- Indexes
CREATE INDEX idx_order_items_order ON order_items (order_id);
CREATE INDEX idx_order_items_food ON order_items (food_item_id);

COMMENT ON TABLE order_items IS 'Line items within an order';
COMMENT ON COLUMN order_items.liter_size_id IS 'Required for salad-type items, NULL for regular items';
COMMENT ON COLUMN order_items.quantity IS 'Number of units at this size';
```

**Example Data:**

For an order with:
- חומוס: 2.5L × 2, 4.5L × 1
- פילה מושט מזרחי: × 3

| id | order_id | food_item_id | liter_size_id | quantity |
|----|----------|--------------|---------------|----------|
| uuid-oi1 | order-123 | humus-id | 2.5L-id | 2 |
| uuid-oi2 | order-123 | humus-id | 4.5L-id | 1 |
| uuid-oi3 | order-123 | fillet-id | NULL | 3 |

---

### 3.6 print_layouts

Stores print layout configurations.

```sql
CREATE TABLE print_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  template JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT print_layouts_name_unique UNIQUE (name)
);

-- Ensure only one default
CREATE UNIQUE INDEX idx_print_layouts_default 
  ON print_layouts (is_default) 
  WHERE is_default = TRUE;

COMMENT ON TABLE print_layouts IS 'Configurable print layout templates';
COMMENT ON COLUMN print_layouts.template IS 'JSON configuration for layout';
```

**Template JSONB Structure:**

```json
{
  "showHeader": true,
  "showCustomerInfo": true,
  "showOrderNumber": true,
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
  "orientation": "portrait"
}
```

---

### 3.7 settings

Stores application settings (like shared password).

```sql
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT settings_key_unique UNIQUE (key)
);

CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE settings IS 'Application-wide settings';
```

**Settings Keys:**

| key | value example |
|-----|---------------|
| auth_password | {"hash": "bcrypt-hash-here"} |
| app_name | {"he": "מערכת הזמנות", "en": "Order System"} |

---

## 4. Views

### 4.1 order_summary

Aggregates order items for reporting.

```sql
CREATE VIEW order_summary AS
SELECT 
  o.id AS order_id,
  o.order_date,
  o.status,
  fi.id AS food_item_id,
  fi.name AS food_item_name,
  fi.has_liters,
  c.name AS category_name,
  c.name_en AS category_name_en,
  ls.size AS liter_size,
  ls.label AS liter_label,
  oi.quantity
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN food_items fi ON oi.food_item_id = fi.id
JOIN categories c ON fi.category_id = c.id
LEFT JOIN liter_sizes ls ON oi.liter_size_id = ls.id;
```

### 4.2 daily_totals

Aggregates totals by date.

```sql
CREATE VIEW daily_totals AS
SELECT 
  o.order_date,
  fi.id AS food_item_id,
  fi.name AS food_item_name,
  fi.has_liters,
  c.name_en AS category,
  ls.label AS liter_size,
  SUM(oi.quantity) AS total_quantity
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN food_items fi ON oi.food_item_id = fi.id
JOIN categories c ON fi.category_id = c.id
LEFT JOIN liter_sizes ls ON oi.liter_size_id = ls.id
WHERE o.status IN ('active', 'completed')
GROUP BY 
  o.order_date,
  fi.id,
  fi.name,
  fi.has_liters,
  c.name_en,
  ls.label
ORDER BY 
  o.order_date,
  c.name_en,
  fi.name,
  ls.label;
```

---

## 5. Functions

### 5.1 get_date_range_summary

Returns aggregated totals for a date range.

```sql
CREATE OR REPLACE FUNCTION get_date_range_summary(
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  food_item_id UUID,
  food_item_name TEXT,
  category TEXT,
  has_liters BOOLEAN,
  liter_size TEXT,
  total_quantity BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fi.id,
    fi.name,
    c.name_en,
    fi.has_liters,
    ls.label,
    SUM(oi.quantity)::BIGINT
  FROM orders o
  JOIN order_items oi ON o.id = oi.order_id
  JOIN food_items fi ON oi.food_item_id = fi.id
  JOIN categories c ON fi.category_id = c.id
  LEFT JOIN liter_sizes ls ON oi.liter_size_id = ls.id
  WHERE o.order_date BETWEEN start_date AND end_date
    AND o.status IN ('active', 'completed')
  GROUP BY 
    fi.id,
    fi.name,
    c.name_en,
    fi.has_liters,
    ls.label
  ORDER BY 
    c.name_en,
    fi.name,
    ls.label;
END;
$$ LANGUAGE plpgsql;
```

**Usage:**

```sql
SELECT * FROM get_date_range_summary('2025-12-01', '2025-12-03');
```

---

## 6. Row Level Security (RLS)

For Supabase, we'll use simple RLS since all authenticated users have full access.

```sql
-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE liter_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (full access)
CREATE POLICY "Allow all for authenticated" ON categories
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated" ON liter_sizes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated" ON food_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated" ON orders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated" ON order_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated" ON print_layouts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated" ON settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

---

## 7. PowerSync Configuration

### 7.1 Sync Rules

```yaml
# powersync.yaml
bucket_definitions:
  global:
    # Categories - read only, rarely changes
    - name: categories
      parameters: []
      data:
        - SELECT * FROM categories ORDER BY sort_order

    # Liter sizes - read only
    - name: liter_sizes
      parameters: []
      data:
        - SELECT * FROM liter_sizes ORDER BY sort_order

    # Food items - may change in admin
    - name: food_items
      parameters: []
      data:
        - SELECT * FROM food_items WHERE is_active = true ORDER BY sort_order

    # Recent orders (last 30 days)
    - name: orders
      parameters: []
      data:
        - SELECT * FROM orders WHERE order_date >= CURRENT_DATE - INTERVAL '30 days'

    # Order items for synced orders
    - name: order_items
      parameters: []
      data:
        - |
          SELECT oi.* FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          WHERE o.order_date >= CURRENT_DATE - INTERVAL '30 days'

    # Print layouts
    - name: print_layouts
      parameters: []
      data:
        - SELECT * FROM print_layouts
```

### 7.2 Local Schema (PowerSync SQLite)

```typescript
// src/lib/powersync/schema.ts
import { Schema, Table, Column } from '@powersync/web';

export const schema = new Schema([
  new Table('categories', [
    new Column('name', 'TEXT'),
    new Column('name_en', 'TEXT'),
    new Column('max_selection', 'INTEGER'),
    new Column('sort_order', 'INTEGER'),
    new Column('created_at', 'TEXT'),
  ]),
  
  new Table('liter_sizes', [
    new Column('size', 'REAL'),
    new Column('label', 'TEXT'),
    new Column('sort_order', 'INTEGER'),
    new Column('created_at', 'TEXT'),
  ]),
  
  new Table('food_items', [
    new Column('category_id', 'TEXT'),
    new Column('name', 'TEXT'),
    new Column('has_liters', 'INTEGER'), // 0 or 1
    new Column('is_active', 'INTEGER'),
    new Column('sort_order', 'INTEGER'),
    new Column('created_at', 'TEXT'),
  ]),
  
  new Table('orders', [
    new Column('order_number', 'INTEGER'),
    new Column('customer_name', 'TEXT'),
    new Column('phone', 'TEXT'),
    new Column('order_date', 'TEXT'),
    new Column('order_time', 'TEXT'),
    new Column('address', 'TEXT'),
    new Column('notes', 'TEXT'),
    new Column('status', 'TEXT'),
    new Column('created_at', 'TEXT'),
    new Column('updated_at', 'TEXT'),
  ]),
  
  new Table('order_items', [
    new Column('order_id', 'TEXT'),
    new Column('food_item_id', 'TEXT'),
    new Column('liter_size_id', 'TEXT'),
    new Column('quantity', 'INTEGER'),
    new Column('created_at', 'TEXT'),
  ]),
  
  new Table('print_layouts', [
    new Column('name', 'TEXT'),
    new Column('template', 'TEXT'), // JSON string
    new Column('is_default', 'INTEGER'),
    new Column('created_at', 'TEXT'),
  ]),
]);
```

---

## 8. Migrations

### 8.1 Initial Migration

```sql
-- 20251201000000_initial_schema.sql

-- Create tables in order (respecting foreign keys)

-- 1. Categories
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

-- 2. Liter sizes
CREATE TABLE IF NOT EXISTS liter_sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  size DECIMAL(3,1) NOT NULL,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT liter_sizes_size_unique UNIQUE (size)
);

-- 3. Food items
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

-- 4. Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number SERIAL,
  customer_name TEXT,
  phone TEXT,
  order_date DATE NOT NULL,
  order_time TIME,
  address TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT orders_status_check CHECK (status IN ('draft', 'active', 'completed'))
);

-- 5. Order items
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

-- 6. Print layouts
CREATE TABLE IF NOT EXISTS print_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  template JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT print_layouts_name_unique UNIQUE (name)
);

-- 7. Settings
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT settings_key_unique UNIQUE (key)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_categories_sort ON categories (sort_order);
CREATE INDEX IF NOT EXISTS idx_liter_sizes_sort ON liter_sizes (sort_order);
CREATE INDEX IF NOT EXISTS idx_food_items_category ON food_items (category_id);
CREATE INDEX IF NOT EXISTS idx_food_items_active ON food_items (is_active);
CREATE INDEX IF NOT EXISTS idx_food_items_sort ON food_items (category_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders (order_date);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_food ON order_items (food_item_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_print_layouts_default ON print_layouts (is_default) WHERE is_default = TRUE;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to orders
DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to settings
DROP TRIGGER IF EXISTS settings_updated_at ON settings;
CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## 9. Backup & Recovery

### 9.1 Backup Strategy
- Supabase provides automatic daily backups
- Point-in-time recovery available on Pro plan
- Consider exporting critical data weekly

### 9.2 Local Data
- PowerSync maintains local SQLite database
- Data persists across browser sessions
- Cleared only on explicit logout or cache clear

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-01 | Initial | First draft |
