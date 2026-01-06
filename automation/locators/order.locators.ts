/**
 * Order Page Locators
 * 
 * @description All locators for the order creation page (/order)
 */
export const OrderLocators = {
  // Header
  header: 'header',
  pageTitle: 'h1',
  summaryLink: 'a[href="/summary"]',
  adminLink: 'a[href="/admin"]',
  logoutButton: 'button:has(.lucide-log-out)',
  
  // Customer Details Section
  customerDetails: {
    section: 'div[data-state][data-orientation="vertical"]:has(button:has-text("פרטי לקוח"))',
    trigger: 'button:has-text("פרטי לקוח")',
    content: '[data-state="open"]',

    // Input fields - using placeholder text that appears in the screenshot
    customerName: 'input[placeholder*="שם הלקוח"]',
    nameInput: 'input[placeholder*="שם הלקוח"]',
    phone: 'input[placeholder*="050"]',
    phoneInput: 'input[placeholder*="050"]',
    phoneAlt: 'input[placeholder*="טלפון נוסף"]',
    phone2Input: 'input[placeholder*="טלפון נוסף"]',
    customerTime: 'label:has-text("זמן ללקוח") ~ input[type="time"], :text("זמן ללקוח") >> .. >> input[type="time"]',
    kitchenTime: 'label:has-text("זמן למטבח") ~ input[type="time"], :text("זמן למטבח") >> .. >> input[type="time"]',
    orderDate: 'input[type="date"]',
    address: 'input[placeholder*="כתובת"]',
    notes: 'input[placeholder*="הערות"], textarea[placeholder*="הערות"]',
    
    // Pricing
    totalPortions: 'input:near(:text("סה״כ מנות"))',
    pricePerPortion: 'input:near(:text("מחיר בסיס למנה"))',
    deliveryFee: 'input:near(:text("הובלה"))',
    totalPayment: ':text("סה״כ לתשלום") ~ div',
  },
  
  // Category Sections
  categories: {
    // Salads
    salads: {
      section: '[data-value="salads"], [value="salads"]',
      trigger: 'button:has-text("סלטים")',
      grid: '.grid.grid-cols-3',
      selectionCount: 'span:has-text("/"):near(:text("סלטים"))',
    },
    
    // Middle Courses
    middleCourses: {
      section: '[data-value="middle_courses"]',
      trigger: 'button:has-text("מנות ביניים")',
      grid: '.grid.grid-cols-3',
      selectionCount: 'span:has-text("/"):near(:text("מנות ביניים"))',
    },
    
    // Sides
    sides: {
      section: '[data-value="sides"]',
      trigger: 'button:has-text("תוספות")',
      grid: '.grid.grid-cols-3',
      selectionCount: 'span:has-text("/"):near(:text("תוספות"))',
    },
    
    // Mains
    mains: {
      section: '[data-value="mains"]',
      trigger: 'button:has-text("עיקריות")',
      grid: '.grid.grid-cols-3',
      selectionCount: 'span:has-text("/"):near(:text("עיקריות"))',
    },
    
    // Extras
    extras: {
      section: '[data-value="extras"]',
      trigger: 'button:has-text("אקסטרות")',
      grid: '.grid.grid-cols-3',
      selectionCount: 'span:near(:text("אקסטרות"))',
      extraItemsPanel: '.bg-red-50',
    },
    
    // Bakery
    bakery: {
      section: '[data-value="bakery"]',
      trigger: 'button:has-text("לחם, מאפים")',
      grid: '.grid.grid-cols-3',
      selectionCount: 'span:near(:text("לחם, מאפים"))',
    },
  },
  
  // Food Item Cards
  foodItem: {
    card: '.rounded-xl.border, [class*="rounded-xl"][class*="border"]',
    selectedCard: '[class*="border-blue-500"], [class*="bg-blue-50"]',
    name: '.font-semibold, .font-bold',
    quantity: '.text-sm.font-bold',
    checkbox: 'input[type="checkbox"]',
    
    // Get card by name
    getByName: (name: string) => `[class*="rounded-xl"]:has-text("${name}")`,
  },
  
  // Popup/Modal for item details
  popup: {
    backdrop: '.fixed.inset-0.bg-black\\/50',
    container: '.fixed.bottom-0, [class*="animate-slide-up"]',
    header: 'h3',
    closeButton: 'button:has-text("✕"), button:has-text("×")',
    
    // Quantity controls
    quantityInput: 'input[type="number"]',
    plusButton: 'button:has-text("+")',
    minusButton: 'button:has-text("−"), button:has-text("-")',
    
    // Liter selectors
    literSize: {
      container: '.grid.grid-cols-2',
      item: '[class*="rounded-xl"]:has-text("L")',
      activeItem: '[class*="border-blue-500"]',
    },
    
    // Size selectors (ג/ק)
    sizeSelector: {
      bigLabel: ':text("ג׳"), :text("גדול")',
      smallLabel: ':text("ק׳"), :text("קטן")',
      bigInput: 'input:near(:text("ג׳"))',
      smallInput: 'input:near(:text("ק׳"))',
    },
    
    // Notes
    noteTextarea: 'textarea[placeholder*="הערה"]',
    
    // Preparation options
    preparationDropdown: 'select, [role="combobox"]',
    preparationOption: (name: string) => `option:has-text("${name}"), [role="option"]:has-text("${name}")`,
    
    // Price input (for extras)
    priceInput: 'input:near(:text("מחיר"))',
    
    // Confirm button
    confirmButton: 'button:has-text("אישור")',
  },
  
  // Extra items panel
  extraItems: {
    panel: '.bg-red-50.border-red-200',
    item: '.bg-white.rounded-lg.border-red-200',
    name: '.font-bold.text-red-700',
    priceInput: 'input[type="number"]:near(:text("₪"))',
    deleteButton: 'button:has-text("✕")',
    totalPrice: ':text("סה״כ אקסטרות"):near(.font-bold)',
  },
  
  // Actions
  actions: {
    saveButton: 'button:has-text("שמור"), button:has(.lucide-save)',
    printButton: 'button:has-text("הדפס"), button:has(.lucide-printer)',
    resetButton: 'button:has(.lucide-rotate-ccw)',
    loadingSpinner: '.animate-spin',
  },
} as const;

/**
 * Helper function to get food item card by name
 */
export const getFoodItemCard = (name: string) => 
  `[class*="rounded-xl"][class*="border"]:has-text("${name}")`;

/**
 * Category name mapping from English to Hebrew
 */
const categoryNameMap: Record<string, string> = {
  'salads': 'סלטים',
  'middle_courses': 'מנות ביניים',
  'sides': 'תוספות',
  'mains': 'עיקריות',
  'extras': 'אקסטרות',
  'bakery': 'לחם, מאפים וקינוחים',
  // Support Hebrew names too
  'סלטים': 'סלטים',
  'מנות ביניים': 'מנות ביניים',
  'תוספות': 'תוספות',
  'עיקריות': 'עיקריות',
  'אקסטרות': 'אקסטרות',
  'לחם, מאפים': 'לחם, מאפים',
};

/**
 * Helper function to get category accordion by name
 */
export const getCategoryAccordion = (categoryName: string) => {
  const hebrewName = categoryNameMap[categoryName] || categoryName;
  return `button:has-text("${hebrewName}")`;
};
