/**
 * Order Page Object
 * 
 * @description Page object for the order creation page (/order)
 */
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { OrderLocators, getFoodItemCard, getCategoryAccordion } from '../locators/order.locators';
import { CustomerData } from '../data/customers.data';
import { PricingData, OrderTimeData, SaladItemData, SideItemData, MainItemData } from '../data/orders.data';
import { CustomerDetailsComponent } from '../components/customer-details.component';
import { FoodCategoryComponent } from '../components/food-category.component';

export class OrderPage extends BasePage {
  // URL
  private readonly url = '/order';
  
  // Components
  public customerDetails: CustomerDetailsComponent;
  public saladsCategory: FoodCategoryComponent;
  public middleCoursesCategory: FoodCategoryComponent;
  public sidesCategory: FoodCategoryComponent;
  public mainsCategory: FoodCategoryComponent;
  public extrasCategory: FoodCategoryComponent;
  public bakeryCategory: FoodCategoryComponent;

  constructor(page: Page) {
    super(page);
    this.customerDetails = new CustomerDetailsComponent(page);
    this.saladsCategory = new FoodCategoryComponent(page, 'salads', 'סלטים');
    this.middleCoursesCategory = new FoodCategoryComponent(page, 'middle_courses', 'מנות ביניים');
    this.sidesCategory = new FoodCategoryComponent(page, 'sides', 'תוספות');
    this.mainsCategory = new FoodCategoryComponent(page, 'mains', 'עיקריות');
    this.extrasCategory = new FoodCategoryComponent(page, 'extras', 'אקסטרות');
    this.bakeryCategory = new FoodCategoryComponent(page, 'bakery', 'לחם, מאפים וקינוחים');
  }

  /**
   * Navigate to order page (override base method)
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
      await this.page.waitForSelector(OrderLocators.actions.saveButton, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Open a food category accordion
   */
  async openCategory(category: string): Promise<void> {
    const accordion = getCategoryAccordion(category);
    const button = this.page.locator(accordion);

    // Check if accordion is already open by looking at the parent's data-state
    const accordionItem = button.locator('..').locator('..');
    const state = await accordionItem.getAttribute('data-state').catch(() => null);

    if (state !== 'open') {
      await button.click();
      // Wait for accordion content to be visible
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Select first available item in a category
   */
  async selectFirstAvailableItem(category: string): Promise<void> {
    const accordion = getCategoryAccordion(category);
    // Find the accordion trigger button and navigate to the content
    const accordionTrigger = this.page.locator(accordion);
    const accordionContent = accordionTrigger.locator('..').locator('..').locator('[data-state="open"] >> .grid, [role="region"] >> .grid');

    // Find clickable items in the grid - they typically have text content
    let items = accordionContent.locator('button, [role="button"], div[class*="cursor-pointer"], div[class*="rounded-xl"][class*="border"]');
    let itemCount = await items.count();

    // Alternative: find items by looking at direct children of the grid
    if (itemCount === 0) {
      const parentSection = accordionTrigger.locator('..').locator('..');
      items = parentSection.locator('.grid > button, .grid > div');
      itemCount = await items.count();
    }

    if (itemCount > 0) {
      await items.first().click();
      await this.page.waitForTimeout(500); // Wait for popup

      // If a popup/modal appears, set quantity to 1 and confirm
      const confirmButton = this.page.locator('button:has-text("אישור")');
      if (await confirmButton.isVisible({ timeout: 1500 }).catch(() => false)) {
        // Try to increment quantity first if there's a + button
        const plusButton = this.page.locator('button:has-text("+")').first();
        if (await plusButton.isVisible({ timeout: 500 }).catch(() => false)) {
          await plusButton.click();
        }
        await confirmButton.click();
        await this.page.waitForTimeout(300);
      }
    }
  }

  /**
   * Select salad with liters (using 1.5L size as default)
   */
  async selectSaladWithLiters(itemName: string, quantity: number): Promise<void> {
    await this.addSaladItem(itemName, [{ label: '1.5L', quantity: quantity }]);
  }

  /**
   * Select item with size (big/small)
   */
  async selectItemWithSize(itemName: string, big: number, small: number): Promise<void> {
    await this.addSideItem(itemName, big, small);
  }

  /**
   * Select item with quantity (supports different categories)
   */
  async selectItemWithQuantity(itemName: string, quantity: number, category?: string): Promise<void> {
    if (category === 'bakery' || category === 'לחם, מאפים וקינוחים') {
      await this.addBakeryItem(itemName, quantity);
    } else if (category === 'middle_courses' || category === 'מנות ביניים') {
      await this.addMiddleCourseItem(itemName, quantity);
    } else {
      await this.addMainItem(itemName, quantity);
    }
  }

  /**
   * Get item quantity from the displayed card
   */
  async getItemQuantity(itemName: string): Promise<number> {
    const card = getFoodItemCard(itemName);
    const cardLocator = this.page.locator(card).first();

    // Try to find the card with a reasonable wait
    try {
      await cardLocator.scrollIntoViewIfNeeded({ timeout: 5000 });
    } catch {
      // Card might not be visible - could be in collapsed accordion
      return 0;
    }

    // Look for quantity display in the card (e.g., "5 ×")
    const cardText = await cardLocator.textContent({ timeout: 5000 }).catch(() => '');
    if (cardText) {
      // Match patterns like "5 ×" or "× 5"
      const match = cardText.match(/(\d+)\s*×|×\s*(\d+)/);
      if (match) {
        return parseInt(match[1] || match[2], 10);
      }
    }
    return 0;
  }

  /**
   * Get selected items in a category
   */
  async getSelectedItems(category: string): Promise<string[]> {
    const accordion = getCategoryAccordion(category);
    const accordionTrigger = this.page.locator(accordion);
    const accordionSection = accordionTrigger.locator('..').locator('..');

    // Selected items have blue border or contain a checkmark/quantity indicator
    const selectedItems = accordionSection.locator('[class*="border-blue-500"], [class*="border-blue-400"], .border-blue-500');
    const items: string[] = [];
    const count = await selectedItems.count();
    for (let i = 0; i < count; i++) {
      const text = await selectedItems.nth(i).textContent();
      if (text) items.push(text.trim());
    }

    // Also check the selection count shown in the accordion header (e.g., "1/3")
    const countText = await accordionTrigger.locator('..').locator('span').first().textContent().catch(() => '0');
    const match = countText?.match(/(\d+)\//);
    if (match && parseInt(match[1]) > 0 && items.length === 0) {
      // Items are selected but we couldn't find them - return placeholder
      items.push('selected');
    }

    return items;
  }

  /**
   * Try to save order and return result
   */
  async trySaveOrder(): Promise<{ success: boolean; validationErrors?: string[] }> {
    await this.clickSave();
    await this.page.waitForTimeout(500);
    
    // Check for validation errors
    const errorMessages = this.page.locator('[data-testid="error-message"], .error-message, [role="alert"]');
    if (await errorMessages.count() > 0) {
      const errors: string[] = [];
      const count = await errorMessages.count();
      for (let i = 0; i < count; i++) {
        const text = await errorMessages.nth(i).textContent();
        if (text) errors.push(text);
      }
      return { success: false, validationErrors: errors };
    }
    
    return { success: true };
  }

  /**
   * Get customer name from form
   */
  async getCustomerName(): Promise<string> {
    return await this.page.locator(OrderLocators.customerDetails.nameInput).inputValue();
  }

  /**
   * Get phone from form
   */
  async getPhone(): Promise<string> {
    return await this.page.locator(OrderLocators.customerDetails.phoneInput).inputValue();
  }

  /**
   * Get phone2 from form
   */
  async getPhone2(): Promise<string> {
    return await this.page.locator(OrderLocators.customerDetails.phone2Input).inputValue();
  }

  /**
   * Select item with variation
   */
  async selectItemWithVariation(itemName: string, variation: string): Promise<void> {
    await this.openCategory('sides');
    const itemCard = getFoodItemCard(`${itemName} ${variation}`);
    await this.click(itemCard);
  }

  /**
   * Select item with preparation
   */
  async selectItemWithPreparation(itemName: string, preparation: string): Promise<void> {
    await this.openCategory('middle_courses');
    await this.addMiddleCourseItem(itemName, 1, preparation);
  }

  /**
   * Set item quantity directly
   */
  async setItemQuantityDirect(itemName: string, quantity: number): Promise<void> {
    const card = getFoodItemCard(itemName);
    const input = this.page.locator(card).locator('input[type="number"]');
    if (await input.count() > 0) {
      await input.fill(String(quantity));
    }
  }

  /**
   * Fill customer information
   */
  async fillCustomerDetails(customer: CustomerData): Promise<void> {
    await this.customerDetails.expand();
    await this.customerDetails.fillName(customer.name);
    await this.customerDetails.fillPhone(customer.phone);
    if (customer.phone2) {
      await this.customerDetails.fillPhoneAlt(customer.phone2);
    }
    if (customer.address) {
      await this.customerDetails.fillAddress(customer.address);
    }
    if (customer.time) {
      await this.customerDetails.fillCustomerTime(customer.time);
    }
    if (customer.notes) {
      await this.customerDetails.fillNotes(customer.notes);
    }
  }

  /**
   * Fill order date and times
   */
  async fillOrderTimes(times: OrderTimeData): Promise<void> {
    await this.customerDetails.expand();
    await this.customerDetails.fillOrderDate(times.orderDate);
    await this.customerDetails.fillKitchenTime(times.kitchenTime);
    await this.customerDetails.fillCustomerTime(times.customerTime);
  }

  /**
   * Fill pricing information
   */
  async fillPricing(pricing: PricingData): Promise<void> {
    await this.customerDetails.expand();
    await this.customerDetails.fillTotalPortions(pricing.totalPortions);
    await this.customerDetails.fillPricePerPortion(pricing.pricePerPortion);
    await this.customerDetails.fillDeliveryFee(pricing.deliveryFee);
  }

  /**
   * Fill order notes
   */
  async fillNotes(notes: string): Promise<void> {
    await this.customerDetails.expand();
    await this.customerDetails.fillNotes(notes);
  }

  /**
   * Get calculated total payment
   */
  async getTotalPayment(): Promise<number> {
    return await this.customerDetails.getTotalPayment();
  }

  /**
   * Add salad item
   */
  async addSaladItem(itemName: string, liters?: { label: string; quantity: number }[]): Promise<void> {
    await this.saladsCategory.expand();
    await this.saladsCategory.clickItem(itemName);
    
    // If popup opens, set quantities
    if (liters && liters.length > 0) {
      for (const liter of liters) {
        await this.setLiterQuantity(liter.label, liter.quantity);
      }
      await this.closePopup();
    }
  }

  /**
   * Add side item
   */
  async addSideItem(itemName: string, sizeBig: number, sizeSmall: number): Promise<void> {
    await this.sidesCategory.expand();
    await this.sidesCategory.clickItem(itemName);
    
    // Set sizes in popup
    await this.setSizeQuantity('big', sizeBig);
    await this.setSizeQuantity('small', sizeSmall);
    await this.closePopup();
  }

  /**
   * Add main dish item
   */
  async addMainItem(itemName: string, quantity: number): Promise<void> {
    await this.mainsCategory.expand();
    await this.mainsCategory.clickItem(itemName);
    
    // Set quantity in popup
    await this.setItemQuantity(quantity);
    await this.closePopup();
  }

  /**
   * Add middle course item
   */
  async addMiddleCourseItem(itemName: string, quantity: number, preparation?: string): Promise<void> {
    await this.middleCoursesCategory.expand();
    await this.middleCoursesCategory.clickItem(itemName);
    
    // Set quantity
    await this.setItemQuantity(quantity);
    
    // Set preparation if specified
    if (preparation) {
      await this.selectPreparation(preparation);
    }
    
    await this.closePopup();
  }

  /**
   * Add bakery item
   */
  async addBakeryItem(itemName: string, quantity: number): Promise<void> {
    await this.bakeryCategory.expand();
    await this.bakeryCategory.clickItem(itemName);

    // Set quantity in popup
    await this.setItemQuantity(quantity);
    await this.closePopup();
  }

  /**
   * Set liter quantity in popup
   */
  async setLiterQuantity(label: string, quantity: number): Promise<void> {
    const literSelector = `${OrderLocators.popup.literSize.item}:has-text("${label}")`;
    const input = this.page.locator(literSelector).locator(OrderLocators.popup.quantityInput);
    
    // Click plus button multiple times or fill directly
    if (await input.count() > 0) {
      await input.fill(String(quantity));
    } else {
      // Use plus/minus buttons
      const plusButton = this.page.locator(literSelector).locator(OrderLocators.popup.plusButton);
      for (let i = 0; i < quantity; i++) {
        await plusButton.click();
      }
    }
  }

  /**
   * Set size quantity (ג/ק) in popup
   */
  async setSizeQuantity(size: 'big' | 'small', quantity: number): Promise<void> {
    const selector = size === 'big' 
      ? OrderLocators.popup.sizeSelector.bigInput 
      : OrderLocators.popup.sizeSelector.smallInput;
    await this.fill(selector, String(quantity));
  }

  /**
   * Set item quantity in popup
   */
  async setItemQuantity(quantity: number): Promise<void> {
    const input = this.page.locator(OrderLocators.popup.container).locator(OrderLocators.popup.quantityInput).first();
    await input.fill(String(quantity));
  }

  /**
   * Select preparation option
   */
  async selectPreparation(preparationName: string): Promise<void> {
    const dropdown = this.page.locator(OrderLocators.popup.preparationDropdown);
    if (await dropdown.count() > 0) {
      await dropdown.selectOption({ label: preparationName });
    }
  }

  /**
   * Close popup/modal
   */
  async closePopup(): Promise<void> {
    const confirmButton = this.page.locator(OrderLocators.popup.confirmButton);
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }
    await this.waitForElementToHide(OrderLocators.popup.backdrop);
  }

  /**
   * Click save button
   */
  async clickSave(): Promise<void> {
    await this.click(OrderLocators.actions.saveButton);
  }

  /**
   * Save order and wait for success
   */
  async saveOrder(): Promise<void> {
    await this.clickSave();
    await this.waitForLoading();
  }

  /**
   * Check if save is in progress
   */
  async isSaving(): Promise<boolean> {
    return await this.isVisible(OrderLocators.actions.loadingSpinner);
  }

  /**
   * Click print button
   */
  async clickPrint(): Promise<void> {
    await this.click(OrderLocators.actions.printButton);
  }

  /**
   * Click reset button
   */
  async clickReset(): Promise<void> {
    await this.click(OrderLocators.actions.resetButton);
  }

  /**
   * Navigate to summary page
   */
  async goToSummary(): Promise<void> {
    await this.click(OrderLocators.summaryLink);
    await this.waitForUrl('/summary');
  }

  /**
   * Get selection count for a category
   */
  async getCategorySelectionCount(categoryName: string): Promise<{ selected: number; max: number }> {
    const accordion = getCategoryAccordion(categoryName);
    const countText = await this.getText(`${accordion} ~ span`);
    const match = countText.match(/(\d+)\/(\d+)/);
    if (match) {
      return { selected: parseInt(match[1]), max: parseInt(match[2]) };
    }
    return { selected: 0, max: 0 };
  }

  /**
   * Check if a food item is selected
   */
  async isItemSelected(itemName: string): Promise<boolean> {
    const card = getFoodItemCard(itemName);
    const classAttr = await this.getAttribute(card, 'class');
    return classAttr?.includes('border-blue-500') || classAttr?.includes('bg-blue-50') || false;
  }

  /**
   * Get extra items panel total
   */
  async getExtraItemsTotal(): Promise<number> {
    const totalText = await this.getText(OrderLocators.extraItems.totalPrice);
    const match = totalText.match(/₪([\d,]+)/);
    if (match) {
      return parseInt(match[1].replace(/,/g, ''), 10);
    }
    return 0;
  }

  /**
   * Add item as extra with price
   */
  async addAsExtra(itemName: string, price: number, quantity?: number): Promise<void> {
    // This would require opening the item popup and clicking "add as extra"
    // Implementation depends on the UI flow
  }

  /**
   * Complete a basic order with minimal data
   */
  async createBasicOrder(customer: CustomerData, times: OrderTimeData): Promise<void> {
    await this.fillCustomerDetails(customer);
    await this.fillOrderTimes(times);
    await this.saveOrder();
  }

  /**
   * Assert order page is loaded
   */
  async assertPageLoaded(): Promise<void> {
    await this.assertVisible(OrderLocators.customerDetails.trigger);
    await this.assertVisible(OrderLocators.actions.saveButton);
  }
}
