"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Calendar,
  ChevronDown,
  ChevronUp,
  Filter,
  Loader2,
  Phone,
  User,
  Package,
  Printer,
  Pencil,
  Trash2,
  MapPin,
  Clock,
  DollarSign,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getOrdersByDateRange,
  getOrdersSummary,
  deleteOrder,
  OrderWithDetails,
  CategorySummary,
} from "@/lib/services/order-service";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { AuthGuard } from "@/components/auth/AuthGuard";

// Hebrew labels
const LABELS = {
  title: "סיכום הזמנות",
  back: "חזרה",
  fromDate: "מתאריך",
  toDate: "עד תאריך",
  filter: "סנן",
  noOrders: "לא נמצאו הזמנות בטווח התאריכים",
  loading: "טוען...",
  ordersList: "רשימת הזמנות",
  summary: "סיכום כמויות",
  allCategories: "כל הקטגוריות",
  selectCategories: "בחר קטגוריות",
  selectItems: "בחר פריטים",
  showAll: "הצג הכל",
  showSelected: "הצג נבחרים",
  total: "סה״כ",
  orders: "הזמנות",
  print: "הדפס",
  today: "היום",
  thisWeek: "השבוע",
  nextWeek: "השבוע הבא",
  customerName: "שם לקוח",
  phone: "טלפון",
};

// Hebrew day names (Sunday = 0)
const HEBREW_DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

// Get Hebrew day name from date
const getHebrewDayName = (dateStr: string): string => {
  const date = new Date(dateStr + "T00:00:00");
  return HEBREW_DAYS[date.getDay()];
};

// Get start of week (Sunday) for a given date
const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Get end of week (Saturday) for a given date
const getWeekEnd = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (6 - day));
  d.setHours(0, 0, 0, 0);
  return d;
};

// Format date to YYYY-MM-DD string
const toDateString = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

type ViewMode = "orders" | "summary";
type FilterMode = "all" | "categories" | "items";

export default function SummaryPage() {
  const router = useRouter();
  const { categories, foodItems, literSizes, isLoading: dataLoading } = useSupabaseData();

  // Date range state (optional - can be empty)
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");

  // Customer filter state
  const [customerNameFilter, setCustomerNameFilter] = React.useState("");
  const [phoneFilter, setPhoneFilter] = React.useState("");

  // Data state
  const [orders, setOrders] = React.useState<OrderWithDetails[]>([]);
  const [summary, setSummary] = React.useState<CategorySummary[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(false);

  // View state
  const [viewMode, setViewMode] = React.useState<ViewMode>("orders");
  const [expandedOrderId, setExpandedOrderId] = React.useState<string | null>(null);

  // Filter state for summary
  const [filterMode, setFilterMode] = React.useState<FilterMode>("all");
  const [selectedCategories, setSelectedCategories] = React.useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = React.useState<Set<string>>(new Set());

  // Memoize extras category for use in calculations and display
  const extrasCategory = React.useMemo(() =>
    categories.find(c => c.name_en === "extras"), [categories]);

  // Helper to calculate total price for an order (matches OrderForm calculation)
  const calculateOrderTotal = React.useCallback((order: OrderWithDetails) => {
    // Sum extra_items prices (from mains/sides/middle_courses added as extras)
    const extraItemsPrice = order.extra_items?.reduce((sum, item) => sum + item.price, 0) || 0;

    // Sum extras category items prices (from order_items.price)
    const extrasCategoryPrice = order.items
      .filter(item => item.food_item?.category_id === extrasCategory?.id && item.price)
      .reduce((sum, item) => sum + (item.price || 0), 0);

    const totalExtraPrice = extraItemsPrice + extrasCategoryPrice;

    if (order.total_portions && order.price_per_portion) {
      return (order.total_portions * order.price_per_portion) + (order.delivery_fee || 0) + totalExtraPrice;
    }
    return totalExtraPrice > 0 ? totalExtraPrice : null;
  }, [extrasCategory]);

  // Restore filters from sessionStorage on mount
  React.useEffect(() => {
    const savedState = sessionStorage.getItem("summaryPageState");
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        if (state.fromDate) setFromDate(state.fromDate);
        if (state.toDate) setToDate(state.toDate);
        if (state.customerNameFilter) setCustomerNameFilter(state.customerNameFilter);
        if (state.phoneFilter) setPhoneFilter(state.phoneFilter);
        if (state.expandedOrderId) setExpandedOrderId(state.expandedOrderId);
        if (state.viewMode) setViewMode(state.viewMode);
        if (state.hasSearched) setHasSearched(state.hasSearched);
        // Trigger search if we have filters
        if (state.hasSearched && (state.fromDate || state.toDate || state.customerNameFilter || state.phoneFilter)) {
          // We'll re-fetch in the next effect
        }
      } catch (e) {
        console.error("Error restoring summary state:", e);
      }
    }
  }, []);

  // Re-fetch orders when filters are restored
  React.useEffect(() => {
    const savedState = sessionStorage.getItem("summaryPageState");
    if (savedState && !dataLoading) {
      try {
        const state = JSON.parse(savedState);
        if (state.hasSearched && (state.fromDate || state.toDate || state.customerNameFilter || state.phoneFilter)) {
          // Re-run the filter
          const fetchOrders = async () => {
            setIsLoading(true);
            try {
              const filters = {
                customerName: state.customerNameFilter || undefined,
                phone: state.phoneFilter || undefined,
              };
              const [ordersData, summaryData] = await Promise.all([
                getOrdersByDateRange(state.fromDate || undefined, state.toDate || undefined, filters),
                getOrdersSummary(state.fromDate || undefined, state.toDate || undefined, filters),
              ]);
              setOrders(ordersData);
              setSummary(summaryData);
            } catch (error) {
              console.error("Error fetching data:", error);
            } finally {
              setIsLoading(false);
            }
          };
          fetchOrders();
          // Clear the saved state after restoring
          sessionStorage.removeItem("summaryPageState");
        }
      } catch (e) {
        console.error("Error re-fetching orders:", e);
      }
    }
  }, [dataLoading]);

  // Save current filters to sessionStorage before navigating away
  const saveFiltersToSession = () => {
    const state = {
      fromDate,
      toDate,
      customerNameFilter,
      phoneFilter,
      expandedOrderId,
      viewMode,
      hasSearched,
    };
    sessionStorage.setItem("summaryPageState", JSON.stringify(state));
  };

  // Quick filter handlers
  const setToday = () => {
    const today = new Date();
    const dateStr = toDateString(today);
    setFromDate(dateStr);
    setToDate(dateStr);
  };

  const setThisWeek = () => {
    const today = new Date();
    const weekStart = getWeekStart(today);
    const weekEnd = getWeekEnd(today);
    setFromDate(toDateString(weekStart));
    setToDate(toDateString(weekEnd));
  };

  const setNextWeek = () => {
    const today = new Date();
    const nextWeekStart = new Date(today);
    nextWeekStart.setDate(today.getDate() + (7 - today.getDay()));
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
    setFromDate(toDateString(nextWeekStart));
    setToDate(toDateString(nextWeekEnd));
  };

  // Check if any filter is set
  const hasAnyFilter = fromDate || toDate || customerNameFilter || phoneFilter;

  // Fetch orders when filter is applied
  const handleFilter = async () => {
    if (!hasAnyFilter) {
      return; // Don't search without any filters
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const filters = {
        customerName: customerNameFilter || undefined,
        phone: phoneFilter || undefined,
      };
      console.log("Fetching orders with filters:", { fromDate, toDate, ...filters });
      const [ordersData, summaryData] = await Promise.all([
        getOrdersByDateRange(fromDate || undefined, toDate || undefined, filters),
        getOrdersSummary(fromDate || undefined, toDate || undefined, filters),
      ]);
      console.log("Orders fetched:", ordersData.length, "orders");
      console.log("Summary fetched:", summaryData);
      setOrders(ordersData);
      setSummary(summaryData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle order expansion
  const toggleOrder = (orderId: string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  // Toggle category selection
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // Toggle item selection
  const toggleItem = (itemId: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  // Filter summary based on selections
  const filteredSummary = React.useMemo(() => {
    if (filterMode === "all") {
      return summary;
    }

    if (filterMode === "categories") {
      if (selectedCategories.size === 0) return summary;
      return summary.filter((cat) => selectedCategories.has(cat.category_id));
    }

    if (filterMode === "items") {
      if (selectedItems.size === 0) return summary;
      return summary
        .map((cat) => ({
          ...cat,
          items: cat.items.filter((item) => selectedItems.has(item.food_item_id)),
        }))
        .filter((cat) => cat.items.length > 0);
    }

    return summary;
  }, [summary, filterMode, selectedCategories, selectedItems]);

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("he-IL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Group items by category for order details
  const groupItemsByCategory = (order: OrderWithDetails) => {
    const grouped = new Map<string, typeof order.items>();

    for (const item of order.items) {
      if (!item.food_item) continue;
      const categoryId = item.food_item.category_id;
      if (!grouped.has(categoryId)) {
        grouped.set(categoryId, []);
      }
      grouped.get(categoryId)!.push(item);
    }

    return Array.from(grouped.entries()).map(([categoryId, items]) => {
      const category = categories.find((c) => c.id === categoryId);
      return {
        categoryId,
        categoryName: category?.name || "לא ידוע",
        items,
      };
    });
  };

  // Transform OrderWithDetails to StoredPrintData format for print-preview
  const transformOrderToPrintData = (order: OrderWithDetails) => {
    // First, separate main items from add-on items
    const mainItems = order.items.filter(item => !item.add_on_id);
    const addOnItems = order.items.filter(item => item.add_on_id);

    // Group add-ons by parent food_item_id
    const addOnsByParent = new Map<string, {
      addon_id: string;
      name: string;
      quantity: number;
      liters: { liter_size_id: string; label: string; quantity: number }[];
    }[]>();

    for (const addOnItem of addOnItems) {
      if (!addOnItem.add_on) continue;
      
      const parentId = addOnItem.food_item_id;
      if (!addOnsByParent.has(parentId)) {
        addOnsByParent.set(parentId, []);
      }

      const addOnsForParent = addOnsByParent.get(parentId)!;
      
      // Find existing add-on entry or create new one
      let addOnEntry = addOnsForParent.find(ao => ao.addon_id === addOnItem.add_on_id);
      if (!addOnEntry) {
        addOnEntry = {
          addon_id: addOnItem.add_on_id!,
          name: addOnItem.add_on.name,
          quantity: 0,
          liters: [],
        };
        addOnsForParent.push(addOnEntry);
      }

      // Handle liter quantities for add-on
      if (addOnItem.liter_size_id && addOnItem.liter_size) {
        addOnEntry.liters.push({
          liter_size_id: addOnItem.liter_size_id,
          label: addOnItem.liter_size.label,
          quantity: addOnItem.quantity,
        });
      } else {
        // Regular quantity for add-on
        addOnEntry.quantity += addOnItem.quantity;
      }
    }

    // Group main items by food_item_id, aggregating liters and handling size_type
    const itemsByFoodItem = new Map<string, {
      food_item_id: string;
      name: string;
      category_id: string;
      has_liters: boolean;
      liters: { liter_size_id: string; label: string; quantity: number }[];
      size_big: number;
      size_small: number;
      regular_quantity: number;
      note: string;
      preparation_name: string;
      price: number | null;
      variations: { variation_id: string; name: string; size_big: number; size_small: number }[];
    }>();

    for (const item of mainItems) {
      if (!item.food_item) continue;

      const foodItemId = item.food_item_id;

      if (!itemsByFoodItem.has(foodItemId)) {
        itemsByFoodItem.set(foodItemId, {
          food_item_id: foodItemId,
          name: item.food_item.name,
          category_id: item.food_item.category_id,
          has_liters: item.food_item.has_liters,
          liters: [],
          size_big: 0,
          size_small: 0,
          regular_quantity: 0,
          note: item.item_note || "",
          preparation_name: item.preparation?.name || "",
          price: item.price ?? null,
          variations: [],
        });
      }

      const entry = itemsByFoodItem.get(foodItemId)!;

      // Handle liter quantities
      if (item.liter_size_id && item.liter_size) {
        entry.liters.push({
          liter_size_id: item.liter_size_id,
          label: item.liter_size.label,
          quantity: item.quantity,
        });
      }
      // Handle variations (e.g., rice types: לבן, ירוק, אשפלו, אדום, לבנוני)
      else if (item.variation_id && item.variation) {
        const existingVar = entry.variations.find(v => v.variation_id === item.variation_id);
        if (existingVar) {
          if (item.size_type === 'big') existingVar.size_big += item.quantity;
          else if (item.size_type === 'small') existingVar.size_small += item.quantity;
        } else {
          entry.variations.push({
            variation_id: item.variation_id,
            name: item.variation.name,
            size_big: item.size_type === 'big' ? item.quantity : 0,
            size_small: item.size_type === 'small' ? item.quantity : 0,
          });
        }
      }
      // Handle size quantities (ג/ק)
      else if (item.size_type === "big") {
        entry.size_big += item.quantity;
      } else if (item.size_type === "small") {
        entry.size_small += item.quantity;
      }
      // Handle regular quantity
      else {
        entry.regular_quantity += item.quantity;
      }
    }

    // Categorize items by category
    const saladsCategory = categories.find(c => c.name_en === "salads");
    const middleCategory = categories.find(c => c.name_en === "middle_courses");
    const sidesCategory = categories.find(c => c.name_en === "sides");
    const mainsCategory = categories.find(c => c.name_en === "mains");
    const extrasCategory = categories.find(c => c.name_en === "extras");
    const bakeryCategory = categories.find(c => c.name_en === "bakery");

    const salads: {
      food_item_id: string;
      name: string;
      selected: boolean;
      measurement_type: string;
      isBulkApplied?: boolean;
      liters: { liter_size_id: string; label: string; quantity: number }[];
      size_big: number;
      size_small: number;
      regular_quantity: number;
      note: string;
      addOns: { addon_id: string; name: string; quantity: number; liters: { liter_size_id: string; label: string; quantity: number }[] }[];
    }[] = [];
    const middleCourses: { food_item_id: string; name: string; selected: boolean; quantity: number; preparation_name?: string; note: string }[] = [];
    const sides: { food_item_id: string; name: string; selected: boolean; size_big: number; size_small: number; quantity: number; liters: { liter_size_id: string; label: string; quantity: number }[]; note: string; variations?: { variation_id: string; name: string; size_big: number; size_small: number }[] }[] = [];
    const mains: { food_item_id: string; name: string; selected: boolean; quantity: number; portion_multiplier?: number; portion_unit?: string; note: string }[] = [];
    const extras: { food_item_id: string; name: string; selected: boolean; quantity: number; note: string; price?: number | null }[] = [];
    const bakery: { food_item_id: string; name: string; selected: boolean; quantity: number; note: string }[] = [];

    for (const item of itemsByFoodItem.values()) {
      const hasContent = item.liters.length > 0 || item.size_big > 0 ||
                         item.size_small > 0 || item.regular_quantity > 0 ||
                         item.variations.some(v => v.size_big > 0 || v.size_small > 0);

      if (item.category_id === saladsCategory?.id) {
        // Get add-ons for this salad
        const itemAddOns = addOnsByParent.get(item.food_item_id) || [];
        
        salads.push({
          food_item_id: item.food_item_id,
          name: item.name,
          selected: hasContent,
          measurement_type: item.has_liters ? "liters" : "size",
          liters: item.liters,
          size_big: item.size_big,
          size_small: item.size_small,
          regular_quantity: item.regular_quantity,
          note: item.note,
          addOns: itemAddOns,
          isBulkApplied: false, // Will be updated below
        });
      } else if (item.category_id === middleCategory?.id) {
        middleCourses.push({
          food_item_id: item.food_item_id,
          name: item.name,
          selected: hasContent,
          quantity: item.regular_quantity,
          preparation_name: item.preparation_name,
          note: item.note,
        });
      } else if (item.category_id === sidesCategory?.id) {
        sides.push({
          food_item_id: item.food_item_id,
          name: item.name,
          selected: hasContent,
          size_big: item.size_big,
          size_small: item.size_small,
          quantity: item.regular_quantity,
          liters: item.liters,
          note: item.note,
          variations: item.variations.filter(v => v.size_big > 0 || v.size_small > 0).map(v => ({
            variation_id: v.variation_id,
            name: v.name,
            size_big: v.size_big,
            size_small: v.size_small,
          })),
        });
      } else if (item.category_id === mainsCategory?.id) {
        const foodItem = foodItems.find(f => f.id === item.food_item_id);
        mains.push({
          food_item_id: item.food_item_id,
          name: item.name,
          selected: hasContent,
          quantity: item.regular_quantity,
          portion_multiplier: foodItem?.portion_multiplier ?? undefined,
          portion_unit: foodItem?.portion_unit ?? undefined,
          note: item.note,
        });
      } else if (item.category_id === extrasCategory?.id) {
        extras.push({
          food_item_id: item.food_item_id,
          name: item.name,
          selected: hasContent,
          quantity: item.regular_quantity,
          note: item.note,
          price: item.price,
        });
      } else if (item.category_id === bakeryCategory?.id) {
        bakery.push({
          food_item_id: item.food_item_id,
          name: item.name,
          selected: hasContent,
          quantity: item.regular_quantity,
          note: item.note,
        });
      }
    }

    // Detect common liter patterns in salads and mark them as isBulkApplied
    // This allows the print-preview page to aggregate and display common liter patterns
    const getLiterSignature = (liters: { label: string; quantity: number }[]) => {
      if (liters.length === 0) return null;
      const sorted = [...liters]
        .filter(l => l.quantity > 0)
        .map(l => ({ label: l.label, quantity: l.quantity }))
        .sort((a, b) => a.label.localeCompare(b.label));
      if (sorted.length === 0) return null;
      return JSON.stringify(sorted);
    };

    // Count occurrences of each liter signature
    const signatureCounts = new Map<string, number>();
    salads.forEach(salad => {
      if (salad.liters.length > 0) {
        const sig = getLiterSignature(salad.liters);
        if (sig) {
          signatureCounts.set(sig, (signatureCounts.get(sig) || 0) + 1);
        }
      }
    });

    // Mark salads with common signatures (appearing more than once) as isBulkApplied
    salads.forEach(salad => {
      if (salad.liters.length > 0) {
        const sig = getLiterSignature(salad.liters);
        if (sig && (signatureCounts.get(sig) || 0) > 1) {
          salad.isBulkApplied = true;
        }
      }
    });

    // Calculate total price of extra items (from mains/sides/middle_courses added as extras)
    const extraItemsPrice = order.extra_items?.reduce((sum, item) => sum + item.price, 0) || 0;

    // Calculate total price of extras category items (from order_items.price)
    const extrasCategoryPrice = order.items
      .filter(item => item.food_item?.category_id === extrasCategory?.id && item.price)
      .reduce((sum, item) => sum + (item.price || 0), 0);

    // Calculate total payment (includes both extra_items and extras category prices)
    const totalExtraPrice = extraItemsPrice + extrasCategoryPrice;
    const totalPayment = (order.total_portions && order.price_per_portion)
      ? (order.total_portions * order.price_per_portion) + (order.delivery_fee || 0) + totalExtraPrice
      : (totalExtraPrice > 0 ? totalExtraPrice : undefined);

    return {
      customer: {
        name: order.customer?.name || "",
        phone: order.customer?.phone || "",
        phone2: order.customer?.phone_alt || "",
        address: order.delivery_address || order.customer?.address || "",
      },
      order: {
        date: order.order_date,
        time: order.order_time || "",
        customerTime: order.customer_time || "",
        notes: order.notes || "",
        totalPortions: order.total_portions || undefined,
        pricePerPortion: order.price_per_portion || undefined,
        deliveryFee: order.delivery_fee || undefined,
        totalPayment: totalPayment,
      },
      salads,
      middleCourses,
      sides,
      mains,
      extras,
      bakery,
      extraItems: order.extra_items?.map(e => ({
        id: e.id,
        source_food_item_id: e.source_food_item_id,
        source_category: e.source_category,
        name: e.name,
        quantity: e.quantity,
        size_big: e.size_big,
        size_small: e.size_small,
        variations: e.variations?.map(v => ({
          variation_id: v.variation_id,
          name: v.name,
          size_big: v.size_big,
          size_small: v.size_small
        })),
        price: e.price,
        note: e.note || undefined,
        preparation_name: e.preparation_name || undefined
      })) || [],
    };
  };

  // Handle printing a specific order
  const handlePrintOrder = (order: OrderWithDetails) => {
    // Save filters and navigation source before navigating
    saveFiltersToSession();
    sessionStorage.setItem("navigationSource", "summary");
    
    const printData = transformOrderToPrintData(order);
    sessionStorage.setItem("printOrderData", JSON.stringify(printData));
    router.push("/print-preview");
  };

  // Handle editing a specific order
  const handleEditOrder = (orderId: string) => {
    // Save filters and navigation source before navigating
    saveFiltersToSession();
    sessionStorage.setItem("navigationSource", "summary");
    router.push(`/edit-order/${orderId}`);
  };

  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את הזמנה ${orderNumber}?`)) {
      return;
    }

    const result = await deleteOrder(orderId);
    if (result.success) {
      // Remove from local state to update UI
      setOrders(orders.filter(o => o.id !== orderId));
      setExpandedOrderId(null);
    } else {
      alert(`שגיאה במחיקת ההזמנה: ${result.error}`);
    }
  };

  if (dataLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600">{LABELS.loading}</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
    <div className="min-h-screen bg-gray-50">
      {/* Header - Mobile optimized */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
          <button
            onClick={() => router.push("/order")}
            className="flex items-center gap-1.5 sm:gap-2 text-gray-600 hover:text-gray-900 active:scale-95 transition-all p-1.5 -m-1.5 rounded-lg"
          >
            <ArrowRight className="w-5 h-5" />
            <span className="text-sm sm:text-base">{LABELS.back}</span>
          </button>
          <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">{LABELS.title}</h1>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 active:scale-95 transition-all p-2 -m-2 rounded-lg"
          >
            <Printer className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Date Range Filter */}
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 print-hide">
          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            <button
              onClick={setToday}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 active:scale-[0.98] transition-all text-xs sm:text-sm"
            >
              {LABELS.today}
            </button>
            <button
              onClick={setThisWeek}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 active:scale-[0.98] transition-all text-xs sm:text-sm"
            >
              {LABELS.thisWeek}
            </button>
            <button
              onClick={setNextWeek}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 active:scale-[0.98] transition-all text-xs sm:text-sm"
            >
              {LABELS.nextWeek}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-end">
            <div className="flex-1 w-full space-y-1">
              <label className="text-xs sm:text-sm font-medium text-gray-700">
                {LABELS.fromDate}
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className={cn(
                    "w-full h-11 sm:h-12 pr-3 sm:pr-4 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm sm:text-base",
                    fromDate ? "pl-20 sm:pl-24" : "pl-3 sm:pl-4"
                  )}
                />
                {fromDate && (
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs sm:text-sm text-blue-600 font-medium pointer-events-none">
                    יום {getHebrewDayName(fromDate)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1 w-full space-y-1">
              <label className="text-xs sm:text-sm font-medium text-gray-700">
                {LABELS.toDate}
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className={cn(
                    "w-full h-11 sm:h-12 pr-3 sm:pr-4 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm sm:text-base",
                    toDate ? "pl-20 sm:pl-24" : "pl-3 sm:pl-4"
                  )}
                />
                {toDate && (
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs sm:text-sm text-blue-600 font-medium pointer-events-none">
                    יום {getHebrewDayName(toDate)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Name and Phone Filters */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
            <div className="flex-1 w-full space-y-1">
              <label className="text-xs sm:text-sm font-medium text-gray-700">
                {LABELS.customerName}
              </label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={customerNameFilter}
                  onChange={(e) => setCustomerNameFilter(e.target.value)}
                  placeholder="חיפוש לפי שם..."
                  className="w-full h-11 sm:h-12 pr-9 sm:pr-10 pl-3 sm:pl-4 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm sm:text-base"
                />
              </div>
            </div>
            <div className="flex-1 w-full space-y-1">
              <label className="text-xs sm:text-sm font-medium text-gray-700">
                {LABELS.phone}
              </label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none" />
                <input
                  type="tel"
                  value={phoneFilter}
                  onChange={(e) => setPhoneFilter(e.target.value)}
                  placeholder="חיפוש לפי טלפון..."
                  dir="ltr"
                  className="w-full h-11 sm:h-12 pr-9 sm:pr-10 pl-3 sm:pl-4 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-left text-sm sm:text-base"
                />
              </div>
            </div>
          </div>

          {/* Search Button */}
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
            <button
              onClick={handleFilter}
              disabled={isLoading || !hasAnyFilter}
              className="w-full h-11 sm:h-12 px-4 sm:px-6 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              ) : (
                <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
              <span>{LABELS.filter}</span>
            </button>
          </div>
        </div>

        {/* View Toggle */}
        {hasSearched && orders.length > 0 && (
          <div className="flex gap-1.5 sm:gap-2 print-hide">
            <button
              onClick={() => setViewMode("orders")}
              className={cn(
                "flex-1 h-10 sm:h-12 font-semibold rounded-lg transition-all text-sm sm:text-base",
                viewMode === "orders"
                  ? "bg-blue-500 text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              )}
            >
              {LABELS.ordersList} ({orders.length})
            </button>
            <button
              onClick={() => setViewMode("summary")}
              className={cn(
                "flex-1 h-10 sm:h-12 font-semibold rounded-lg transition-all text-sm sm:text-base",
                viewMode === "summary"
                  ? "bg-blue-500 text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              )}
            >
              {LABELS.summary}
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600">{LABELS.loading}</p>
          </div>
        )}

        {/* No Results */}
        {!isLoading && hasSearched && orders.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">{LABELS.noOrders}</p>
          </div>
        )}


        {/* Orders List View */}
        {!isLoading && viewMode === "orders" && orders.length > 0 && (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                {/* Order Header - Clickable */}
                <button
                  onClick={() => toggleOrder(order.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-right"
                >
                  <div className="flex-1">
                    {/* Order number and status */}
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-sm font-bold text-blue-600">
                        #{order.order_number}
                      </span>
                      <span
                        className={cn(
                          "text-xs font-medium px-2 py-1 rounded",
                          order.status === "active" && "bg-blue-100 text-blue-700",
                          order.status === "completed" && "bg-green-100 text-green-700",
                          order.status === "draft" && "bg-yellow-100 text-yellow-700",
                          order.status === "cancelled" && "bg-red-100 text-red-700"
                        )}
                      >
                        {order.status === "active" && "פעיל"}
                        {order.status === "completed" && "הושלם"}
                        {order.status === "draft" && "טיוטה"}
                        {order.status === "cancelled" && "בוטל"}
                      </span>
                      {/* Price display */}
                      {calculateOrderTotal(order) !== null && (
                        <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                          ₪{calculateOrderTotal(order)!.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Customer details grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                      {/* Customer name */}
                      <div className="flex items-center gap-2 text-gray-800">
                        <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="font-medium truncate">
                          {order.customer?.name || "ללא שם"}
                        </span>
                      </div>

                      {/* Phone */}
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span dir="ltr">{order.customer?.phone || "ללא טלפון"}</span>
                      </div>

                      {/* Secondary phone */}
                      {order.customer?.phone_alt && (
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <Phone className="w-4 h-4 text-blue-400 flex-shrink-0" />
                          <span dir="ltr">{order.customer.phone_alt}</span>
                        </div>
                      )}

                      {/* Date */}
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span>{formatDate(order.order_date)}</span>
                      </div>

                      {/* Customer time */}
                      {order.customer_time && (
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <Clock className="w-4 h-4 text-purple-400 flex-shrink-0" />
                          <span>ללקוח: {order.customer_time}</span>
                        </div>
                      )}

                      {/* Kitchen time */}
                      {order.order_time && (
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <Clock className="w-4 h-4 text-orange-400 flex-shrink-0" />
                          <span>למטבח: {order.order_time}</span>
                        </div>
                      )}

                      {/* Address */}
                      {order.delivery_address && (
                        <div className="flex items-center gap-2 text-gray-600 text-sm sm:col-span-2">
                          <MapPin className="w-4 h-4 text-red-400 flex-shrink-0" />
                          <span className="truncate">{order.delivery_address}</span>
                        </div>
                      )}

                      {/* Portions and price details */}
                      {order.total_portions && (
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <DollarSign className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <span>{order.total_portions} מנות × ₪{order.price_per_portion}</span>
                        </div>
                      )}

                      {/* Delivery fee */}
                      {order.delivery_fee && order.delivery_fee > 0 && (
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <MapPin className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <span>משלוח: ₪{order.delivery_fee}</span>
                        </div>
                      )}

                      {/* Notes preview */}
                      {order.notes && (
                        <div className="flex items-center gap-2 text-amber-600 text-sm sm:col-span-2">
                          <FileText className="w-4 h-4 text-amber-400 flex-shrink-0" />
                          <span className="truncate">{order.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mr-4">
                    {expandedOrderId === order.id ? (
                      <ChevronUp className="w-6 h-6 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Order Details - Expandable */}
                {expandedOrderId === order.id && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    {order.notes && (
                      <div className="mb-4 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800">
                        <strong>הערות:</strong> {order.notes}
                      </div>
                    )}

                    {order.delivery_address && (
                      <div className="mb-4 text-sm text-gray-600">
                        <strong>כתובת:</strong> {order.delivery_address}
                      </div>
                    )}

                    {groupItemsByCategory(order).map((group) => (
                      <div key={group.categoryId} className="mb-4 last:mb-0">
                        <h4 className="font-semibold text-gray-800 mb-2 pb-1 border-b border-gray-200">
                          {group.categoryName}
                        </h4>
                        <div className="space-y-1">
                          {group.items.map((item) => {
                            const isExtras = group.categoryId === extrasCategory?.id;
                            return (
                              <div
                                key={item.id}
                                className="flex items-center justify-between text-sm py-1"
                              >
                                <span className="text-gray-700">
                                  {item.food_item?.name}
                                  {isExtras && item.price && (
                                    <span className="text-green-600 mr-2">
                                      ₪{item.price}
                                    </span>
                                  )}
                                </span>
                                <span className="text-gray-900 font-medium">
                                  {item.liter_size
                                    ? `${item.liter_size.label} × ${item.quantity}`
                                    : item.size_type === "big"
                                    ? `ג׳: ${item.quantity}`
                                    : item.size_type === "small"
                                    ? `ק׳: ${item.quantity}`
                                    : `× ${item.quantity}`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {/* Extra Items Section */}
                    {order.extra_items && order.extra_items.length > 0 && (
                      <div className="mb-4 last:mb-0">
                        <h4 className="font-semibold text-red-700 mb-2 pb-1 border-b border-red-200">
                          פריטי אקסטרה
                        </h4>
                        <div className="space-y-1">
                          {order.extra_items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between text-sm py-1"
                            >
                              <div className="flex flex-col">
                                <span className="text-gray-700 font-medium">
                                  {item.name}
                                  {item.preparation_name && ` (${item.preparation_name})`}
                                </span>
                                {item.variations && item.variations.length > 0 && (
                                  <span className="text-xs text-gray-500">
                                    {item.variations.map(v => `${v.name} (ג:${v.size_big}, ק:${v.size_small})`).join(", ")}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-900 font-medium">
                                  {item.quantity > 0 ? `× ${item.quantity}` : 
                                   (item.size_big > 0 || item.size_small > 0) ? 
                                   `${item.size_big > 0 ? `ג׳:${item.size_big}` : ''} ${item.size_small > 0 ? `ק׳:${item.size_small}` : ''}` : ''}
                                </span>
                                <span className="text-red-600 font-bold text-xs bg-red-50 px-1.5 py-0.5 rounded">
                                  ₪{item.price}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {order.items.length === 0 && (!order.extra_items || order.extra_items.length === 0) && (
                      <p className="text-gray-500 text-sm text-center py-4">
                        אין פריטים בהזמנה
                      </p>
                    )}

                    {/* Action Buttons - Mobile optimized */}
                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrintOrder(order);
                        }}
                        className="flex-1 h-10 sm:h-10 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base"
                      >
                        <Printer className="w-4 h-4" />
                        <span>הדפס</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditOrder(order.id);
                        }}
                        className="flex-1 h-10 sm:h-10 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base"
                      >
                        <Pencil className="w-4 h-4" />
                        <span>ערוך</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteOrder(order.id, String(order.order_number));
                        }}
                        className="flex-1 h-10 sm:h-10 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>מחק</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Summary View */}
        {!isLoading && viewMode === "summary" && summary.length > 0 && (
          <div className="space-y-4">
            {/* Print Header - only visible when printing */}
            <div className="print-date-range">
              סיכום כמויות: {formatDate(fromDate)} - {formatDate(toDate)}
            </div>
            
            {/* Filter Options */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 print-hide">
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setFilterMode("all")}
                  className={cn(
                    "px-4 py-2 rounded-lg font-medium transition-all text-sm",
                    filterMode === "all"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  {LABELS.showAll}
                </button>
                <button
                  onClick={() => setFilterMode("categories")}
                  className={cn(
                    "px-4 py-2 rounded-lg font-medium transition-all text-sm",
                    filterMode === "categories"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  {LABELS.selectCategories}
                </button>
                <button
                  onClick={() => setFilterMode("items")}
                  className={cn(
                    "px-4 py-2 rounded-lg font-medium transition-all text-sm",
                    filterMode === "items"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  {LABELS.selectItems}
                </button>
              </div>

              {/* Category Selection */}
              {filterMode === "categories" && (
                <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => toggleCategory(category.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                        selectedCategories.has(category.id)
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      )}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Item Selection */}
              {filterMode === "items" && (
                <div className="space-y-3 pt-3 border-t border-gray-200">
                  {categories.map((category) => {
                    const categoryItems = foodItems.filter(
                      (item) => item.category_id === category.id
                    );
                    if (categoryItems.length === 0) return null;

                    return (
                      <div key={category.id}>
                        <h5 className="text-sm font-semibold text-gray-600 mb-2">
                          {category.name}
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {categoryItems.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => toggleItem(item.id)}
                              className={cn(
                                "px-3 py-1 rounded-full text-xs font-medium transition-all",
                                selectedItems.has(item.id)
                                  ? "bg-blue-500 text-white"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              )}
                            >
                              {item.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Summary Results */}
            <div className="space-y-4">
              {filteredSummary.map((category) => (
                <div
                  key={category.category_id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                >
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h3 className="font-bold text-gray-900">
                      {category.category_name}
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {category.items.map((item, itemIndex) => (
                      <div key={`${item.food_item_id}_${item.is_add_on ? 'addon' : item.is_variation ? 'var' : 'main'}_${itemIndex}`} className="p-4">
                        <div className="flex items-start justify-between">
                          <span className={cn(
                            "font-medium",
                            item.is_add_on ? "text-purple-700" : item.is_variation ? "text-blue-700" : "text-gray-800"
                          )}>
                            {item.food_name}
                          </span>
                          {/* Show total quantity only if no liters and no sizes */}
                          {!item.has_liters && 
                           (!item.liter_quantities || item.liter_quantities.length === 0) &&
                           (!item.size_quantities || item.size_quantities.length === 0) &&
                           item.total_quantity && item.total_quantity > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
                                {item.total_quantity}
                              </span>
                              {/* Portion calculation */}
                              {item.portion_multiplier && item.portion_multiplier > 1 && item.portion_unit && (
                                <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-bold">
                                  = {item.total_quantity * item.portion_multiplier} {item.portion_unit}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Liter quantities */}
                        {item.liter_quantities && item.liter_quantities.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2 items-center">
                            {item.liter_quantities
                              .sort((a, b) => a.liter_size - b.liter_size)
                              .map((lq) => (
                                <span
                                  key={lq.liter_size_id}
                                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                                >
                                  <span className="font-bold">{lq.liter_label}</span>
                                  <span className="mx-1">×</span>
                                  <span className="font-bold">{lq.total_quantity}</span>
                                </span>
                              ))}
                            {/* Total liters calculation */}
                            <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-bold">
                              סה״כ{" "}
                              {item.liter_quantities.reduce((sum, lq) => {
                                return sum + (lq.liter_size * lq.total_quantity);
                              }, 0).toFixed(1).replace(/\.0$/, "")}L
                            </span>
                          </div>
                        )}
                        
                        {/* Size quantities (ג/ק) */}
                        {item.size_quantities && item.size_quantities.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {item.size_quantities
                              .sort((a, b) => (a.size_type === "big" ? -1 : 1))
                              .map((sq) => (
                                <span
                                  key={sq.size_type}
                                  className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                                >
                                  <span className="font-bold">{sq.size_label}</span>
                                  <span className="mx-1">×</span>
                                  <span className="font-bold">{sq.total_quantity}</span>
                                </span>
                              ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          header,
          .no-print,
          .print-hide {
            display: none !important;
          }
          main {
            padding: 0 !important;
          }
          .print-date-range {
            display: block !important;
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 20px;
            padding: 10px;
            border-bottom: 2px solid #000;
          }
        }
        @media screen {
          .print-date-range {
            display: none;
          }
        }
      `}</style>
    </div>
    </AuthGuard>
  );
}