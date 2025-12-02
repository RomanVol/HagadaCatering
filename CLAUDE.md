# Kitchen Order Management System (מערכת ניהול הזמנות למטבח)

## Project Overview
Internal catering order management system for kitchen staff. Allows creating orders with salads, main courses, sides, and extras. Supports offline mode with automatic sync when connection returns. Entirely in **Hebrew (RTL)**.

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Next.js 14+ (App Router) | React framework with SSR |
| Database | Supabase (PostgreSQL) | Cloud database + auth |
| Offline Sync | PowerSync | SQLite local + bi-directional sync |
| PWA | Serwist | Service worker for offline app shell |
| Styling | Tailwind CSS | Utility-first CSS |
| UI Components | shadcn/ui | Accessible, customizable components |
| State | Zustand | Lightweight state management |
| Language | TypeScript | Type safety |

## Core Features

### 1. Order Management
- Create, edit, and complete orders
- Order lifecycle: `draft` → `active` → `completed`
- Customer details: name (שם), phone (טלפון), date (יום), time (שעה), address (כתובת)

### 2. Food Categories & Selection Rules

| Category | Hebrew | Max Selection | Quantity Type |
|----------|--------|---------------|---------------|
| Salads | סלטים | 10 | Liters (2.5, 1.5, 3, 4.5) × quantity |
| Middle Courses | מנות ביניים | 2 | Regular number |
| Sides | תוספות | 3 | Regular number |
| Mains | עיקריות | 3 | Regular number |
| Extras | אקסטרות | unlimited | Regular number |

### 3. Salad Selection Logic
- Salads use liter-based box sizes: **2.5L, 1.5L, 3L, 4.5L**
- Each salad can have multiple sizes with quantities
- Example: חומוס → 2.5L × 2, 3L × 1
- UI should allow:
  - Select individual liter sizes per salad
  - Bulk apply liter selection to all marked salads

### 4. Summary/Reports View
- Filter orders by date range
- Show aggregated totals per food item
- Example output for חומוס (date range):
  - Today: 2.5L × 2
  - Tomorrow: 2.5L × 3, 3L × 1
  - **Total: 2.5L × 5, 3L × 1**
- Option to view individual item amounts without date filter

### 5. Printing
- Layout similar to paper form
- Display salad quantities as: `2.5L × 2, 3L × 1`
- Admin can configure multiple print layouts
- Print view optimized for kitchen staff

### 6. Admin Panel
- Add/edit/delete food items
- When adding: specify if item uses liter sizes (salad type)
- Manage print layout templates
- View all food items by category

## Authentication
- Simple shared login (no user tracking needed)
- Single password/PIN for all 3 internal users
- Use Supabase Auth with shared credentials OR simple password gate

## Offline Requirements
- App must load and function without internet
- All CRUD operations work offline
- Data stored locally via PowerSync (SQLite)
- Automatic sync when connection restored
- Visual indicator for online/offline status
- Visual indicator for pending sync items

## Database Schema

### Tables

```sql
-- Food categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,           -- e.g., "סלטים"
  name_en TEXT,                 -- e.g., "salads" (for code reference)
  max_selection INTEGER,        -- e.g., 10 for salads
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Food items
CREATE TABLE food_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id),
  name TEXT NOT NULL,           -- e.g., "חומוס"
  has_liters BOOLEAN DEFAULT FALSE,  -- true for salads
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Available liter sizes (for salads)
CREATE TABLE liter_sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  size DECIMAL NOT NULL,        -- 1.5, 2.5, 3, 4.5
  label TEXT NOT NULL,          -- "1.5L"
  sort_order INTEGER
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number SERIAL,
  customer_name TEXT,
  phone TEXT,
  order_date DATE NOT NULL,
  order_time TIME,
  address TEXT,
  notes TEXT,
  status TEXT DEFAULT 'draft',  -- draft, active, completed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order line items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  food_item_id UUID REFERENCES food_items(id),
  liter_size_id UUID REFERENCES liter_sizes(id),  -- NULL for non-salad items
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Print layouts
CREATE TABLE print_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  template JSONB,               -- Layout configuration
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   ├── (main)/
│   │   ├── layout.tsx          # Main app layout with nav
│   │   ├── page.tsx            # Dashboard / Orders list
│   │   ├── orders/
│   │   │   ├── page.tsx        # Orders list
│   │   │   ├── new/
│   │   │   │   └── page.tsx    # Create order
│   │   │   └── [id]/
│   │   │       ├── page.tsx    # View/Edit order
│   │   │       └── print/
│   │   │           └── page.tsx # Print view
│   │   ├── summary/
│   │   │   └── page.tsx        # Reports & totals
│   │   └── admin/
│   │       ├── page.tsx        # Admin dashboard
│   │       ├── foods/
│   │       │   └── page.tsx    # Manage food items
│   │       └── layouts/
│   │           └── page.tsx    # Manage print layouts
│   ├── layout.tsx              # Root layout
│   └── manifest.ts             # PWA manifest
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── orders/
│   │   ├── OrderForm.tsx
│   │   ├── SaladSelector.tsx   # Special salad liter UI
│   │   ├── FoodItemSelector.tsx
│   │   └── OrderCard.tsx
│   ├── summary/
│   │   ├── DateRangePicker.tsx
│   │   └── TotalsTable.tsx
│   ├── print/
│   │   └── PrintLayout.tsx
│   └── shared/
│       ├── OfflineIndicator.tsx
│       └── SyncStatus.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── types.ts
│   ├── powersync/
│   │   ├── setup.ts
│   │   ├── schema.ts
│   │   └── sync.ts
│   └── utils.ts
├── hooks/
│   ├── useOrders.ts
│   ├── useFoodItems.ts
│   ├── useOfflineStatus.ts
│   └── useSummary.ts
├── stores/
│   └── orderStore.ts           # Zustand store
├── types/
│   └── index.ts
└── styles/
    └── globals.css
```

## UI/UX Requirements

### General
- **RTL layout** - Hebrew text direction
- Mobile-first responsive design
- Works on phones, tablets, desktop
- Large touch targets for kitchen use (min 44px)
- Clear visual feedback for selections

### Order Form UI
- Categories displayed as expandable sections
- Salads: checkbox + liter size buttons + quantity inputs
- Other items: checkbox + quantity input
- Show selection count vs max (e.g., "5/10 סלטים")
- "Apply to all" button for bulk liter selection

### Color Scheme (suggestion)
- Primary: Blue (#3B82F6)
- Success/Completed: Green (#10B981)
- Warning/Pending: Amber (#F59E0B)
- Background: Light gray (#F9FAFB)
- Cards: White

### Offline Indicators
- Header badge showing online/offline status
- Pending sync count badge
- Toast notifications on sync complete

## Coding Conventions

### General
- Use TypeScript strict mode
- Prefer named exports
- Use async/await over .then()
- Handle loading and error states

### Naming
- Components: PascalCase (`OrderForm.tsx`)
- Hooks: camelCase with `use` prefix (`useOrders.ts`)
- Utilities: camelCase (`formatDate.ts`)
- Database columns: snake_case
- TypeScript interfaces: PascalCase with `I` prefix optional

### Hebrew Text
- All UI labels in Hebrew
- Store Hebrew text in constants file for easy updates
- Use `dir="rtl"` on root element

```typescript
// Example: src/lib/constants/labels.ts
export const LABELS = {
  categories: {
    salads: 'סלטים',
    middleCourses: 'מנות ביניים',
    sides: 'תוספות',
    mains: 'עיקריות',
    extras: 'אקסטרות',
  },
  actions: {
    save: 'שמור',
    cancel: 'ביטול',
    print: 'הדפס',
    delete: 'מחק',
  },
  // ...
};
```

## Key Commands

```bash
# Development
npm run dev

# Build
npm run build

# Database
npx supabase start      # Local Supabase
npx supabase db push    # Push migrations
npx supabase gen types typescript --local > src/lib/supabase/types.ts

# Linting
npm run lint
npm run type-check
```

## Important Notes

1. **Offline-first**: Always assume user might be offline. Design data flow accordingly.

2. **PowerSync setup**: Follow PowerSync + Supabase integration guide exactly.

3. **Print CSS**: Use `@media print` for print-specific styles. Test on actual printers.

4. **Salad logic complexity**: The salad liter/quantity selection is the most complex UI component. Build and test thoroughly.

5. **Data seeding**: Initial food items should be seeded from the paper form (28 salads, 11 middle courses, etc.)

6. **Mobile testing**: Test on actual mobile devices, not just browser emulation.

## Documentation
- Functional requirements: See `docs/PRD.md`
- UI/UX design specs: See `docs/DESIGN.md`
- Database details: See `docs/DATABASE.md`
- PowerSync setup: See `docs/OFFLINE-SYNC.md`
