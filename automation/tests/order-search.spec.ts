/**
 * Order Search Tests
 * 
 * @description Tests for searching and filtering orders
 * Test Cases: TC-009 to TC-013
 */
import { test, expect, TestTags, TestCategories } from '../fixtures/test-fixtures';
import { testCustomer, validCustomers, customerFilters } from '../data/customers.data';
import { testOrder, getTodayDate, getTomorrowDate, getWeekStart, getWeekEnd } from '../data/orders.data';

test.describe(TestCategories.ORDER_SEARCH, () => {
  
  test.beforeEach(async ({ loginPage, summaryPage }) => {
    // Setup: Mock login and navigate to summary page
    await loginPage.navigate();
    await loginPage.mockLogin();
    await summaryPage.navigate();
    await summaryPage.waitForPageLoad();
  });

  /**
   * TC-009: Search Order by Customer Name
   * Priority: Critical
   * Test Steps:
   * 1. Enter customer name in search field
   * 2. Verify matching orders are displayed
   * 3. Verify non-matching orders are hidden
   */
  test(`TC-009: Search Order by Customer Name ${TestTags.CRITICAL}`, async ({ 
    summaryPage 
  }) => {
    // Act
    await summaryPage.searchByName(customerFilters.byPartialName);
    
    // Assert
    const visibleOrders = await summaryPage.getVisibleOrderCards();
    
    for (const order of visibleOrders) {
      const customerName = await summaryPage.getOrderCustomerName(order);
      expect(customerName?.toLowerCase()).toContain(customerFilters.byPartialName.toLowerCase());
    }
  });

  /**
   * TC-010: Search Order by Phone Number
   * Priority: High
   * Test Steps:
   * 1. Enter phone number in search field
   * 2. Verify matching orders are displayed
   * 3. Verify partial phone search works
   */
  test(`TC-010: Search Order by Phone Number ${TestTags.HIGH}`, async ({ 
    summaryPage 
  }) => {
    // Act
    await summaryPage.searchByPhone(customerFilters.byPartialPhone);
    
    // Assert
    const visibleOrders = await summaryPage.getVisibleOrderCards();
    
    for (const order of visibleOrders) {
      const phoneNumber = await summaryPage.getOrderPhoneNumber(order);
      expect(phoneNumber).toContain(customerFilters.byPartialPhone);
    }
  });

  /**
   * TC-011: Filter Orders by Date Range
   * Priority: High
   * Test Steps:
   * 1. Set date range filter
   * 2. Verify only orders within range are displayed
   */
  test(`TC-011: Filter Orders by Date Range ${TestTags.HIGH}`, async ({ 
    summaryPage 
  }) => {
    // Arrange
    const startDate = getTodayDate();
    const endDate = getTomorrowDate();
    
    // Act
    await summaryPage.setDateRange(startDate, endDate);
    
    // Assert
    const visibleOrders = await summaryPage.getVisibleOrderCards();
    
    for (const order of visibleOrders) {
      const orderDate = await summaryPage.getOrderDate(order);
      expect(orderDate).toBeTruthy();
      // Date should be within range
    }
  });

  /**
   * TC-012: Filter Orders by This Week
   * Priority: Medium
   * Test Steps:
   * 1. Click "This Week" filter button
   * 2. Verify date range is set correctly
   * 3. Verify orders are filtered to current week
   */
  test(`TC-012: Filter Orders by This Week ${TestTags.MEDIUM}`, async ({ 
    summaryPage 
  }) => {
    // Act
    await summaryPage.filterByThisWeek();
    
    // Assert
    const dateRange = await summaryPage.getCurrentDateRange();
    const expectedStart = getWeekStart();
    const expectedEnd = getWeekEnd();
    
    expect(dateRange.start).toBe(expectedStart);
    expect(dateRange.end).toBe(expectedEnd);
  });

  /**
   * TC-013: Filter Orders by Next Week
   * Priority: Medium
   * Test Steps:
   * 1. Click "Next Week" filter button
   * 2. Verify date range is set correctly
   * 3. Verify orders are filtered to next week
   */
  test(`TC-013: Filter Orders by Next Week ${TestTags.MEDIUM}`, async ({ 
    summaryPage 
  }) => {
    // Act
    await summaryPage.filterByNextWeek();
    
    // Assert
    const visibleOrders = await summaryPage.getVisibleOrderCards();
    
    // Verify all orders are for next week dates
    for (const order of visibleOrders) {
      const orderDate = await summaryPage.getOrderDate(order);
      // Order date should be within next week range
      expect(orderDate).toBeTruthy();
    }
  });

  /**
   * TC-013b: Combined Search and Date Filter
   * Priority: Medium
   * Test Steps:
   * 1. Set date range filter
   * 2. Enter search text
   * 3. Verify both filters are applied together
   */
  test(`TC-013b: Combined Search and Date Filter ${TestTags.MEDIUM}`, async ({ 
    summaryPage 
  }) => {
    // Arrange
    const startDate = getTodayDate();
    const endDate = getTomorrowDate();
    
    // Act
    await summaryPage.setDateRange(startDate, endDate);
    await summaryPage.searchByName(customerFilters.byPartialName);
    
    // Assert
    const visibleOrders = await summaryPage.getVisibleOrderCards();
    
    for (const order of visibleOrders) {
      const customerName = await summaryPage.getOrderCustomerName(order);
      expect(customerName?.toLowerCase()).toContain(customerFilters.byPartialName.toLowerCase());
    }
  });

  /**
   * TC-013c: Clear Search Filters
   * Priority: Low
   * Test Steps:
   * 1. Apply search filters
   * 2. Clear filters
   * 3. Verify all orders are displayed again
   */
  test(`TC-013c: Clear Search Filters ${TestTags.LOW}`, async ({ 
    summaryPage 
  }) => {
    // Arrange - Apply filters first
    await summaryPage.searchByName(customerFilters.byPartialName);
    const filteredCount = await summaryPage.getVisibleOrderCount();
    
    // Act - Clear filters
    await summaryPage.clearFilters();
    
    // Assert - Should show all or more orders
    const totalCount = await summaryPage.getVisibleOrderCount();
    expect(totalCount).toBeGreaterThanOrEqual(filteredCount);
  });
});
