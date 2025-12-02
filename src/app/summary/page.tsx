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
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getOrdersByDateRange,
  getOrdersSummary,
  OrderWithDetails,
  CategorySummary,
} from "@/lib/services/order-service";
import { useSupabaseData } from "@/hooks/useSupabaseData";

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
};

type ViewMode = "orders" | "summary";
type FilterMode = "all" | "categories" | "items";

export default function SummaryPage() {
  const router = useRouter();
  const { categories, foodItems, literSizes, isLoading: dataLoading } = useSupabaseData();

  // Date range state
  const [fromDate, setFromDate] = React.useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = React.useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

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

  // Fetch orders when filter is applied
  const handleFilter = async () => {
    setIsLoading(true);
    setHasSearched(true);

    try {
      const [ordersData, summaryData] = await Promise.all([
        getOrdersByDateRange(fromDate, toDate),
        getOrdersSummary(fromDate, toDate),
      ]);
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

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">{LABELS.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
            <span>{LABELS.back}</span>
          </button>
          <h1 className="text-xl font-bold text-gray-900">{LABELS.title}</h1>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Printer className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Date Range Filter */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium text-gray-700">
                {LABELS.fromDate}
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full h-12 px-4 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium text-gray-700">
                {LABELS.toDate}
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full h-12 px-4 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>
            <button
              onClick={handleFilter}
              disabled={isLoading}
              className="h-12 px-6 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Filter className="w-5 h-5" />
              )}
              <span>{LABELS.filter}</span>
            </button>
          </div>
        </div>

        {/* View Toggle */}
        {hasSearched && orders.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("orders")}
              className={cn(
                "flex-1 h-12 font-semibold rounded-lg transition-all",
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
                "flex-1 h-12 font-semibold rounded-lg transition-all",
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
                    <div className="flex items-center gap-3 mb-2">
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
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-gray-800">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">
                          {order.customer?.name || "ללא שם"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span dir="ltr">{order.customer?.phone || "ללא טלפון"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>
                          {formatDate(order.order_date)}
                          {order.order_time && ` | ${order.order_time}`}
                        </span>
                      </div>
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
                          {group.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between text-sm py-1"
                            >
                              <span className="text-gray-700">
                                {item.food_item?.name}
                              </span>
                              <span className="text-gray-900 font-medium">
                                {item.liter_size
                                  ? `${item.liter_size.label} × ${item.quantity}`
                                  : `× ${item.quantity}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {order.items.length === 0 && (
                      <p className="text-gray-500 text-sm text-center py-4">
                        אין פריטים בהזמנה
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Summary View */}
        {!isLoading && viewMode === "summary" && summary.length > 0 && (
          <div className="space-y-4">
            {/* Filter Options */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
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
                    {category.items.map((item) => (
                      <div key={item.food_item_id} className="p-4">
                        <div className="flex items-start justify-between">
                          <span className="font-medium text-gray-800">
                            {item.food_name}
                          </span>
                          {!item.has_liters && (
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
                              {item.total_quantity}
                            </span>
                          )}
                        </div>
                        {item.has_liters && item.liter_quantities && (
                          <div className="flex flex-wrap gap-2 mt-2">
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
          .no-print {
            display: none !important;
          }
          main {
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
