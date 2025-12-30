// Category types
export interface Category {
  id: string;
  name: string;
  name_en: string;
  max_selection: number | null;
  sort_order: number;
  created_at: string;
}

// Liter size types (global predefined sizes)
export interface LiterSize {
  id: string;
  size: number;
  label: string;
  sort_order: number;
  created_at: string;
}

// Custom liter size per food item
export interface FoodItemCustomLiter {
  id: string;
  food_item_id: string;
  size: number;
  label: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

// Measurement type for salads
export type MeasurementType = 'liters' | 'size' | 'none';

// Food item types
export interface FoodItem {
  id: string;
  category_id: string;
  name: string;
  has_liters: boolean;
  measurement_type: MeasurementType; // 'liters' = 1.5L, 2.5L, etc., 'size' = Big/Small (ג/ק), 'none' = just quantity
  is_active: boolean;
  sort_order: number;
  created_at: string;
  // Portion size information for display
  portion_multiplier?: number | null; // e.g., 2 for חצי שניצל, 3 for קציצות, 100 for 100g
  portion_unit?: string | null; // e.g., 'חצאים', 'קציצות', 'גרם', 'ק״ג'
  // Add-ons that appear when this item is selected
  add_ons?: FoodItemAddOn[];
  // Preparation options for this item (e.g., עשבי תיבול, ברוטב מזרחי)
  preparations?: FoodItemPreparation[];
  // Variations of this item (e.g., אורז לבן, אורז ירוק, אורז אדום)
  variations?: FoodItemVariation[];
  // Custom liter sizes for this item (e.g., 1L for טחינה)
  custom_liters?: FoodItemCustomLiter[];
}

// Add-on item that appears conditionally when parent item is selected
export interface FoodItemAddOn {
  id: string;
  parent_food_item_id: string;
  name: string;
  measurement_type: MeasurementType;
  sort_order: number;
  is_active: boolean;
  linked_food_item_id?: string | null;  // Link to existing food item for quantity merging
}

// Preparation option for food items (e.g., different cooking styles)
export interface FoodItemPreparation {
  id: string;
  parent_food_item_id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}

// Variation of food items (e.g., אורז לבן, אורז אדום, אורז ירוק)
export interface FoodItemVariation {
  id: string;
  parent_food_item_id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}

// Customer type (unique by phone)
export interface Customer {
  id: string;
  phone: string;
  phone_alt: string | null;
  name: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Order status
export type OrderStatus = 'draft' | 'active' | 'completed' | 'cancelled';

// Order types
export interface Order {
  id: string;
  order_number: number;
  customer_id: string | null;
  order_date: string;
  order_time: string | null;
  customer_time: string | null;
  delivery_address: string | null;
  notes: string | null;
  status: OrderStatus;
  // Pricing fields
  total_portions: number | null;
  price_per_portion: number | null;
  delivery_fee: number | null;
  created_at: string;
  updated_at: string;
  // Joined data
  customer?: Customer;
}

// Order item types
export interface OrderItem {
  id: string;
  order_id: string;
  food_item_id: string;
  liter_size_id: string | null;
  size_type: "big" | "small" | null; // For size-based measurements (ג/ק)
  preparation_id: string | null; // Selected preparation option
  variation_id: string | null; // For items with variations (e.g., rice types)
  quantity: number;
  item_note: string | null; // Free-text note for this item
  created_at: string;
}

// For the order form - selected salad with liter sizes
export interface SaladSelection {
  food_item_id: string;
  liters: {
    liter_size_id: string;
    quantity: number;
  }[];
}

// For the order form - selected regular item
export interface RegularItemSelection {
  food_item_id: string;
  quantity: number;
}

// Combined order form data
export interface OrderFormData {
  customer_name: string;
  phone: string;
  order_date: string;
  order_time: string;
  address: string;
  notes: string;
  salads: SaladSelection[];
  middle_courses: RegularItemSelection[];
  sides: RegularItemSelection[];
  mains: RegularItemSelection[];
  extras: RegularItemSelection[];
}

// Print layout types
export interface PrintLayoutTemplate {
  showHeader: boolean;
  headerText?: string;
  showOrderNumber: boolean;
  showCustomerInfo: boolean;
  showDate: boolean;
  showTime: boolean;
  showAddress: boolean;
  showNotes: boolean;
  sections: {
    category: string;
    show: boolean;
    order: number;
  }[];
  fontSize: 'small' | 'medium' | 'large';
  orientation: 'portrait' | 'landscape';
  showUnselectedItems: boolean;
  showCategoryTitles: boolean;
}

export interface PrintLayout {
  id: string;
  name: string;
  template: PrintLayoutTemplate;
  is_default: boolean;
  created_at: string;
}
