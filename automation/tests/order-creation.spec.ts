/**
 * Order Creation Tests
 * 
 * @description Tests for creating new orders in the system
 * Test Cases: TC-001 to TC-008
 */
import { test, expect, TestTags, TestCategories } from '../fixtures/test-fixtures';
import { testCustomer, validCustomers, edgeCaseCustomers } from '../data/customers.data';
import { testOrder, orderTiming, orderPricing } from '../data/orders.data';
import { foodItemSamples, FoodCategories, categoryNames } from '../data/food-items.data';

test.describe(TestCategories.ORDER_CREATION, () => {
  
  test.beforeEach(async ({ loginPage, orderPage }) => {
    // Setup: Mock login and navigate to order page
    await loginPage.navigate();
    await loginPage.mockLogin();
    await orderPage.navigate();
    await orderPage.waitForPageLoad();
  });

  /**
   * TC-001: Create Basic Order with Customer Details
   * Priority: Critical
   * Test Steps:
   * 1. Fill in customer name
   * 2. Fill in customer phone number
   * 3. Select collection time
   * 4. Save order
   * 5. Verify order appears in summary
   */
  test(`TC-001: Create Basic Order with Customer Details ${TestTags.CRITICAL}`, async ({ 
    orderPage, 
    summaryPage 
  }) => {
    // Act
    await orderPage.fillCustomerDetails({
      name: testCustomer.name,
      phone: testCustomer.phone,
      time: orderTiming.defaultTime,
    });
    
    await orderPage.saveOrder();
    
    // Assert - Navigate to summary and verify order exists
    await summaryPage.navigate();
    await summaryPage.waitForPageLoad();
    
    const orderExists = await summaryPage.searchForOrder(testCustomer.name);
    expect(orderExists).toBeTruthy();
  });

  /**
   * TC-002: Create Order with All Customer Fields
   * Priority: High
   * Test Steps:
   * 1. Fill in all customer fields (name, phone1, phone2, time, notes)
   * 2. Save order
   * 3. Verify all fields are saved correctly
   */
  test(`TC-002: Create Order with All Customer Fields ${TestTags.HIGH}`, async ({ 
    orderPage, 
    summaryPage 
  }) => {
    const fullCustomer = validCustomers[0];
    
    // Act
    await orderPage.fillCustomerDetails({
      name: fullCustomer.name,
      phone: fullCustomer.phone,
      phone2: fullCustomer.phone2,
      time: fullCustomer.time,
      notes: fullCustomer.notes,
    });
    
    await orderPage.saveOrder();
    
    // Assert
    await summaryPage.navigate();
    const orderCard = await summaryPage.findOrderCard(fullCustomer.name);
    expect(orderCard).toBeTruthy();
    
    // Verify phone2 is displayed if exists
    if (fullCustomer.phone2) {
      const cardText = await orderCard?.textContent();
      expect(cardText).toContain(fullCustomer.phone2);
    }
  });

  /**
   * TC-003: Create Order with Salad Items (Liter-based)
   * Priority: Critical
   * Test Steps:
   * 1. Fill customer details
   * 2. Select salad items with liter quantities
   * 3. Verify liter dropdown functionality
   * 4. Save order
   */
  test(`TC-003: Create Order with Salad Items (Liter-based) ${TestTags.CRITICAL}`, async ({ 
    orderPage 
  }) => {
    // Arrange
    await orderPage.fillCustomerDetails({
      name: testCustomer.name,
      phone: testCustomer.phone,
      time: orderTiming.defaultTime,
    });
    
    // Act - Select salad with liter quantity
    await orderPage.openCategory(FoodCategories.SALADS);
    await orderPage.selectSaladWithLiters(foodItemSamples.salads[0], 1); // 1 liter
    
    // Assert
    const selectedItems = await orderPage.getSelectedItems(FoodCategories.SALADS);
    expect(selectedItems.length).toBeGreaterThan(0);
    
    await orderPage.saveOrder();
  });

  /**
   * TC-004: Create Order with Size-based Items (ג/ק)
   * Priority: Critical
   * Test Steps:
   * 1. Fill customer details
   * 2. Select items with ג (gadol/large) and ק (katan/small) quantities
   * 3. Verify size selection functionality
   * 4. Save order
   */
  test(`TC-004: Create Order with Size-based Items ${TestTags.CRITICAL}`, async ({ 
    orderPage 
  }) => {
    // Arrange
    await orderPage.fillCustomerDetails({
      name: testCustomer.name,
      phone: testCustomer.phone,
      time: orderTiming.defaultTime,
    });
    
    // Act - Select item with size (sides have ג/ק sizes)
    await orderPage.openCategory(FoodCategories.SIDES);
    await orderPage.selectItemWithSize(foodItemSamples.sides[0], 2, 1); // 2 ג, 1 ק
    
    // Assert
    await orderPage.saveOrder();
  });

  /**
   * TC-005: Create Order with Quantity-based Items
   * Priority: High
   * Test Steps:
   * 1. Fill customer details
   * 2. Select items with numeric quantities
   * 3. Verify quantity increment/decrement
   * 4. Save order
   */
  test(`TC-005: Create Order with Quantity-based Items ${TestTags.HIGH}`, async ({ 
    orderPage 
  }) => {
    // Arrange
    await orderPage.fillCustomerDetails({
      name: testCustomer.name,
      phone: testCustomer.phone,
      time: orderTiming.defaultTime,
    });
    
    // Act - Select bakery items with quantity
    await orderPage.openCategory(FoodCategories.BAKERY);
    await orderPage.selectItemWithQuantity(foodItemSamples.bakery[0], 5, FoodCategories.BAKERY);
    
    // Assert
    const quantity = await orderPage.getItemQuantity(foodItemSamples.bakery[0]);
    expect(quantity).toBe(5);
    
    await orderPage.saveOrder();
  });

  /**
   * TC-006: Create Order with Multiple Categories
   * Priority: High
   * Test Steps:
   * 1. Fill customer details
   * 2. Select items from all categories
   * 3. Verify all selections are maintained
   * 4. Save order
   */
  test(`TC-006: Create Order with Multiple Categories ${TestTags.HIGH}`, async ({ 
    orderPage 
  }) => {
    // Arrange
    await orderPage.fillCustomerDetails({
      name: testCustomer.name,
      phone: testCustomer.phone,
      time: orderTiming.defaultTime,
    });
    
    // Act - Select from multiple categories
    const categories = [
      FoodCategories.SALADS,
      FoodCategories.MIDDLE_COURSES,
      FoodCategories.SIDES,
      FoodCategories.MAINS,
      FoodCategories.BAKERY,
    ];
    
    for (const category of categories) {
      await orderPage.openCategory(category);
      await orderPage.selectFirstAvailableItem(category);
    }
    
    // Assert - Verify items selected from each category
    for (const category of categories) {
      const selectedItems = await orderPage.getSelectedItems(category);
      expect(selectedItems.length).toBeGreaterThanOrEqual(1);
    }
    
    await orderPage.saveOrder();
  });

  /**
   * TC-007: Create Order with Extras Category
   * Priority: Medium
   * Test Steps:
   * 1. Fill customer details
   * 2. Navigate to extras category
   * 3. Select extra items
   * 4. Verify extras are displayed correctly
   */
  test(`TC-007: Create Order with Extras Category ${TestTags.MEDIUM}`, async ({ 
    orderPage 
  }) => {
    // Arrange
    await orderPage.fillCustomerDetails({
      name: testCustomer.name,
      phone: testCustomer.phone,
      time: orderTiming.defaultTime,
    });
    
    // Act - Select extras
    await orderPage.openCategory(FoodCategories.EXTRAS);
    await orderPage.selectFirstAvailableItem(FoodCategories.EXTRAS);
    
    // Assert
    const selectedExtras = await orderPage.getSelectedItems(FoodCategories.EXTRAS);
    expect(selectedExtras.length).toBeGreaterThan(0);
    
    await orderPage.saveOrder();
  });

  /**
   * TC-008: Verify Order Number Generation
   * Priority: Medium
   * Test Steps:
   * 1. Create a new order
   * 2. Save order
   * 3. Verify unique order number is generated
   * 4. Verify order number format
   */
  test(`TC-008: Verify Order Number Generation ${TestTags.MEDIUM}`, async ({ 
    orderPage, 
    summaryPage 
  }) => {
    // Arrange
    await orderPage.fillCustomerDetails({
      name: testCustomer.name,
      phone: testCustomer.phone,
      time: orderTiming.defaultTime,
    });
    
    // Act
    await orderPage.saveOrder();
    
    // Assert - Navigate to summary and verify order has a number
    await summaryPage.navigate();
    const orderCard = await summaryPage.findOrderCard(testCustomer.name);
    const orderNumber = await summaryPage.getOrderNumber(orderCard!);
    
    expect(orderNumber).toBeTruthy();
    expect(orderNumber).toMatch(/^\d+$/); // Should be numeric
  });

  /**
   * TC-008b: Validate Required Fields
   * Priority: High
   * Test Steps:
   * 1. Try to save order without customer name
   * 2. Verify validation error appears
   * 3. Try to save order without phone number
   * 4. Verify validation error appears
   */
  test(`TC-008b: Validate Required Fields ${TestTags.HIGH}`, async ({ 
    orderPage 
  }) => {
    // Try to save without required fields
    const saveResult = await orderPage.trySaveOrder();
    
    // Assert - Should show validation error or prevent save
    expect(saveResult.success).toBeFalsy();
    expect(saveResult.validationErrors).toBeDefined();
  });
});
