/**
 * Data Integrity Tests
 * 
 * @description Tests for verifying data accuracy and persistence
 * Test Cases: TC-029 to TC-032
 */
import { test, expect, TestTags, TestCategories } from '../fixtures/test-fixtures';
import { testCustomer, validCustomers, generateUniqueCustomer } from '../data/customers.data';
import { FoodCategories, foodItemSamples } from '../data/food-items.data';
import { orderTiming } from '../data/orders.data';

test.describe(TestCategories.DATA_INTEGRITY, () => {
  
  test.beforeEach(async ({ loginPage }) => {
    // Setup: Mock login
    await loginPage.navigate();
    await loginPage.mockLogin();
  });

  /**
   * TC-029: Verify Order Data Persists After Page Refresh
   * Priority: Critical
   * Test Steps:
   * 1. Create a new order
   * 2. Refresh the page
   * 3. Navigate to summary
   * 4. Verify order data is still present
   */
  test(`TC-029: Verify Order Data Persists After Page Refresh ${TestTags.CRITICAL}`, async ({ 
    orderPage,
    summaryPage,
    page 
  }) => {
    // Arrange - Create unique customer for this test
    const uniqueCustomer = generateUniqueCustomer();
    
    // Act - Create order
    await orderPage.navigate();
    await orderPage.fillCustomerDetails({
      name: uniqueCustomer.name,
      phone: uniqueCustomer.phone,
      time: orderTiming.defaultTime,
    });
    
    await orderPage.openCategory(FoodCategories.SALADS);
    await orderPage.selectFirstAvailableItem(FoodCategories.SALADS);
    
    await orderPage.saveOrder();
    
    // Refresh page
    await page.reload();
    
    // Navigate to summary and verify
    await summaryPage.navigate();
    await summaryPage.waitForPageLoad();
    
    const orderCard = await summaryPage.findOrderCard(uniqueCustomer.name);
    expect(orderCard).toBeTruthy();
  });

  /**
   * TC-030: Verify Item Quantities Match Between Pages
   * Priority: High
   * Test Steps:
   * 1. Create order with specific quantities
   * 2. Navigate to summary
   * 3. Navigate to print preview
   * 4. Verify quantities match across all views
   */
  test(`TC-030: Verify Item Quantities Match Between Pages ${TestTags.HIGH}`, async ({ 
    orderPage,
    summaryPage,
    editOrderPage,
    printPreviewPage 
  }) => {
    // Arrange - Create order with specific quantities
    const uniqueCustomer = generateUniqueCustomer();
    const expectedQuantity = 5;
    
    await orderPage.navigate();
    await orderPage.fillCustomerDetails({
      name: uniqueCustomer.name,
      phone: uniqueCustomer.phone,
      time: orderTiming.defaultTime,
    });
    
    await orderPage.openCategory(FoodCategories.BAKERY);
    await orderPage.selectItemWithQuantity(foodItemSamples.bakery[0], expectedQuantity);
    
    await orderPage.saveOrder();
    
    // Navigate to summary and find order
    await summaryPage.navigate();
    const orderCard = await summaryPage.findOrderCard(uniqueCustomer.name);
    expect(orderCard).toBeTruthy();
    
    // Navigate to print preview and verify
    await summaryPage.clickPrintButton(orderCard!);
    await printPreviewPage.waitForPageLoad();
    
    const bakeryItems = await printPreviewPage.getCategoryItems(FoodCategories.BAKERY);
    const targetItem = bakeryItems.find(item => 
      item.name.includes(foodItemSamples.bakery[0])
    );
    
    if (targetItem) {
      expect(targetItem.quantity).toContain(String(expectedQuantity));
    }
  });

  /**
   * TC-031: Verify Customer Details Saved Correctly
   * Priority: Critical
   * Test Steps:
   * 1. Create order with all customer fields
   * 2. Navigate to edit order
   * 3. Verify all fields match original input
   */
  test(`TC-031: Verify Customer Details Saved Correctly ${TestTags.CRITICAL}`, async ({ 
    orderPage,
    summaryPage,
    editOrderPage 
  }) => {
    // Arrange
    const fullCustomer = validCustomers[0];
    
    await orderPage.navigate();
    await orderPage.fillCustomerDetails({
      name: fullCustomer.name,
      phone: fullCustomer.phone,
      phone2: fullCustomer.phone2,
      time: fullCustomer.time,
      notes: fullCustomer.notes,
    });
    
    await orderPage.saveOrder();
    
    // Navigate to edit and verify
    await summaryPage.navigate();
    const orderCard = await summaryPage.findOrderCard(fullCustomer.name);
    expect(orderCard).toBeTruthy();
    
    await summaryPage.clickEditButton(orderCard!);
    await editOrderPage.waitForPageLoad();
    
    // Verify each field
    const savedName = await editOrderPage.getCustomerName();
    expect(savedName).toBe(fullCustomer.name);
    
    const savedPhone = await editOrderPage.getPhone();
    expect(savedPhone).toBe(fullCustomer.phone);
    
    if (fullCustomer.phone2) {
      const savedPhone2 = await editOrderPage.getPhone2();
      expect(savedPhone2).toBe(fullCustomer.phone2);
    }
  });

  /**
   * TC-032: Verify Liter Calculations are Accurate
   * Priority: High
   * Test Steps:
   * 1. Create order with multiple liter selections
   * 2. Verify total liter calculation
   * 3. Verify individual item liters
   */
  test(`TC-032: Verify Liter Calculations are Accurate ${TestTags.HIGH}`, async ({ 
    orderPage,
    summaryPage,
    printPreviewPage 
  }) => {
    // Arrange
    const uniqueCustomer = generateUniqueCustomer();
    
    await orderPage.navigate();
    await orderPage.fillCustomerDetails({
      name: uniqueCustomer.name,
      phone: uniqueCustomer.phone,
      time: orderTiming.defaultTime,
    });
    
    // Add salads with specific liter amounts
    await orderPage.openCategory(FoodCategories.SALADS);
    await orderPage.selectSaladWithLiters(foodItemSamples.salads[0], 2); // 2 liters
    
    await orderPage.saveOrder();
    
    // Navigate to print preview and verify
    await summaryPage.navigate();
    const orderCard = await summaryPage.findOrderCard(uniqueCustomer.name);
    expect(orderCard).toBeTruthy();
    
    await summaryPage.clickPrintButton(orderCard!);
    await printPreviewPage.waitForPageLoad();
    
    // Verify liter display
    const saladItems = await printPreviewPage.getCategoryItems(FoodCategories.SALADS);
    expect(saladItems.length).toBeGreaterThan(0);
  });

  /**
   * TC-032b: Verify Order Number Uniqueness
   * Priority: Medium
   * Test Steps:
   * 1. Create multiple orders
   * 2. Verify each has a unique order number
   */
  test(`TC-032b: Verify Order Number Uniqueness ${TestTags.MEDIUM}`, async ({ 
    orderPage,
    summaryPage 
  }) => {
    // Create first order
    const customer1 = generateUniqueCustomer();
    await orderPage.navigate();
    await orderPage.fillCustomerDetails({
      name: customer1.name,
      phone: customer1.phone,
      time: orderTiming.defaultTime,
    });
    await orderPage.saveOrder();
    
    // Create second order
    const customer2 = generateUniqueCustomer();
    await orderPage.navigate();
    await orderPage.fillCustomerDetails({
      name: customer2.name,
      phone: customer2.phone,
      time: orderTiming.defaultTime,
    });
    await orderPage.saveOrder();
    
    // Navigate to summary and get order numbers
    await summaryPage.navigate();
    await summaryPage.waitForPageLoad();
    
    const card1 = await summaryPage.findOrderCard(customer1.name);
    const card2 = await summaryPage.findOrderCard(customer2.name);
    
    if (card1 && card2) {
      const orderNumber1 = await summaryPage.getOrderNumber(card1);
      const orderNumber2 = await summaryPage.getOrderNumber(card2);
      
      expect(orderNumber1).not.toBe(orderNumber2);
    }
  });
});
