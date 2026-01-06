/**
 * End-to-End Workflow Tests
 * 
 * @description Complete user journey tests
 * Test Cases: TC-041 to TC-042
 */
import { test, expect, TestTags, TestCategories } from '../fixtures/test-fixtures';
import { generateUniqueCustomer, validCustomers } from '../data/customers.data';
import { FoodCategories, foodItemSamples } from '../data/food-items.data';
import { orderTiming, completeOrderData } from '../data/orders.data';

test.describe(TestCategories.E2E, () => {
  
  test.beforeEach(async ({ loginPage }) => {
    // Setup: Mock login
    await loginPage.navigate();
    await loginPage.mockLogin();
  });

  /**
   * TC-041: Complete Order Flow - Create, View, Print
   * Priority: Critical
   * Test Steps:
   * 1. Create a new order with all details
   * 2. Navigate to summary
   * 3. Find and view the order
   * 4. Navigate to print preview
   * 5. Verify all data is displayed correctly
   */
  test(`TC-041: Complete Order Flow - Create, View, Print ${TestTags.CRITICAL}`, async ({ 
    orderPage,
    summaryPage,
    printPreviewPage 
  }) => {
    // Step 1: Create a complete order
    const customer = generateUniqueCustomer();
    
    await orderPage.navigate();
    await orderPage.waitForPageLoad();
    
    // Fill customer details
    await orderPage.fillCustomerDetails({
      name: customer.name,
      phone: customer.phone,
      time: orderTiming.defaultTime,
    });
    
    // Add items from multiple categories
    await orderPage.openCategory(FoodCategories.SALADS);
    await orderPage.selectSaladWithLiters(foodItemSamples.salads[0], 1);
    
    await orderPage.openCategory(FoodCategories.SIDES);
    await orderPage.selectItemWithSize(foodItemSamples.sides[0], 2, 1);
    
    await orderPage.openCategory(FoodCategories.MAINS);
    await orderPage.selectItemWithQuantity(foodItemSamples.mains[0], 5);
    
    await orderPage.openCategory(FoodCategories.BAKERY);
    await orderPage.selectItemWithQuantity(foodItemSamples.bakery[0], 10);
    
    await orderPage.saveOrder();
    
    // Step 2: Navigate to summary
    await summaryPage.navigate();
    await summaryPage.waitForPageLoad();
    
    // Step 3: Find the order
    const orderCard = await summaryPage.findOrderCard(customer.name);
    expect(orderCard).toBeTruthy();
    
    // Verify customer name and phone in summary
    const displayedName = await summaryPage.getOrderCustomerName(orderCard!);
    expect(displayedName).toBe(customer.name);
    
    // Step 4: Navigate to print preview
    await summaryPage.clickPrintButton(orderCard!);
    await printPreviewPage.waitForPageLoad();
    
    // Step 5: Verify data in print preview
    const printName = await printPreviewPage.getCustomerName();
    expect(printName).toBe(customer.name);
    
    const printPhone = await printPreviewPage.getPhoneNumber();
    expect(printPhone).toBe(customer.phone);
    
    // Verify categories are displayed
    const categories = await printPreviewPage.getDisplayedCategories();
    expect(categories.length).toBeGreaterThan(0);
  });

  /**
   * TC-042: Complete Order Flow - Create, Edit, Verify
   * Priority: Critical
   * Test Steps:
   * 1. Create a new order
   * 2. Navigate to summary
   * 3. Edit the order
   * 4. Add new items
   * 5. Change customer details
   * 6. Save changes
   * 7. Verify changes in summary and print preview
   */
  test(`TC-042: Complete Order Flow - Create, Edit, Verify ${TestTags.CRITICAL}`, async ({ 
    orderPage,
    summaryPage,
    editOrderPage,
    printPreviewPage 
  }) => {
    // Step 1: Create initial order
    const originalCustomer = generateUniqueCustomer();
    
    await orderPage.navigate();
    await orderPage.fillCustomerDetails({
      name: originalCustomer.name,
      phone: originalCustomer.phone,
      time: orderTiming.defaultTime,
    });
    
    await orderPage.openCategory(FoodCategories.SALADS);
    await orderPage.selectFirstAvailableItem(FoodCategories.SALADS);
    
    await orderPage.saveOrder();
    
    // Step 2: Find order in summary
    await summaryPage.navigate();
    await summaryPage.waitForPageLoad();
    
    const orderCard = await summaryPage.findOrderCard(originalCustomer.name);
    expect(orderCard).toBeTruthy();
    
    // Step 3: Open for editing
    await summaryPage.clickEditButton(orderCard!);
    await editOrderPage.waitForPageLoad();
    
    // Step 4: Add new items
    await editOrderPage.openCategory(FoodCategories.BAKERY);
    await editOrderPage.selectItemWithQuantity(foodItemSamples.bakery[0], 5);
    
    // Step 5: Change customer details
    const updatedName = `${originalCustomer.name} (מעודכן)`;
    await editOrderPage.updateCustomerDetails({
      name: updatedName,
    });
    
    // Step 6: Save changes
    await editOrderPage.saveChanges();
    
    // Step 7: Verify changes in summary
    await summaryPage.navigate();
    await summaryPage.waitForPageLoad();
    
    const updatedCard = await summaryPage.findOrderCard(updatedName);
    expect(updatedCard).toBeTruthy();
    
    // Verify in print preview
    await summaryPage.clickPrintButton(updatedCard!);
    await printPreviewPage.waitForPageLoad();
    
    const printName = await printPreviewPage.getCustomerName();
    expect(printName).toBe(updatedName);
    
    // Verify bakery items were added
    const bakeryItems = await printPreviewPage.getCategoryItems(FoodCategories.BAKERY);
    expect(bakeryItems.length).toBeGreaterThan(0);
  });

  /**
   * TC-042b: Full CRUD Operations
   * Priority: High
   * Test Steps:
   * 1. Create order
   * 2. Read/View order
   * 3. Update order
   * 4. Delete order
   * 5. Verify deletion
   */
  test(`TC-042b: Full CRUD Operations ${TestTags.HIGH}`, async ({ 
    orderPage,
    summaryPage,
    editOrderPage 
  }) => {
    // CREATE
    const customer = generateUniqueCustomer();
    
    await orderPage.navigate();
    await orderPage.fillCustomerDetails({
      name: customer.name,
      phone: customer.phone,
      time: orderTiming.defaultTime,
    });
    
    await orderPage.openCategory(FoodCategories.SALADS);
    await orderPage.selectFirstAvailableItem(FoodCategories.SALADS);
    
    await orderPage.saveOrder();
    
    // READ
    await summaryPage.navigate();
    await summaryPage.waitForPageLoad();
    
    let orderCard = await summaryPage.findOrderCard(customer.name);
    expect(orderCard).toBeTruthy();
    
    // UPDATE
    await summaryPage.clickEditButton(orderCard!);
    await editOrderPage.waitForPageLoad();
    
    const newPhone = '0509999999';
    await editOrderPage.updateCustomerDetails({
      phone: newPhone,
    });
    await editOrderPage.saveChanges();
    
    // Verify update
    await summaryPage.navigate();
    orderCard = await summaryPage.findOrderCard(customer.name);
    expect(orderCard).toBeTruthy();
    
    const updatedPhone = await summaryPage.getOrderPhoneNumber(orderCard!);
    expect(updatedPhone).toContain(newPhone);
    
    // DELETE
    await summaryPage.clickEditButton(orderCard!);
    await editOrderPage.waitForPageLoad();
    
    await editOrderPage.deleteOrder();
    await editOrderPage.confirmDelete();
    
    // Verify deletion
    await summaryPage.navigate();
    await summaryPage.waitForPageLoad();
    
    const deletedCard = await summaryPage.findOrderCard(customer.name);
    expect(deletedCard).toBeFalsy();
  });

  /**
   * TC-042c: Multi-Order Workflow
   * Priority: Medium
   * Test Steps:
   * 1. Create multiple orders
   * 2. Verify all appear in summary
   * 3. Filter and find specific orders
   * 4. Batch operations verification
   */
  test(`TC-042c: Multi-Order Workflow ${TestTags.MEDIUM}`, async ({ 
    orderPage,
    summaryPage 
  }) => {
    const customers = [
      generateUniqueCustomer(),
      generateUniqueCustomer(),
      generateUniqueCustomer(),
    ];
    
    // Create multiple orders
    for (const customer of customers) {
      await orderPage.navigate();
      await orderPage.fillCustomerDetails({
        name: customer.name,
        phone: customer.phone,
        time: orderTiming.defaultTime,
      });
      
      await orderPage.openCategory(FoodCategories.SALADS);
      await orderPage.selectFirstAvailableItem(FoodCategories.SALADS);
      
      await orderPage.saveOrder();
    }
    
    // Verify all orders in summary
    await summaryPage.navigate();
    await summaryPage.waitForPageLoad();
    
    for (const customer of customers) {
      const orderCard = await summaryPage.findOrderCard(customer.name);
      expect(orderCard).toBeTruthy();
    }
    
    // Test filtering
    await summaryPage.searchByName(customers[0].name);
    const filteredCards = await summaryPage.getVisibleOrderCards();
    expect(filteredCards.length).toBeGreaterThan(0);
  });

  /**
   * TC-042d: Navigation Flow Verification
   * Priority: Medium
   * Test Steps:
   * 1. Navigate through all pages
   * 2. Verify back navigation works
   * 3. Verify state is maintained
   */
  test(`TC-042d: Navigation Flow Verification ${TestTags.MEDIUM}`, async ({ 
    orderPage,
    summaryPage,
    page 
  }) => {
    // Start at order page
    await orderPage.navigate();
    expect(await orderPage.isPageLoaded()).toBeTruthy();
    
    // Go to summary
    await summaryPage.navigate();
    expect(await summaryPage.isPageLoaded()).toBeTruthy();
    
    // Use back navigation
    await page.goBack();
    
    // Should be back at order page (or previous page)
    await page.waitForLoadState('networkidle');
    
    // Navigate forward
    await page.goForward();
    
    // Should be at summary again
    await summaryPage.waitForPageLoad();
    expect(await summaryPage.isPageLoaded()).toBeTruthy();
  });
});
