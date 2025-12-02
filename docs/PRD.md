# Product Requirements Document (PRD)
# מערכת ניהול הזמנות למטבח - Kitchen Order Management System

## 1. Executive Summary

### 1.1 Product Overview
An internal Progressive Web Application (PWA) for managing catering orders. The system allows kitchen staff to create, edit, and track orders with detailed food selections. It works offline and syncs automatically when connection is restored.

### 1.2 Target Users
- 3 internal kitchen staff members
- Used on mobile devices and desktop computers
- Must work in kitchen environment (possibly with wet/dirty hands - large touch targets)

### 1.3 Core Value Proposition
- Replace paper order forms with digital system
- Work offline in areas with poor connectivity
- Aggregate order data for kitchen preparation
- Print formatted order sheets for kitchen staff

---

## 2. User Stories

### 2.1 Order Management

#### US-001: Create New Order
**As a** kitchen staff member  
**I want to** create a new order with customer details and food selections  
**So that** I can record what needs to be prepared

**Acceptance Criteria:**
- [ ] Can enter customer name, phone, date, time, address
- [ ] Can select up to 10 salads with liter sizes and quantities
- [ ] Can select up to 2 middle courses with quantities
- [ ] Can select up to 3 sides with quantities
- [ ] Can select up to 3 mains with quantities
- [ ] Can add unlimited extras with quantities
- [ ] Order is saved locally immediately
- [ ] Order syncs to server when online

---

#### US-002: Edit Existing Order
**As a** kitchen staff member  
**I want to** modify an existing order  
**So that** I can update it when customer changes requirements

**Acceptance Criteria:**
- [ ] Can access any non-completed order
- [ ] Can modify all fields (customer info, food selections)
- [ ] Can add or remove food items
- [ ] Changes are saved immediately
- [ ] Last modified timestamp is updated

---

#### US-003: Mark Order as Completed
**As a** kitchen staff member  
**I want to** mark an order as completed  
**So that** I know which orders are done

**Acceptance Criteria:**
- [ ] Can change order status from active to completed
- [ ] Completed orders move to separate view/section
- [ ] Completed orders cannot be edited (or require confirmation to edit)
- [ ] Can filter orders by status

---

#### US-004: View Orders List
**As a** kitchen staff member  
**I want to** see all orders  
**So that** I can manage today's work

**Acceptance Criteria:**
- [ ] See list of all orders (draft, active, completed)
- [ ] Orders sorted by date/time
- [ ] Quick view shows: order number, customer name, date, status
- [ ] Can filter by status and date
- [ ] Can search by customer name or phone

---

### 2.2 Salad Selection (Special Logic)

#### US-005: Select Salad with Liter Sizes
**As a** kitchen staff member  
**I want to** select salads with specific box sizes and quantities  
**So that** the kitchen knows exactly what containers to prepare

**Acceptance Criteria:**
- [ ] Each salad shows 4 liter options: 1.5L, 2.5L, 3L, 4.5L
- [ ] Can select multiple sizes for same salad
- [ ] Can set quantity for each size (e.g., 2.5L × 3, 3L × 2)
- [ ] Selection count shows progress (e.g., "5/10 סלטים")
- [ ] Cannot exceed 10 salad selections

**Example:**
```
חומוס:
  ☑ 1.5L × 0
  ☑ 2.5L × 2  ← Selected
  ☐ 3L × 0
  ☑ 4.5L × 1  ← Selected
  
Total for חומוס: 2.5L × 2, 4.5L × 1
```

---

#### US-006: Bulk Apply Liter Size to All Salads
**As a** kitchen staff member  
**I want to** apply the same liter size to all selected salads at once  
**So that** I can quickly set common configurations

**Acceptance Criteria:**
- [ ] "Apply to all" button/option available
- [ ] Can select which liter size to apply
- [ ] Can set quantity to apply
- [ ] Only applies to currently checked salads
- [ ] Can still modify individual salads after bulk apply

---

### 2.3 Summary & Reports

#### US-007: View Aggregated Totals by Date Range
**As a** kitchen staff member  
**I want to** see total quantities of each food item for a date range  
**So that** I know how much to prepare

**Acceptance Criteria:**
- [ ] Can select date range (from date - to date)
- [ ] Shows aggregated totals per food item
- [ ] Salads show totals per liter size
- [ ] Only includes active and completed orders (not drafts)
- [ ] Can export or print summary

**Example Output:**
```
תאריך: 01/12/2025 - 03/12/2025

סלטים:
  חומוס: 1.5L × 3, 2.5L × 8, 3L × 2
  טחינה: 2.5L × 5, 4.5L × 3
  מטבוחה: 2.5L × 10

מנות ביניים:
  פילה מושט מזרחי: 12
  בורקס רוטב פטריות: 8

עיקריות:
  כרעיים אפוי: 45
  שניצל מטוגן: 30
```

---

#### US-008: View Individual Item Totals
**As a** kitchen staff member  
**I want to** see totals for a specific food item  
**So that** I can check quantities for specific dishes

**Acceptance Criteria:**
- [ ] Can select specific food item
- [ ] Shows breakdown by date
- [ ] Shows total across all dates
- [ ] For salads, shows breakdown by liter size

---

### 2.4 Printing

#### US-009: Print Order for Kitchen
**As a** kitchen staff member  
**I want to** print an order in a kitchen-friendly format  
**So that** kitchen staff can see what to prepare

**Acceptance Criteria:**
- [ ] Print layout similar to paper form
- [ ] Shows all selected items with quantities
- [ ] Salads display as: "2.5L × 2, 3L × 1"
- [ ] Clear category separation
- [ ] Customer info at top or bottom
- [ ] Order number prominently displayed
- [ ] Optimized for standard printer (A4)

---

#### US-010: Print Summary Report
**As a** kitchen staff member  
**I want to** print the aggregated summary  
**So that** kitchen can see total preparation needs

**Acceptance Criteria:**
- [ ] Print layout shows date range
- [ ] All items with totals clearly listed
- [ ] Grouped by category
- [ ] Large, readable font for kitchen

---

### 2.5 Admin Functions

#### US-011: Add New Food Item
**As an** admin  
**I want to** add new food items to the menu  
**So that** we can include new dishes

**Acceptance Criteria:**
- [ ] Can specify item name (Hebrew)
- [ ] Can select category
- [ ] Can specify if item uses liter sizes (salad-type)
- [ ] Can set sort order
- [ ] New item immediately available in order form

---

#### US-012: Edit Food Item
**As an** admin  
**I want to** edit existing food items  
**So that** I can update names or settings

**Acceptance Criteria:**
- [ ] Can change item name
- [ ] Can change category
- [ ] Can toggle liter-size setting
- [ ] Can change sort order
- [ ] Can deactivate item (hide from order form)
- [ ] Existing orders with this item remain unaffected

---

#### US-013: Delete Food Item
**As an** admin  
**I want to** remove food items no longer offered  
**So that** the menu stays current

**Acceptance Criteria:**
- [ ] Can delete item only if not used in any order
- [ ] If used in orders, can only deactivate (not delete)
- [ ] Confirmation required before delete

---

#### US-014: Manage Print Layouts
**As an** admin  
**I want to** configure different print layouts  
**So that** we can have different formats for different needs

**Acceptance Criteria:**
- [ ] Can create multiple layout templates
- [ ] Can set which sections to include
- [ ] Can set order of sections
- [ ] Can set one layout as default
- [ ] Can preview layout before saving

---

### 2.6 Offline & Sync

#### US-015: Work Offline
**As a** kitchen staff member  
**I want to** use the app without internet connection  
**So that** I can work in areas with poor connectivity

**Acceptance Criteria:**
- [ ] App loads without internet
- [ ] Can create new orders offline
- [ ] Can edit existing orders offline
- [ ] Can view all synced data offline
- [ ] Visual indicator shows offline status

---

#### US-016: Automatic Sync
**As a** kitchen staff member  
**I want to** have my changes automatically sync when online  
**So that** I don't have to manually sync

**Acceptance Criteria:**
- [ ] Changes sync automatically when connection restored
- [ ] Visual indicator shows sync in progress
- [ ] Visual indicator shows pending changes count
- [ ] Notification when sync completes
- [ ] Handles sync conflicts gracefully

---

### 2.7 Authentication

#### US-017: Simple Login
**As a** kitchen staff member  
**I want to** log in with a simple password  
**So that** only authorized staff can access the system

**Acceptance Criteria:**
- [ ] Single shared password for all users
- [ ] Password entry screen on first load
- [ ] Stay logged in on device (remember me)
- [ ] Can log out manually
- [ ] Admin can change password

---

## 3. Functional Requirements

### 3.1 Order Data Structure

Each order contains:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| order_number | Auto | Yes | Unique sequential number |
| customer_name | Text | No | שם הלקוח |
| phone | Text | No | טלפון |
| order_date | Date | Yes | יום ההזמנה |
| order_time | Time | No | שעה |
| address | Text | No | כתובת |
| notes | Text | No | הערות |
| status | Enum | Yes | draft / active / completed |
| items | Array | Yes | Selected food items |

### 3.2 Order Item Data Structure

Each order item contains:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| food_item_id | UUID | Yes | Reference to food item |
| liter_size_id | UUID | Conditional | Required for salad-type items |
| quantity | Integer | Yes | Number of units |

### 3.3 Business Rules

#### Selection Limits
| Category | Hebrew | Max Items |
|----------|--------|-----------|
| Salads | סלטים | 10 |
| Middle Courses | מנות ביניים | 2 |
| Sides | תוספות | 3 |
| Mains | עיקריות | 3 |
| Extras | אקסטרות | Unlimited |

#### Liter Sizes (for Salads)
- 1.5L
- 2.5L
- 3L
- 4.5L

#### Order Status Flow
```
draft → active → completed
         ↓
       (can revert to draft for editing)
```

### 3.4 Validation Rules

1. **Order date** is required
2. **At least one food item** must be selected
3. **Salad items** must have at least one liter size with quantity > 0
4. **Non-salad items** must have quantity > 0
5. **Selection limits** must not be exceeded per category

---

## 4. Non-Functional Requirements

### 4.1 Performance
- App should load in under 3 seconds on 3G connection
- Order form should respond to input within 100ms
- Sync should complete within 10 seconds for typical changes

### 4.2 Offline Capability
- App must function fully offline after initial load
- Local data must persist across browser sessions
- Sync queue must handle 100+ pending changes

### 4.3 Compatibility
- Mobile: iOS Safari, Chrome for Android
- Desktop: Chrome, Firefox, Safari, Edge
- Minimum screen width: 320px
- Responsive up to 1920px

### 4.4 Accessibility
- Minimum touch target: 44px × 44px
- Sufficient color contrast (WCAG AA)
- RTL layout throughout
- Clear focus indicators

### 4.5 Security
- Password protected access
- HTTPS only
- No sensitive customer data stored (basic contact info only)

---

## 5. Out of Scope (Future Phases)

The following features are explicitly **NOT** included in this phase:

1. ❌ Pricing and payment calculations
2. ❌ Customer-facing ordering (internal use only)
3. ❌ Inventory management
4. ❌ Multiple business/location support
5. ❌ User-specific permissions (all users have same access)
6. ❌ Order history analytics/graphs
7. ❌ SMS/Email notifications
8. ❌ Integration with external systems
9. ❌ Portion checkboxes (ק, ב, ע, א, ס) from paper form

---

## 6. Success Metrics

| Metric | Target |
|--------|--------|
| App load time | < 3 seconds |
| Offline reliability | 99.9% |
| Order creation time | < 2 minutes |
| Sync success rate | > 99% |
| User adoption | 100% (all 3 staff) |

---

## 7. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Poor connectivity | Can't sync | Robust offline mode with PowerSync |
| Data loss | Lost orders | Local persistence + cloud backup |
| Printer compatibility | Can't print | Standard CSS print, test on target printer |
| Complex salad UI | User confusion | Thorough UX testing, simple design |
| Device diversity | UI breaks | Responsive design, test on real devices |

---

## 8. Timeline Estimate

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Setup | 1 week | Project setup, DB schema, auth |
| Core Order Form | 2 weeks | Create/edit orders, salad logic |
| Offline Sync | 1 week | PowerSync integration |
| Summary & Reports | 1 week | Aggregation, filtering |
| Printing | 1 week | Print layouts, admin config |
| Admin Panel | 1 week | Food management, settings |
| Testing & Polish | 1 week | Bug fixes, UX improvements |
| **Total** | **8 weeks** | Full MVP |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-01 | Initial | First draft |
