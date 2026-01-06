/**
 * Print Preview Page Locators
 * 
 * @description All locators for the print preview page (/print-preview)
 */
export const PrintPreviewLocators = {
  // Page container
  container: '[class*="print-order"], main, .min-h-screen',
  
  // Loading state
  loadingSpinner: '.animate-spin',
  loadingText: ':text("טוען נתונים...")',
  
  // Error states
  errorContainer: '.text-red-500',
  noDataMessage: ':text("אין נתוני הזמנה להדפסה")',
  backToOrderLink: 'button:has-text("חזרה לדף ההזמנה"), a:has-text("חזרה")',
  
  // Order Header Section
  orderHeader: {
    container: '.order-header, [class*="header"]',
    orderNumber: ':text("#")',
    orderDate: ':text(/\\d{2}[./]\\d{2}[./]\\d{4}/)',
  },
  
  // Customer Information
  customerInfo: {
    container: '[class*="customer"]',
    name: '.font-bold:near(:text("לקוח")), :text("לקוח"):near(.font-bold)',
    phone: '[dir="ltr"]:has-text(/05\\d/)',
    phone2: '[dir="ltr"]:has-text(/05\\d/):nth-of-type(2)',
    address: ':near(:text("כתובת")), :has-text("רחוב")',
    customerTime: ':text("זמן ללקוח"), :text(/ללקוח:?\\s*\\d{2}:\\d{2}/)',
    kitchenTime: ':text("זמן למטבח"), :text(/למטבח:?\\s*\\d{2}:\\d{2}/)',
  },
  
  // Category Sections
  categories: {
    // Salads (סלטים)
    salads: {
      section: '[class*="salads"], :text("סלטים"):near(section)',
      header: 'h2:has-text("סלטים"), h3:has-text("סלטים")',
      items: '[class*="salad-item"], tr:has-text(/L|ליטר/)',
    },
    
    // Middle Courses (מנות ביניים)
    middleCourses: {
      section: ':text("מנות ביניים"):near(section)',
      header: 'h2:has-text("מנות ביניים"), h3:has-text("מנות ביניים")',
      items: 'tr, .flex:has-text("×")',
    },
    
    // Sides (תוספות)
    sides: {
      section: ':text("תוספות"):near(section)',
      header: 'h2:has-text("תוספות"), h3:has-text("תוספות")',
      items: 'tr:has-text(/[גק]׳/), .flex:has-text(/[גק]/)',
    },
    
    // Mains (עיקריות)
    mains: {
      section: ':text("עיקריות"):near(section)',
      header: 'h2:has-text("עיקריות"), h3:has-text("עיקריות")',
      items: 'tr, .flex:has-text("×")',
    },
    
    // Extras (אקסטרות)
    extras: {
      section: ':text("אקסטרות"):near(section)',
      header: 'h2:has-text("אקסטרות"), h3:has-text("אקסטרות")',
      items: 'tr, .flex',
      priceDisplay: ':text("₪")',
    },
    
    // Bakery (לחם, מאפים וקינוחים)
    bakery: {
      section: ':text("לחם"):near(section), :text("מאפים"):near(section)',
      header: 'h2:has-text("לחם"), h3:has-text("מאפים")',
      items: 'tr, .flex:has-text("×")',
    },
  },
  
  // Item Display
  itemRow: {
    container: 'tr, .flex.items-center',
    name: 'td:first-child, .flex > span:first-child',
    quantity: 'td:last-child, .font-bold',
    
    // Selected item marker
    selectedMarker: '[class*="check"], [class*="selected"], ✓, ✔',
    
    // Liter display
    literQuantity: ':text(/\\d+\\.?\\d*L/), :text(/ליטר/)',
    
    // Size display (ג/ק)
    sizeDisplay: ':text(/[גק]׳?\\s*×?\\s*\\d+/)',
    
    // Note
    note: '.text-gray-500, .text-sm:has-text("הערה")',
    
    // Extra item marker
    extraMarker: '[class*="red"], [class*="extra"]',
    
    // Price (for extras)
    price: ':text(/₪\\d+/)',
  },
  
  // Aggregated Liters Display
  aggregatedLiters: {
    container: '.aggregated-liters, [class*="total"]',
    totalLiters: ':text(/סה״כ.*L/), :text(/Total.*L/)',
  },
  
  // Pricing Section
  pricing: {
    container: '[class*="pricing"], [class*="payment"]',
    portionsCount: ':text("מנות"):near(:text(/\\d+/))',
    pricePerPortion: ':text(/₪\\d+/):near(:text("למנה"))',
    deliveryFee: ':text("משלוח"):near(:text(/₪\\d+/))',
    totalPayment: ':text("סה״כ"):near(:text(/₪\\d+/))',
  },
  
  // Notes Section
  notes: {
    container: '[class*="notes"]',
    content: '.text-amber-600, .bg-yellow-50',
  },
  
  // Print Controls (hidden during print)
  controls: {
    backButton: 'button:has-text("חזרה"), button:has(.lucide-arrow-right)',
    printButton: 'button:has-text("הדפס"), button:has(.lucide-printer)',
  },
  
  // Get item by name
  getItemByName: (name: string) => `tr:has-text("${name}"), .flex:has-text("${name}")`,
  
  // Get category section by name
  getCategoryByName: (name: string) => `section:has(h2:has-text("${name}")), section:has(h3:has-text("${name}"))`,
} as const;

/**
 * Category Names in Hebrew
 */
export const CategoryNames = {
  salads: 'סלטים',
  middleCourses: 'מנות ביניים',
  sides: 'תוספות',
  mains: 'עיקריות',
  extras: 'אקסטרות',
  bakery: 'לחם, מאפים וקינוחים',
} as const;
