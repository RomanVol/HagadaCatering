/**
 * Summary Page Locators
 * 
 * @description All locators for the summary page (/summary)
 */
export const SummaryLocators = {
  // Header
  header: {
    container: 'header',
    title: 'h1:has-text("סיכום הזמנות")',
    backButton: 'button:has(.lucide-arrow-right)',
    printButton: 'button:has(.lucide-printer)',
  },
  
  // Date Filter Section
  dateFilter: {
    container: '.bg-white.rounded-xl:has(input[type="date"])',
    
    // Quick filter buttons
    todayButton: 'button:has-text("היום")',
    thisWeekButton: 'button:has-text("השבוע"):not(:has-text("הבא"))',
    nextWeekButton: 'button:has-text("השבוע הבא")',
    
    // Date inputs
    fromDate: 'input[type="date"]:near(:text("מתאריך"))',
    toDate: 'input[type="date"]:near(:text("עד תאריך"))',
    
    // Day name display
    dayName: '.text-blue-600',
  },
  
  // Customer Filter Section
  customerFilter: {
    nameInput: 'input[placeholder*="שם"]',
    phoneInput: 'input[type="tel"][placeholder*="טלפון"]',
  },
  
  // Filter Button
  filterButton: 'button:has-text("סנן"), button:has(.lucide-filter)',
  loadingSpinner: '.animate-spin',
  
  // View Toggle
  viewToggle: {
    ordersListButton: 'button:has-text("רשימת הזמנות")',
    summaryButton: 'button:has-text("סיכום כמויות")',
  },
  
  // Orders List View
  ordersList: {
    container: '.space-y-3',
    noOrdersMessage: ':text("לא נמצאו הזמנות")',
    
    // Order Card
    orderCard: '.bg-white.rounded-xl.border',
    orderNumber: ':text("#"):has-text(/\\d+/)',
    statusBadge: {
      active: '.bg-blue-100.text-blue-700',
      completed: '.bg-green-100.text-green-700',
      draft: '.bg-yellow-100.text-yellow-700',
      cancelled: '.bg-red-100.text-red-700',
    },
    
    // Customer info in card
    customerName: '.font-medium:near(.lucide-user)',
    customerPhone: 'span[dir="ltr"]:near(.lucide-phone)',
    orderDate: ':near(.lucide-calendar)',
    customerTime: ':text("ללקוח:"):near(.lucide-clock)',
    kitchenTime: ':text("למטבח:"):near(.lucide-clock)',
    address: ':near(.lucide-map-pin)',
    
    // Price info
    priceDisplay: '.text-green-600:has-text("₪")',
    portionsInfo: ':text("מנות"):near(.lucide-dollar-sign)',
    deliveryFee: ':text("משלוח:"):near(.lucide-map-pin)',
    
    // Notes
    notes: '.text-amber-600:near(.lucide-file-text)',
    
    // Expand/collapse
    expandButton: '.lucide-chevron-down, .lucide-chevron-up',
  },
  
  // Expanded Order Details
  expandedOrder: {
    container: '.border-t.border-gray-200.bg-gray-50',
    notesSection: '.bg-yellow-50',
    addressSection: ':text("כתובת:")',
    
    // Category sections
    categorySection: '.mb-4:has(h4)',
    categoryHeader: 'h4.font-semibold',
    itemRow: '.flex.items-center.justify-between',
    itemName: '.text-gray-700',
    itemQuantity: '.text-gray-900.font-medium',
    
    // Extra items section
    extraItemsSection: 'h4:has-text("פריטי אקסטרה")',
    extraItem: '.text-red-700',
    extraItemPrice: '.text-red-600.font-bold',
    
    // Action buttons
    printButton: 'button:has-text("הדפס"):has(.lucide-printer)',
    editButton: 'button:has-text("ערוך הזמנה"):has(.lucide-pencil)',
  },
  
  // Quantity Summary View
  quantitySummary: {
    container: '.space-y-4',
    
    // Print header (visible when printing)
    printDateRange: '.print-date-range',
    
    // Filter options
    filterOptions: {
      showAllButton: 'button:has-text("הצג הכל")',
      selectCategoriesButton: 'button:has-text("בחר קטגוריות")',
      selectItemsButton: 'button:has-text("בחר פריטים")',
    },
    
    // Category selection
    categorySelection: 'button.rounded-full',
    
    // Summary card
    summaryCard: '.bg-white.rounded-xl.border:has(.bg-gray-50)',
    categoryHeader: '.bg-gray-50 h3.font-bold',
    
    // Item display
    itemRow: '.p-4:has(.font-medium)',
    itemName: '.font-medium.text-gray-800',
    addOnItem: '.text-purple-700',
    variationItem: '.text-blue-700',
    
    // Quantity badges
    quantityBadge: '.bg-blue-100.text-blue-800',
    literBadge: '.bg-blue-100:has-text("L")',
    sizeBadge: '.bg-green-100.text-green-800',
    totalBadge: '.bg-amber-100.text-amber-800',
  },
  
  // Get order card by order number
  getOrderByNumber: (orderNumber: number) => 
    `.bg-white.rounded-xl:has-text("#${orderNumber}")`,
  
  // Get order card by customer name
  getOrderByCustomerName: (name: string) =>
    `.bg-white.rounded-xl:has-text("${name}")`,
} as const;

/**
 * Summary Page Status Labels (Hebrew)
 */
export const StatusLabels = {
  active: 'פעיל',
  completed: 'הושלם',
  draft: 'טיוטה',
  cancelled: 'בוטל',
} as const;
