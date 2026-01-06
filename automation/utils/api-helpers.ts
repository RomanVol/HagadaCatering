/**
 * API Helpers
 * 
 * @description Utility functions for API operations and direct database access
 * Used for test setup/teardown and data verification
 */
import { Page, APIRequestContext } from '@playwright/test';

/**
 * Supabase API configuration
 * Note: These should be set via environment variables in actual usage
 */
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

/**
 * Create API headers for Supabase requests
 */
export const getSupabaseHeaders = (accessToken?: string) => ({
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
});

/**
 * Create order via API (for test setup)
 */
export const createOrderViaApi = async (
  request: APIRequestContext,
  orderData: {
    customer: { name: string; phone: string; address?: string };
    order_date: string;
    items?: Array<{ food_item_id: string; quantity: number }>;
  },
  accessToken?: string
): Promise<{ id: string; order_number: number }> => {
  // This would be implemented based on your actual API structure
  // For now, return a placeholder
  console.log('API create order:', orderData);
  return { id: 'placeholder-id', order_number: 0 };
};

/**
 * Get order by ID via API
 */
export const getOrderViaApi = async (
  request: APIRequestContext,
  orderId: string,
  accessToken?: string
): Promise<unknown> => {
  const response = await request.get(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`, {
    headers: getSupabaseHeaders(accessToken),
  });
  const data = await response.json();
  return data[0];
};

/**
 * Delete order via API (for test cleanup)
 */
export const deleteOrderViaApi = async (
  request: APIRequestContext,
  orderId: string,
  accessToken?: string
): Promise<void> => {
  await request.delete(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`, {
    headers: getSupabaseHeaders(accessToken),
  });
};

/**
 * Get all orders within date range
 */
export const getOrdersInDateRange = async (
  request: APIRequestContext,
  fromDate: string,
  toDate: string,
  accessToken?: string
): Promise<unknown[]> => {
  const response = await request.get(
    `${SUPABASE_URL}/rest/v1/orders?order_date=gte.${fromDate}&order_date=lte.${toDate}`,
    { headers: getSupabaseHeaders(accessToken) }
  );
  return await response.json();
};

/**
 * Get customer by phone number
 */
export const getCustomerByPhone = async (
  request: APIRequestContext,
  phone: string,
  accessToken?: string
): Promise<unknown> => {
  const response = await request.get(
    `${SUPABASE_URL}/rest/v1/customers?phone=eq.${phone}`,
    { headers: getSupabaseHeaders(accessToken) }
  );
  const data = await response.json();
  return data[0];
};

/**
 * Get food items by category
 */
export const getFoodItemsByCategory = async (
  request: APIRequestContext,
  categoryNameEn: string,
  accessToken?: string
): Promise<unknown[]> => {
  // First get category ID
  const categoryResponse = await request.get(
    `${SUPABASE_URL}/rest/v1/categories?name_en=eq.${categoryNameEn}`,
    { headers: getSupabaseHeaders(accessToken) }
  );
  const categories = await categoryResponse.json();
  if (!categories[0]) return [];

  // Then get food items
  const itemsResponse = await request.get(
    `${SUPABASE_URL}/rest/v1/food_items?category_id=eq.${categories[0].id}`,
    { headers: getSupabaseHeaders(accessToken) }
  );
  return await itemsResponse.json();
};

/**
 * Verify order exists in database
 */
export const verifyOrderExists = async (
  request: APIRequestContext,
  orderId: string,
  accessToken?: string
): Promise<boolean> => {
  const order = await getOrderViaApi(request, orderId, accessToken);
  return order !== undefined;
};

/**
 * Get order items for an order
 */
export const getOrderItems = async (
  request: APIRequestContext,
  orderId: string,
  accessToken?: string
): Promise<unknown[]> => {
  const response = await request.get(
    `${SUPABASE_URL}/rest/v1/order_items?order_id=eq.${orderId}`,
    { headers: getSupabaseHeaders(accessToken) }
  );
  return await response.json();
};

/**
 * Clean up test orders (by customer name pattern)
 */
export const cleanupTestOrders = async (
  request: APIRequestContext,
  namePattern: string = 'בדיקת מערכת',
  accessToken?: string
): Promise<void> => {
  // Get customers matching pattern
  const customersResponse = await request.get(
    `${SUPABASE_URL}/rest/v1/customers?name=like.*${namePattern}*`,
    { headers: getSupabaseHeaders(accessToken) }
  );
  const customers = await customersResponse.json();
  
  // Delete related orders
  for (const customer of customers) {
    await request.delete(
      `${SUPABASE_URL}/rest/v1/orders?customer_id=eq.${customer.id}`,
      { headers: getSupabaseHeaders(accessToken) }
    );
  }
};

/**
 * Seed test data
 */
export const seedTestData = async (
  request: APIRequestContext,
  accessToken?: string
): Promise<{ customerId: string; orderId: string }> => {
  // Create test customer
  const customerResponse = await request.post(
    `${SUPABASE_URL}/rest/v1/customers`,
    {
      headers: getSupabaseHeaders(accessToken),
      data: {
        name: 'לקוח בדיקות אוטומטיות',
        phone: '0501111111',
        address: 'כתובת בדיקה',
      },
    }
  );
  const customers = await customerResponse.json();
  const customerId = customers[0]?.id;

  // Return placeholder - actual implementation would create full order
  return { customerId, orderId: 'placeholder' };
};

/**
 * Get session storage data from page
 */
export const getSessionStorageItem = async (page: Page, key: string): Promise<string | null> => {
  return await page.evaluate((k) => sessionStorage.getItem(k), key);
};

/**
 * Set session storage data on page
 */
export const setSessionStorageItem = async (page: Page, key: string, value: string): Promise<void> => {
  await page.evaluate(([k, v]) => sessionStorage.setItem(k, v), [key, value]);
};

/**
 * Get local storage data from page
 */
export const getLocalStorageItem = async (page: Page, key: string): Promise<string | null> => {
  return await page.evaluate((k) => localStorage.getItem(k), key);
};

/**
 * Clear browser storage
 */
export const clearBrowserStorage = async (page: Page): Promise<void> => {
  await page.evaluate(() => {
    sessionStorage.clear();
    localStorage.clear();
  });
};
