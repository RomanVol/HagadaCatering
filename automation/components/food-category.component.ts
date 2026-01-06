/**
 * Food Category Component
 * 
 * @description Reusable component for food category accordion sections
 */
import { Page, Locator } from '@playwright/test';
import { OrderLocators, getFoodItemCard } from '../locators/order.locators';

export class FoodCategoryComponent {
  private page: Page;
  private categoryId: string;
  private categoryName: string;

  constructor(page: Page, categoryId: string, categoryName: string) {
    this.page = page;
    this.categoryId = categoryId;
    this.categoryName = categoryName;
  }

  /**
   * Get the accordion trigger button
   */
  private get trigger(): Locator {
    return this.page.locator(`button:has-text("${this.categoryName}")`);
  }

  /**
   * Get the accordion section (parent of trigger)
   */
  private get section(): Locator {
    // Navigate from trigger button to the accordion item container
    return this.trigger.locator('..').locator('..');
  }

  /**
   * Get the items grid
   */
  private get itemsGrid(): Locator {
    // Grid is inside the accordion content
    return this.section.locator('.grid');
  }

  /**
   * Check if section is expanded
   */
  async isExpanded(): Promise<boolean> {
    const content = this.section.locator('[data-state="open"]');
    return await content.count() > 0;
  }

  /**
   * Expand the category section
   */
  async expand(): Promise<void> {
    // Check if already expanded by looking for visible grid
    const grid = this.itemsGrid;
    if (await grid.isVisible()) {
      return;
    }
    await this.trigger.click();
    await this.page.waitForTimeout(300); // Wait for animation
  }

  /**
   * Collapse the category section
   */
  async collapse(): Promise<void> {
    const grid = this.itemsGrid;
    if (await grid.isVisible()) {
      await this.trigger.click();
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Get selection count from header
   */
  async getSelectionCount(): Promise<{ selected: number; max: number | null }> {
    const countText = await this.trigger.locator('..').locator('span').last().textContent();
    if (!countText) return { selected: 0, max: null };
    
    const matchWithMax = countText.match(/(\d+)\/(\d+)/);
    if (matchWithMax) {
      return { selected: parseInt(matchWithMax[1]), max: parseInt(matchWithMax[2]) };
    }
    
    const matchCount = countText.match(/(\d+)/);
    if (matchCount) {
      return { selected: parseInt(matchCount[1]), max: null };
    }
    
    return { selected: 0, max: null };
  }

  /**
   * Get all item cards
   */
  async getItemCards(): Promise<Locator[]> {
    await this.expand();
    return await this.itemsGrid.locator(OrderLocators.foodItem.card).all();
  }

  /**
   * Get item card by name
   */
  getItemCard(itemName: string): Locator {
    return this.itemsGrid.locator(getFoodItemCard(itemName));
  }

  /**
   * Click on a food item to select/open popup
   */
  async clickItem(itemName: string): Promise<void> {
    await this.expand();
    const card = this.getItemCard(itemName);
    await card.scrollIntoViewIfNeeded();
    await card.click();
  }

  /**
   * Check if an item is selected
   */
  async isItemSelected(itemName: string): Promise<boolean> {
    const card = this.getItemCard(itemName);
    const classAttr = await card.getAttribute('class');
    return classAttr?.includes('border-blue-500') || classAttr?.includes('bg-blue-50') || false;
  }

  /**
   * Get all selected items
   */
  async getSelectedItems(): Promise<string[]> {
    await this.expand();
    const selectedCards = await this.itemsGrid.locator(OrderLocators.foodItem.selectedCard).all();
    const names: string[] = [];
    for (const card of selectedCards) {
      const name = await card.locator(OrderLocators.foodItem.name).textContent();
      if (name) names.push(name.trim());
    }
    return names;
  }

  /**
   * Get item quantity display (for items showing quantity on card)
   */
  async getItemQuantityDisplay(itemName: string): Promise<string> {
    const card = this.getItemCard(itemName);
    const quantityElement = card.locator(OrderLocators.foodItem.quantity);
    if (await quantityElement.count() > 0) {
      return await quantityElement.textContent() || '';
    }
    return '';
  }

  /**
   * Count visible items in the category
   */
  async getItemCount(): Promise<number> {
    await this.expand();
    return await this.itemsGrid.locator(OrderLocators.foodItem.card).count();
  }

  /**
   * Get all item names in the category
   */
  async getAllItemNames(): Promise<string[]> {
    await this.expand();
    const cards = await this.itemsGrid.locator(OrderLocators.foodItem.card).all();
    const names: string[] = [];
    for (const card of cards) {
      const name = await card.locator(OrderLocators.foodItem.name).textContent();
      if (name) names.push(name.trim());
    }
    return names;
  }

  /**
   * Deselect all items (by setting quantities to 0)
   * Note: This requires opening each item popup which may not be ideal
   */
  async deselectAll(): Promise<void> {
    const selectedItems = await this.getSelectedItems();
    for (const itemName of selectedItems) {
      await this.clickItem(itemName);
      // Would need to set quantity to 0 in popup
      // Implementation depends on item type
    }
  }
}
