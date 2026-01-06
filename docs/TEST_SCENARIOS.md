# Kitchen Orders Application - Test Scenarios Document

## Overview
This document contains all test scenarios for the Kitchen Orders application (HagadaOrder).
Each test includes a unique ID, description, preconditions, detailed steps, and expected results.

---

## 1. Order Creation Tests

### Test 1.1: Create Basic Order with Customer Details
**Test ID:** TC-001  
**Category:** Sanity Test  
**Priority:** Critical

**Description:**  
Verify that a basic order can be created with customer details and saved successfully.

**Preconditions:**
- User is logged in to the application
- User is on the order page (/order)
- Database is accessible

**Test Steps:**
1. Navigate to the order page by clicking "הזמנה חדשה" or going to /order
2. Fill in customer name field with "ישראל ישראלי"
3. Fill in primary phone number with "0501234567"
4. Fill in secondary phone number with "0509876543"
5. Fill in delivery address with "רחוב הרצל 15, תל אביב"
6. Select order date using the date picker (select tomorrow's date)
7. Set kitchen time (זמן למטבח) to "14:00"
8. Set customer time (זמן ללקוח) to "16:00"
9. Click the "שמור" (Save) button

**Expected Results:**
- Order is saved successfully
- Success message is displayed
- Order is assigned an order number
- User can find the order in the summary page

---

### Test 1.2: Create Order with Salad Items (Liter Measurements)
**Test ID:** TC-002  
**Category:** Functional Test  
**Priority:** High

**Description:**  
Verify that salad items with liter measurements can be added to an order.

**Preconditions:**
- User is logged in
- User is on the order page
- Salad items exist in the database

**Test Steps:**
1. Fill in basic customer details (name: "דוד כהן", phone: "0521111111")
2. Select order date
3. Scroll to the "סלטים" (Salads) section
4. Click on a salad item (e.g., "חומוס")
5. For 1/2 liter option, enter quantity "2"
6. For 1 liter option, enter quantity "3"
7. Click on another salad item (e.g., "טחינה")
8. For 1/4 liter option, enter quantity "4"
9. Click "שמור" button

**Expected Results:**
- Order is saved with correct salad items
- Quantities are saved correctly for each liter size
- In summary page, salads show correct liter quantities (e.g., "1/2L × 2", "1L × 3")

---

### Test 1.3: Create Order with Side Dishes (Size-based: ג/ק)
**Test ID:** TC-003  
**Category:** Functional Test  
**Priority:** High

**Description:**  
Verify that side dish items with size-based measurements (big/small) can be added.

**Preconditions:**
- User is logged in
- User is on the order page
- Side dish items exist in the database

**Test Steps:**
1. Fill in customer details (name: "שרה לוי", phone: "0532222222")
2. Select order date
3. Scroll to the "תוספות" (Sides) section
4. Click on a side item (e.g., "אורז לבן")
5. In the "ג" (big) field, enter "3"
6. In the "ק" (small) field, enter "5"
7. Click on another side item (e.g., "פירה")
8. In the "ג" field, enter "2"
9. Click "שמור" button

**Expected Results:**
- Order is saved with correct side dish items
- Size quantities (ג/ק) are saved correctly
- In summary page, sides show "ג × 3, ק × 5" format

---

### Test 1.4: Create Order with Main Dishes (Quantity + Portions)
**Test ID:** TC-004  
**Category:** Functional Test  
**Priority:** High

**Description:**  
Verify that main dish items with quantity and portion multipliers work correctly.

**Preconditions:**
- User is logged in
- User is on the order page
- Main dish items with portion_multiplier exist

**Test Steps:**
1. Fill in customer details (name: "משה אברהם", phone: "0543333333")
2. Select order date
3. Scroll to the "עיקריות" (Mains) section
4. Click on a main dish (e.g., "עוף בגריל")
5. Enter quantity "10"
6. Note if the item has portion multiplier displayed
7. Click on another main dish
8. Enter quantity "5"
9. Click "שמור" button

**Expected Results:**
- Order is saved with correct main dish items
- Quantities are saved correctly
- If portion multiplier exists, calculated portions are displayed correctly

---

### Test 1.5: Create Order with Middle Courses and Preparation Options
**Test ID:** TC-005  
**Category:** Functional Test  
**Priority:** Medium

**Description:**  
Verify that middle course items with preparation options can be added.

**Preconditions:**
- User is logged in
- Middle course items with preparation options exist

**Test Steps:**
1. Fill in customer details (name: "רחל גולד", phone: "0554444444")
2. Select order date
3. Scroll to the "ביניים" (Middle Courses) section
4. Click on a middle course item (e.g., "כרעיים")
5. Enter quantity "15"
6. If preparation options exist (e.g., "מתובל", "לא מתובל"), select one
7. Add a note in the item note field: "ללא שום"
8. Click "שמור" button

**Expected Results:**
- Order is saved with correct middle course items
- Preparation option is saved
- Item note is saved and visible

---

### Test 1.6: Create Order with Extra Items
**Test ID:** TC-006  
**Category:** Functional Test  
**Priority:** High

**Description:**  
Verify that extra items (with additional pricing) can be added to an order.

**Preconditions:**
- User is logged in
- User is on the order page

**Test Steps:**
1. Fill in customer details (name: "יעקב שמעון", phone: "0565555555")
2. Select order date
3. Add some regular items to the order
4. Scroll to the "אקסטרה" section or look for extra item options
5. Click on a food item to add as extra
6. Enter extra quantity (e.g., "ג" = 2, "ק" = 3)
7. Set the price for the extra item (e.g., 50)
8. Click "שמור" button

**Expected Results:**
- Order is saved with extra items
- Extra items appear in a separate section
- Extra item price is added to total calculation
- Extra items appear in both their category and extra section on print

---

### Test 1.7: Create Order with Pricing Information
**Test ID:** TC-007  
**Category:** Functional Test  
**Priority:** Medium

**Description:**  
Verify that order pricing (portions, price per portion, delivery fee) is saved correctly.

**Preconditions:**
- User is logged in
- User is on the order page

**Test Steps:**
1. Fill in customer details
2. Select order date and add some items
3. Scroll to the pricing section
4. Enter total portions: "50"
5. Enter price per portion: "85"
6. Enter delivery fee: "100"
7. Verify the total calculation is displayed correctly (50 × 85 + 100 = 4350)
8. Click "שמור" button

**Expected Results:**
- All pricing information is saved correctly
- Total payment is calculated correctly
- Pricing information appears in summary page
- Pricing information appears on print preview

---

### Test 1.8: Create Order with General Notes
**Test ID:** TC-008  
**Category:** Functional Test  
**Priority:** Low

**Description:**  
Verify that general order notes are saved correctly.

**Preconditions:**
- User is logged in

**Test Steps:**
1. Fill in customer details
2. Select order date and add some items
3. Find the general notes field
4. Enter notes: "לקוח VIP - להכין בקפידה. להתקשר לפני המשלוח."
5. Click "שמור" button

**Expected Results:**
- Notes are saved with the order
- Notes appear in the order details in summary page
- Notes appear on print preview

---

## 2. Order Search and Filter Tests

### Test 2.1: Filter Orders by Date Range
**Test ID:** TC-009  
**Category:** Functional Test  
**Priority:** Critical

**Description:**  
Verify that orders can be filtered by date range.

**Preconditions:**
- Multiple orders exist in the database with different dates
- User is logged in

**Test Steps:**
1. Navigate to summary page (/summary)
2. Set "מתאריך" (from date) to a date where orders exist
3. Set "עד תאריך" (to date) to include multiple orders
4. Click "סנן" (Filter) button

**Expected Results:**
- Only orders within the date range are displayed
- Order count matches the number of orders in that range
- Orders are sorted by date

---

### Test 2.2: Filter Orders by Customer Name
**Test ID:** TC-010  
**Category:** Functional Test  
**Priority:** High

**Description:**  
Verify that orders can be filtered by customer name.

**Preconditions:**
- Orders exist with different customer names
- User is logged in

**Test Steps:**
1. Navigate to summary page
2. In the "שם לקוח" field, enter partial name (e.g., "ישראל")
3. Click "סנן" button

**Expected Results:**
- Only orders with matching customer names are displayed
- Partial name matching works (contains search)
- Results include all variations of the name

---

### Test 2.3: Filter Orders by Phone Number
**Test ID:** TC-011  
**Category:** Functional Test  
**Priority:** High

**Description:**  
Verify that orders can be filtered by phone number.

**Preconditions:**
- Orders exist with different phone numbers
- User is logged in

**Test Steps:**
1. Navigate to summary page
2. In the "טלפון" field, enter phone number "0501234567"
3. Click "סנן" button

**Expected Results:**
- Only orders with matching phone number are displayed
- Both primary and secondary phone numbers are searched
- Partial phone number matching works

---

### Test 2.4: Filter Orders Using Quick Filters
**Test ID:** TC-012  
**Category:** Functional Test  
**Priority:** Medium

**Description:**  
Verify that quick filter buttons (Today, This Week, Next Week) work correctly.

**Preconditions:**
- Orders exist for today, this week, and next week
- User is logged in

**Test Steps:**
1. Navigate to summary page
2. Click "היום" (Today) button
3. Click "סנן" button
4. Verify results show only today's orders
5. Click "השבוע" (This Week) button
6. Click "סנן" button
7. Verify results show orders from Sunday to Saturday of current week
8. Click "השבוע הבא" (Next Week) button
9. Click "סנן" button
10. Verify results show orders for next week

**Expected Results:**
- Each quick filter sets the correct date range
- Date inputs are updated to reflect the selected range
- Filter results match the expected date range

---

### Test 2.5: Combined Filters (Date + Name + Phone)
**Test ID:** TC-013  
**Category:** Functional Test  
**Priority:** Medium

**Description:**  
Verify that multiple filters can be combined.

**Preconditions:**
- Multiple orders exist
- User is logged in

**Test Steps:**
1. Navigate to summary page
2. Set date range for this week
3. Enter partial customer name
4. Enter partial phone number
5. Click "סנן" button

**Expected Results:**
- Results match ALL filter criteria (AND logic)
- Orders must be within date range AND match name AND match phone
- Correct number of results displayed

---

## 3. Order Summary Tests

### Test 3.1: View Quantity Summary by Category
**Test ID:** TC-014  
**Category:** Functional Test  
**Priority:** Critical

**Description:**  
Verify that the quantity summary correctly aggregates items by category.

**Preconditions:**
- Multiple orders exist with various items
- User is logged in

**Test Steps:**
1. Create Order A with: חומוס 1L × 2, טחינה 1/2L × 3
2. Create Order B with: חומוס 1L × 1, חומוס 1/2L × 4
3. Navigate to summary page
4. Filter to include both orders
5. Click "סיכום כמויות" tab

**Expected Results:**
- Salads category shows aggregated quantities:
  - חומוס: 1L × 3 (2+1), 1/2L × 4
  - טחינה: 1/2L × 3
- Total liters calculation is correct
- Each category is displayed separately

---

### Test 3.2: Summary with Size-based Items (ג/ק)
**Test ID:** TC-015  
**Category:** Functional Test  
**Priority:** High

**Description:**  
Verify that size-based items are correctly aggregated in summary.

**Preconditions:**
- Multiple orders with side dishes exist

**Test Steps:**
1. Create Order A with: אורז לבן ג × 3, ק × 2
2. Create Order B with: אורז לבן ג × 2, ק × 5
3. Navigate to summary page and filter to include both orders
4. View quantity summary

**Expected Results:**
- אורז לבן shows: ג × 5 (3+2), ק × 7 (2+5)
- Sizes are displayed separately, not combined

---

### Test 3.3: Summary Filter by Categories
**Test ID:** TC-016  
**Category:** Functional Test  
**Priority:** Medium

**Description:**  
Verify that summary can be filtered to show specific categories only.

**Preconditions:**
- Orders with items from multiple categories exist

**Test Steps:**
1. Navigate to summary page
2. Filter orders and view quantity summary
3. Click "בחר קטגוריות" button
4. Select only "סלטים" and "תוספות"
5. Verify display

**Expected Results:**
- Only selected categories are displayed
- Other categories are hidden
- Quantities are still correct for displayed categories

---

### Test 3.4: Summary Filter by Specific Items
**Test ID:** TC-017  
**Category:** Functional Test  
**Priority:** Medium

**Description:**  
Verify that summary can be filtered to show specific items only.

**Preconditions:**
- Orders with multiple items exist

**Test Steps:**
1. Navigate to summary page
2. Filter orders and view quantity summary
3. Click "בחר פריטים" button
4. Select specific items (e.g., "חומוס", "אורז לבן")
5. Verify display

**Expected Results:**
- Only selected items are displayed
- Items from multiple categories can be selected
- Quantities are correct for displayed items

---

### Test 3.5: Summary Includes Extra Items
**Test ID:** TC-018  
**Category:** Functional Test  
**Priority:** High

**Description:**  
Verify that extra items are included in the quantity summary.

**Preconditions:**
- Orders with extra items exist

**Test Steps:**
1. Create an order with regular items and extra items
2. Navigate to summary page
3. Filter to include the order
4. View quantity summary

**Expected Results:**
- Extra items appear in their source category
- Extra items are marked or distinguished somehow
- Quantities from extra items are included in totals

---

## 4. Order Edit Tests

### Test 4.1: Navigate to Edit Order from Summary
**Test ID:** TC-019  
**Category:** Functional Test  
**Priority:** Critical

**Description:**  
Verify that an order can be opened for editing from the summary page.

**Preconditions:**
- At least one order exists
- User is logged in

**Test Steps:**
1. Navigate to summary page
2. Filter to find an existing order
3. Click on the order to expand it
4. Click "ערוך הזמנה" (Edit Order) button
5. Verify redirect to edit page

**Expected Results:**
- User is redirected to /edit-order/[order-id]
- All order details are loaded correctly
- All items are displayed with correct quantities
- Customer information is pre-filled

---

### Test 4.2: Edit Customer Details
**Test ID:** TC-020  
**Category:** Functional Test  
**Priority:** High

**Description:**  
Verify that customer details can be edited and saved.

**Preconditions:**
- An order exists
- User is on the edit order page

**Test Steps:**
1. Navigate to edit page for an existing order
2. Change customer name from "ישראל ישראלי" to "אברהם אברהמי"
3. Change phone number to "0577777777"
4. Change address to "רחוב חדש 100, ירושלים"
5. Click "שמור" button
6. Navigate back to summary and find the order

**Expected Results:**
- Changes are saved successfully
- Updated customer name appears in summary
- Updated phone and address are visible in order details

---

### Test 4.3: Edit Item Quantities
**Test ID:** TC-021  
**Category:** Functional Test  
**Priority:** Critical

**Description:**  
Verify that item quantities can be edited and saved.

**Preconditions:**
- An order with items exists
- User is on the edit order page

**Test Steps:**
1. Navigate to edit page for an order with salad items
2. Find a salad item with quantity 2
3. Change the quantity to 5
4. Add a new item that wasn't in the original order
5. Remove an existing item by setting quantity to 0
6. Click "שמור" button
7. Navigate back to summary and verify changes

**Expected Results:**
- Changed quantities are saved correctly
- New items are added to the order
- Removed items no longer appear
- Summary quantities reflect the changes

---

### Test 4.4: Edit Order Date and Time
**Test ID:** TC-022  
**Category:** Functional Test  
**Priority:** High

**Description:**  
Verify that order date and time can be edited.

**Preconditions:**
- An order exists
- User is on the edit order page

**Test Steps:**
1. Navigate to edit page for an existing order
2. Change order date to a different date
3. Change kitchen time to "10:00"
4. Change customer time to "12:00"
5. Click "שמור" button
6. Verify changes in summary page

**Expected Results:**
- New date is saved and order appears under new date
- Kitchen time is updated
- Customer time is updated
- Order no longer appears under old date (if filtered)

---

### Test 4.5: Edit Extra Items
**Test ID:** TC-023  
**Category:** Functional Test  
**Priority:** High

**Description:**  
Verify that extra items can be added, modified, and removed during edit.

**Preconditions:**
- An order exists (with or without extra items)
- User is on the edit order page

**Test Steps:**
1. Navigate to edit page for an order
2. Add a new extra item with price 75
3. If existing extra items exist, change the quantity
4. Remove an extra item
5. Click "שמור" button
6. Verify changes in summary page

**Expected Results:**
- New extra items are saved with correct price
- Modified extra item quantities are updated
- Removed extra items no longer appear
- Total payment reflects extra item changes

---

### Test 4.6: Edit Pricing Information
**Test ID:** TC-024  
**Category:** Functional Test  
**Priority:** Medium

**Description:**  
Verify that pricing information can be edited.

**Preconditions:**
- An order with pricing exists
- User is on the edit order page

**Test Steps:**
1. Navigate to edit page for an order with pricing
2. Change total portions from 50 to 60
3. Change price per portion from 85 to 90
4. Change delivery fee from 100 to 150
5. Click "שמור" button
6. Verify new total calculation (60 × 90 + 150 = 5550)

**Expected Results:**
- All pricing changes are saved
- Total payment is recalculated correctly
- Updated pricing appears in summary and print preview

---

## 5. Print Preview Tests

### Test 5.1: Print Preview from Summary Page
**Test ID:** TC-025  
**Category:** Functional Test  
**Priority:** Critical

**Description:**  
Verify that print preview correctly displays all order information.

**Preconditions:**
- An order with complete information exists
- User is logged in

**Test Steps:**
1. Navigate to summary page
2. Filter and find an order
3. Expand the order
4. Click "הדפס" (Print) button
5. Verify print preview page opens

**Expected Results:**
- Print preview page displays correctly
- Customer name and phone are shown
- Secondary phone (if exists) is displayed
- Customer time (זמן ללקוח) is displayed
- Order date is shown
- All items are organized by category
- Extra items appear in their category AND in extras section
- Pricing information is displayed

---

### Test 5.2: Print Preview Shows All Categories
**Test ID:** TC-026  
**Category:** Functional Test  
**Priority:** High

**Description:**  
Verify that all item categories appear correctly in print preview.

**Preconditions:**
- An order with items from all categories exists

**Test Steps:**
1. Create an order with items from: Salads, Sides, Middle Courses, Mains, Extras, Bakery
2. Navigate to summary and open print preview for this order
3. Verify each category section

**Expected Results:**
- Each category has its own section
- Items are grouped correctly under their category
- Quantities are displayed in correct format per category type
- Category names are in Hebrew

---

### Test 5.3: Print Preview Liter Calculations
**Test ID:** TC-027  
**Category:** Functional Test  
**Priority:** Medium

**Description:**  
Verify that liter items show correct calculations in print preview.

**Preconditions:**
- An order with liter-based items exists

**Test Steps:**
1. Create an order with salads: 1/2L × 4, 1L × 2, 1/4L × 8
2. Open print preview
3. Verify total liter calculation

**Expected Results:**
- Each liter size shows quantity
- Total calculation is correct: (0.5×4) + (1×2) + (0.25×8) = 2 + 2 + 2 = 6L
- Display format is clear and readable

---

### Test 5.4: Print Preview Extra Items Display
**Test ID:** TC-028  
**Category:** Functional Test  
**Priority:** High

**Description:**  
Verify that extra items display correctly in print preview.

**Preconditions:**
- An order with extra items exists

**Test Steps:**
1. Create an order with regular items
2. Add extra items from different categories
3. Open print preview
4. Verify extra items display

**Expected Results:**
- Extra items appear in their source category with quantities
- Extra items ALSO appear in a dedicated "Extras" section
- Price is shown for extra items
- Extra items are visually distinguished (e.g., different color or marker)

---

## 6. Data Integrity Tests

### Test 6.1: Order Number Uniqueness
**Test ID:** TC-029  
**Category:** Sanity Test  
**Priority:** Critical

**Description:**  
Verify that each order receives a unique order number.

**Preconditions:**
- Database is clean or has existing orders

**Test Steps:**
1. Create Order 1 and note the order number
2. Create Order 2 and note the order number
3. Create Order 3 and note the order number
4. Compare all order numbers

**Expected Results:**
- Each order has a unique order number
- Order numbers are sequential or follow a pattern
- No duplicate order numbers exist

---

### Test 6.2: Order Persists After Page Refresh
**Test ID:** TC-030  
**Category:** Sanity Test  
**Priority:** Critical

**Description:**  
Verify that saved orders persist in the database.

**Preconditions:**
- None

**Test Steps:**
1. Create a new order with all details
2. Save the order
3. Note the order number
4. Close the browser completely
5. Reopen the browser and navigate to summary page
6. Search for the order by order number or customer name

**Expected Results:**
- Order is found in the database
- All details are preserved exactly as entered
- No data loss occurred

---

### Test 6.3: Concurrent Edit Protection
**Test ID:** TC-031  
**Category:** Functional Test  
**Priority:** Medium

**Description:**  
Verify behavior when the same order is edited from multiple sessions.

**Preconditions:**
- An order exists

**Test Steps:**
1. Open the order in edit mode in Browser A
2. Open the same order in edit mode in Browser B
3. In Browser A, change customer name and save
4. In Browser B, change item quantities and save
5. Verify the final state of the order

**Expected Results:**
- Last save wins (or conflict is detected)
- No data corruption occurs
- Order remains in valid state

---

### Test 6.4: Required Fields Validation
**Test ID:** TC-032  
**Category:** Functional Test  
**Priority:** High

**Description:**  
Verify that required fields are validated before saving.

**Preconditions:**
- User is on the order page

**Test Steps:**
1. Try to save an order without customer name
2. Try to save an order without order date
3. Try to save an order without any items
4. Observe validation messages

**Expected Results:**
- Order cannot be saved without required fields
- Appropriate error messages are displayed
- User is guided to fill required fields

---

## 7. Edge Case Tests

### Test 7.1: Large Quantity Values
**Test ID:** TC-033  
**Category:** Edge Case Test  
**Priority:** Low

**Description:**  
Verify that large quantity values are handled correctly.

**Preconditions:**
- User is on the order page

**Test Steps:**
1. Enter a very large quantity (e.g., 999) for an item
2. Save the order
3. Verify the quantity is saved correctly
4. Check summary calculations

**Expected Results:**
- Large quantities are saved correctly
- No overflow or calculation errors
- Summary handles large numbers properly

---

### Test 7.2: Special Characters in Notes
**Test ID:** TC-034  
**Category:** Edge Case Test  
**Priority:** Low

**Description:**  
Verify that special characters in notes are handled correctly.

**Preconditions:**
- User is on the order page

**Test Steps:**
1. Enter notes with special characters: "הערה עם 'גרשיים' ו-סימנים! @#$%"
2. Save the order
3. View the order in summary
4. Open print preview

**Expected Results:**
- Special characters are preserved
- No encoding issues
- Notes display correctly everywhere

---

### Test 7.3: Empty Order Items After Edit
**Test ID:** TC-035  
**Category:** Edge Case Test  
**Priority:** Medium

**Description:**  
Verify that removing all items from an order is handled correctly.

**Preconditions:**
- An order with items exists

**Test Steps:**
1. Open the order for editing
2. Remove all items (set all quantities to 0)
3. Try to save the order
4. Observe behavior

**Expected Results:**
- System either prevents saving empty order
- Or order is saved but marked appropriately
- No database errors occur

---

### Test 7.4: Date Boundary Filters
**Test ID:** TC-036  
**Category:** Edge Case Test  
**Priority:** Medium

**Description:**  
Verify that date filters handle boundary conditions correctly.

**Preconditions:**
- Orders exist on specific boundary dates

**Test Steps:**
1. Create an order for January 1, 2026
2. Create an order for December 31, 2025
3. Filter from January 1, 2026 to January 1, 2026
4. Verify only the January order appears
5. Filter from December 31, 2025 to January 1, 2026
6. Verify both orders appear

**Expected Results:**
- Date boundaries are inclusive
- Single-day filter works correctly
- Cross-month and cross-year filters work

---

## 8. Performance Tests

### Test 8.1: Load Time with Many Orders
**Test ID:** TC-037  
**Category:** Performance Test  
**Priority:** Medium

**Description:**  
Verify that the summary page loads in acceptable time with many orders.

**Preconditions:**
- Database contains 100+ orders

**Test Steps:**
1. Navigate to summary page
2. Set date range to include all orders
3. Click filter
4. Measure time until results are displayed

**Expected Results:**
- Results load within 5 seconds
- Loading indicator is shown during fetch
- No browser freezing or crashes

---

### Test 8.2: Summary Calculation Performance
**Test ID:** TC-038  
**Category:** Performance Test  
**Priority:** Medium

**Description:**  
Verify that quantity summary calculations complete quickly.

**Preconditions:**
- Many orders with many items exist

**Test Steps:**
1. Filter to include 50+ orders
2. Switch to "סיכום כמויות" tab
3. Measure time for summary to appear
4. Apply category filter and measure response time

**Expected Results:**
- Summary appears within 3 seconds
- Filtering is near-instantaneous
- No UI lag or freezing

---

## 9. Item Variations Tests

### Test 9.1: Rice Variations (Side Dishes)
**Test ID:** TC-039  
**Category:** Functional Test  
**Priority:** High

**Description:**  
Verify that rice items with variations (white, yellow, etc.) are handled correctly.

**Preconditions:**
- Rice item with variations exists in database
- User is on order page

**Test Steps:**
1. Fill in customer details
2. Scroll to sides section
3. Find rice item (e.g., "אורז")
4. Verify variations are displayed (לבן, צהוב, etc.)
5. Enter quantities for different variations:
   - אורז לבן: ג × 3, ק × 2
   - אורז צהוב: ג × 2, ק × 4
6. Click "שמור" button

**Expected Results:**
- Each variation is saved separately
- Quantities per variation are correct
- In summary, variations appear under the main item
- Print preview shows each variation separately

---

### Test 9.2: Add-on Items (Salads)
**Test ID:** TC-040  
**Category:** Functional Test  
**Priority:** Medium

**Description:**  
Verify that add-on items for salads work correctly.

**Preconditions:**
- Salad items with add-ons exist
- User is on order page

**Test Steps:**
1. Fill in customer details
2. Scroll to salads section
3. Select a salad item that has add-ons
4. Enter base salad quantity
5. Add quantities for add-ons
6. Click "שמור" button

**Expected Results:**
- Add-ons are saved with the parent item
- Add-on quantities are separate from parent
- Summary shows add-ons correctly
- Print shows add-ons under parent item

---

## 10. Workflow Tests

### Test 10.1: Complete Order Workflow - New Order
**Test ID:** TC-041  
**Category:** End-to-End Test  
**Priority:** Critical

**Description:**  
Verify the complete workflow from creating a new order to printing.

**Preconditions:**
- User is logged in
- Database is accessible

**Test Steps:**
1. Navigate to /order
2. Fill customer details:
   - Name: "בדיקת מערכת"
   - Phone: "0501234567"
   - Phone2: "0509876543"
   - Address: "רחוב הבדיקה 1"
3. Set order date to tomorrow
4. Set kitchen time: "14:00"
5. Set customer time: "16:00"
6. Add salads with liter quantities
7. Add sides with ג/ק quantities
8. Add main dishes with quantities
9. Add an extra item with price
10. Enter pricing: 50 portions × 85 + delivery 100
11. Add general notes
12. Click "שמור"
13. Navigate to summary page
14. Find the order using filters
15. Expand the order and verify all details
16. Click "הדפס" and verify print preview
17. Verify all information is correct on print

**Expected Results:**
- Order is saved successfully at step 12
- Order appears in summary with all correct details
- Print preview shows all information correctly
- Customer time and phone2 are displayed
- Extra items appear in category and extras section
- Total price calculation is correct

---

### Test 10.2: Complete Order Workflow - Edit Existing
**Test ID:** TC-042  
**Category:** End-to-End Test  
**Priority:** Critical

**Description:**  
Verify the complete workflow for editing an existing order.

**Preconditions:**
- An existing order with items exists
- User is logged in

**Test Steps:**
1. Navigate to summary page
2. Filter to find the target order
3. Expand the order
4. Click "ערוך הזמנה"
5. Verify all original data is loaded correctly
6. Make the following changes:
   - Change customer name
   - Add a new salad item
   - Remove an existing side dish
   - Change quantity of a main dish
   - Add a new extra item
   - Update the price per portion
7. Click "שמור"
8. Navigate back to summary
9. Find and expand the order
10. Verify all changes are reflected
11. Click "הדפס" and verify print preview

**Expected Results:**
- Original data loads correctly at step 5
- All changes are saved at step 7
- Summary shows updated information
- Print preview reflects all changes
- No data corruption or loss

---

## Summary Table

| Test Category | Number of Tests | Priority Distribution |
|---------------|-----------------|----------------------|
| Order Creation | 8 | 3 Critical, 4 High, 1 Low |
| Order Search/Filter | 5 | 1 Critical, 2 High, 2 Medium |
| Order Summary | 5 | 1 Critical, 2 High, 2 Medium |
| Order Edit | 6 | 1 Critical, 4 High, 1 Medium |
| Print Preview | 4 | 1 Critical, 2 High, 1 Medium |
| Data Integrity | 4 | 2 Critical, 1 High, 1 Medium |
| Edge Cases | 4 | 0 Critical, 0 High, 2 Medium, 2 Low |
| Performance | 2 | 0 Critical, 0 High, 2 Medium |
| Item Variations | 2 | 0 Critical, 1 High, 1 Medium |
| Workflow (E2E) | 2 | 2 Critical, 0 High, 0 Medium |
| **Total** | **42** | **11 Critical, 16 High, 12 Medium, 3 Low** |

---

## Appendix: Test Data Templates

### Sample Customer Data
```
Name: ישראל ישראלי
Phone: 0501234567
Phone2: 0509876543
Address: רחוב הרצל 15, תל אביב
```

### Sample Order Items
```
Salads:
- חומוס: 1L × 2, 1/2L × 3
- טחינה: 1/4L × 4

Sides:
- אורז לבן: ג × 3, ק × 5
- פירה: ג × 2

Mains:
- עוף בגריל: × 10

Middle Courses:
- כרעיים: × 15 (מתובל)

Extra Items:
- אורז צהוב: ג × 2, ק × 3 (price: 50)
```

### Sample Pricing
```
Total Portions: 50
Price per Portion: 85
Delivery Fee: 100
Expected Total: 4350 + extra items price
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | January 5, 2026 | System | Initial document creation |
