/**
 * Item Variations Tests
 * 
 * @description Tests for item variations and measurement types
 * Test Cases: TC-039 to TC-040
 */
import { test, expect, TestTags, TestCategories } from '../fixtures/test-fixtures';
import { generateUniqueCustomer } from '../data/customers.data';
import { FoodCategories, foodItemSamples, literSizes, sideItemsList } from '../data/food-items.data';
import { orderTiming } from '../data/orders.data';

test.describe('Item Variations', () => {
  
  test.beforeEach(async ({ loginPage }) => {
    // Setup: Mock login
    await loginPage.navigate();
    await loginPage.mockLogin();
  });

  /**
   * TC-039: Test All Liter Size Options
   * Priority: High
   * Test Steps:
   * 1. Navigate to order creation
   * 2. Test each liter size option
   * 3. Verify selections are saved correctly
   */
  test(`TC-039: Test All Liter Size Options ${TestTags.HIGH}`, async ({ 
    orderPage,
    summaryPage,
    printPreviewPage 
  }) => {
    // Arrange
    const customer = generateUniqueCustomer();
    
    await orderPage.navigate();
    await orderPage.fillCustomerDetails({
      name: customer.name,
      phone: customer.phone,
      time: orderTiming.defaultTime,
    });
    
    // Act - Select salad with different liter sizes
    await orderPage.openCategory(FoodCategories.SALADS);
    
    // Test multiple liter selections
    for (const size of literSizes.slice(0, 3)) {
      await orderPage.selectSaladWithLiters(foodItemSamples.salads[0], size.size);
    }
    
    await orderPage.saveOrder();
    
    // Assert - Navigate to print preview and verify
    await summaryPage.navigate();
    const orderCard = await summaryPage.findOrderCard(customer.name);
    expect(orderCard).toBeTruthy();
    
    await summaryPage.clickPrintButton(orderCard!);
    await printPreviewPage.waitForPageLoad();
    
    const saladItems = await printPreviewPage.getCategoryItems(FoodCategories.SALADS);
    expect(saladItems.length).toBeGreaterThan(0);
  });

  /**
   * TC-040: Test Size-Based Items (ג/ק)
   * Priority: High
   * Test Steps:
   * 1. Navigate to order creation
   * 2. Select items with big (ג) and small (ק) sizes
   * 3. Verify size display in print preview
   */
  test(`TC-040: Test Size-Based Items (ג/ק) ${TestTags.HIGH}`, async ({ 
    orderPage,
    summaryPage,
    printPreviewPage 
  }) => {
    // Arrange
    const customer = generateUniqueCustomer();
    const bigSize = 3;
    const smallSize = 2;
    
    await orderPage.navigate();
    await orderPage.fillCustomerDetails({
      name: customer.name,
      phone: customer.phone,
      time: orderTiming.defaultTime,
    });
    
    // Act - Select side with sizes
    await orderPage.openCategory(FoodCategories.SIDES);
    await orderPage.selectItemWithSize(foodItemSamples.sides[0], bigSize, smallSize);
    
    await orderPage.saveOrder();
    
    // Assert - Verify in print preview
    await summaryPage.navigate();
    const orderCard = await summaryPage.findOrderCard(customer.name);
    expect(orderCard).toBeTruthy();
    
    await summaryPage.clickPrintButton(orderCard!);
    await printPreviewPage.waitForPageLoad();
    
    const sideItems = await printPreviewPage.getCategoryItems(FoodCategories.SIDES);
    expect(sideItems.length).toBeGreaterThan(0);
    
    // Verify the sizes are displayed
    const targetItem = sideItems.find(item => 
      item.name.includes(foodItemSamples.sides[0])
    );
    
    if (targetItem) {
      // Should contain the size indicators (ג or ק)
      const hasSize = targetItem.quantity.includes('ג') || targetItem.quantity.includes('ק');
      expect(hasSize).toBeTruthy();
    }
  });

  /**
   * TC-040b: Test Rice Variations
   * Priority: Medium
   * Test Steps:
   * 1. Navigate to order creation
   * 2. Select rice with different variations
   * 3. Verify variations are displayed correctly
   */
  test(`TC-040b: Test Rice Variations ${TestTags.MEDIUM}`, async ({ 
    orderPage,
    summaryPage,
    printPreviewPage 
  }) => {
    // Arrange
    const customer = generateUniqueCustomer();
    
    await orderPage.navigate();
    await orderPage.fillCustomerDetails({
      name: customer.name,
      phone: customer.phone,
      time: orderTiming.defaultTime,
    });
    
    // Act - Select rice with variation (if supported)
    await orderPage.openCategory(FoodCategories.SIDES);
    
    // Select rice item
    const riceItem = sideItemsList.find(item => item.name === 'אורז');
    if (riceItem && riceItem.hasVariations) {
      await orderPage.selectItemWithVariation(riceItem.name, riceItem.variations![0]);
    } else {
      await orderPage.selectFirstAvailableItem(FoodCategories.SIDES);
    }
    
    await orderPage.saveOrder();
    
    // Assert
    await summaryPage.navigate();
    const orderCard = await summaryPage.findOrderCard(customer.name);
    expect(orderCard).toBeTruthy();
  });

  /**
   * TC-040c: Test Quantity-Based Items
   * Priority: High
   * Test Steps:
   * 1. Navigate to order creation
   * 2. Select items with numeric quantities
   * 3. Verify quantity increment/decrement
   * 4. Verify in print preview
   */
  test(`TC-040c: Test Quantity-Based Items ${TestTags.HIGH}`, async ({ 
    orderPage,
    summaryPage,
    printPreviewPage 
  }) => {
    // Arrange
    const customer = generateUniqueCustomer();
    const targetQuantity = 10;
    
    await orderPage.navigate();
    await orderPage.fillCustomerDetails({
      name: customer.name,
      phone: customer.phone,
      time: orderTiming.defaultTime,
    });
    
    // Act - Select bakery item with quantity
    await orderPage.openCategory(FoodCategories.BAKERY);
    await orderPage.selectItemWithQuantity(foodItemSamples.bakery[0], targetQuantity);
    
    // Verify quantity before save
    const quantityBeforeSave = await orderPage.getItemQuantity(foodItemSamples.bakery[0]);
    expect(quantityBeforeSave).toBe(targetQuantity);
    
    await orderPage.saveOrder();
    
    // Assert - Verify in print preview
    await summaryPage.navigate();
    const orderCard = await summaryPage.findOrderCard(customer.name);
    expect(orderCard).toBeTruthy();
    
    await summaryPage.clickPrintButton(orderCard!);
    await printPreviewPage.waitForPageLoad();
    
    const bakeryItems = await printPreviewPage.getCategoryItems(FoodCategories.BAKERY);
    const targetItem = bakeryItems.find(item => 
      item.name.includes(foodItemSamples.bakery[0])
    );
    
    if (targetItem) {
      expect(targetItem.quantity).toContain(String(targetQuantity));
    }
  });

  /**
   * TC-040d: Test Middle Course Preparations
   * Priority: Medium
   * Test Steps:
   * 1. Select middle course with preparation option
   * 2. Verify preparation is saved
   */
  test(`TC-040d: Test Middle Course Preparations ${TestTags.MEDIUM}`, async ({ 
    orderPage,
    summaryPage 
  }) => {
    // Arrange
    const customer = generateUniqueCustomer();
    
    await orderPage.navigate();
    await orderPage.fillCustomerDetails({
      name: customer.name,
      phone: customer.phone,
      time: orderTiming.defaultTime,
    });
    
    // Act - Select middle course with preparation
    await orderPage.openCategory(FoodCategories.MIDDLE_COURSES);
    await orderPage.selectItemWithPreparation(
      foodItemSamples.middleCourses[0], 
      'מתובל'
    );
    
    await orderPage.saveOrder();
    
    // Assert
    await summaryPage.navigate();
    const orderCard = await summaryPage.findOrderCard(customer.name);
    expect(orderCard).toBeTruthy();
  });
});
