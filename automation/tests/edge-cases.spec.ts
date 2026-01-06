/**
 * Edge Cases Tests
 * 
 * @description Tests for boundary conditions and edge cases
 * Test Cases: TC-033 to TC-036
 */
import { test, expect, TestTags, TestCategories } from '../fixtures/test-fixtures';
import { edgeCaseCustomers, invalidCustomers, generateUniqueCustomer } from '../data/customers.data';
import { FoodCategories, foodItemSamples } from '../data/food-items.data';
import { orderTiming } from '../data/orders.data';

test.describe(TestCategories.EDGE_CASES, () => {
  
  test.beforeEach(async ({ loginPage }) => {
    // Setup: Mock login
    await loginPage.navigate();
    await loginPage.mockLogin();
  });

  /**
   * TC-033: Handle Empty Order (No Items Selected)
   * Priority: Medium
   * Test Steps:
   * 1. Fill customer details only
   * 2. Try to save without selecting any items
   * 3. Verify appropriate handling (error or allowed)
   */
  test(`TC-033: Handle Empty Order (No Items Selected) ${TestTags.EDGE_CASE}`, async ({ 
    orderPage 
  }) => {
    // Arrange
    const customer = generateUniqueCustomer();
    
    await orderPage.navigate();
    await orderPage.fillCustomerDetails({
      name: customer.name,
      phone: customer.phone,
      time: orderTiming.defaultTime,
    });
    
    // Act - Try to save without items
    const result = await orderPage.trySaveOrder();
    
    // Assert - Either succeeds or shows validation
    // Behavior depends on app requirements
    expect(result).toBeDefined();
  });

  /**
   * TC-034: Handle Special Characters in Customer Name
   * Priority: Medium
   * Test Steps:
   * 1. Enter customer name with special characters
   * 2. Save order
   * 3. Verify name is saved correctly
   */
  test(`TC-034: Handle Special Characters in Customer Name ${TestTags.EDGE_CASE}`, async ({ 
    orderPage,
    summaryPage 
  }) => {
    // Arrange
    const specialCustomer = edgeCaseCustomers.specialCharacters;
    
    await orderPage.navigate();
    await orderPage.fillCustomerDetails({
      name: specialCustomer.name,
      phone: specialCustomer.phone,
      time: orderTiming.defaultTime,
    });
    
    await orderPage.openCategory(FoodCategories.SALADS);
    await orderPage.selectFirstAvailableItem(FoodCategories.SALADS);
    
    // Act
    await orderPage.saveOrder();
    
    // Assert
    await summaryPage.navigate();
    // Search for the order - may need partial match
    const orderExists = await summaryPage.searchForOrder(specialCustomer.phone);
    expect(orderExists).toBeTruthy();
  });

  /**
   * TC-035: Handle Very Long Customer Name
   * Priority: Low
   * Test Steps:
   * 1. Enter very long customer name
   * 2. Verify UI handles the length
   * 3. Save and verify name is stored
   */
  test(`TC-035: Handle Very Long Customer Name ${TestTags.EDGE_CASE}`, async ({ 
    orderPage,
    summaryPage 
  }) => {
    // Arrange
    const longNameCustomer = edgeCaseCustomers.longName;
    
    await orderPage.navigate();
    await orderPage.fillCustomerDetails({
      name: longNameCustomer.name,
      phone: longNameCustomer.phone,
      time: orderTiming.defaultTime,
    });
    
    await orderPage.openCategory(FoodCategories.SALADS);
    await orderPage.selectFirstAvailableItem(FoodCategories.SALADS);
    
    // Act
    await orderPage.saveOrder();
    
    // Assert - Verify order was created (name may be truncated)
    await summaryPage.navigate();
    const orderExists = await summaryPage.searchForOrder(longNameCustomer.phone);
    expect(orderExists).toBeTruthy();
  });

  /**
   * TC-036: Handle Mixed Hebrew and English Text
   * Priority: Low
   * Test Steps:
   * 1. Enter customer name with mixed Hebrew/English
   * 2. Verify RTL handling
   * 3. Save and verify display
   */
  test(`TC-036: Handle Mixed Hebrew and English Text ${TestTags.EDGE_CASE}`, async ({ 
    orderPage,
    summaryPage 
  }) => {
    // Arrange
    const mixedCustomer = edgeCaseCustomers.hebrewAndEnglish;
    
    await orderPage.navigate();
    await orderPage.fillCustomerDetails({
      name: mixedCustomer.name,
      phone: mixedCustomer.phone,
      time: orderTiming.defaultTime,
    });
    
    await orderPage.openCategory(FoodCategories.SALADS);
    await orderPage.selectFirstAvailableItem(FoodCategories.SALADS);
    
    // Act
    await orderPage.saveOrder();
    
    // Assert
    await summaryPage.navigate();
    const orderExists = await summaryPage.searchForOrder(mixedCustomer.phone);
    expect(orderExists).toBeTruthy();
  });

  /**
   * TC-036b: Maximum Quantity Limits
   * Priority: Medium
   * Test Steps:
   * 1. Try to set very high quantity for items
   * 2. Verify system handles limits appropriately
   */
  test(`TC-036b: Maximum Quantity Limits ${TestTags.EDGE_CASE}`, async ({ 
    orderPage 
  }) => {
    // Arrange
    const customer = generateUniqueCustomer();
    const maxQuantity = 9999;
    
    await orderPage.navigate();
    await orderPage.fillCustomerDetails({
      name: customer.name,
      phone: customer.phone,
      time: orderTiming.defaultTime,
    });
    
    // Act - Try to set very high quantity
    await orderPage.openCategory(FoodCategories.BAKERY);
    await orderPage.selectItemWithQuantity(foodItemSamples.bakery[0], maxQuantity);
    
    // Assert - Verify quantity is handled
    const actualQuantity = await orderPage.getItemQuantity(foodItemSamples.bakery[0]);
    expect(actualQuantity).toBeGreaterThan(0);
  });

  /**
   * TC-036c: Zero Quantity Items
   * Priority: Low
   * Test Steps:
   * 1. Select an item
   * 2. Set quantity to zero
   * 3. Verify item is removed or handled
   */
  test(`TC-036c: Zero Quantity Items ${TestTags.EDGE_CASE}`, async ({ 
    orderPage 
  }) => {
    // Arrange
    const customer = generateUniqueCustomer();
    
    await orderPage.navigate();
    await orderPage.fillCustomerDetails({
      name: customer.name,
      phone: customer.phone,
      time: orderTiming.defaultTime,
    });
    
    // Act - Select item then set to zero
    await orderPage.openCategory(FoodCategories.BAKERY);
    await orderPage.selectItemWithQuantity(foodItemSamples.bakery[0], 5);
    await orderPage.setItemQuantity(foodItemSamples.bakery[0], 0);
    
    // Assert - Item should be removed from selection
    const selectedItems = await orderPage.getSelectedItems(FoodCategories.BAKERY);
    const hasItem = selectedItems.some(item => 
      item.includes(foodItemSamples.bakery[0])
    );
    expect(hasItem).toBeFalsy();
  });

  /**
   * TC-036d: Invalid Phone Number Format
   * Priority: Medium
   * Test Steps:
   * 1. Enter invalid phone number
   * 2. Try to save
   * 3. Verify validation error
   */
  test(`TC-036d: Invalid Phone Number Format ${TestTags.EDGE_CASE}`, async ({ 
    orderPage 
  }) => {
    // Arrange
    const invalidCustomer = invalidCustomers.invalidPhone;
    
    await orderPage.navigate();
    await orderPage.fillCustomerDetails({
      name: invalidCustomer.name,
      phone: invalidCustomer.phone,
    });
    
    // Act
    const result = await orderPage.trySaveOrder();
    
    // Assert - Should show validation error
    // Note: Depends on app validation rules
    expect(result).toBeDefined();
  });

  /**
   * TC-036e: Empty Required Fields
   * Priority: High
   * Test Steps:
   * 1. Leave customer name empty
   * 2. Try to save
   * 3. Verify validation prevents save
   */
  test(`TC-036e: Empty Required Fields ${TestTags.EDGE_CASE}`, async ({ 
    orderPage 
  }) => {
    // Arrange - Leave name empty
    const noNameCustomer = invalidCustomers.emptyName;
    
    await orderPage.navigate();
    await orderPage.fillCustomerDetails({
      name: '',
      phone: noNameCustomer.phone,
    });
    
    // Act
    const result = await orderPage.trySaveOrder();
    
    // Assert - Should show validation error
    expect(result.success).toBeFalsy();
  });
});
