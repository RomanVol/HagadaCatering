/**
 * Test Helpers
 * 
 * @description Utility functions for tests
 */
import { Page, Locator, expect } from '@playwright/test';

/**
 * Wait for network idle state
 */
export const waitForNetworkIdle = async (page: Page, timeout: number = 5000): Promise<void> => {
  await page.waitForLoadState('networkidle', { timeout });
};

/**
 * Wait for navigation to complete
 */
export const waitForNavigation = async (page: Page, url: string): Promise<void> => {
  await page.waitForURL(url, { waitUntil: 'networkidle' });
};

/**
 * Take screenshot with timestamp
 */
export const takeScreenshot = async (page: Page, name: string): Promise<void> => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ path: `automation/reports/screenshots/${name}-${timestamp}.png` });
};

/**
 * Wait for element to be visible and return it
 */
export const waitForElement = async (page: Page, selector: string, timeout: number = 10000): Promise<Locator> => {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible', timeout });
  return element;
};

/**
 * Wait for element to be hidden
 */
export const waitForElementToHide = async (page: Page, selector: string, timeout: number = 10000): Promise<void> => {
  const element = page.locator(selector);
  await element.waitFor({ state: 'hidden', timeout });
};

/**
 * Scroll element into view
 */
export const scrollIntoView = async (element: Locator): Promise<void> => {
  await element.scrollIntoViewIfNeeded();
};

/**
 * Clear input field and type new value
 */
export const clearAndType = async (element: Locator, value: string): Promise<void> => {
  await element.clear();
  await element.fill(value);
};

/**
 * Click element with retry
 */
export const clickWithRetry = async (element: Locator, retries: number = 3): Promise<void> => {
  for (let i = 0; i < retries; i++) {
    try {
      await element.click();
      return;
    } catch (error) {
      if (i === retries - 1) throw error;
      await element.page().waitForTimeout(500);
    }
  }
};

/**
 * Wait for loading spinner to disappear
 */
export const waitForLoading = async (page: Page, timeout: number = 30000): Promise<void> => {
  const spinner = page.locator('.animate-spin');
  try {
    await spinner.waitFor({ state: 'visible', timeout: 2000 });
    await spinner.waitFor({ state: 'hidden', timeout });
  } catch {
    // Spinner might not appear if loading is fast
  }
};

/**
 * Format date for input (YYYY-MM-DD)
 */
export const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Format time for input (HH:MM)
 */
export const formatTimeForInput = (hours: number, minutes: number): string => {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

/**
 * Generate random phone number
 */
export const generateRandomPhone = (): string => {
  const suffixes = ['050', '052', '053', '054', '055', '058'];
  const prefix = suffixes[Math.floor(Math.random() * suffixes.length)];
  const number = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  return `${prefix}${number}`;
};

/**
 * Generate unique test ID
 */
export const generateTestId = (): string => {
  return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Assert element text contains expected value (Hebrew-safe)
 */
export const assertTextContains = async (element: Locator, expectedText: string): Promise<void> => {
  const actualText = await element.textContent();
  expect(actualText).toContain(expectedText);
};

/**
 * Assert input value
 */
export const assertInputValue = async (element: Locator, expectedValue: string): Promise<void> => {
  await expect(element).toHaveValue(expectedValue);
};

/**
 * Assert element count
 */
export const assertElementCount = async (page: Page, selector: string, count: number): Promise<void> => {
  await expect(page.locator(selector)).toHaveCount(count);
};

/**
 * Get all text content from elements matching selector
 */
export const getAllTextContent = async (page: Page, selector: string): Promise<string[]> => {
  return await page.locator(selector).allTextContents();
};

/**
 * Check if element exists in DOM
 */
export const elementExists = async (page: Page, selector: string): Promise<boolean> => {
  return await page.locator(selector).count() > 0;
};

/**
 * Wait for text to appear on page
 */
export const waitForText = async (page: Page, text: string, timeout: number = 10000): Promise<void> => {
  await page.waitForSelector(`text=${text}`, { state: 'visible', timeout });
};

/**
 * Measure performance - time to load
 */
export const measureLoadTime = async (page: Page, action: () => Promise<void>): Promise<number> => {
  const startTime = Date.now();
  await action();
  await waitForNetworkIdle(page);
  return Date.now() - startTime;
};

/**
 * Retry action with backoff
 */
export const retryWithBackoff = async <T>(
  action: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> => {
  let lastError: Error | undefined;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await action();
    } catch (error) {
      lastError = error as Error;
      await new Promise(resolve => setTimeout(resolve, initialDelay * Math.pow(2, i)));
    }
  }
  throw lastError;
};

/**
 * Parse Hebrew currency string to number
 */
export const parseCurrencyAmount = (text: string): number => {
  const match = text.match(/₪?([\d,]+)/);
  if (match) {
    return parseInt(match[1].replace(/,/g, ''), 10);
  }
  return 0;
};

/**
 * Parse quantity string to number
 */
export const parseQuantity = (text: string): number => {
  const match = text.match(/×?\s*(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return 0;
};
