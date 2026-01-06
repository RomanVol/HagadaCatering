/**
 * Edit Order Page Locators
 * 
 * @description All locators for the edit order page (/edit-order/[id])
 * Inherits most locators from order.locators.ts since the UI is similar
 */
export const EditOrderLocators = {
  // Header
  header: {
    container: 'header',
    backButton: 'button:has(.lucide-arrow-right)',
    title: 'h1:has-text("עריכת הזמנה")',
    orderNumber: 'h1:has-text("#")',
  },
  
  // Loading state
  loadingSpinner: '.animate-spin',
  loadingText: ':text("טוען הזמנה...")',
  
  // Error state
  errorContainer: '.text-red-500',
  errorText: ':text("שגיאה")',
  backToSummaryLink: 'a:has-text("חזרה לסיכום"), button:has-text("חזרה לסיכום")',
  
  // Save button (in footer)
  saveButton: 'button:has-text("שמור"), button:has(.lucide-save)',
  
  // Customer Details - same structure as order page
  customerDetails: {
    section: '[data-value="customer-details"]',
    trigger: 'button:has-text("פרטי לקוח")',
    
    // Pre-filled inputs
    customerName: 'input:near(:text("שם לקוח"))',
    phone: 'input[type="tel"]:near(:text("טלפון")):first-of-type',
    phoneAlt: 'input[placeholder*="טלפון נוסף"]',
    customerTime: 'input[type="time"]:near(:text("זמן ללקוח"))',
    kitchenTime: 'input[type="time"]:near(:text("זמן למטבח"))',
    orderDate: 'input[type="date"]',
    address: 'input:near(:text("כתובת"))',
    notes: 'input:near(:text("הערות"))',
    
    // Pricing section
    totalPortions: 'input:near(:text("סה״כ מנות"))',
    pricePerPortion: 'input:near(:text("מחיר בסיס למנה"))',
    deliveryFee: 'input:near(:text("הובלה"))',
    totalPayment: ':text("סה״כ לתשלום") ~ div .font-bold',
  },
  
  // Category sections - same as order page
  categories: {
    salads: {
      trigger: 'button:has-text("סלטים")',
      count: 'span:has-text("/"):near(:text("סלטים"))',
    },
    middleCourses: {
      trigger: 'button:has-text("מנות ביניים")',
      count: 'span:has-text("/"):near(:text("מנות ביניים"))',
    },
    sides: {
      trigger: 'button:has-text("תוספות"):not(:has-text("אקס"))',
      count: 'span:has-text("/"):near(:text("תוספות"))',
    },
    mains: {
      trigger: 'button:has-text("עיקריות")',
      count: 'span:has-text("/"):near(:text("עיקריות"))',
    },
    extras: {
      trigger: 'button:has-text("אקסטרות")',
      count: 'span:near(:text("אקסטרות"))',
    },
    bakery: {
      trigger: 'button:has-text("לחם, מאפים")',
      count: 'span:near(:text("לחם, מאפים"))',
    },
  },
  
  // Food items (selected items should show checkmarks/quantities)
  foodItem: {
    card: '[class*="rounded-xl"][class*="border"]',
    selectedCard: '[class*="border-blue-500"]',
    getByName: (name: string) => `[class*="rounded-xl"]:has-text("${name}")`,
  },
  
  // Extra items panel (displays items added as extras)
  extraItems: {
    panel: '.bg-red-50',
    item: '.bg-white.rounded-lg.border-red-200',
    name: '.font-bold.text-red-700',
    quantity: '.text-red-600',
    priceInput: 'input[type="number"]',
    deleteButton: 'button:has-text("✕")',
    totalPrice: ':text("סה״כ אקסטרות")',
  },
  
  // Popup for editing item
  popup: {
    backdrop: '.fixed.inset-0.bg-black\\/50',
    container: '.fixed.bottom-0',
    header: 'h3',
    closeButton: 'button:has-text("✕")',
    
    // Quantity controls
    quantityInput: 'input[type="number"]',
    plusButton: 'button:has-text("+")',
    minusButton: 'button:has-text("−")',
    
    // Confirm
    confirmButton: 'button:has-text("אישור")',
    
    // Add as extra
    addAsExtraButton: 'button:has-text("הוסף כאקסטרה")',
    extraPriceInput: 'input:near(:text("מחיר"))',
  },
  
  // Success/Error messages
  successMessage: 'text=עודכנה בהצלחה',
  errorMessage: 'text=שגיאה',
} as const;

/**
 * Get edit order URL for a specific order ID
 */
export const getEditOrderUrl = (orderId: string) => `/edit-order/${orderId}`;
