/**
 * Summary Page Object
 * 
 * @description Page object for the summary page (/summary)
 */
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { SummaryLocators, StatusLabels } from '../locators/summary.locators';

export class SummaryPage extends BasePage {
  // URL
  private readonly url = '/summary';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to summary page (override base method)
   */
  async navigate(): Promise<void> {
    await super.navigate(this.url);
    await this.waitForPageLoad();
    await this.waitForLoading();
  }

  /**
   * Alias for navigate
   */
  async goto(): Promise<void> {
    await this.navigate();
  }

  /**
   * Check if page is loaded
   */
  async isPageLoaded(): Promise<boolean> {
    try {
      await this.page.waitForSelector(SummaryLocators.filterButton, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Search by customer name
   */
  async searchByName(name: string): Promise<void> {
    await this.setCustomerNameFilter(name);
    await this.clickFilter();
  }

  /**
   * Search by phone
   */
  async searchByPhone(phone: string): Promise<void> {
    await this.setPhoneFilter(phone);
    await this.clickFilter();
  }

  /**
   * Search for order (returns true if found)
   */
  async searchForOrder(searchTerm: string): Promise<boolean> {
    // Click "Today" to ensure a date range is selected
    await this.clickTodayFilter();
    await this.page.waitForTimeout(300);

    await this.setCustomerNameFilter(searchTerm);
    await this.clickFilter();

    // Wait for loading to complete
    await this.page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 }).catch(() => {});
    await this.page.waitForTimeout(500);

    const count = await this.getOrderCount();
    return count > 0;
  }

  /**
   * Find order card by customer name
   */
  async findOrderCard(customerName: string): Promise<Locator | null> {
    // Click "Today" to ensure a date range is selected
    await this.clickTodayFilter();
    await this.page.waitForTimeout(300);

    // Filter by customer name
    await this.setCustomerNameFilter(customerName);
    await this.clickFilter();

    // Wait for loading to complete
    await this.page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 }).catch(() => {});
    await this.page.waitForTimeout(500);

    const card = this.getOrderByCustomerName(customerName);
    if (await card.count() > 0) {
      return card.first();
    }
    return null;
  }

  /**
   * Get visible order cards
   */
  async getVisibleOrderCards(): Promise<Locator[]> {
    const cards = this.page.locator(SummaryLocators.ordersList.orderCard);
    const count = await cards.count();
    const result: Locator[] = [];
    for (let i = 0; i < count; i++) {
      result.push(cards.nth(i));
    }
    return result;
  }

  /**
   * Get visible order count
   */
  async getVisibleOrderCount(): Promise<number> {
    return await this.page.locator(SummaryLocators.ordersList.orderCard).count();
  }

  /**
   * Get order phone number
   */
  async getOrderPhoneNumber(orderCard: Locator): Promise<string> {
    return await orderCard.locator(SummaryLocators.ordersList.customerPhone).textContent() || '';
  }

  /**
   * Get order date
   */
  async getOrderDate(orderCard: Locator): Promise<string> {
    const dateText = await orderCard.locator('.text-gray-500, [class*="date"]').first().textContent();
    return dateText || '';
  }

  /**
   * Get order number from card
   */
  async getOrderNumber(orderCard: Locator): Promise<string> {
    const text = await orderCard.locator('.font-bold, [class*="order-number"]').first().textContent();
    const match = text?.match(/\d+/);
    return match ? match[0] : '';
  }

  /**
   * Check if edit button exists
   */
  async hasEditButton(orderCard: Locator): Promise<boolean> {
    return await orderCard.locator(SummaryLocators.expandedOrder.editButton).count() > 0;
  }

  /**
   * Check if print button exists
   */
  async hasPrintButton(orderCard: Locator): Promise<boolean> {
    return await orderCard.locator(SummaryLocators.expandedOrder.printButton).count() > 0;
  }

  /**
   * Click print button on order
   */
  async clickPrintButton(orderCard: Locator): Promise<void> {
    await orderCard.locator(SummaryLocators.expandedOrder.printButton).click();
  }

  /**
   * Click edit button on order
   */
  async clickEditButton(orderCard: Locator): Promise<void> {
    await orderCard.locator(SummaryLocators.expandedOrder.editButton).click();
  }

  /**
   * Check if search is visible
   */
  async isSearchVisible(): Promise<boolean> {
    return await this.isVisible(SummaryLocators.customerFilter.nameInput);
  }

  /**
   * Check if date filter is visible
   */
  async isDateFilterVisible(): Promise<boolean> {
    return await this.isVisible(SummaryLocators.dateFilter.fromDate);
  }

  /**
   * Get current view type
   */
  async getCurrentView(): Promise<'orders' | 'summary'> {
    if (await this.isOrdersViewActive()) {
      return 'orders';
    }
    return 'summary';
  }

  /**
   * Toggle between views
   */
  async toggleView(): Promise<void> {
    const currentView = await this.getCurrentView();
    if (currentView === 'orders') {
      await this.switchToSummaryView();
    } else {
      await this.switchToOrdersView();
    }
  }

  /**
   * Filter by this week
   */
  async filterByThisWeek(): Promise<void> {
    await this.clickThisWeekFilter();
    await this.waitForLoading();
  }

  /**
   * Filter by next week
   */
  async filterByNextWeek(): Promise<void> {
    await this.clickNextWeekFilter();
    await this.waitForLoading();
  }

  /**
   * Get current date range
   */
  async getCurrentDateRange(): Promise<{ start: string; end: string }> {
    const start = await this.getFromDate();
    const end = await this.getToDate();
    return { start, end };
  }

  /**
   * Clear all filters
   */
  async clearFilters(): Promise<void> {
    await this.fill(SummaryLocators.customerFilter.nameInput, '');
    await this.fill(SummaryLocators.customerFilter.phoneInput, '');
    await this.clickFilter();
  }

  /**
   * Check if user is on summary page
   */
  isOnSummaryPage(): boolean {
    return this.getCurrentUrl().includes('/summary');
  }

  // ==================== DATE FILTERS ====================

  /**
   * Click "Today" quick filter
   */
  async clickTodayFilter(): Promise<void> {
    await this.click(SummaryLocators.dateFilter.todayButton);
  }

  /**
   * Click "This Week" quick filter
   */
  async clickThisWeekFilter(): Promise<void> {
    await this.click(SummaryLocators.dateFilter.thisWeekButton);
  }

  /**
   * Click "Next Week" quick filter
   */
  async clickNextWeekFilter(): Promise<void> {
    await this.click(SummaryLocators.dateFilter.nextWeekButton);
  }

  /**
   * Set from date
   */
  async setFromDate(date: string): Promise<void> {
    await this.fill(SummaryLocators.dateFilter.fromDate, date);
  }

  /**
   * Set to date
   */
  async setToDate(date: string): Promise<void> {
    await this.fill(SummaryLocators.dateFilter.toDate, date);
  }

  /**
   * Set date range
   */
  async setDateRange(fromDate: string, toDate: string): Promise<void> {
    await this.setFromDate(fromDate);
    await this.setToDate(toDate);
  }

  /**
   * Get from date value
   */
  async getFromDate(): Promise<string> {
    return await this.getValue(SummaryLocators.dateFilter.fromDate);
  }

  /**
   * Get to date value
   */
  async getToDate(): Promise<string> {
    return await this.getValue(SummaryLocators.dateFilter.toDate);
  }

  // ==================== CUSTOMER FILTERS ====================

  /**
   * Set customer name filter
   */
  async setCustomerNameFilter(name: string): Promise<void> {
    await this.fill(SummaryLocators.customerFilter.nameInput, name);
  }

  /**
   * Set phone filter
   */
  async setPhoneFilter(phone: string): Promise<void> {
    await this.fill(SummaryLocators.customerFilter.phoneInput, phone);
  }

  /**
   * Click filter button
   */
  async clickFilter(): Promise<void> {
    await this.click(SummaryLocators.filterButton);
    await this.waitForLoading();
  }

  /**
   * Apply filters with date range
   */
  async filterByDateRange(fromDate: string, toDate: string): Promise<void> {
    await this.setDateRange(fromDate, toDate);
    await this.clickFilter();
  }

  /**
   * Apply filters with customer name
   */
  async filterByCustomerName(name: string): Promise<void> {
    await this.setCustomerNameFilter(name);
    await this.clickFilter();
  }

  /**
   * Apply filters with phone
   */
  async filterByPhone(phone: string): Promise<void> {
    await this.setPhoneFilter(phone);
    await this.clickFilter();
  }

  /**
   * Apply combined filters
   */
  async applyFilters(filters: {
    fromDate?: string;
    toDate?: string;
    customerName?: string;
    phone?: string;
  }): Promise<void> {
    if (filters.fromDate) await this.setFromDate(filters.fromDate);
    if (filters.toDate) await this.setToDate(filters.toDate);
    if (filters.customerName) await this.setCustomerNameFilter(filters.customerName);
    if (filters.phone) await this.setPhoneFilter(filters.phone);
    await this.clickFilter();
  }

  // ==================== VIEW TOGGLE ====================

  /**
   * Switch to orders list view
   */
  async switchToOrdersView(): Promise<void> {
    await this.click(SummaryLocators.viewToggle.ordersListButton);
  }

  /**
   * Switch to quantity summary view
   */
  async switchToSummaryView(): Promise<void> {
    await this.click(SummaryLocators.viewToggle.summaryButton);
  }

  /**
   * Check if orders view is active
   */
  async isOrdersViewActive(): Promise<boolean> {
    const button = this.page.locator(SummaryLocators.viewToggle.ordersListButton);
    const classAttr = await button.getAttribute('class');
    return classAttr?.includes('bg-blue-500') || false;
  }

  // ==================== ORDERS LIST ====================

  /**
   * Get number of orders displayed
   */
  async getOrderCount(): Promise<number> {
    return await this.page.locator(SummaryLocators.ordersList.orderCard).count();
  }

  /**
   * Check if no orders message is displayed
   */
  async hasNoOrdersMessage(): Promise<boolean> {
    return await this.isVisible(SummaryLocators.ordersList.noOrdersMessage);
  }

  /**
   * Get order card by index
   */
  getOrderCard(index: number): Locator {
    return this.page.locator(SummaryLocators.ordersList.orderCard).nth(index);
  }

  /**
   * Get order card by order number
   */
  getOrderByNumber(orderNumber: number): Locator {
    return this.page.locator(SummaryLocators.getOrderByNumber(orderNumber));
  }

  /**
   * Get order card by customer name
   */
  getOrderByCustomerName(name: string): Locator {
    return this.page.locator(SummaryLocators.getOrderByCustomerName(name));
  }

  /**
   * Expand order details
   */
  async expandOrder(orderCard: Locator): Promise<void> {
    await orderCard.click();
    await this.page.waitForTimeout(300); // Wait for animation
  }

  /**
   * Get customer name from order card
   */
  async getOrderCustomerName(orderCard: Locator): Promise<string> {
    return await orderCard.locator(SummaryLocators.ordersList.customerName).textContent() || '';
  }

  /**
   * Get customer phone from order card
   */
  async getOrderCustomerPhone(orderCard: Locator): Promise<string> {
    return await orderCard.locator(SummaryLocators.ordersList.customerPhone).textContent() || '';
  }

  /**
   * Get order price from card
   */
  async getOrderPrice(orderCard: Locator): Promise<number> {
    const priceText = await orderCard.locator(SummaryLocators.ordersList.priceDisplay).textContent();
    const match = priceText?.match(/₪([\d,]+)/);
    return match ? parseInt(match[1].replace(/,/g, ''), 10) : 0;
  }

  /**
   * Click print button on expanded order
   */
  async clickPrintOrder(orderCard: Locator): Promise<void> {
    await orderCard.locator(SummaryLocators.expandedOrder.printButton).click();
    await this.waitForUrl('/print-preview');
  }

  /**
   * Click edit button on expanded order
   */
  async clickEditOrder(orderCard: Locator): Promise<void> {
    await orderCard.locator(SummaryLocators.expandedOrder.editButton).click();
    await this.waitForUrl('/edit-order');
  }

  // ==================== QUANTITY SUMMARY ====================

  /**
   * Get quantity summary categories
   */
  async getSummaryCategories(): Promise<string[]> {
    const headers = await this.page.locator(SummaryLocators.quantitySummary.categoryHeader).all();
    const names: string[] = [];
    for (const header of headers) {
      const name = await header.textContent();
      if (name) names.push(name.trim());
    }
    return names;
  }

  /**
   * Click "Show All" filter in summary view
   */
  async clickShowAll(): Promise<void> {
    await this.click(SummaryLocators.quantitySummary.filterOptions.showAllButton);
  }

  /**
   * Click "Select Categories" filter
   */
  async clickSelectCategories(): Promise<void> {
    await this.click(SummaryLocators.quantitySummary.filterOptions.selectCategoriesButton);
  }

  /**
   * Click "Select Items" filter
   */
  async clickSelectItems(): Promise<void> {
    await this.click(SummaryLocators.quantitySummary.filterOptions.selectItemsButton);
  }

  // ==================== NAVIGATION ====================

  /**
   * Click back button to go to order page
   */
  async goBack(): Promise<void> {
    await this.click(SummaryLocators.header.backButton);
    await this.waitForUrl('/order');
  }

  // ==================== ASSERTIONS ====================

  /**
   * Assert page is loaded
   */
  async assertPageLoaded(): Promise<void> {
    await this.assertVisible(SummaryLocators.header.title);
    await this.assertVisible(SummaryLocators.filterButton);
  }

  /**
   * Assert no orders message is displayed
   */
  async assertNoOrdersDisplayed(): Promise<void> {
    await this.assertVisible(SummaryLocators.ordersList.noOrdersMessage);
  }

  /**
   * Assert order count
   */
  async assertOrderCount(expectedCount: number): Promise<void> {
    await this.assertCount(SummaryLocators.ordersList.orderCard, expectedCount);
  }

  /**
   * Assert order exists by customer name
   */
  async assertOrderExists(customerName: string): Promise<void> {
    await this.assertVisible(SummaryLocators.getOrderByCustomerName(customerName));
  }
}
