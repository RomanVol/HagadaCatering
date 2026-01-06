/**
 * Order Test Data
 * 
 * @description Sample order data and configurations for testing
 */

import { CustomerData, testCustomer, validCustomers } from './customers.data';

/**
 * Order data interface
 */
export interface OrderData {
  customer: CustomerData;
  times: OrderTimeData;
  pricing?: PricingData;
  notes?: string;
}

/**
 * Default test order
 */
export const testOrder: OrderData = {
  customer: testCustomer,
  times: {
    orderDate: new Date().toISOString().split('T')[0],
    kitchenTime: '12:00',
    customerTime: '14:00',
  },
};

/**
 * Order time configurations
 */
export interface OrderTimeData {
  orderDate: string;
  kitchenTime: string;
  customerTime: string;
}

/**
 * Order timing helpers
 */
export const orderTiming = {
  defaultTime: '12:00',
  morningTime: '09:00',
  afternoonTime: '14:00',
  eveningTime: '18:00',
};

/**
 * Order pricing helpers
 */
export const orderPricing = {
  standardPortion: 85,
  largePortion: 100,
  deliveryFee: 100,
};

/**
 * Get today's date in YYYY-MM-DD format
 */
export const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Get tomorrow's date in YYYY-MM-DD format
 */
export const getTomorrowDate = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

/**
 * Get date N days from now
 */
export const getDateFromNow = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

/**
 * Get week start (Sunday) for a given date
 */
export const getWeekStart = (date: Date = new Date()): string => {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d.toISOString().split('T')[0];
};

/**
 * Get week end (Saturday) for a given date
 */
export const getWeekEnd = (date: Date = new Date()): string => {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (6 - day));
  return d.toISOString().split('T')[0];
};

/**
 * Get next week start
 */
export const getNextWeekStart = (): string => {
  const today = new Date();
  const nextWeekStart = new Date(today);
  nextWeekStart.setDate(today.getDate() + (7 - today.getDay()));
  return nextWeekStart.toISOString().split('T')[0];
};

/**
 * Standard order times
 */
export const orderTimes: OrderTimeData = {
  orderDate: getTomorrowDate(),
  kitchenTime: '14:00',
  customerTime: '16:00',
};

/**
 * Pricing configurations
 */
export interface PricingData {
  totalPortions: number;
  pricePerPortion: number;
  deliveryFee: number;
}

export const standardPricing: PricingData = {
  totalPortions: 50,
  pricePerPortion: 85,
  deliveryFee: 100,
};

export const largePricing: PricingData = {
  totalPortions: 100,
  pricePerPortion: 75,
  deliveryFee: 150,
};

/**
 * Calculate expected total payment
 */
export const calculateTotal = (pricing: PricingData, extraItemsTotal: number = 0): number => {
  return (pricing.totalPortions * pricing.pricePerPortion) + pricing.deliveryFee + extraItemsTotal;
};

/**
 * Salad items configuration
 */
export interface SaladItemData {
  name: string;
  liters?: { label: string; quantity: number }[];
  sizeBig?: number;
  sizeSmall?: number;
}

export const saladItems: SaladItemData[] = [
  { name: 'חומוס', liters: [{ label: '1L', quantity: 2 }, { label: '½L', quantity: 3 }] },
  { name: 'טחינה', liters: [{ label: '¼L', quantity: 4 }] },
  { name: 'מטבוחה', liters: [{ label: '1L', quantity: 1 }] },
  { name: 'חציל מטוגן', sizeBig: 2, sizeSmall: 3 },
];

/**
 * Side items configuration
 */
export interface SideItemData {
  name: string;
  sizeBig: number;
  sizeSmall: number;
  variation?: string;
}

export const sideItems: SideItemData[] = [
  { name: 'אורז לבן', sizeBig: 3, sizeSmall: 5 },
  { name: 'אורז צהוב', sizeBig: 2, sizeSmall: 4, variation: 'צהוב' },
  { name: 'פירה', sizeBig: 2, sizeSmall: 0 },
  { name: 'תפו״א אפויים', sizeBig: 3, sizeSmall: 2 },
];

/**
 * Main dish items configuration
 */
export interface MainItemData {
  name: string;
  quantity: number;
  preparation?: string;
}

export const mainItems: MainItemData[] = [
  { name: 'עוף בגריל', quantity: 10 },
  { name: 'שניצל מטוגן', quantity: 15 },
  { name: 'כרעיים אפוי', quantity: 20, preparation: 'מתובל' },
  { name: 'בשר ברוטב', quantity: 8 },
];

/**
 * Middle course items configuration
 */
export interface MiddleCourseData {
  name: string;
  quantity: number;
  preparation?: string;
  note?: string;
}

export const middleCourseItems: MiddleCourseData[] = [
  { name: 'כרעיים', quantity: 15, preparation: 'מתובל' },
  { name: 'פרגיות', quantity: 10, note: 'ללא שום' },
];

/**
 * Extra items configuration
 */
export interface ExtraItemData {
  sourceName: string;
  sourceCategory: 'mains' | 'sides' | 'middle_courses';
  sizeBig?: number;
  sizeSmall?: number;
  quantity?: number;
  price: number;
}

export const extraItems: ExtraItemData[] = [
  { sourceName: 'אורז צהוב', sourceCategory: 'sides', sizeBig: 2, sizeSmall: 3, price: 50 },
  { sourceName: 'שניצל מטוגן', sourceCategory: 'mains', quantity: 5, price: 75 },
];

/**
 * Complete order data for E2E tests
 */
export interface CompleteOrderData {
  customer: CustomerData;
  times: OrderTimeData;
  pricing: PricingData;
  notes: string;
  salads: SaladItemData[];
  sides: SideItemData[];
  mains: MainItemData[];
  middleCourses: MiddleCourseData[];
  extras?: ExtraItemData[];
}

export const completeOrderData: CompleteOrderData = {
  customer: testCustomer,
  times: orderTimes,
  pricing: standardPricing,
  notes: 'לקוח VIP - להכין בקפידה. להתקשר לפני המשלוח.',
  salads: saladItems.slice(0, 2),
  sides: sideItems.slice(0, 2),
  mains: mainItems.slice(0, 2),
  middleCourses: middleCourseItems.slice(0, 1),
  extras: extraItems.slice(0, 1),
};

/**
 * Minimal order data for quick tests
 */
export const minimalOrderData: CompleteOrderData = {
  customer: validCustomers[0],
  times: orderTimes,
  pricing: { totalPortions: 10, pricePerPortion: 50, deliveryFee: 0 },
  notes: '',
  salads: [{ name: 'חומוס', liters: [{ label: '1L', quantity: 1 }] }],
  sides: [],
  mains: [{ name: 'שניצל מטוגן', quantity: 5 }],
  middleCourses: [],
};

/**
 * Generate unique order data for test isolation
 */
export const generateUniqueOrder = (): CompleteOrderData => {
  const timestamp = Date.now();
  return {
    customer: {
      name: `לקוח ${timestamp}`,
      phone: `050${String(timestamp).slice(-7)}`,
      address: `רחוב ${timestamp}, תל אביב`,
    },
    times: orderTimes,
    pricing: standardPricing,
    notes: `הזמנת בדיקה ${timestamp}`,
    salads: [{ name: 'חומוס', liters: [{ label: '1L', quantity: 1 }] }],
    sides: [{ name: 'אורז לבן', sizeBig: 1, sizeSmall: 1 }],
    mains: [{ name: 'שניצל מטוגן', quantity: 5 }],
    middleCourses: [],
  };
};
