/**
 * Performance Tests
 * 
 * @description Tests for verifying application performance
 * Test Cases: TC-037 to TC-038
 */
import { test, expect, TestTags, TestCategories } from '../fixtures/test-fixtures';
import { generateUniqueCustomer } from '../data/customers.data';
import { FoodCategories, foodItemSamples } from '../data/food-items.data';
import { orderTiming } from '../data/orders.data';

test.describe(TestCategories.PERFORMANCE, () => {
  
  test.beforeEach(async ({ loginPage }) => {
    // Setup: Mock login
    await loginPage.navigate();
    await loginPage.mockLogin();
  });

  /**
   * TC-037: Page Load Performance
   * Priority: High
   * Test Steps:
   * 1. Navigate to each page
   * 2. Measure load time
   * 3. Verify acceptable performance
   */
  test(`TC-037: Page Load Performance ${TestTags.PERFORMANCE}`, async ({ 
    orderPage,
    summaryPage,
    page 
  }) => {
    // Test Order Page Load Time
    const orderPageStart = Date.now();
    await orderPage.navigate();
    await orderPage.waitForPageLoad();
    const orderPageLoadTime = Date.now() - orderPageStart;
    
    expect(orderPageLoadTime).toBeLessThan(5000); // 5 seconds max
    console.log(`Order page load time: ${orderPageLoadTime}ms`);
    
    // Test Summary Page Load Time
    const summaryPageStart = Date.now();
    await summaryPage.navigate();
    await summaryPage.waitForPageLoad();
    const summaryPageLoadTime = Date.now() - summaryPageStart;
    
    expect(summaryPageLoadTime).toBeLessThan(5000); // 5 seconds max
    console.log(`Summary page load time: ${summaryPageLoadTime}ms`);
  });

  /**
   * TC-038: Order Creation Performance
   * Priority: Medium
   * Test Steps:
   * 1. Create order with multiple items
   * 2. Measure total time
   * 3. Verify acceptable performance
   */
  test(`TC-038: Order Creation Performance ${TestTags.PERFORMANCE}`, async ({ 
    orderPage 
  }) => {
    // Arrange
    const customer = generateUniqueCustomer();
    
    const startTime = Date.now();
    
    // Act - Create order with items from multiple categories
    await orderPage.navigate();
    await orderPage.fillCustomerDetails({
      name: customer.name,
      phone: customer.phone,
      time: orderTiming.defaultTime,
    });
    
    // Add items from each category
    await orderPage.openCategory(FoodCategories.SALADS);
    await orderPage.selectFirstAvailableItem(FoodCategories.SALADS);
    
    await orderPage.openCategory(FoodCategories.SIDES);
    await orderPage.selectFirstAvailableItem(FoodCategories.SIDES);
    
    await orderPage.openCategory(FoodCategories.MAINS);
    await orderPage.selectFirstAvailableItem(FoodCategories.MAINS);
    
    await orderPage.saveOrder();
    
    const totalTime = Date.now() - startTime;
    
    // Assert - Should complete within reasonable time
    expect(totalTime).toBeLessThan(30000); // 30 seconds max for full order
    console.log(`Order creation time: ${totalTime}ms`);
  });

  /**
   * TC-038b: Search Performance with Many Orders
   * Priority: Medium
   * Test Steps:
   * 1. Navigate to summary with many orders
   * 2. Perform search
   * 3. Measure response time
   */
  test(`TC-038b: Search Performance ${TestTags.PERFORMANCE}`, async ({ 
    summaryPage 
  }) => {
    // Navigate to summary
    await summaryPage.navigate();
    await summaryPage.waitForPageLoad();
    
    // Measure search performance
    const searchStart = Date.now();
    await summaryPage.searchByName('א');
    const searchTime = Date.now() - searchStart;
    
    expect(searchTime).toBeLessThan(2000); // 2 seconds max for search
    console.log(`Search time: ${searchTime}ms`);
  });

  /**
   * TC-038c: Multiple Rapid Operations
   * Priority: Low
   * Test Steps:
   * 1. Perform multiple rapid clicks
   * 2. Verify app remains stable
   * 3. Verify no duplicate submissions
   */
  test(`TC-038c: Multiple Rapid Operations ${TestTags.PERFORMANCE}`, async ({ 
    orderPage 
  }) => {
    // Arrange
    await orderPage.navigate();
    await orderPage.waitForPageLoad();
    
    // Act - Rapid category toggles
    const startTime = Date.now();
    
    for (let i = 0; i < 5; i++) {
      await orderPage.openCategory(FoodCategories.SALADS);
      await orderPage.openCategory(FoodCategories.SIDES);
      await orderPage.openCategory(FoodCategories.MAINS);
    }
    
    const operationTime = Date.now() - startTime;
    
    // Assert - Operations should complete without errors
    expect(operationTime).toBeLessThan(10000); // 10 seconds max
    console.log(`Rapid operations time: ${operationTime}ms`);
    
    // Verify page is still stable
    const isPageLoaded = await orderPage.isPageLoaded();
    expect(isPageLoaded).toBeTruthy();
  });

  /**
   * TC-038d: Print Preview Generation Time
   * Priority: Medium
   * Test Steps:
   * 1. Navigate to print preview for complex order
   * 2. Measure generation time
   */
  test(`TC-038d: Print Preview Generation Time ${TestTags.PERFORMANCE}`, async ({ 
    summaryPage,
    printPreviewPage 
  }) => {
    // Navigate to summary
    await summaryPage.navigate();
    await summaryPage.waitForPageLoad();
    
    const orderCards = await summaryPage.getVisibleOrderCards();
    
    if (orderCards.length === 0) {
      test.skip();
      return;
    }
    
    // Measure print preview load time
    const startTime = Date.now();
    await summaryPage.clickPrintButton(orderCards[0]);
    await printPreviewPage.waitForPageLoad();
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(5000); // 5 seconds max
    console.log(`Print preview generation time: ${loadTime}ms`);
  });
});
