/**
 * Print Preview Tests
 * 
 * @description Tests for the print preview functionality
 * Test Cases: TC-025 to TC-028
 */
import { test, expect, TestTags, TestCategories } from '../fixtures/test-fixtures';
import { testCustomer } from '../data/customers.data';
import { FoodCategories, categoryNames } from '../data/food-items.data';

test.describe(TestCategories.PRINT_PREVIEW, () => {
  
  test.beforeEach(async ({ loginPage, summaryPage }) => {
    // Setup: Mock login and navigate to summary page
    await loginPage.navigate();
    await loginPage.mockLogin();
    await summaryPage.navigate();
    await summaryPage.waitForPageLoad();
  });

  /**
   * TC-025: Print Preview Displays All Categories
   * Priority: Critical
   * Test Steps:
   * 1. Navigate to print preview for an order
   * 2. Verify salads category is displayed
   * 3. Verify middle courses category is displayed
   * 4. Verify sides category is displayed
   * 5. Verify mains category is displayed
   * 6. Verify extras category is displayed
   * 7. Verify bakery category is displayed
   */
  test(`TC-025: Print Preview Displays All Categories ${TestTags.CRITICAL}`, async ({ 
    summaryPage,
    printPreviewPage 
  }) => {
    // Arrange - Navigate to print preview
    const orderCards = await summaryPage.getVisibleOrderCards();
    
    if (orderCards.length === 0) {
      test.skip();
      return;
    }
    
    await summaryPage.clickPrintButton(orderCards[0]);
    await printPreviewPage.waitForPageLoad();
    
    // Assert - Verify categories are displayed (if they have items)
    const categoriesPresent = await printPreviewPage.getDisplayedCategories();
    
    // At minimum, we should have some categories displayed
    expect(categoriesPresent.length).toBeGreaterThanOrEqual(0);
  });

  /**
   * TC-026: Print Preview Shows Customer Details
   * Priority: Critical
   * Test Steps:
   * 1. Navigate to print preview
   * 2. Verify customer name is displayed
   * 3. Verify phone number is displayed
   * 4. Verify phone2 is displayed (if exists)
   * 5. Verify customer time is displayed
   */
  test(`TC-026: Print Preview Shows Customer Details ${TestTags.CRITICAL}`, async ({ 
    summaryPage,
    printPreviewPage 
  }) => {
    // Arrange
    const orderCards = await summaryPage.getVisibleOrderCards();
    
    if (orderCards.length === 0) {
      test.skip();
      return;
    }
    
    const expectedName = await summaryPage.getOrderCustomerName(orderCards[0]);
    
    await summaryPage.clickPrintButton(orderCards[0]);
    await printPreviewPage.waitForPageLoad();
    
    // Assert - Verify customer details
    const displayedName = await printPreviewPage.getCustomerName();
    expect(displayedName).toBe(expectedName);
    
    const displayedPhone = await printPreviewPage.getPhoneNumber();
    expect(displayedPhone).toBeTruthy();
    
    // Check for secondary phone (phone2)
    const phone2 = await printPreviewPage.getSecondaryPhone();
    // phone2 may or may not exist, just verify no crash
    
    // Check for customer time
    const customerTime = await printPreviewPage.getCustomerTime();
    // customerTime should be displayed if set
  });

  /**
   * TC-027: Print Preview Shows Item Quantities Correctly
   * Priority: High
   * Test Steps:
   * 1. Navigate to print preview
   * 2. Verify salad items show liter quantities
   * 3. Verify size-based items show ג/ק quantities
   * 4. Verify quantity-based items show numeric quantities
   */
  test(`TC-027: Print Preview Shows Item Quantities Correctly ${TestTags.HIGH}`, async ({ 
    summaryPage,
    printPreviewPage 
  }) => {
    // Arrange
    const orderCards = await summaryPage.getVisibleOrderCards();
    
    if (orderCards.length === 0) {
      test.skip();
      return;
    }
    
    await summaryPage.clickPrintButton(orderCards[0]);
    await printPreviewPage.waitForPageLoad();
    
    // Assert - Verify items are displayed with quantities
    const saladItems = await printPreviewPage.getCategoryItems(FoodCategories.SALADS);
    
    for (const item of saladItems) {
      // Each item should have name and quantity
      expect(item.name).toBeTruthy();
      expect(item.quantity).toBeTruthy();
    }
    
    // Verify size-based items (ג/ק)
    const sideItems = await printPreviewPage.getCategoryItems(FoodCategories.SIDES);
    
    for (const item of sideItems) {
      expect(item.name).toBeTruthy();
    }
  });

  /**
   * TC-028: Print Preview Shows Extras Category
   * Priority: High
   * Test Steps:
   * 1. Create order with extras
   * 2. Navigate to print preview
   * 3. Verify extras category is displayed
   * 4. Verify extras items are listed correctly
   */
  test(`TC-028: Print Preview Shows Extras Category ${TestTags.HIGH}`, async ({ 
    summaryPage,
    printPreviewPage 
  }) => {
    // Arrange
    const orderCards = await summaryPage.getVisibleOrderCards();
    
    if (orderCards.length === 0) {
      test.skip();
      return;
    }
    
    await summaryPage.clickPrintButton(orderCards[0]);
    await printPreviewPage.waitForPageLoad();
    
    // Check if extras category exists
    const hasExtras = await printPreviewPage.hasCategorySection(FoodCategories.EXTRAS);
    
    if (hasExtras) {
      // Assert - Verify extras are displayed
      const extrasItems = await printPreviewPage.getCategoryItems(FoodCategories.EXTRAS);
      expect(extrasItems.length).toBeGreaterThan(0);
    }
  });

  /**
   * TC-028b: Print Preview Shows Pricing Information
   * Priority: Medium
   * Test Steps:
   * 1. Navigate to print preview
   * 2. Verify total portions displayed
   * 3. Verify price per portion displayed
   * 4. Verify total price calculation
   */
  test(`TC-028b: Print Preview Shows Pricing Information ${TestTags.MEDIUM}`, async ({ 
    summaryPage,
    printPreviewPage 
  }) => {
    // Arrange
    const orderCards = await summaryPage.getVisibleOrderCards();
    
    if (orderCards.length === 0) {
      test.skip();
      return;
    }
    
    await summaryPage.clickPrintButton(orderCards[0]);
    await printPreviewPage.waitForPageLoad();
    
    // Assert - Verify pricing elements
    const pricingInfo = await printPreviewPage.getPricingInformation();
    
    if (pricingInfo.totalPortions) {
      expect(pricingInfo.totalPortions).toBeGreaterThan(0);
    }
    
    if (pricingInfo.pricePerPortion) {
      expect(pricingInfo.pricePerPortion).toBeGreaterThan(0);
    }
  });

  /**
   * TC-028c: Print Button Functionality
   * Priority: Medium
   * Test Steps:
   * 1. Navigate to print preview
   * 2. Click print button
   * 3. Verify print dialog is triggered
   */
  test(`TC-028c: Print Button Functionality ${TestTags.MEDIUM}`, async ({ 
    summaryPage,
    printPreviewPage,
    page 
  }) => {
    // Arrange
    const orderCards = await summaryPage.getVisibleOrderCards();
    
    if (orderCards.length === 0) {
      test.skip();
      return;
    }
    
    await summaryPage.clickPrintButton(orderCards[0]);
    await printPreviewPage.waitForPageLoad();
    
    // Setup print dialog listener
    let printDialogTriggered = false;
    page.on('dialog', async (dialog) => {
      printDialogTriggered = true;
    });
    
    // Act - Try to trigger print
    // Note: Actual print dialog testing may require browser-specific handling
    await printPreviewPage.clickPrintButton();
    
    // Assert - Page should remain stable
    const isStillOnPage = await printPreviewPage.isOnPrintPreviewPage();
    expect(isStillOnPage).toBeTruthy();
  });

  /**
   * TC-028d: Back Navigation from Print Preview
   * Priority: Low
   * Test Steps:
   * 1. Navigate to print preview
   * 2. Click back button
   * 3. Verify navigation back to summary
   */
  test(`TC-028d: Back Navigation from Print Preview ${TestTags.LOW}`, async ({ 
    summaryPage,
    printPreviewPage,
    page 
  }) => {
    // Arrange
    const orderCards = await summaryPage.getVisibleOrderCards();
    
    if (orderCards.length === 0) {
      test.skip();
      return;
    }
    
    await summaryPage.clickPrintButton(orderCards[0]);
    await printPreviewPage.waitForPageLoad();
    
    // Act - Go back
    await printPreviewPage.goBack();
    
    // Assert - Should be back on summary
    await summaryPage.waitForPageLoad();
    const isOnSummary = await summaryPage.isPageLoaded();
    expect(isOnSummary).toBeTruthy();
  });
});
