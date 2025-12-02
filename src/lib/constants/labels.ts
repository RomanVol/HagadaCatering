export const LABELS = {
  // App
  app: {
    name: 'מערכת ניהול הזמנות',
    title: 'ניהול הזמנות',
  },

  // Categories
  categories: {
    salads: 'סלטים',
    middle_courses: 'מנות ביניים',
    sides: 'תוספות',
    mains: 'עיקריות',
    extras: 'אקסטרות',
  },

  // Order form fields
  orderForm: {
    newOrder: 'הזמנה חדשה',
    editOrder: 'עריכת הזמנה',
    customerName: 'שם',
    phone: 'טלפון',
    date: 'תאריך',
    time: 'שעה',
    address: 'כתובת',
    notes: 'הערות',
    customerDetails: 'פרטי לקוח',
    orderNumber: 'הזמנה',
  },

  // Selection limits
  selection: {
    toSelect: 'לבחירה',
    unlimited: 'ללא הגבלה',
  },

  // Actions
  actions: {
    save: 'שמור',
    cancel: 'ביטול',
    print: 'הדפס',
    delete: 'מחק',
    edit: 'ערוך',
    add: 'הוסף',
    back: 'חזרה',
    applyToAll: 'החל על כל הסלטים המסומנים',
    close: 'סגור',
  },

  // Status
  status: {
    draft: 'טיוטה',
    active: 'פעיל',
    completed: 'הושלם',
  },

  // Connection
  connection: {
    online: 'מחובר',
    offline: 'לא מחובר',
    syncing: 'מסנכרן...',
    pendingSync: 'ממתינים לסנכרון',
  },

  // Navigation
  nav: {
    home: 'בית',
    orders: 'הזמנות',
    summary: 'סיכום',
    admin: 'ניהול',
  },

  // Validation
  validation: {
    required: 'שדה חובה',
    invalidPhone: 'מספר טלפון לא תקין',
    selectAtLeastOne: 'יש לבחור לפחות פריט אחד',
    maxSelection: 'הגעת למקסימום הבחירות',
  },

  // Empty states
  empty: {
    noOrders: 'אין הזמנות',
    noItems: 'אין פריטים',
  },
} as const;
