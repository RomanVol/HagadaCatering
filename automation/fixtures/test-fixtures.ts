/**
 * Test Fixtures
 * 
 * @description Custom Playwright fixtures for the Kitchen Orders automation
 */
import { test as base, expect, Page, BrowserContext } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { OrderPage } from '../pages/order.page';
import { SummaryPage } from '../pages/summary.page';
import { EditOrderPage } from '../pages/edit-order.page';
import { PrintPreviewPage } from '../pages/print-preview.page';

/**
 * Custom fixture types
 */
type CustomFixtures = {
  loginPage: LoginPage;
  orderPage: OrderPage;
  summaryPage: SummaryPage;
  editOrderPage: EditOrderPage;
  printPreviewPage: PrintPreviewPage;
};

/**
 * Extended test object with custom fixtures
 */
export const test = base.extend<CustomFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  orderPage: async ({ page }, use) => {
    const orderPage = new OrderPage(page);
    await use(orderPage);
  },

  summaryPage: async ({ page }, use) => {
    const summaryPage = new SummaryPage(page);
    await use(summaryPage);
  },

  editOrderPage: async ({ page }, use) => {
    const editOrderPage = new EditOrderPage(page);
    await use(editOrderPage);
  },

  printPreviewPage: async ({ page }, use) => {
    const printPreviewPage = new PrintPreviewPage(page);
    await use(printPreviewPage);
  },
});

/**
 * Re-export expect for convenience
 */
export { expect };

/**
 * Test annotations/tags
 */
export const TestTags = {
  SANITY: '@sanity',
  SMOKE: '@smoke',
  REGRESSION: '@regression',
  CRITICAL: '@critical',
  HIGH: '@high',
  MEDIUM: '@medium',
  LOW: '@low',
  PERFORMANCE: '@performance',
  EDGE_CASE: '@edge-case',
} as const;

/**
 * Test categories for organization
 */
export const TestCategories = {
  ORDER_CREATION: 'Order Creation',
  ORDER_SEARCH: 'Order Search',
  ORDER_SUMMARY: 'Order Summary',
  ORDER_EDIT: 'Order Edit',
  PRINT_PREVIEW: 'Print Preview',
  DATA_INTEGRITY: 'Data Integrity',
  EDGE_CASES: 'Edge Cases',
  PERFORMANCE: 'Performance',
  E2E: 'End to End',
} as const;
