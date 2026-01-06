/**
 * Customer Test Data
 * 
 * @description Test data for customer-related scenarios
 */

/**
 * Customer data interface
 */
export interface CustomerData {
  name: string;
  phone: string;
  phone2?: string;
  address?: string;
  time?: string;
  notes?: string;
}

/**
 * Default test customer
 */
export const testCustomer: CustomerData = {
  name: 'לקוח בדיקה',
  phone: '0501234567',
  phone2: '0521234567',
  time: '12:00',
  notes: 'הערות בדיקה',
};

/**
 * Valid customer data samples
 */
export const validCustomers: CustomerData[] = [
  {
    name: 'ישראל ישראלי',
    phone: '0501111111',
    phone2: '0521111111',
    time: '10:00',
    notes: 'איסוף בבוקר',
  },
  {
    name: 'משה כהן',
    phone: '0502222222',
    time: '14:00',
  },
  {
    name: 'דוד לוי',
    phone: '0503333333',
    phone2: '0523333333',
    time: '16:30',
    notes: 'להתקשר לפני',
  },
  {
    name: 'שרה אברהם',
    phone: '0504444444',
    time: '18:00',
  },
  {
    name: 'רחל יעקב',
    phone: '0505555555',
    phone2: '0525555555',
    time: '11:30',
    notes: 'אלרגיה לבוטנים',
  },
];

/**
 * Edge case customers for testing boundary conditions
 */
export const edgeCaseCustomers = {
  longName: {
    name: 'שם ארוך מאוד שאמור לבדוק את התנהגות המערכת עם שמות ארוכים במיוחד',
    phone: '0506666666',
  },
  specialCharacters: {
    name: "בדיקה 'גרשיים' ו-מקפים",
    phone: '0507777777',
  },
  hebrewAndEnglish: {
    name: 'יוסי Cohen',
    phone: '0508888888',
  },
  numbersInName: {
    name: 'לקוח 123 בדיקה',
    phone: '0509999999',
  },
};

/**
 * Invalid customer data for negative tests
 */
export const invalidCustomers = {
  emptyName: {
    name: '',
    phone: '0501234567',
  },
  emptyPhone: {
    name: 'ישראל ישראלי',
    phone: '',
  },
  invalidPhone: {
    name: 'ישראל ישראלי',
    phone: '123',
  },
};

/**
 * Customer search filters
 */
export const customerFilters = {
  byPartialName: 'ישראל',
  byPhone: '0501234567',
  byPartialPhone: '050',
};

/**
 * Generate a unique customer for test isolation
 */
export const generateUniqueCustomer = (): CustomerData => {
  const timestamp = Date.now();
  return {
    name: `לקוח בדיקה ${timestamp}`,
    phone: `050${String(timestamp).slice(-7)}`,
    time: '12:00',
  };
};
