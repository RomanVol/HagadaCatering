/**
 * Food Items Test Data
 * 
 * @description Reference data for food items and categories
 */

/**
 * Food category enum for type safety
 */
export const FoodCategories = {
  SALADS: 'salads',
  MIDDLE_COURSES: 'middle_courses',
  SIDES: 'sides',
  MAINS: 'mains',
  EXTRAS: 'extras',
  BAKERY: 'bakery',
} as const;

export type FoodCategory = typeof FoodCategories[keyof typeof FoodCategories];

/**
 * Category names in Hebrew and English
 */
export const categories = {
  salads: { he: 'סלטים', en: 'salads' },
  middleCourses: { he: 'מנות ביניים', en: 'middle_courses' },
  sides: { he: 'תוספות', en: 'sides' },
  mains: { he: 'עיקריות', en: 'mains' },
  extras: { he: 'אקסטרות', en: 'extras' },
  bakery: { he: 'לחם, מאפים וקינוחים', en: 'bakery' },
} as const;

export const categoryNames = categories;

/**
 * Sample food items by category for tests
 */
export const foodItemSamples = {
  salads: ['מטבוחה', 'חציל מטוגן', 'חומוס', 'טחינה', 'ירקות'],
  middleCourses: ['כרעיים', 'פרגיות', 'שיפודי עוף'],
  sides: ['תפו״א אפויים', 'קוסקוס', 'אורז'],
  mains: ['שניצל מטוגן', 'כרעיים אפוי', 'בשר ברוטב'],
  extras: ['מים', 'שתיה קלה', 'יין'],
  bakery: ['פרנות', 'המוציא', 'מזונות'],
};

/**
 * Salad items with their measurement types
 */
export const saladItemsList = {
  liters: [
    'מטבוחה',
    'חציל מטוגן',
    'חציל במיונז',
    'חציל זעלוק',
    'חציל בלאדי',
    'סלק',
    'גזר מבושל',
    'גזר חי',
    'פלפל חריף',
    'חומוס',
    'טחינה',
    'ערבי',
    'ירקות',
    'חסה',
    'כרוב',
    'חמוצי הבית',
    'זיתים',
    'מלפפון בשמיר',
    'קונסולו',
    'כרוב אדום במיונז',
    'כרוב אדום חמוץ',
    'תירס ופטריות',
    'פול',
    'מיונז',
    'טאבולה',
    'ירוק',
    'לימון צ׳רמלה',
    'ירק פיצוחים',
  ],
  size: [
    'חציל מטוגן', // Can also be by size
  ],
};

/**
 * Liter sizes available
 */
export const literSizes = [
  { label: '1.5L', size: 1.5 },
  { label: '2.5L', size: 2.5 },
  { label: '3L', size: 3 },
  { label: '4.5L', size: 4.5 },
];

/**
 * Side dishes with their variations
 */
export const sideItemsList = [
  { name: 'אורז', hasVariations: true, variations: ['לבן', 'צהוב', 'ירוק', 'אשפלו', 'אדום', 'לבנוני'] },
  { name: 'תפו״א אפויים', hasVariations: false },
  { name: 'זיתים מרוקאים', hasVariations: false },
  { name: 'ארטישוק ופטריות', hasVariations: false },
  { name: 'אפונה וגזר', hasVariations: false },
  { name: 'אפונה וארטישוק', hasVariations: false },
  { name: 'ירקות מוקפצים', hasVariations: false },
  { name: 'שעועית ברוטב', hasVariations: false },
  { name: 'שעועית מוקפצת', hasVariations: false },
  { name: 'קוסקוס', hasVariations: false },
  { name: 'ירקות לקוסקוס', hasVariations: false },
];

/**
 * Main dishes with their properties
 */
export const mainItemsList = [
  { name: 'כרעיים אפוי', hasPortionMultiplier: false },
  { name: 'חצאי כרעיים', hasPortionMultiplier: false },
  { name: 'פרגיות', hasPortionMultiplier: false },
  { name: 'שניצל מטוגן', hasPortionMultiplier: true, portionMultiplier: 3, portionUnit: 'יחידות' },
  { name: 'חצאי שניצל', hasPortionMultiplier: true, portionMultiplier: 6, portionUnit: 'יחידות' },
  { name: 'בשר ברוטב', hasPortionMultiplier: false },
  { name: 'לשון ברוטב', hasPortionMultiplier: false },
  { name: 'אסאדו', hasPortionMultiplier: false },
  { name: 'שיפודי קבב', hasPortionMultiplier: true, portionMultiplier: 2, portionUnit: 'שיפודים' },
  { name: 'שיפודי עוף', hasPortionMultiplier: true, portionMultiplier: 2, portionUnit: 'שיפודים' },
  { name: 'חזה עוף', hasPortionMultiplier: false },
];

/**
 * Middle course items
 */
export const middleCourseItemsList = [
  { name: 'כרעיים', preparations: ['מתובל', 'לא מתובל'] },
  { name: 'פרגיות', preparations: ['מתובל', 'לא מתובל'] },
  { name: 'שיפודי עוף', preparations: [] },
];

/**
 * Preparation options
 */
export const preparationOptions = {
  seasoned: 'מתובל',
  unseasoned: 'לא מתובל',
  fried: 'מטוגן',
  baked: 'אפוי',
};

/**
 * Calculate total liters from liter quantities
 */
export const calculateTotalLiters = (liters: { label: string; quantity: number }[]): number => {
  return liters.reduce((total, item) => {
    const sizeInfo = literSizes.find(ls => ls.label === item.label);
    if (sizeInfo) {
      return total + (sizeInfo.size * item.quantity);
    }
    return total;
  }, 0);
};

/**
 * Format liter display for verification
 */
export const formatLiterDisplay = (label: string, quantity: number): string => {
  return `${label} × ${quantity}`;
};

/**
 * Format size display (ג/ק) for verification
 */
export const formatSizeDisplay = (sizeBig: number, sizeSmall: number): string => {
  const parts: string[] = [];
  if (sizeBig > 0) parts.push(`ג × ${sizeBig}`);
  if (sizeSmall > 0) parts.push(`ק × ${sizeSmall}`);
  return parts.join(', ');
};
