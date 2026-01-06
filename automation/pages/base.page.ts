/**
 * Base Page Object
 * 
 * @description Base class for all page objects with common functionality
 */
import { Page, Locator, expect } from '@playwright/test';

export abstract class BasePage {
  protected page: Page;
  
  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a specific URL
   */
  async navigate(path: string): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for loading spinner to disappear
   */
  async waitForLoading(): Promise<void> {
    const spinner = this.page.locator('.animate-spin');
    try {
      await spinner.waitFor({ state: 'visible', timeout: 2000 });
      await spinner.waitFor({ state: 'hidden', timeout: 30000 });
    } catch {
      // Spinner might not appear if loading is fast
    }
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Get current URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Wait for URL to contain specific path
   */
  async waitForUrl(path: string): Promise<void> {
    await this.page.waitForURL(`**${path}**`);
  }

  /**
   * Click element with waiting
   */
  async click(selector: string): Promise<void> {
    await this.page.locator(selector).click();
  }

  /**
   * Fill input field
   */
  async fill(selector: string, value: string): Promise<void> {
    await this.page.locator(selector).fill(value);
  }

  /**
   * Clear and fill input field
   */
  async clearAndFill(selector: string, value: string): Promise<void> {
    const element = this.page.locator(selector);
    await element.clear();
    await element.fill(value);
  }

  /**
   * Get text content of element
   */
  async getText(selector: string): Promise<string> {
    return await this.page.locator(selector).textContent() || '';
  }

  /**
   * Get input value
   */
  async getValue(selector: string): Promise<string> {
    return await this.page.locator(selector).inputValue();
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector: string): Promise<boolean> {
    return await this.page.locator(selector).isVisible();
  }

  /**
   * Check if element exists
   */
  async exists(selector: string): Promise<boolean> {
    return await this.page.locator(selector).count() > 0;
  }

  /**
   * Wait for element to be visible
   */
  async waitForElement(selector: string, timeout: number = 10000): Promise<Locator> {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible', timeout });
    return element;
  }

  /**
   * Wait for element to disappear
   */
  async waitForElementToHide(selector: string, timeout: number = 10000): Promise<void> {
    await this.page.locator(selector).waitFor({ state: 'hidden', timeout });
  }

  /**
   * Wait for text to appear
   */
  async waitForText(text: string, timeout: number = 10000): Promise<void> {
    await this.page.waitForSelector(`text=${text}`, { state: 'visible', timeout });
  }

  /**
   * Take screenshot
   */
  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `automation/reports/screenshots/${name}.png` });
  }

  /**
   * Scroll element into view
   */
  async scrollIntoView(selector: string): Promise<void> {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }

  /**
   * Get locator for element
   */
  getLocator(selector: string): Locator {
    return this.page.locator(selector);
  }

  /**
   * Get all elements matching selector
   */
  async getAllElements(selector: string): Promise<Locator[]> {
    return await this.page.locator(selector).all();
  }

  /**
   * Assert element has text
   */
  async assertText(selector: string, expectedText: string): Promise<void> {
    await expect(this.page.locator(selector)).toContainText(expectedText);
  }

  /**
   * Assert element has value
   */
  async assertValue(selector: string, expectedValue: string): Promise<void> {
    await expect(this.page.locator(selector)).toHaveValue(expectedValue);
  }

  /**
   * Assert element is visible
   */
  async assertVisible(selector: string): Promise<void> {
    await expect(this.page.locator(selector)).toBeVisible();
  }

  /**
   * Assert element is not visible
   */
  async assertNotVisible(selector: string): Promise<void> {
    await expect(this.page.locator(selector)).not.toBeVisible();
  }

  /**
   * Assert element count
   */
  async assertCount(selector: string, count: number): Promise<void> {
    await expect(this.page.locator(selector)).toHaveCount(count);
  }

  /**
   * Press keyboard key
   */
  async pressKey(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }

  /**
   * Select option from dropdown
   */
  async selectOption(selector: string, value: string): Promise<void> {
    await this.page.locator(selector).selectOption(value);
  }

  /**
   * Check/uncheck checkbox
   */
  async setCheckbox(selector: string, checked: boolean): Promise<void> {
    const checkbox = this.page.locator(selector);
    if (checked) {
      await checkbox.check();
    } else {
      await checkbox.uncheck();
    }
  }

  /**
   * Get attribute value
   */
  async getAttribute(selector: string, attribute: string): Promise<string | null> {
    return await this.page.locator(selector).getAttribute(attribute);
  }

  /**
   * Handle alert dialog
   */
  async handleAlert(accept: boolean = true): Promise<string> {
    return new Promise((resolve) => {
      this.page.once('dialog', async (dialog) => {
        const message = dialog.message();
        if (accept) {
          await dialog.accept();
        } else {
          await dialog.dismiss();
        }
        resolve(message);
      });
    });
  }

  /**
   * Wait for network idle
   */
  async waitForNetworkIdle(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Reload page
   */
  async reload(): Promise<void> {
    await this.page.reload();
    await this.waitForPageLoad();
  }
}
