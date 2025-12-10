# HagadaCatering Code Workflow Documentation

This document describes the complete code workflow for the Kitchen Order Management System (מערכת ניהול הזמנות למטבח).

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Application Routes](#application-routes)
3. [Data Flow](#data-flow)
4. [Order Management Workflow](#order-management-workflow)
5. [Food Item Selection Logic](#food-item-selection-logic)
6. [State Management](#state-management)
7. [Key Components](#key-components)
8. [Database Operations](#database-operations)
9. [Summary & Reports](#summary--reports)
10. [Print Workflow](#print-workflow)
11. [Admin Workflow](#admin-workflow)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js 14)                     │
├─────────────────────────────────────────────────────────────────┤
│  Pages            │  Components           │  Hooks               │
│  ─────            │  ──────────           │  ─────               │
│  / (OrderForm)    │  OrderForm            │  useSupabaseData     │
│  /admin           │  SaladSelector        │                      │
│  /summary         │  FoodItemSelector     │                      │
│  /edit-order/[id] │  PrintOrderPage       │                      │
│  /print-preview   │  UI (shadcn/ui)       │                      │
├─────────────────────────────────────────────────────────────────┤
│                     Services Layer                               │
│  ─────────────────────────────────────────────────────────────── │
│  order-service.ts  │  admin-service.ts                          │
├─────────────────────────────────────────────────────────────────┤
│                     Supabase Client (@supabase/ssr)             │
├─────────────────────────────────────────────────────────────────┤
│                     PostgreSQL (Supabase Cloud)                  │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Next.js 14 (App Router) | Server/client components, routing |
| Language | TypeScript | Type safety |
| UI Components | shadcn/ui | Accessible, customizable components |
| Styling | Tailwind CSS 4 | Utility-first CSS |
| Database | Supabase (PostgreSQL) | Cloud database |
| Client SDK | @supabase/ssr | Server-side rendering support |
| Icons | lucide-react | Icon library |
| Date Handling | date-fns | Date formatting/manipulation |

---

## Application Routes

| Route | File | Purpose |
|-------|------|---------|
| `/` | `src/app/page.tsx` | Main order creation form |
| `/admin` | `src/app/admin/page.tsx` | Food item management |
| `/summary` | `src/app/summary/page.tsx` | View orders and aggregated summaries |
| `/edit-order/[id]` | `src/app/edit-order/[id]/page.tsx` | Edit existing orders |
| `/print-preview` | `src/app/print-preview/page.tsx` | Interactive print layout |
| `/debug` | `src/app/debug/page.tsx` | Database status (development) |
| `/debug-orders` | `src/app/debug-orders/page.tsx` | Order management utility (development) |

---

## Data Flow

### Read Flow (Fetching Data)

```
Component Mount
      │
      ▼
useSupabaseData() hook
      │
      ├─→ createClient() (Supabase client)
      │
      ▼
Parallel Fetches:
      │
      ├─→ categories (sorted by sort_order)
      ├─→ food_items (active only, with measurement_type)
      ├─→ liter_sizes (1.5L, 2.5L, 3L, 4.5L)
      ├─→ food_item_add_ons (optional)
      ├─→ food_item_preparations (optional)
      └─→ food_item_variations (optional)
      │
      ▼
Map relationships (add-ons/preparations → parent items)
      │
      ▼
Return { categories, foodItems, literSizes, isLoading, error }
```

### Write Flow (Saving Data)

```
User clicks "Save Order"
      │
      ▼
Validate form (phone number required)
      │
      ▼
saveOrder() service function
      │
      ├─→ Find or create customer (by phone)
      │   ├─→ Query customers by phone
      │   ├─→ If exists: update name/address
      │   └─→ If not: create new customer
      │
      ├─→ Create order record
      │   └─→ Insert into orders table
      │
      └─→ Create order items (bulk insert)
          ├─→ For liter items: one row per liter size
          ├─→ For size items: separate rows for big/small
          ├─→ For regular items: single row
          └─→ For add-ons: separate rows with add_on_id
      │
      ▼
Return { success, order, customer }
```

---

## Order Management Workflow

### Order Lifecycle

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   DRAFT     │ ──▶ │   ACTIVE    │ ──▶ │  COMPLETED  │
│ (in memory) │     │ (saved DB)  │     │  (marked)   │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │                    │
      │                   │                    │
   Form filled      Can be edited         Still queryable
   not saved yet    /edit-order/[id]      for reports
```

### Creating a New Order

1. **Load Form**
   - Navigate to `/` (home page)
   - `useSupabaseData()` fetches categories, food items, liter sizes
   - Initialize empty form state

2. **Fill Customer Details**
   - Customer Name (optional)
   - Phone Number (required for save)
   - Order Date (defaults to today)
   - Order Time (optional)
   - Delivery Address (optional)
   - Notes (optional)

3. **Select Food Items**
   - Expand category accordions
   - Click items to open selection popups
   - Configure quantities based on measurement type
   - Add preparations, variations, notes as needed

4. **Save Order**
   - Click "Save" button
   - Validates phone number
   - Calls `saveOrder()` service
   - On success: shows confirmation, resets form
   - On error: displays error message

### Editing an Existing Order

1. Navigate to `/summary`
2. Find order in list, click "Edit"
3. Redirects to `/edit-order/[id]`
4. Form loads pre-populated with:
   - Customer details
   - Selected items and quantities
   - Preparations, variations, notes
5. Modify as needed
6. Click "Save" to update

---

## Food Item Selection Logic

### Measurement Types

Each food item has a `measurement_type` determining how quantities are entered:

#### Type 1: Liters (default for salads)

```
┌─────────────────────────────────────┐
│  Item: חומוס (Hummus)               │
│  measurement_type: "liters"         │
├─────────────────────────────────────┤
│  Available sizes:                   │
│  ┌─────┬─────┬─────┬─────┐         │
│  │1.5L │2.5L │ 3L  │4.5L │         │
│  └─────┴─────┴─────┴─────┘         │
│                                     │
│  User enters quantity per size:     │
│  1.5L × 2, 2.5L × 3, 3L × 1        │
│                                     │
│  Saves as 3 separate order_items:   │
│  - { liter_size_id: 1.5L, qty: 2 } │
│  - { liter_size_id: 2.5L, qty: 3 } │
│  - { liter_size_id: 3L, qty: 1 }   │
└─────────────────────────────────────┘
```

#### Type 2: Size (Big/Small - ג/ק)

```
┌─────────────────────────────────────┐
│  Item: Some Side Dish               │
│  measurement_type: "size"           │
├─────────────────────────────────────┤
│  User enters:                       │
│  Big (ג׳) × 5                       │
│  Small (ק׳) × 3                     │
│                                     │
│  Display: "5ג׳ 3ק׳"                 │
│                                     │
│  Saves as 2 separate order_items:   │
│  - { size_type: "big", qty: 5 }    │
│  - { size_type: "small", qty: 3 }  │
└─────────────────────────────────────┘
```

#### Type 3: None (Regular Quantity)

```
┌─────────────────────────────────────┐
│  Item: שניצל                        │
│  measurement_type: "none"           │
├─────────────────────────────────────┤
│  User enters: Quantity: 7           │
│                                     │
│  Display: "×7"                      │
│                                     │
│  Saves as single order_item:        │
│  - { quantity: 7 }                  │
└─────────────────────────────────────┘
```

### Selection Limits by Category

| Category | Hebrew | Max Selection |
|----------|--------|---------------|
| Salads | סלטים | 10 |
| Middle Courses | מנות ביניים | 2 |
| Sides | תוספות | 3 |
| Mains | עיקריות | 3 |
| Extras | אקסטרות | Unlimited |

### Add-Ons System

Some food items have optional add-ons (e.g., כרוב אסייתי has רוטב option):

```
┌─────────────────────────────────────┐
│  Parent Item: כרוב אסייתי            │
│  ├─ Main quantities: 2.5L × 2       │
│  │                                  │
│  └─ Add-on: רוטב מזרחי              │
│     └─ Add-on quantities: 2.5L × 1  │
└─────────────────────────────────────┘
```

### Variations System

Some items support variations (e.g., rice types):

```
┌─────────────────────────────────────┐
│  Item: אורז                         │
│  ├─ Variation: אורז לבן             │
│  │  └─ Big: 2, Small: 1             │
│  ├─ Variation: אורז ירוק            │
│  │  └─ Big: 1, Small: 0             │
│  └─ Variation: אורז אדום            │
│     └─ Big: 0, Small: 1             │
└─────────────────────────────────────┘
```

### Bulk Apply Feature

For salads, users can set liter quantities and apply to multiple items:

1. Set quantities in bulk control (e.g., 2.5L = 2)
2. Check multiple salad items
3. Click "Apply to all"
4. All checked salads get the same quantities

---

## State Management

### Current Pattern: Local React State

The application uses `useState` for all state management:

```typescript
// Customer & order details
const [formState, setFormState] = useState<OrderFormState>({
  customer_name: "",
  phone: "",
  order_date: "",
  order_time: "",
  address: "",
  notes: "",
  salads: [],
  middle_courses: [],
  sides: [],
  mains: [],
  extras: [],
});

// UI state
const [expandedSaladId, setExpandedSaladId] = useState<string | null>(null);
const [isSaving, setIsSaving] = useState(false);
const [saveError, setSaveError] = useState<string | null>(null);
```

### State Scope

| State Type | Storage | Scope |
|------------|---------|-------|
| Form Data | useState | Component |
| Fetched Data | useState | Component |
| UI State | useState | Component |
| Print Data | sessionStorage | Browser session |
| Persistent Data | Supabase DB | Global |

---

## Key Components

### Component Hierarchy

```
RootLayout (src/app/layout.tsx)
└── Page Components
    ├── Home (/) → OrderForm
    │   ├── CustomerDetailsSection
    │   ├── CategoryAccordion
    │   │   ├── SaladCard[] → SaladLiterPopup
    │   │   └── FoodItemCard[] → FoodItemPopup
    │   └── ActionButtons (Save/Print)
    │
    ├── Admin (/admin)
    │   ├── CategoryTabs
    │   ├── AddItemForm
    │   └── FoodItemsList → PreparationsModal
    │
    ├── Summary (/summary)
    │   ├── DateRangePicker
    │   ├── ViewModeToggle
    │   ├── OrdersList (expandable)
    │   └── SummaryTable
    │
    ├── EditOrder (/edit-order/[id])
    │   └── OrderForm (pre-populated)
    │
    └── PrintPreview (/print-preview)
        └── PrintOrderPage
            ├── DraggableSections
            └── PrintButton
```

### Core Components

| Component | File | Purpose |
|-----------|------|---------|
| `OrderForm` | `src/components/orders/OrderForm.tsx` | Main order creation interface |
| `SaladCard` | `src/components/orders/SaladSelector.tsx` | Salad display with selection summary |
| `SaladLiterPopup` | `src/components/orders/SaladSelector.tsx` | Modal for configuring salad quantities |
| `FoodItemCard` | `src/components/orders/FoodItemSelector.tsx` | Food item display |
| `FoodItemPopup` | `src/components/orders/FoodItemSelector.tsx` | Modal for configuring item quantities |
| `PrintOrderPage` | `src/components/print/PrintOrderPage.tsx` | Interactive print layout editor |

---

## Database Operations

### Service Layer

All database operations go through service functions:

**`src/lib/services/order-service.ts`**
- `saveOrder(input)` - Create new order with items
- `updateOrder(orderId, input)` - Update existing order
- `getOrderWithItems(orderId)` - Fetch order with all items
- `getOrdersByDateRange(from, to)` - Query orders by date
- `getOrdersSummary(from, to)` - Aggregated summary by item

**`src/lib/services/admin-service.ts`**
- `createFoodItem(data)` - Add new food item
- `updateFoodItem(id, data)` - Edit food item
- `deleteFoodItem(id)` - Soft delete
- `createPreparation(foodItemId, name)` - Add preparation option
- `createVariation(foodItemId, name)` - Add variation option

### Database Schema (Key Tables)

```sql
-- Core tables
categories      -- סלטים, עיקריות, etc.
food_items      -- Individual food items
liter_sizes     -- 1.5L, 2.5L, 3L, 4.5L
customers       -- Customer records (by phone)
orders          -- Order headers
order_items     -- Order line items

-- Extension tables
food_item_add_ons       -- Optional add-ons per item
food_item_preparations  -- Cooking styles per item
food_item_variations    -- Variations (e.g., rice types)
```

---

## Summary & Reports

### Summary Page Workflow

1. **Select Date Range**
   - From Date, To Date inputs
   - Click "Filter" to query

2. **View Modes**
   - **Orders List**: All orders in range, expandable
   - **Summary Table**: Aggregated totals by category/item

3. **Aggregation Logic**

```
For each order in date range:
  For each order_item:
    Group by: Category → Food Item

    If liter item:
      Sum quantities per liter size
    If size item:
      Sum big and small separately
    If regular:
      Sum all quantities

    Track add-ons separately
    Track variations separately
```

4. **Example Output**

```
סלטים:
  חומוס:
    1.5L: 5 total
    2.5L: 8 total
    3L:   3 total

  כרוב אסייתי:
    2.5L: 4 total
    רוטב מזרחי (add-on): 2.5L × 2

תוספות:
  אורז:
    אורז לבן: 10ג׳ 5ק׳
    אורז ירוק: 3ג׳ 2ק׳
```

---

## Print Workflow

### Flow Diagram

```
OrderForm
    │
    │ Click "Print"
    ▼
Build printData from formState
    │
    │ Store in sessionStorage
    ▼
Navigate to /print-preview
    │
    ▼
PrintOrderPage loads
    │
    │ Read from sessionStorage
    ▼
Render interactive layout
    │
    ├─→ Drag/drop to reorder items
    ├─→ Hide/show items
    └─→ Click Print → window.print()
```

### Print Data Structure

```typescript
interface PrintData {
  customer: {
    name: string;
    phone: string;
    address: string;
  };
  order: {
    date: string;
    time: string;
    notes: string;
  };
  salads: PrintOrderItem[];
  middleCourses: PrintOrderItem[];
  sides: PrintOrderItem[];
  mains: PrintOrderItem[];
  extras: PrintOrderItem[];
}

interface PrintOrderItem {
  id: string;
  name: string;
  liters?: { label: string; quantity: number }[];
  size_big?: number;
  size_small?: number;
  regular_quantity?: number;
  variations?: { name: string; size_big: number; size_small: number }[];
  addOns?: { name: string; quantity: number; liters?: ... }[];
  sort_order: number;
  isVisible: boolean;
}
```

### Print Layout Features

- **Drag & Drop**: Reorder items within/between sections
- **Visibility Toggle**: Hide items (keeps placeholder for kitchen marking)
- **Print CSS**: Optimized for A4 landscape, large fonts, clean borders

---

## Admin Workflow

### Managing Food Items

1. **Navigate to `/admin`**
2. **Select Category** via tabs
3. **Add New Item**:
   - Enter name
   - Select measurement type (liters/size/none)
   - For mains: set portion multiplier/unit
   - Click "Save"

4. **Edit Item**:
   - Click edit icon
   - Modify name, measurement type, portion settings
   - Click save

5. **Delete Item**:
   - Click delete → soft delete (inactive)
   - Can restore or permanently delete

### Managing Preparations

1. Click chef hat icon on food item
2. Modal opens with list of preparations
3. Add new: type name, click "Add"
4. Edit/delete existing preparations

### Managing Variations

Similar to preparations, for items like rice with multiple types.

---

## File Structure Reference

```
src/
├── app/
│   ├── layout.tsx              # Root HTML layout (RTL)
│   ├── page.tsx                # Home - OrderForm
│   ├── admin/page.tsx          # Food management
│   ├── summary/page.tsx        # Orders & reports
│   ├── edit-order/[id]/page.tsx
│   ├── print-preview/page.tsx
│   ├── debug/page.tsx          # Dev tools
│   └── debug-orders/page.tsx   # Dev tools
│
├── components/
│   ├── orders/
│   │   ├── OrderForm.tsx       # Main order form (~1000+ lines)
│   │   ├── SaladSelector.tsx   # Salad card + popup
│   │   └── FoodItemSelector.tsx
│   ├── print/
│   │   └── PrintOrderPage.tsx  # Print layout editor
│   └── ui/                     # shadcn/ui components
│
├── lib/
│   ├── services/
│   │   ├── order-service.ts    # Order CRUD operations
│   │   └── admin-service.ts    # Admin operations
│   ├── supabase/
│   │   ├── client.ts           # Browser client factory
│   │   └── server.ts           # Server client factory
│   ├── constants/
│   │   └── labels.ts           # Hebrew labels
│   ├── mock-data.ts            # Seed data
│   └── utils.ts                # Utilities (cn)
│
├── hooks/
│   └── useSupabaseData.ts      # Data fetching hook
│
├── types/
│   └── index.ts                # TypeScript interfaces
│
└── styles/
    └── globals.css             # Global styles + Tailwind
```

---

## Future Enhancements (Not Yet Implemented)

1. **Authentication** - Login page with shared PIN
2. **PowerSync Integration** - Offline mode with local SQLite
3. **PWA Support** - Full service worker configuration
4. **Print Layout Templates** - Admin-configurable layouts

---

## Quick Reference: Common Operations

### Add a new food item
1. Go to `/admin`
2. Select category tab
3. Enter item name
4. Select measurement type
5. Click "Add"

### Create an order
1. Go to `/` (home)
2. Enter customer phone (required)
3. Fill customer details
4. Select items from each category
5. Click "Save"

### View daily summary
1. Go to `/summary`
2. Set date range
3. Toggle to "Summary" view
4. View aggregated totals

### Print an order
1. Fill order form
2. Click "Print" button
3. Arrange items in print preview
4. Click browser print
