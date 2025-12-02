// Category types
export interface Category {
  id: string;
  name: string;
  name_en: string;
  max_selection: number | null;
  sort_order: number;
  created_at: string;
}

// Liter size types
export interface LiterSize {
  id: string;
  size: number;
  label: string;
  sort_order: number;
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
}

// Customer type (unique by phone)
export interface Customer {
  id: string;
  phone: string;
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
  delivery_address: string | null;
  notes: string | null;
  status: OrderStatus;
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
  quantity: number;
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
