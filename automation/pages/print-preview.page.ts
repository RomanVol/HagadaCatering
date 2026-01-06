/**
 * Print Preview Page Object
 * 
 * @description Page object for the print preview page (/print-preview)
 */
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { PrintPreviewLocators, CategoryNames } from '../locators/print-preview.locators';

export class PrintPreviewPage extends BasePage {
  // URL
  private readonly url = '/print-preview';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to print preview (typically navigated from other pages)
   */
  async goto(): Promise<void> {
    await super.navigate(this.url);
    await this.waitForPageLoad();
    await this.waitForLoading();
  }

  /**
   * Wait for page load
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Check if page is loaded
   */
  async isPageLoaded(): Promise<boolean> {
    return this.isOnPrintPreviewPage();
  }

  /**
   * Check if user is on print preview page
   */
  isOnPrintPreviewPage(): boolean {
    return this.getCurrentUrl().includes('/print-preview');
  }

  /**
   * Check if page is loading
   */
  async isLoading(): Promise<boolean> {
    return await this.isVisible(PrintPreviewLocators.loadingSpinner);
  }

  /**
   * Check if no data message is displayed
   */
  async hasNoDataMessage(): Promise<boolean> {
    return await this.isVisible(PrintPreviewLocators.noDataMessage);
  }

  // ==================== CUSTOMER INFO ====================

  /**
   * Get customer name
   */
  async getCustomerName(): Promise<string> {
    return await this.getText(PrintPreviewLocators.customerInfo.name);
  }

  /**
   * Get phone number
   */
  async getPhoneNumber(): Promise<string> {
    return await this.getCustomerPhone();
  }

  /**
   * Get customer phone
   */
  async getCustomerPhone(): Promise<string> {
    const phoneElements = await this.page.locator(PrintPreviewLocators.customerInfo.phone).all();
    if (phoneElements.length > 0) {
      return await phoneElements[0].textContent() || '';
    }
    return '';
  }

  /**
   * Get secondary phone
   */
  async getSecondaryPhone(): Promise<string> {
    return await this.getCustomerPhone2();
  }

  /**
   * Get secondary phone
   */
  async getCustomerPhone2(): Promise<string> {
    const phoneElements = await this.page.locator(PrintPreviewLocators.customerInfo.phone).all();
    if (phoneElements.length > 1) {
      return await phoneElements[1].textContent() || '';
    }
    return '';
  }

  /**
   * Check if secondary phone is displayed
   */
  async hasSecondaryPhone(): Promise<boolean> {
    const phoneElements = await this.page.locator(PrintPreviewLocators.customerInfo.phone).all();
    return phoneElements.length > 1;
  }

  /**
   * Get customer address
   */
  async getCustomerAddress(): Promise<string> {
    return await this.getText(PrintPreviewLocators.customerInfo.address);
  }

  /**
   * Get customer time (זמן ללקוח)
   */
  async getCustomerTime(): Promise<string> {
    const timeElement = this.page.locator(PrintPreviewLocators.customerInfo.customerTime);
    if (await timeElement.count() > 0) {
      return await timeElement.textContent() || '';
    }
    return '';
  }

  /**
   * Check if customer time is displayed
   */
  async hasCustomerTime(): Promise<boolean> {
    return await this.isVisible(PrintPreviewLocators.customerInfo.customerTime);
  }

  /**
   * Get kitchen time (זמן למטבח)
   */
  async getKitchenTime(): Promise<string> {
    const timeElement = this.page.locator(PrintPreviewLocators.customerInfo.kitchenTime);
    if (await timeElement.count() > 0) {
      return await timeElement.textContent() || '';
    }
    return '';
  }

  // ==================== CATEGORIES ====================

  /**
   * Check if category section exists
   */
  async hasCategorySection(category: keyof typeof CategoryNames): Promise<boolean> {
    const categoryLocators = PrintPreviewLocators.categories[category];
    if (categoryLocators?.section) {
      return await this.isVisible(categoryLocators.section);
    }
    return false;
  }

  /**
   * Get all categories displayed
   */
  async getDisplayedCategories(): Promise<string[]> {
    const categories: string[] = [];
    
    for (const [key, name] of Object.entries(CategoryNames)) {
      if (await this.hasCategorySection(key as keyof typeof CategoryNames)) {
        categories.push(name);
      }
    }
    
    return categories;
  }

  // ==================== ITEMS ====================

  /**
   * Get item by name
   */
  getItem(itemName: string): Locator {
    return this.page.locator(PrintPreviewLocators.getItemByName(itemName));
  }

  /**
   * Check if item is displayed
   */
  async hasItem(itemName: string): Promise<boolean> {
    return await this.getItem(itemName).count() > 0;
  }

  /**
   * Check if item is marked as selected
   */
  async isItemSelected(itemName: string): Promise<boolean> {
    const item = this.getItem(itemName);
    // Look for check mark or selected styling
    const hasCheckmark = await item.locator(PrintPreviewLocators.itemRow.selectedMarker).count() > 0;
    return hasCheckmark;
  }

  /**
   * Get item quantity text
   */
  async getItemQuantity(itemName: string): Promise<string> {
    const item = this.getItem(itemName);
    const quantityElement = item.locator(PrintPreviewLocators.itemRow.quantity);
    return await quantityElement.textContent() || '';
  }

  /**
   * Check if item is marked as extra
   */
  async isExtraItem(itemName: string): Promise<boolean> {
    const item = this.getItem(itemName);
    const hasExtraMarker = await item.locator(PrintPreviewLocators.itemRow.extraMarker).count() > 0;
    return hasExtraMarker;
  }

  /**
   * Get extra item price
   */
  async getExtraItemPrice(itemName: string): Promise<number> {
    const item = this.getItem(itemName);
    const priceText = await item.locator(PrintPreviewLocators.itemRow.price).textContent();
    const match = priceText?.match(/₪(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  // ==================== SALADS SPECIFIC ====================

  /**
   * Get salad liter quantities
   */
  async getSaladLiterQuantities(itemName: string): Promise<string> {
    const item = this.getItem(itemName);
    const literElement = item.locator(PrintPreviewLocators.itemRow.literQuantity);
    return await literElement.textContent() || '';
  }

  // ==================== SIDES SPECIFIC ====================

  /**
   * Get side size quantities (ג/ק)
   */
  async getSideSizeQuantities(itemName: string): Promise<string> {
    const item = this.getItem(itemName);
    const sizeElement = item.locator(PrintPreviewLocators.itemRow.sizeDisplay);
    return await sizeElement.textContent() || '';
  }

  // ==================== EXTRAS SECTION ====================

  /**
   * Get all items in extras section
   */
  async getExtrasItems(): Promise<string[]> {
    if (!await this.hasCategorySection('extras')) {
      return [];
    }
    
    const itemNames: string[] = [];
    const items = await this.page.locator(PrintPreviewLocators.categories.extras.items).all();
    
    for (const item of items) {
      const name = await item.locator(PrintPreviewLocators.itemRow.name).textContent();
      if (name) itemNames.push(name.trim());
    }
    
    return itemNames;
  }

  // ==================== PRICING ====================

  /**
   * Get total portions display
   */
  async getTotalPortions(): Promise<number> {
    const text = await this.getText(PrintPreviewLocators.pricing.portionsCount);
    const match = text.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Get total payment
   */
  async getTotalPayment(): Promise<number> {
    const text = await this.getText(PrintPreviewLocators.pricing.totalPayment);
    const match = text.match(/₪([\d,]+)/);
    return match ? parseInt(match[1].replace(/,/g, ''), 10) : 0;
  }

  // ==================== NOTES ====================

  /**
   * Check if notes section is displayed
   */
  async hasNotes(): Promise<boolean> {
    return await this.isVisible(PrintPreviewLocators.notes.content);
  }

  /**
   * Get notes content
   */
  async getNotesContent(): Promise<string> {
    if (await this.hasNotes()) {
      return await this.getText(PrintPreviewLocators.notes.content);
    }
    return '';
  }

  // ==================== AGGREGATED LITERS ====================

  /**
   * Get aggregated liters total
   */
  async getAggregatedLitersTotal(): Promise<string> {
    const totalElement = this.page.locator(PrintPreviewLocators.aggregatedLiters.totalLiters);
    if (await totalElement.count() > 0) {
      return await totalElement.textContent() || '';
    }
    return '';
  }

  // ==================== NAVIGATION ====================

  /**
   * Click back button
   */
  async goBack(): Promise<void> {
    await this.click(PrintPreviewLocators.controls.backButton);
  }

  /**
   * Click print button
   */
  async clickPrint(): Promise<void> {
    await this.click(PrintPreviewLocators.controls.printButton);
  }

  // ==================== ASSERTIONS ====================

  /**
   * Assert page is loaded with data
   */
  async assertPageLoaded(): Promise<void> {
    await expect(this.page.locator(PrintPreviewLocators.noDataMessage)).not.toBeVisible();
  }

  /**
   * Assert customer info is displayed
   */
  async assertCustomerInfoDisplayed(name: string, phone: string): Promise<void> {
    await this.waitForText(name);
    await this.waitForText(phone);
  }

  /**
   * Assert customer time is displayed
   */
  async assertCustomerTimeDisplayed(): Promise<void> {
    await this.assertVisible(PrintPreviewLocators.customerInfo.customerTime);
  }

  /**
   * Assert secondary phone is displayed
   */
  async assertSecondaryPhoneDisplayed(): Promise<void> {
    expect(await this.hasSecondaryPhone()).toBe(true);
  }

  /**
   * Assert item appears in category
   */
  async assertItemInCategory(itemName: string, categoryName: string): Promise<void> {
    const categorySection = this.page.locator(PrintPreviewLocators.getCategoryByName(categoryName));
    const item = categorySection.locator(PrintPreviewLocators.getItemByName(itemName));
    await expect(item).toBeVisible();
  }

  /**
   * Assert extra item appears in both category and extras section
   */
  async assertExtraItemDisplayedCorrectly(itemName: string, sourceCategory: string): Promise<void> {
    // Should appear in source category
    await this.assertItemInCategory(itemName, sourceCategory);
    
    // Should also appear in extras section
    const extrasItems = await this.getExtrasItems();
    expect(extrasItems).toContain(itemName);
  }
}
