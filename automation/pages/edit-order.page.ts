/**
 * Edit Order Page Object
 * 
 * @description Page object for the edit order page (/edit-order/[id])
 */
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { EditOrderLocators, getEditOrderUrl } from '../locators/edit-order.locators';
import { CustomerData } from '../data/customers.data';
import { PricingData, OrderTimeData } from '../data/orders.data';

export class EditOrderPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to edit order page (requires order id)
   */
  async navigateToOrder(orderId: string): Promise<void> {
    await super.navigate(getEditOrderUrl(orderId));
    await this.waitForPageLoad();
    await this.waitForLoading();
  }

  /**
   * Alias for navigateToOrder
   */
  async goto(orderId: string): Promise<void> {
    await this.navigateToOrder(orderId);
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
    return this.isOnEditPage();
  }

  /**
   * Check if user is on edit page
   */
  isOnEditPage(): boolean {
    return this.getCurrentUrl().includes('/edit-order');
  }

  /**
   * Check if user is on edit order page
   */
  isOnEditOrderPage(): boolean {
    return this.getCurrentUrl().includes('/edit-order');
  }

  /**
   * Get order number from page title
   */
  async getOrderNumber(): Promise<number> {
    const title = await this.getText(EditOrderLocators.header.orderNumber);
    const match = title.match(/#(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Check if page is loading
   */
  async isLoading(): Promise<boolean> {
    return await this.isVisible(EditOrderLocators.loadingSpinner);
  }

  /**
   * Check if error is displayed
   */
  async hasError(): Promise<boolean> {
    return await this.isVisible(EditOrderLocators.errorContainer);
  }

  /**
   * Get error message
   */
  async getErrorMessage(): Promise<string> {
    if (await this.hasError()) {
      return await this.getText(EditOrderLocators.errorText);
    }
    return '';
  }

  // ==================== CUSTOMER DETAILS ====================

  /**
   * Expand customer details section
   */
  async expandCustomerDetails(): Promise<void> {
    await this.click(EditOrderLocators.customerDetails.trigger);
    await this.page.waitForTimeout(300);
  }

  /**
   * Get current customer name
   */
  async getCustomerName(): Promise<string> {
    return await this.getValue(EditOrderLocators.customerDetails.customerName);
  }

  /**
   * Update customer name
   */
  async updateCustomerName(name: string): Promise<void> {
    await this.clearAndFill(EditOrderLocators.customerDetails.customerName, name);
  }

  /**
   * Get current phone
   */
  async getPhone(): Promise<string> {
    return await this.getValue(EditOrderLocators.customerDetails.phone);
  }

  /**
   * Update phone
   */
  async updatePhone(phone: string): Promise<void> {
    await this.clearAndFill(EditOrderLocators.customerDetails.phone, phone);
  }

  /**
   * Get current address
   */
  async getAddress(): Promise<string> {
    return await this.getValue(EditOrderLocators.customerDetails.address);
  }

  /**
   * Update address
   */
  async updateAddress(address: string): Promise<void> {
    await this.clearAndFill(EditOrderLocators.customerDetails.address, address);
  }

  /**
   * Update customer details
   */
  async updateCustomerDetails(customer: Partial<CustomerData>): Promise<void> {
    await this.expandCustomerDetails();
    if (customer.name) await this.updateCustomerName(customer.name);
    if (customer.phone) await this.updatePhone(customer.phone);
    if (customer.address) await this.updateAddress(customer.address);
  }

  // ==================== ORDER TIMES ====================

  /**
   * Get order date
   */
  async getOrderDate(): Promise<string> {
    return await this.getValue(EditOrderLocators.customerDetails.orderDate);
  }

  /**
   * Update order date
   */
  async updateOrderDate(date: string): Promise<void> {
    await this.fill(EditOrderLocators.customerDetails.orderDate, date);
  }

  /**
   * Get kitchen time
   */
  async getKitchenTime(): Promise<string> {
    return await this.getValue(EditOrderLocators.customerDetails.kitchenTime);
  }

  /**
   * Update kitchen time
   */
  async updateKitchenTime(time: string): Promise<void> {
    await this.fill(EditOrderLocators.customerDetails.kitchenTime, time);
  }

  /**
   * Get customer time
   */
  async getCustomerTime(): Promise<string> {
    return await this.getValue(EditOrderLocators.customerDetails.customerTime);
  }

  /**
   * Update customer time
   */
  async updateCustomerTime(time: string): Promise<void> {
    await this.fill(EditOrderLocators.customerDetails.customerTime, time);
  }

  /**
   * Update order times
   */
  async updateOrderTimes(times: Partial<OrderTimeData>): Promise<void> {
    await this.expandCustomerDetails();
    if (times.orderDate) await this.updateOrderDate(times.orderDate);
    if (times.kitchenTime) await this.updateKitchenTime(times.kitchenTime);
    if (times.customerTime) await this.updateCustomerTime(times.customerTime);
  }

  // ==================== PRICING ====================

  /**
   * Get total portions
   */
  async getTotalPortions(): Promise<number> {
    const value = await this.getValue(EditOrderLocators.customerDetails.totalPortions);
    return parseInt(value) || 0;
  }

  /**
   * Update total portions
   */
  async updateTotalPortions(portions: number): Promise<void> {
    await this.clearAndFill(EditOrderLocators.customerDetails.totalPortions, String(portions));
  }

  /**
   * Get price per portion
   */
  async getPricePerPortion(): Promise<number> {
    const value = await this.getValue(EditOrderLocators.customerDetails.pricePerPortion);
    return parseFloat(value) || 0;
  }

  /**
   * Update price per portion
   */
  async updatePricePerPortion(price: number): Promise<void> {
    await this.clearAndFill(EditOrderLocators.customerDetails.pricePerPortion, String(price));
  }

  /**
   * Get delivery fee
   */
  async getDeliveryFee(): Promise<number> {
    const value = await this.getValue(EditOrderLocators.customerDetails.deliveryFee);
    return parseFloat(value) || 0;
  }

  /**
   * Update delivery fee
   */
  async updateDeliveryFee(fee: number): Promise<void> {
    await this.clearAndFill(EditOrderLocators.customerDetails.deliveryFee, String(fee));
  }

  /**
   * Get calculated total payment
   */
  async getTotalPayment(): Promise<number> {
    const text = await this.getText(EditOrderLocators.customerDetails.totalPayment);
    const match = text?.match(/₪([\d,]+)/);
    return match ? parseInt(match[1].replace(/,/g, ''), 10) : 0;
  }

  /**
   * Update pricing
   */
  async updatePricing(pricing: Partial<PricingData>): Promise<void> {
    await this.expandCustomerDetails();
    if (pricing.totalPortions !== undefined) await this.updateTotalPortions(pricing.totalPortions);
    if (pricing.pricePerPortion !== undefined) await this.updatePricePerPortion(pricing.pricePerPortion);
    if (pricing.deliveryFee !== undefined) await this.updateDeliveryFee(pricing.deliveryFee);
  }

  // ==================== ITEMS ====================

  /**
   * Expand category section
   */
  async expandCategory(category: 'salads' | 'middleCourses' | 'sides' | 'mains' | 'extras' | 'bakery'): Promise<void> {
    const trigger = EditOrderLocators.categories[category].trigger;
    await this.click(trigger);
    await this.page.waitForTimeout(300);
  }

  /**
   * Get category selection count
   */
  async getCategoryCount(category: 'salads' | 'middleCourses' | 'sides' | 'mains' | 'extras' | 'bakery'): Promise<string> {
    const countSelector = EditOrderLocators.categories[category].count;
    return await this.getText(countSelector);
  }

  /**
   * Click on food item
   */
  async clickFoodItem(itemName: string): Promise<void> {
    const card = this.page.locator(EditOrderLocators.foodItem.getByName(itemName));
    await card.scrollIntoViewIfNeeded();
    await card.click();
  }

  /**
   * Check if food item is selected
   */
  async isItemSelected(itemName: string): Promise<boolean> {
    const card = this.page.locator(EditOrderLocators.foodItem.getByName(itemName));
    const classAttr = await card.getAttribute('class');
    return classAttr?.includes('border-blue-500') || false;
  }

  // ==================== EXTRA ITEMS ====================

  /**
   * Check if extra items panel is visible
   */
  async hasExtraItems(): Promise<boolean> {
    return await this.isVisible(EditOrderLocators.extraItems.panel);
  }

  /**
   * Get extra items count
   */
  async getExtraItemsCount(): Promise<number> {
    return await this.page.locator(EditOrderLocators.extraItems.item).count();
  }

  /**
   * Delete extra item
   */
  async deleteExtraItem(index: number): Promise<void> {
    const deleteButton = this.page.locator(EditOrderLocators.extraItems.deleteButton).nth(index);
    await deleteButton.click();
  }

  // ==================== ACTIONS ====================

  /**
   * Click save button
   */
  async clickSave(): Promise<void> {
    await this.click(EditOrderLocators.saveButton);
    await this.waitForLoading();
  }

  /**
   * Save order and wait for success
   */
  async saveOrder(): Promise<void> {
    // Setup alert handler
    this.page.once('dialog', async (dialog) => {
      await dialog.accept();
    });
    await this.clickSave();
  }

  /**
   * Go back to summary
   */
  async goBack(): Promise<void> {
    await this.click(EditOrderLocators.header.backButton);
    await this.waitForUrl('/summary');
  }

  // ==================== POPUP ====================

  /**
   * Check if popup is open
   */
  async isPopupOpen(): Promise<boolean> {
    return await this.isVisible(EditOrderLocators.popup.backdrop);
  }

  /**
   * Close popup
   */
  async closePopup(): Promise<void> {
    if (await this.isPopupOpen()) {
      await this.click(EditOrderLocators.popup.confirmButton);
      await this.waitForElementToHide(EditOrderLocators.popup.backdrop);
    }
  }

  /**
   * Set quantity in popup
   */
  async setPopupQuantity(quantity: number): Promise<void> {
    const input = this.page.locator(EditOrderLocators.popup.container).locator(EditOrderLocators.popup.quantityInput).first();
    await input.clear();
    await input.fill(String(quantity));
  }

  // ==================== ASSERTIONS ====================

  /**
   * Assert page is loaded with order data
   */
  async assertPageLoaded(): Promise<void> {
    await this.assertVisible(EditOrderLocators.header.title);
    await this.assertVisible(EditOrderLocators.saveButton);
  }

  /**
   * Assert error is displayed
   */
  async assertErrorDisplayed(): Promise<void> {
    await this.assertVisible(EditOrderLocators.errorContainer);
  }

  /**
   * Assert success message after save
   */
  async assertSaveSuccess(): Promise<void> {
    await this.waitForText('עודכנה בהצלחה');
  }

  // ==================== ADDITIONAL METHODS FOR TESTS ====================

  /**
   * Open a food category accordion
   */
  async openCategory(category: string): Promise<void> {
    const trigger = `button:has-text("${category}")`;
    await this.click(trigger);
    await this.page.waitForTimeout(300);
  }

  /**
   * Select first available item in a category
   */
  async selectFirstAvailableItem(category: string): Promise<void> {
    await this.openCategory(category);
    const items = this.page.locator('[data-testid="food-item"], [class*="rounded-xl"][class*="border"]');
    if (await items.count() > 0) {
      await items.first().click();
    }
  }

  /**
   * Get total item count in order
   */
  async getTotalItemCount(): Promise<number> {
    // Count selected items across all categories
    const selectedItems = this.page.locator('[class*="border-blue-500"], [class*="bg-blue-50"]');
    return await selectedItems.count();
  }

  /**
   * Remove first selected item
   */
  async removeFirstItem(): Promise<void> {
    const selectedItems = this.page.locator('[class*="border-blue-500"], [class*="bg-blue-50"]');
    if (await selectedItems.count() > 0) {
      await selectedItems.first().click();
      // Handle popup to set quantity to 0 or click delete
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Set item quantity by name
   */
  async setItemQuantity(itemName: string, quantity: number): Promise<void> {
    await this.clickFoodItem(itemName);
    await this.setPopupQuantity(quantity);
    await this.closePopup();
  }

  /**
   * Select item with quantity
   */
  async selectItemWithQuantity(itemName: string, quantity: number): Promise<void> {
    await this.setItemQuantity(itemName, quantity);
  }

  /**
   * Update collection time
   */
  async updateCollectionTime(time: string): Promise<void> {
    await this.updateCustomerTime(time);
  }

  /**
   * Save changes (alias for saveOrder)
   */
  async saveChanges(): Promise<void> {
    await this.saveOrder();
  }

  /**
   * Cancel edit - go back without saving
   */
  async cancelEdit(): Promise<void> {
    await this.goBack();
  }

  /**
   * Delete order
   */
  async deleteOrder(): Promise<void> {
    const deleteButton = this.page.locator('button:has-text("מחק"), button:has(.lucide-trash)');
    if (await deleteButton.count() > 0) {
      await deleteButton.click();
    }
  }

  /**
   * Confirm delete in dialog
   */
  async confirmDelete(): Promise<void> {
    const confirmButton = this.page.locator('[role="alertdialog"] button:has-text("מחק"), button:has-text("אישור")');
    if (await confirmButton.count() > 0) {
      await confirmButton.click();
      await this.waitForLoading();
    }
  }
}
