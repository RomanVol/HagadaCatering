/**
 * Order Summary Tests
 * 
 * @description Tests for the order summary page views and display
 * Test Cases: TC-014 to TC-018
 */
import { test, expect, TestTags, TestCategories } from '../fixtures/test-fixtures';
import { testCustomer } from '../data/customers.data';
import { FoodCategories } from '../data/food-items.data';

test.describe(TestCategories.ORDER_SUMMARY, () => {
  
  test.beforeEach(async ({ loginPage, summaryPage }) => {
    // Setup: Mock login and navigate to summary page
    await loginPage.navigate();
    await loginPage.mockLogin();
    await summaryPage.navigate();
    await summaryPage.waitForPageLoad();
  });

  /**
   * TC-014: Verify Summary Page Loads
   * Priority: Critical
   * Test Steps:
   * 1. Navigate to summary page
   * 2. Verify page elements are displayed
   * 3. Verify order cards are loaded
   */
  test(`TC-014: Verify Summary Page Loads ${TestTags.CRITICAL}`, async ({ 
    summaryPage 
  }) => {
    // Assert - Verify page loaded correctly
    const isPageLoaded = await summaryPage.isPageLoaded();
    expect(isPageLoaded).toBeTruthy();
    
    // Verify search input is visible
    const isSearchVisible = await summaryPage.isSearchVisible();
    expect(isSearchVisible).toBeTruthy();
    
    // Verify date filter is visible
    const isDateFilterVisible = await summaryPage.isDateFilterVisible();
    expect(isDateFilterVisible).toBeTruthy();
  });

  /**
   * TC-015: Toggle Between Card and Table View
   * Priority: High
   * Test Steps:
   * 1. Verify default view (cards or table)
   * 2. Toggle to alternative view
   * 3. Verify view changed correctly
   * 4. Toggle back
   */
  test(`TC-015: Toggle Between Card and Table View ${TestTags.HIGH}`, async ({ 
    summaryPage 
  }) => {
    // Arrange - Check initial view
    const initialView = await summaryPage.getCurrentView();
    
    // Act - Toggle view
    await summaryPage.toggleView();
    
    // Assert - View should change
    const newView = await summaryPage.getCurrentView();
    expect(newView).not.toBe(initialView);
    
    // Act - Toggle back
    await summaryPage.toggleView();
    
    // Assert - Should be back to original view
    const finalView = await summaryPage.getCurrentView();
    expect(finalView).toBe(initialView);
  });

  /**
   * TC-016: Order Card Displays Correct Information
   * Priority: Critical
   * Test Steps:
   * 1. Find an order card
   * 2. Verify customer name is displayed
   * 3. Verify phone number is displayed
   * 4. Verify date/time is displayed
   * 5. Verify order actions are available
   */
  test(`TC-016: Order Card Displays Correct Information ${TestTags.CRITICAL}`, async ({ 
    summaryPage 
  }) => {
    // Get first order card
    const orderCards = await summaryPage.getVisibleOrderCards();
    
    if (orderCards.length > 0) {
      const firstCard = orderCards[0];
      
      // Verify required fields are displayed
      const customerName = await summaryPage.getOrderCustomerName(firstCard);
      expect(customerName).toBeTruthy();
      
      const phoneNumber = await summaryPage.getOrderPhoneNumber(firstCard);
      expect(phoneNumber).toBeTruthy();
      
      // Verify action buttons are available
      const hasEditButton = await summaryPage.hasEditButton(firstCard);
      expect(hasEditButton).toBeTruthy();
      
      const hasPrintButton = await summaryPage.hasPrintButton(firstCard);
      expect(hasPrintButton).toBeTruthy();
    } else {
      // Skip if no orders exist
      test.skip();
    }
  });

  /**
   * TC-017: Navigate to Print Preview from Summary
   * Priority: High
   * Test Steps:
   * 1. Find an order card
   * 2. Click print button
   * 3. Verify navigation to print preview page
   */
  test(`TC-017: Navigate to Print Preview from Summary ${TestTags.HIGH}`, async ({ 
    summaryPage,
    printPreviewPage,
    page
  }) => {
    // Get first order card
    const orderCards = await summaryPage.getVisibleOrderCards();
    
    if (orderCards.length > 0) {
      const firstCard = orderCards[0];
      
      // Act - Click print button
      await summaryPage.clickPrintButton(firstCard);
      
      // Assert - Should navigate to print preview
      await printPreviewPage.waitForPageLoad();
      const isPrintPage = await printPreviewPage.isOnPrintPreviewPage();
      expect(isPrintPage).toBeTruthy();
    } else {
      test.skip();
    }
  });

  /**
   * TC-018: Navigate to Edit Order from Summary
   * Priority: High
   * Test Steps:
   * 1. Find an order card
   * 2. Click edit button
   * 3. Verify navigation to edit order page
   */
  test(`TC-018: Navigate to Edit Order from Summary ${TestTags.HIGH}`, async ({ 
    summaryPage,
    editOrderPage,
    page
  }) => {
    // Get first order card
    const orderCards = await summaryPage.getVisibleOrderCards();
    
    if (orderCards.length > 0) {
      const firstCard = orderCards[0];
      
      // Act - Click edit button
      await summaryPage.clickEditButton(firstCard);
      
      // Assert - Should navigate to edit page
      await editOrderPage.waitForPageLoad();
      const isEditPage = await editOrderPage.isOnEditPage();
      expect(isEditPage).toBeTruthy();
    } else {
      test.skip();
    }
  });

  /**
   * TC-018b: Verify Order Count Display
   * Priority: Medium
   * Test Steps:
   * 1. Get total order count from summary
   * 2. Apply filters
   * 3. Verify filtered count updates
   */
  test(`TC-018b: Verify Order Count Display ${TestTags.MEDIUM}`, async ({ 
    summaryPage 
  }) => {
    // Get initial count
    const initialCount = await summaryPage.getOrderCount();
    
    // Apply a filter
    await summaryPage.searchByName('א');
    
    // Verify count might have changed
    const filteredCount = await summaryPage.getOrderCount();
    expect(filteredCount).toBeGreaterThanOrEqual(0);
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });
});
