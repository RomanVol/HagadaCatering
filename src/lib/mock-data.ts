// import { Category, FoodItem, LiterSize } from "@/types";

// // Mock categories
// export const mockCategories: Category[] = [
//   {
//     id: "cat-salads",
//     name: "סלטים",
//     name_en: "salads",
//     max_selection: 10,
//     sort_order: 1,
//     created_at: new Date().toISOString(),
//   },
//   {
//     id: "cat-middle",
//     name: "מנות ביניים",
//     name_en: "middle_courses",
//     max_selection: 2,
//     sort_order: 2,
//     created_at: new Date().toISOString(),
//   },
//   {
//     id: "cat-sides",
//     name: "תוספות",
//     name_en: "sides",
//     max_selection: 3,
//     sort_order: 3,
//     created_at: new Date().toISOString(),
//   },
//   {
//     id: "cat-mains",
//     name: "עיקריות",
//     name_en: "mains",
//     max_selection: 3,
//     sort_order: 4,
//     created_at: new Date().toISOString(),
//   },
//   {
//     id: "cat-extras",
//     name: "אקסטרות",
//     name_en: "extras",
//     max_selection: null,
//     sort_order: 5,
//     created_at: new Date().toISOString(),
//   },
// ];

// // Mock liter sizes
// export const mockLiterSizes: LiterSize[] = [
//   { id: "liter-1.5", size: 1.5, label: "1.5L", sort_order: 1, created_at: new Date().toISOString() },
//   { id: "liter-2.5", size: 2.5, label: "2.5L", sort_order: 2, created_at: new Date().toISOString() },
//   { id: "liter-3", size: 3.0, label: "3L", sort_order: 3, created_at: new Date().toISOString() },
//   { id: "liter-4.5", size: 4.5, label: "4.5L", sort_order: 4, created_at: new Date().toISOString() },
// ];

// // Mock food items
// export const mockFoodItems: FoodItem[] = [
//   // Salads (28 items)
//   { id: "salad-1", category_id: "cat-salads", name: "מטבוחה", has_liters: true, measurement_type: "liters", is_active: true, sort_order: 1, created_at: new Date().toISOString() },
//   { id: "salad-2", category_id: "cat-salads", name: "חציל מטוגן", has_liters: true, measurement_type: "liters", is_active: true, sort_order: 2, created_at: new Date().toISOString() },
//   { id: "salad-3", category_id: "cat-salads", name: "חציל במיונז", has_liters: true, measurement_type: "liters", is_active: true, sort_order: 3, created_at: new Date().toISOString() },
//   { id: "salad-4", category_id: "cat-salads", name: "חציל זעלוק", has_liters: true, measurement_type: "liters", is_active: true, sort_order: 4, created_at: new Date().toISOString() },
//   { id: "salad-5", category_id: "cat-salads", name: "חציל בלאדי", has_liters: true, measurement_type: "liters", is_active: true, sort_order: 5, created_at: new Date().toISOString() },
//   { id: "salad-6", category_id: "cat-salads", name: "סלק", has_liters: true, measurement_type: "liters", is_active: true, sort_order: 6, created_at: new Date().toISOString() },
//   { id: "salad-7", category_id: "cat-salads", name: "גזר מבושל", has_liters: true, measurement_type: "liters", is_active: true, sort_order: 7, created_at: new Date().toISOString() },
//   { id: "salad-8", category_id: "cat-salads", name: "גזר חי", has_liters: true, measurement_type: "liters", is_active: true, sort_order: 8, created_at: new Date().toISOString() },
//   { id: "salad-9", category_id: "cat-salads", name: "פלפל חריף", has_liters: true, measurement_type: "liters", is_active: true, sort_order: 9, created_at: new Date().toISOString() },
//   { id: "salad-10", category_id: "cat-salads", name: "חומוס", has_liters: true, measurement_type: "liters", is_active: true, sort_order: 10, created_at: new Date().toISOString() },
//   { id: "salad-11", category_id: "cat-salads", name: "טחינה", has_liters: true, measurement_type: "liters", is_active: true, sort_order: 11, created_at: new Date().toISOString() },
//   { id: "salad-12", category_id: "cat-salads", name: "ערבי", has_liters: true, measurement_type: "liters", is_active: true, sort_order: 12, created_at: new Date().toISOString() },
//   { id: "salad-13", category_id: "cat-salads", name: "ירקות", has_liters: true, measurement_type: "liters", is_active: true, sort_order: 13, created_at: new Date().toISOString() },
//   { id: "salad-14", category_id: "cat-salads", name: "חסה", has_liters: true, measurement_type: "liters", is_active: true, sort_order: 14, created_at: new Date().toISOString() },
//   { id: "salad-15", category_id: "cat-salads", name: "כרוב", has_liters: true, measurement_type: "liters", is_active: true, sort_order: 15, created_at: new Date().toISOString() },
//   { id: "salad-16", category_id: "cat-salads", name: "חמוצי הבית", has_liters: true, measurement_type: "liters", is_active: true, sort_order: 16, created_at: new Date().toISOString() },
//   { id: "salad-17", category_id: "cat-salads", name: "זיתים", has_liters: true, measurement_type: "liters", is_active: true, sort_order: 17, created_at: new Date().toISOString() },
//   { id: "salad-18", category_id: "cat-salads", name: "מלפפון בשמיר", has_liters: true, measurement_type: "liters", is_active: true, sort_order: 18, created_at: new Date().toISOString() },
//   { id: "salad-19", category_id: "cat-salads", name: "קונסולו", has_liters: true, measurement_type: "liters", is_active: true, sort_order: 19, created_at: new Date().toISOString() },
//   { id: "salad-20", category_id: "cat-salads", name: "כרוב אדום במיונז", has_liters: true, measurement_type: "liters", is_active: true, sort_order: 20, created_at: new Date().toISOString() },
//   { id: "salad-21", category_id: "cat-salads", name: "כרוב אדום חמוץ", has_liters: true, measurement_type: "liters", is_active: true, sort_order: 21, created_at: new Date().toISOString() },
//   { id: "salad-22", category_id: "cat-salads", name: "תירס ופטריות", has_liters: true, measurement_type: "liters", is_active: true, sort_order: 22, created_at: new Date().toISOString() },
//   { id: "salad-23", category_id: "cat-salads", name: "פול", has_liters: true, measurement_type: "liters", is_active: true, sort_order: 23, created_at: new Date().toISOString() },
//   { id: "salad-24", category_id: "cat-salads", name: "מיונז", has_liters: true, measurement_type: "liters", is_active: true, sort_order: 24, created_at: new Date().toISOString() },
//   { id: "salad-25", category_id: "cat-salads", name: "טאבולה", has_liters: true, is_active: true, sort_order: 25, created_at: new Date().toISOString() },
//   { id: "salad-26", category_id: "cat-salads", name: "ירוק", has_liters: true, is_active: true, sort_order: 26, created_at: new Date().toISOString() },
//   { id: "salad-27", category_id: "cat-salads", name: "לימון צ'רמלה", has_liters: true, is_active: true, sort_order: 27, created_at: new Date().toISOString() },
//   { id: "salad-28", category_id: "cat-salads", name: "ירק פיצוחים", has_liters: true, is_active: true, sort_order: 28, created_at: new Date().toISOString() },

//   // Middle courses (11 items)
//   { id: "middle-1", category_id: "cat-middle", name: "פילה מושט מזרחי", has_liters: false, is_active: true, sort_order: 1, created_at: new Date().toISOString() },
//   { id: "middle-2", category_id: "cat-middle", name: "פילה מושט מטוגן", has_liters: false, is_active: true, sort_order: 2, created_at: new Date().toISOString() },
//   { id: "middle-3", category_id: "cat-middle", name: "סול מטוגן", has_liters: false, is_active: true, sort_order: 3, created_at: new Date().toISOString() },
//   { id: "middle-4", category_id: "cat-middle", name: "סלומון מזרחי", has_liters: false, is_active: true, sort_order: 4, created_at: new Date().toISOString() },
//   { id: "middle-5", category_id: "cat-middle", name: "סלמון בעשבי תיבול", has_liters: false, is_active: true, sort_order: 5, created_at: new Date().toISOString() },
//   { id: "middle-6", category_id: "cat-middle", name: "גסיכה", has_liters: false, is_active: true, sort_order: 6, created_at: new Date().toISOString() },
//   { id: "middle-7", category_id: "cat-middle", name: "בורקס רוטב פטריות", has_liters: false, is_active: true, sort_order: 7, created_at: new Date().toISOString() },
//   { id: "middle-8", category_id: "cat-middle", name: "מאפה השף", has_liters: false, is_active: true, sort_order: 8, created_at: new Date().toISOString() },
//   { id: "middle-9", category_id: "cat-middle", name: "רול בשר", has_liters: false, is_active: true, sort_order: 9, created_at: new Date().toISOString() },
//   { id: "middle-10", category_id: "cat-middle", name: "רול ירקות", has_liters: false, is_active: true, sort_order: 10, created_at: new Date().toISOString() },
//   { id: "middle-11", category_id: "cat-middle", name: "חמין", has_liters: false, is_active: true, sort_order: 11, created_at: new Date().toISOString() },

//   // Sides (11 items)
//   { id: "side-1", category_id: "cat-sides", name: "אורז", has_liters: false, is_active: true, sort_order: 1, created_at: new Date().toISOString() },
//   { id: "side-2", category_id: "cat-sides", name: 'תפו"א אפויים', has_liters: false, is_active: true, sort_order: 2, created_at: new Date().toISOString() },
//   { id: "side-3", category_id: "cat-sides", name: "זיתים מרוקאים", has_liters: false, is_active: true, sort_order: 3, created_at: new Date().toISOString() },
//   { id: "side-4", category_id: "cat-sides", name: "ארטישוק ופטריות", has_liters: false, is_active: true, sort_order: 4, created_at: new Date().toISOString() },
//   { id: "side-5", category_id: "cat-sides", name: "אפונה וגזר", has_liters: false, is_active: true, sort_order: 5, created_at: new Date().toISOString() },
//   { id: "side-6", category_id: "cat-sides", name: "אפונה וארטישוק", has_liters: false, is_active: true, sort_order: 6, created_at: new Date().toISOString() },
//   { id: "side-7", category_id: "cat-sides", name: "ירקות מוקפצים", has_liters: false, is_active: true, sort_order: 7, created_at: new Date().toISOString() },
//   { id: "side-8", category_id: "cat-sides", name: "שעועית ברוטב", has_liters: false, is_active: true, sort_order: 8, created_at: new Date().toISOString() },
//   { id: "side-9", category_id: "cat-sides", name: "שעועית מוקפצת", has_liters: false, is_active: true, sort_order: 9, created_at: new Date().toISOString() },
//   { id: "side-10", category_id: "cat-sides", name: "קוסקוס", has_liters: false, is_active: true, sort_order: 10, created_at: new Date().toISOString() },
//   { id: "side-11", category_id: "cat-sides", name: "ירקות לקוסקוס", has_liters: false, is_active: true, sort_order: 11, created_at: new Date().toISOString() },

//   // Mains (11 items)
//   { id: "main-1", category_id: "cat-mains", name: "כרעיים אפוי", has_liters: false, is_active: true, sort_order: 1, created_at: new Date().toISOString() },
//   { id: "main-2", category_id: "cat-mains", name: "חצאי כרעיים", has_liters: false, is_active: true, sort_order: 2, created_at: new Date().toISOString() },
//   { id: "main-3", category_id: "cat-mains", name: "פרגיות", has_liters: false, is_active: true, sort_order: 3, created_at: new Date().toISOString() },
//   { id: "main-4", category_id: "cat-mains", name: "שניצל מטוגן", has_liters: false, is_active: true, sort_order: 4, created_at: new Date().toISOString() },
//   { id: "main-5", category_id: "cat-mains", name: "חצאי שניצל", has_liters: false, is_active: true, sort_order: 5, created_at: new Date().toISOString() },
//   { id: "main-6", category_id: "cat-mains", name: "בשר ברוטב", has_liters: false, is_active: true, sort_order: 6, created_at: new Date().toISOString() },
//   { id: "main-7", category_id: "cat-mains", name: "לשון ברוטב", has_liters: false, is_active: true, sort_order: 7, created_at: new Date().toISOString() },
//   { id: "main-8", category_id: "cat-mains", name: "אסאדו", has_liters: false, is_active: true, sort_order: 8, created_at: new Date().toISOString() },
//   { id: "main-9", category_id: "cat-mains", name: "שיפודי קבב", has_liters: false, is_active: true, sort_order: 9, created_at: new Date().toISOString() },
//   { id: "main-10", category_id: "cat-mains", name: "שיפודי עוף", has_liters: false, is_active: true, sort_order: 10, created_at: new Date().toISOString() },
//   { id: "main-11", category_id: "cat-mains", name: "חזה עוף", has_liters: false, is_active: true, sort_order: 11, created_at: new Date().toISOString() },
// ];

// // Helper functions
// export function getFoodItemsByCategory(categoryId: string): FoodItem[] {
//   return mockFoodItems
//     .filter((item) => item.category_id === categoryId && item.is_active)
//     .sort((a, b) => a.sort_order - b.sort_order);
// }

// export function getCategoryByNameEn(nameEn: string): Category | undefined {
//   return mockCategories.find((cat) => cat.name_en === nameEn);
// }
