# HagadaCatering Technical Reference

This document provides detailed technical documentation of all components, functions, and their interactions with exact code references.

---

## Table of Contents

1. [Component Reference](#component-reference)
2. [Function Call Graph](#function-call-graph)
3. [Data Flow Details](#data-flow-details)
4. [State Management Details](#state-management-details)
5. [Service Layer Reference](#service-layer-reference)
6. [Type Definitions](#type-definitions)

---

## Component Reference

### Page Components

#### Home Page (`src/app/page.tsx`)

**Lines**: 1-33

**Purpose**: Entry point for order creation

**Renders**:
- Quick navigation buttons (lines 11-26)
- `OrderForm` component (line 28)

**Imports**:
```typescript
import { OrderForm } from "@/components/orders/OrderForm";  // line 3
```

**Navigation Links**:
- `/summary` - BarChart3 icon (line 13-17)
- `/admin` - Settings icon (line 18-24)

---

#### Summary Page (`src/app/summary/page.tsx`)

**Lines**: 1-631

**Purpose**: View orders by date range and aggregated summaries

**Key State Variables** (lines 52-79):
```typescript
const [fromDate, setFromDate]           // Date range start
const [toDate, setToDate]               // Date range end
const [orders, setOrders]               // Fetched orders
const [summary, setSummary]             // Aggregated summary
const [viewMode, setViewMode]           // "orders" | "summary"
const [filterMode, setFilterMode]       // "all" | "categories" | "items"
```

**Key Functions**:

| Function | Lines | Description |
|----------|-------|-------------|
| `handleFilter()` | 81-100 | Fetches orders and summary for date range |
| `toggleOrder()` | 103-105 | Expands/collapses order details |
| `toggleCategory()` | 108-118 | Toggles category filter selection |
| `toggleItem()` | 121-131 | Toggles item filter selection |
| `groupItemsByCategory()` | 168-188 | Groups order items by category for display |

**Service Calls** (lines 87-90):
```typescript
const [ordersData, summaryData] = await Promise.all([
  getOrdersByDateRange(fromDate, toDate),  // order-service.ts:303
  getOrdersSummary(fromDate, toDate),      // order-service.ts:394
]);
```

---

#### Admin Page (`src/app/admin/page.tsx`)

**Lines**: 1-900+

**Purpose**: Manage food items, categories, and preparations

**Key State Variables** (lines 78-109):
```typescript
const [categories, setCategories]           // All categories
const [foodItems, setFoodItems]             // Items for selected category
const [selectedCategoryId, setSelectedCategoryId]
const [isAddingItem, setIsAddingItem]       // Add item form visibility
const [editingItemId, setEditingItemId]     // Currently editing item
const [preparationsModalItem, setPreparationsModalItem]  // Preparations modal
```

**Key Functions**:

| Function | Lines | Description |
|----------|-------|-------------|
| `loadCategories()` | 138-146 | Fetches all categories |
| `loadFoodItems()` | 148-151 | Fetches items for a category |
| `handleAddItem()` | 153-185 | Creates new food item |
| `handleUpdateItem()` | 187-220 | Updates existing food item |
| `handleDeleteItem()` | ~230 | Soft deletes food item |
| `handleRestoreItem()` | ~250 | Restores soft-deleted item |

**Service Calls**:
```typescript
await getCategories()           // admin-service.ts:24
await getFoodItems(categoryId)  // admin-service.ts:43
await createFoodItem(input)     // admin-service.ts:72
await updateFoodItem(input)     // admin-service.ts:116
await deleteFoodItem(id)        // admin-service.ts:149
await restoreFoodItem(id)       // admin-service.ts:206
```

---

### Order Components

#### OrderForm (`src/components/orders/OrderForm.tsx`)

**Lines**: 1-1514

**Purpose**: Main order creation/editing form

**Type Definitions** (lines 23-79):
```typescript
interface AddOnFormItem {        // line 23
  addon_id: string;
  quantity: number;
  liters: { liter_size_id: string; quantity: number }[];
}

interface SaladFormItem {        // line 29
  food_item_id: string;
  selected: boolean;
  measurement_type: MeasurementType;
  liters: { liter_size_id: string; quantity: number }[];
  size_big: number;
  size_small: number;
  regular_quantity: number;
  addOns: AddOnFormItem[];
  note: string;
}

interface RegularFormItem {      // line 45
  food_item_id: string;
  selected: boolean;
  quantity: number;
  preparation_id?: string;
  preparation_name?: string;
  note?: string;
}

interface SidesFormItem {        // line 54
  food_item_id: string;
  selected: boolean;
  size_big: number;
  size_small: number;
  preparation_id?: string;
  note?: string;
  variations?: { variation_id: string; size_big: number; size_small: number }[];
}

interface OrderFormState {       // line 67
  customer_name: string;
  phone: string;
  order_date: string;
  order_time: string;
  address: string;
  notes: string;
  salads: SaladFormItem[];
  middle_courses: RegularFormItem[];
  sides: SidesFormItem[];
  mains: RegularFormItem[];
  extras: RegularFormItem[];
}
```

**Initialization** (lines 81-204):
```typescript
export function OrderForm() {
  const router = useRouter();                        // line 83
  const { categories, foodItems, literSizes, isLoading, error } = useSupabaseData();  // line 86

  // Get categories by name_en (lines 89-93)
  const saladCategory = categories.find((c) => c.name_en === "salads");
  const middleCategory = categories.find((c) => c.name_en === "middle_courses");
  // ...

  // Memoized food items by category (lines 97-116)
  const saladItems = React.useMemo(
    () => getFoodItemsByCategoryName(foodItems, categories, "salads"),
    [foodItems, categories]
  );
  // ...

  // Form state initialization (lines 119-131)
  const [formState, setFormState] = React.useState<OrderFormState>({...});

  // Initialize form with food items when data loads (lines 148-204)
  React.useEffect(() => {
    if (!isDataInitialized && !isLoading && foodItems.length > 0) {
      setFormState((prev) => ({
        ...prev,
        salads: saladItems.map((item) => ({
          food_item_id: item.id,
          selected: false,
          measurement_type: item.measurement_type || "liters",
          liters: literSizes.map((ls) => ({ liter_size_id: ls.id, quantity: 0 })),
          // ...
        })),
        // ... other categories
      }));
    }
  }, [...]);
}
```

**Handler Functions**:

| Handler | Lines | Description |
|---------|-------|-------------|
| `handleSaladToggle()` | 265-274 | Toggle salad selection |
| `handleSaladLiterChange()` | 276-294 | Update salad liter quantity |
| `handleSaladSizeChange()` | 297-313 | Update salad size (ג/ק) quantity |
| `handleSaladRegularQuantityChange()` | 316-325 | Update regular quantity |
| `handleAddOnLiterChange()` | 328-356 | Update add-on liter quantity |
| `handleAddOnQuantityChange()` | 359-379 | Update add-on simple quantity |
| `handleSaladNoteChange()` | 382-389 | Update salad note |
| `handleRegularToggle()` | 391-404 | Toggle regular item selection |
| `handleRegularQuantityChange()` | 406-419 | Update regular item quantity |
| `handleSidesToggle()` | 435-444 | Toggle side item selection |
| `handleSidesSizeChange()` | 446-466 | Update side size (ג/ק) quantity |
| `handleSidesVariationSizeChange()` | 523-551 | Update variation size quantity |
| `handleBulkApply()` | 553-571 | Bulk apply liter settings |
| `handlePrint()` | 574-693 | Build print data and navigate |
| `handleSave()` | 695-900 | Validate and save order |

**Save Flow** (lines 695-900):
```typescript
const handleSave = async () => {
  // 1. Validate phone (line 697-700)
  if (!formState.phone.trim()) {
    alert("נא להזין מספר טלפון");
    return;
  }

  // 2. Build items array from form state (lines 707-868)
  const items: SaveOrderInput["items"] = [];

  // Add salad items (lines 710-786)
  formState.salads.forEach((salad) => {
    if (salad.selected) {
      if (salad.measurement_type === "liters") {
        salad.liters.forEach((liter) => {
          if (liter.quantity > 0) {
            items.push({
              food_item_id: salad.food_item_id,
              liter_size_id: liter.liter_size_id,
              quantity: liter.quantity,
            });
          }
        });
      }
      // ... size and regular handling
    }
  });

  // Add regular items (lines 789-807)
  // Add sides items (lines 809-868)

  // 3. Call saveOrder service (lines 871-884)
  const result = await saveOrder({
    customer: { name, phone, address },
    order: { order_date, order_time, delivery_address, notes },
    items,
  });

  // 4. Handle result (lines 886-897)
  if (result.success) {
    alert(`הזמנה נשמרה בהצלחה! מספר הזמנה: ${result.order?.order_number}`);
  }
};
```

**Render Structure** (lines 902-1513):
```
<div className="min-h-screen bg-gray-50">
  ├── <header>                         // lines 905-914
  │   └── Back button, title
  │
  ├── <main>                           // lines 917-1480
  │   ├── Customer Details Accordion   // lines 919-1004
  │   │   ├── Customer name input
  │   │   ├── Phone input
  │   │   ├── Date/time inputs
  │   │   ├── Address input
  │   │   └── Notes input
  │   │
  │   └── Food Selection Accordion     // lines 1006-1479
  │       ├── Salads Section           // lines 1012-1144
  │       │   ├── Bulk apply UI        // lines 1034-1065
  │       │   ├── SaladCard grid       // lines 1068-1098
  │       │   └── SaladLiterPopup      // lines 1101-1142
  │       │
  │       ├── Middle Courses Section   // lines 1146-1221
  │       ├── Sides Section            // lines 1223-1317
  │       ├── Mains Section            // lines 1319-1394
  │       └── Extras Section           // lines 1396-1478
  │
  └── <div> Fixed Bottom Bar           // lines 1483-1510
      ├── Save Button
      └── Print Button
</div>
```

---

#### SaladCard (`src/components/orders/SaladSelector.tsx:39-168`)

**Props Interface** (lines 26-37):
```typescript
interface SaladCardProps {
  item: FoodItem;
  selected: boolean;
  literQuantities: LiterQuantity[];
  sizeQuantity?: SizeQuantity;
  regularQuantity?: number;
  addOns?: AddOnState[];
  note?: string;
  literSizes: LiterSize[];
  measurementType: MeasurementType;
  onSelect: () => void;
}
```

**Key Computations**:
- `hasAnySelection` (lines 52-61): Checks if any quantity is set based on measurement type
- `hasAddOnSelections` (lines 64-69): Checks if add-ons have quantities
- `selectionSummary` (lines 72-90): Builds display text like "2.5L×3 | 3L×1"

**Render** (lines 92-167):
- Shows checkmark badge when selected
- Shows measurement type indicator (ג׳/ק׳)
- Shows add-ons indicator (+N)
- Shows quantity summary
- Shows note indicator

---

#### SaladLiterPopup (`src/components/orders/SaladSelector.tsx:189-536`)

**Props Interface** (lines 171-187):
```typescript
interface SaladLiterPopupProps {
  item: FoodItem;
  literQuantities: LiterQuantity[];
  sizeQuantity?: SizeQuantity;
  regularQuantity?: number;
  addOns?: AddOnState[];
  note?: string;
  literSizes: LiterSize[];
  measurementType: MeasurementType;
  onLiterChange: (literSizeId: string, quantity: number) => void;
  onSizeChange?: (size: "big" | "small", quantity: number) => void;
  onRegularQuantityChange?: (quantity: number) => void;
  onAddOnLiterChange?: (addonId: string, literSizeId: string, quantity: number) => void;
  onAddOnQuantityChange?: (addonId: string, quantity: number) => void;
  onNoteChange?: (note: string) => void;
  onClose: () => void;
}
```

**Render Sections**:
- Backdrop overlay (lines 288-292)
- Header with item name and close button (lines 297-307)
- Liter options grid (lines 310-327) - uses `LiterSelector` component
- Size options grid (lines 330-349) - uses `SizeSelector` component
- Regular quantity selector (lines 352-408)
- Add-ons section (lines 411-487)
- Notes textarea (lines 490-501)
- Summary display (lines 504-522)
- Done button (lines 525-531)

---

#### LiterSelector (`src/components/orders/SaladSelector.tsx:545-620`)

**Purpose**: Single liter size quantity input with +/- buttons

**Props** (lines 538-543):
```typescript
interface LiterSelectorProps {
  literSize: LiterSize;
  quantity: number;
  isActive: boolean;
  onChange: (quantity: number) => void;
}
```

---

#### SizeSelector (`src/components/orders/SaladSelector.tsx:698-797`)

**Purpose**: Big/Small quantity input with +/- buttons

**Props** (lines 689-696):
```typescript
interface SizeSelectorProps {
  label: string;      // "גדול" or "קטן"
  symbol: string;     // "ג׳" or "ק׳"
  quantity: number;
  isActive: boolean;
  onChange: (quantity: number) => void;
  color: "blue" | "green";
}
```

---

#### FoodItemCard (`src/components/orders/FoodItemSelector.tsx:49-188`)

**Props Interface** (lines 37-47):
```typescript
interface FoodItemCardProps {
  item: FoodItem;
  selected: boolean;
  quantity: number;
  sizeQuantity?: SizeQuantity;
  useSizeMode?: boolean;
  preparationName?: string;
  note?: string;
  variationQuantities?: VariationQuantity[];
  onSelect: () => void;
}
```

**Key Computations**:
- `selectionSummary` (lines 64-89): Builds display text for variations or regular quantities
- `portionTotal` (lines 92-94): Calculates portion display (e.g., "= 30 קציצות")
- `hasAnySelection` (lines 97-105): Checks if any quantity is set

---

#### FoodItemPopup (`src/components/orders/FoodItemSelector.tsx:207-427`)

**Props Interface** (lines 191-205):
```typescript
interface FoodItemPopupProps {
  item: FoodItem;
  quantity: number;
  sizeQuantity?: SizeQuantity;
  useSizeMode?: boolean;
  selectedPreparationId?: string;
  note?: string;
  variationQuantities?: VariationQuantity[];
  onQuantityChange: (quantity: number) => void;
  onSizeChange?: (size: "big" | "small", quantity: number) => void;
  onPreparationChange?: (preparationId: string | undefined, preparationName: string | undefined) => void;
  onNoteChange?: (note: string) => void;
  onVariationSizeChange?: (variationId: string, size: "big" | "small", quantity: number) => void;
  onClose: () => void;
}
```

**Render Sections**:
- Backdrop overlay (lines 247-250)
- Header with item name and close button (lines 256-266)
- Preparation options buttons (lines 269-292)
- Variations selector (lines 295-314) - uses `VariationSelector`
- OR Size-based quantity selector (lines 315-337)
- OR Regular quantity selector (lines 338-398)
- Notes textarea (lines 401-413)
- Done button (lines 416-422)

---

#### VariationSelector (`src/components/orders/FoodItemSelector.tsx:552-654`)

**Purpose**: Size selection for item variations (e.g., rice types)

**Props** (lines 544-550):
```typescript
interface VariationSelectorProps {
  variation: FoodItemVariation;
  sizeBig: number;
  sizeSmall: number;
  isActive: boolean;
  onSizeChange: (size: "big" | "small", quantity: number) => void;
}
```

---

## Function Call Graph

### Order Creation Flow

```
User clicks "Save" in OrderForm
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ handleSave() (OrderForm.tsx:695)                                │
│   │                                                             │
│   ├─→ Validate phone number (line 697)                          │
│   │                                                             │
│   ├─→ Build items array from formState (lines 707-868)          │
│   │     ├─→ Process salads (lines 710-786)                      │
│   │     ├─→ Process regular items (lines 789-807)               │
│   │     └─→ Process sides with variations (lines 809-868)       │
│   │                                                             │
│   └─→ saveOrder(input) (line 871)                               │
│         │                                                       │
└─────────┼───────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│ saveOrder() (order-service.ts:101)                              │
│   │                                                             │
│   ├─→ findOrCreateCustomer(phone, name, address) (line 106)     │
│   │     │                                                       │
│   │     ├─→ supabase.from("customers").select().eq("phone")     │
│   │     ├─→ If exists: supabase.from("customers").update()      │
│   │     └─→ If not: supabase.from("customers").insert()         │
│   │                                                             │
│   ├─→ supabase.from("orders").insert() (line 121)               │
│   │                                                             │
│   └─→ supabase.from("order_items").insert(orderItems) (line 159)│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Data Fetching Flow

```
Component mounts
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ useSupabaseData() (useSupabaseData.ts:15)                       │
│   │                                                             │
│   ├─→ createClient() (line 24)                                  │
│   │     └─→ supabase/client.ts:createClient()                   │
│   │                                                             │
│   ├─→ supabase.from("categories").select() (line 28)            │
│   ├─→ supabase.from("food_items").select().eq("is_active") (36) │
│   ├─→ supabase.from("liter_sizes").select() (line 45)           │
│   ├─→ supabase.from("food_item_add_ons").select() (line 55)     │
│   ├─→ supabase.from("food_item_preparations").select() (line 72)│
│   └─→ supabase.from("food_item_variations").select() (line 88)  │
│                                                                 │
│   └─→ Map add-ons/preparations/variations to items (lines 106-124)
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│ Returns: { categories, foodItems, literSizes, isLoading, error }│
└─────────────────────────────────────────────────────────────────┘
```

### Summary Aggregation Flow

```
User clicks "Filter" in SummaryPage
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ handleFilter() (summary/page.tsx:81)                            │
│   │                                                             │
│   └─→ Promise.all([                                             │
│         getOrdersByDateRange(fromDate, toDate),                 │
│         getOrdersSummary(fromDate, toDate)                      │
│       ])                                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│ getOrdersSummary() (order-service.ts:394)                       │
│   │                                                             │
│   ├─→ supabase.from("categories").select() (line 401)           │
│   │                                                             │
│   ├─→ supabase.from("orders").select("id")                      │
│   │     .gte("order_date", fromDate)                            │
│   │     .lte("order_date", toDate) (lines 409-414)              │
│   │                                                             │
│   ├─→ supabase.from("order_items").select(                      │
│   │     "*, food_item:food_items(...), liter_size:liter_sizes()")│
│   │     .in("order_id", orderIds) (lines 423-430)               │
│   │                                                             │
│   ├─→ supabase.from("food_item_add_ons").select()               │
│   │     .in("id", addOnIds) (lines 438-447)                     │
│   │                                                             │
│   ├─→ supabase.from("food_item_variations").select()            │
│   │     .in("id", variationIds) (lines 451-464)                 │
│   │                                                             │
│   └─→ Aggregate by category and food item (lines 471-592)       │
│         ├─→ Group by category_id                                │
│         ├─→ Sum liter quantities                                │
│         ├─→ Sum size quantities (ג/ק)                           │
│         ├─→ Sum regular quantities                              │
│         └─→ Track add-ons and variations separately             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Details

### Form State → Order Items Mapping

```
formState.salads[i]                    order_items rows
─────────────────────────────────────────────────────────────────
{                                      If measurement_type === "liters":
  food_item_id: "abc",                 ┌─────────────────────────────┐
  selected: true,                      │ { food_item_id: "abc",      │
  measurement_type: "liters",          │   liter_size_id: "1.5L_id", │
  liters: [                            │   quantity: 2 }             │
    { liter_size_id: "1.5L_id",        ├─────────────────────────────┤
      quantity: 2 },                   │ { food_item_id: "abc",      │
    { liter_size_id: "2.5L_id",        │   liter_size_id: "2.5L_id", │
      quantity: 3 }                    │   quantity: 3 }             │
  ],                                   └─────────────────────────────┘
  addOns: [
    { addon_id: "rotev",               If add-on has quantity:
      quantity: 2 }                    ┌─────────────────────────────┐
  ]                                    │ { food_item_id: "abc",      │
}                                      │   add_on_id: "rotev",       │
                                       │   quantity: 2 }             │
                                       └─────────────────────────────┘

{                                      If measurement_type === "size":
  food_item_id: "def",                 ┌─────────────────────────────┐
  selected: true,                      │ { food_item_id: "def",      │
  measurement_type: "size",            │   size_type: "big",         │
  size_big: 5,                         │   quantity: 5 }             │
  size_small: 3                        ├─────────────────────────────┤
}                                      │ { food_item_id: "def",      │
                                       │   size_type: "small",       │
                                       │   quantity: 3 }             │
                                       └─────────────────────────────┘

formState.sides[i]                     With variations:
─────────────────────────────────────────────────────────────────
{                                      ┌─────────────────────────────┐
  food_item_id: "rice",                │ { food_item_id: "rice",     │
  selected: true,                      │   variation_id: "white",    │
  variations: [                        │   size_type: "big",         │
    { variation_id: "white",           │   quantity: 2 }             │
      size_big: 2,                     ├─────────────────────────────┤
      size_small: 1 },                 │ { food_item_id: "rice",     │
    { variation_id: "green",           │   variation_id: "white",    │
      size_big: 1,                     │   size_type: "small",       │
      size_small: 0 }                  │   quantity: 1 }             │
  ]                                    ├─────────────────────────────┤
}                                      │ { food_item_id: "rice",     │
                                       │   variation_id: "green",    │
                                       │   size_type: "big",         │
                                       │   quantity: 1 }             │
                                       └─────────────────────────────┘
```

---

## State Management Details

### OrderForm State Flow

```
                    ┌────────────────────┐
                    │   useSupabaseData  │
                    │   (hook)           │
                    └────────┬───────────┘
                             │ returns
                             ▼
┌──────────────────────────────────────────────────────────────┐
│ { categories, foodItems, literSizes, isLoading, error }      │
└────────┬─────────────────────────────────────────────────────┘
         │
         │ useEffect (lines 148-204)
         ▼
┌──────────────────────────────────────────────────────────────┐
│ formState = {                                                │
│   customer_name: "",                                         │
│   phone: "",                                                 │
│   order_date: today,                                         │
│   ...                                                        │
│   salads: [                                                  │
│     { food_item_id, selected: false, liters: [...], ... }   │
│     // One entry per salad item from foodItems               │
│   ],                                                         │
│   middle_courses: [...],                                     │
│   sides: [...],                                              │
│   mains: [...],                                              │
│   extras: [...]                                              │
│ }                                                            │
└────────┬─────────────────────────────────────────────────────┘
         │
         │ User interactions call handlers
         │
         ├─→ handleSaladToggle(foodItemId, checked)
         │     └─→ setFormState(prev => ({ ...prev, salads: ... }))
         │
         ├─→ handleSaladLiterChange(foodItemId, literSizeId, qty)
         │     └─→ setFormState(prev => ({ ...prev, salads: ... }))
         │
         ├─→ ... (other handlers)
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│ Updated formState triggers re-render                         │
│   → SaladCard shows new selection                            │
│   → Selection counts update                                  │
└──────────────────────────────────────────────────────────────┘
```

### Component Communication

```
┌─────────────────────────────────────────────────────────────────┐
│                        OrderForm                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ formState                                                   ││
│  │ expandedSaladId                                             ││
│  │ bulkLiters                                                  ││
│  └────────────┬────────────────────────────────────────────────┘│
│               │                                                  │
│   ┌───────────┼───────────┐                                      │
│   │           │           │                                      │
│   ▼           ▼           ▼                                      │
│ ┌─────────┐ ┌─────────┐ ┌─────────────────┐                      │
│ │SaladCard│ │SaladCard│ │SaladLiterPopup  │                      │
│ │ props:  │ │ props:  │ │ props:          │                      │
│ │ item    │ │ item    │ │ item            │                      │
│ │ selected│ │ selected│ │ literQuantities │                      │
│ │ liters  │ │ liters  │ │ onLiterChange   │──────┐               │
│ │ onSelect│ │ onSelect│ │ onSizeChange    │      │               │
│ └────┬────┘ └────┬────┘ │ onClose         │      │               │
│      │           │      └─────────────────┘      │               │
│      │ onClick   │                               │ callback      │
│      ▼           ▼                               ▼               │
│  setExpandedSaladId(id)                 handleSaladLiterChange() │
│                                         handleSaladSizeChange()  │
│                                         setExpandedSaladId(null) │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Service Layer Reference

### order-service.ts Functions

| Function | Lines | Parameters | Returns | Description |
|----------|-------|------------|---------|-------------|
| `findOrCreateCustomer` | 40-95 | `phone, name, address` | `{ customer, error }` | Find by phone or create new |
| `saveOrder` | 101-184 | `SaveOrderInput` | `SaveOrderResult` | Create order with items |
| `getOrdersByPhone` | 189-214 | `phone` | `Order[]` | Get customer's orders |
| `getOrderWithItems` | 219-247 | `orderId` | `{ order, items }` | Get single order details |
| `updateOrderStatus` | 252-268 | `orderId, status` | `{ success, error }` | Update order status |
| `getOrdersByDateRange` | 303-350 | `fromDate, toDate` | `OrderWithDetails[]` | Get orders in date range |
| `getOrdersSummary` | 394-592 | `fromDate, toDate` | `CategorySummary[]` | Get aggregated summary |
| `updateOrder` | 652-932 | `orderId, UpdateOrderInput` | `SaveOrderResult` | Update existing order |

### admin-service.ts Functions

| Function | Lines | Parameters | Returns | Description |
|----------|-------|------------|---------|-------------|
| `getCategories` | 24-38 | none | `Category[]` | Get all categories |
| `getFoodItems` | 43-67 | `categoryId?` | `FoodItem[]` | Get food items |
| `createFoodItem` | 72-111 | `CreateFoodItemInput` | `{ success, item, error }` | Create food item |
| `updateFoodItem` | 116-144 | `UpdateFoodItemInput` | `{ success, error }` | Update food item |
| `deleteFoodItem` | 149-166 | `id` | `{ success, error }` | Soft delete item |
| `permanentlyDeleteFoodItem` | 171-201 | `id` | `{ success, error }` | Hard delete item |
| `restoreFoodItem` | 206-222 | `id` | `{ success, error }` | Restore deleted item |
| `getPreparations` | 241-256 | `foodItemId` | `FoodItemPreparation[]` | Get preparations |
| `createPreparation` | 261-298 | `CreatePreparationInput` | `{ success, preparation, error }` | Create preparation |
| `updatePreparation` | 303-325 | `UpdatePreparationInput` | `{ success, error }` | Update preparation |
| `deletePreparation` | 330-347 | `id` | `{ success, error }` | Soft delete prep |
| `permanentlyDeletePreparation` | 352-368 | `id` | `{ success, error }` | Hard delete prep |

---

## Type Definitions

### Core Types (`src/types/index.ts`)

```typescript
// Line 2-9
interface Category {
  id: string;
  name: string;           // Hebrew: "סלטים"
  name_en: string;        // English: "salads"
  max_selection: number | null;
  sort_order: number;
  created_at: string;
}

// Line 12-18
interface LiterSize {
  id: string;
  size: number;           // 1.5, 2.5, 3, 4.5
  label: string;          // "1.5L"
  sort_order: number;
  created_at: string;
}

// Line 21
type MeasurementType = 'liters' | 'size' | 'none';

// Lines 24-42
interface FoodItem {
  id: string;
  category_id: string;
  name: string;
  has_liters: boolean;
  measurement_type: MeasurementType;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  portion_multiplier?: number | null;
  portion_unit?: string | null;
  add_ons?: FoodItemAddOn[];
  preparations?: FoodItemPreparation[];
  variations?: FoodItemVariation[];
}

// Lines 45-52
interface FoodItemAddOn {
  id: string;
  parent_food_item_id: string;
  name: string;
  measurement_type: MeasurementType;
  sort_order: number;
  is_active: boolean;
}

// Lines 55-61
interface FoodItemPreparation {
  id: string;
  parent_food_item_id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}

// Lines 64-70
interface FoodItemVariation {
  id: string;
  parent_food_item_id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}

// Lines 73-81
interface Customer {
  id: string;
  phone: string;
  name: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Line 84
type OrderStatus = 'draft' | 'active' | 'completed' | 'cancelled';

// Lines 87-100
interface Order {
  id: string;
  order_number: number;
  customer_id: string | null;
  order_date: string;
  order_time: string | null;
  delivery_address: string | null;
  notes: string | null;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  customer?: Customer;
}

// Lines 103-114
interface OrderItem {
  id: string;
  order_id: string;
  food_item_id: string;
  liter_size_id: string | null;
  size_type: "big" | "small" | null;
  preparation_id: string | null;
  variation_id: string | null;
  quantity: number;
  item_note: string | null;
  created_at: string;
}
```

---

## File Quick Reference

| File | Lines | Purpose |
|------|-------|---------|
| `src/app/page.tsx` | 33 | Home page - renders OrderForm |
| `src/app/summary/page.tsx` | 631 | Orders list and summary view |
| `src/app/admin/page.tsx` | 900+ | Food item management |
| `src/app/edit-order/[id]/page.tsx` | 400+ | Edit existing order |
| `src/app/print-preview/page.tsx` | 100+ | Print preview page |
| `src/components/orders/OrderForm.tsx` | 1514 | Main order creation form |
| `src/components/orders/SaladSelector.tsx` | 801 | Salad card and popup |
| `src/components/orders/FoodItemSelector.tsx` | 655 | Food item card and popup |
| `src/components/print/PrintOrderPage.tsx` | 500+ | Print layout component |
| `src/lib/services/order-service.ts` | 934 | Order CRUD operations |
| `src/lib/services/admin-service.ts` | 369 | Admin operations |
| `src/hooks/useSupabaseData.ts` | 152 | Data fetching hook |
| `src/lib/supabase/client.ts` | 11 | Supabase client factory |
| `src/types/index.ts` | 174 | TypeScript interfaces |
| `src/lib/constants/labels.ts` | 86 | Hebrew UI labels |
