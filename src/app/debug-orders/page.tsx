"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";

export default function DebugOrdersPage() {
  const [data, setData] = React.useState<{
    orderItems: unknown[];
    addOns: unknown[];
  } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [deleteDate, setDeleteDate] = React.useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteResult, setDeleteResult] = React.useState<string | null>(null);
  const [ordersToDelete, setOrdersToDelete] = React.useState<number>(0);

  const fetchData = React.useCallback(async () => {
    const supabase = createClient();

    // Get today's orders
    const today = new Date().toISOString().split("T")[0];
    
    const { data: orders } = await supabase
      .from("orders")
      .select("id")
      .eq("order_date", today);

    const orderIds = orders?.map(o => o.id) || [];

    const { data: items } = await supabase
      .from("order_items")
      .select(`
        *,
        food_item:food_items(id, name, category_id),
        liter_size:liter_sizes(id, label, size)
      `)
      .in("order_id", orderIds.length > 0 ? orderIds : ['none']);

    // Get add-ons
    const { data: addOns } = await supabase
      .from("food_item_add_ons")
      .select("*");

    setData({
      orderItems: items || [],
      addOns: addOns || [],
    });
    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Check how many orders exist for the selected date
  const checkOrdersForDate = React.useCallback(async (date: string) => {
    const supabase = createClient();
    const { count } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("order_date", date);
    setOrdersToDelete(count || 0);
  }, []);

  React.useEffect(() => {
    checkOrdersForDate(deleteDate);
  }, [deleteDate, checkOrdersForDate]);

  const handleDeleteOrders = async () => {
    if (ordersToDelete === 0) {
      setDeleteResult("אין הזמנות למחיקה בתאריך זה");
      return;
    }

    const confirmed = window.confirm(
      `האם אתה בטוח שברצונך למחוק ${ordersToDelete} הזמנות מתאריך ${deleteDate}?\n\nפעולה זו בלתי הפיכה!`
    );

    if (!confirmed) return;

    setIsDeleting(true);
    setDeleteResult(null);

    try {
      const supabase = createClient();

      // Get order IDs for the date
      const { data: orders } = await supabase
        .from("orders")
        .select("id")
        .eq("order_date", deleteDate);

      if (!orders || orders.length === 0) {
        setDeleteResult("אין הזמנות למחיקה");
        setIsDeleting(false);
        return;
      }

      const orderIds = orders.map(o => o.id);

      // Delete order items first (due to foreign key constraint)
      const { error: itemsError } = await supabase
        .from("order_items")
        .delete()
        .in("order_id", orderIds);

      if (itemsError) {
        setDeleteResult(`שגיאה במחיקת פריטי הזמנה: ${itemsError.message}`);
        setIsDeleting(false);
        return;
      }

      // Delete orders
      const { error: ordersError } = await supabase
        .from("orders")
        .delete()
        .eq("order_date", deleteDate);

      if (ordersError) {
        setDeleteResult(`שגיאה במחיקת הזמנות: ${ordersError.message}`);
        setIsDeleting(false);
        return;
      }

      setDeleteResult(`נמחקו בהצלחה ${orderIds.length} הזמנות מתאריך ${deleteDate}`);
      setOrdersToDelete(0);
      
      // Refresh data
      fetchData();
    } catch (error) {
      setDeleteResult(`שגיאה: ${error instanceof Error ? error.message : "שגיאה לא ידועה"}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <div className="p-8">טוען...</div>;
  }

  return (
    <div className="p-8" dir="rtl">
      <h1 className="text-2xl font-bold mb-6">דיבאג - פריטי הזמנות מהיום</h1>

      {/* Delete Orders Section */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
        <h2 className="text-xl font-bold mb-4 text-red-700">🗑️ מחיקת הזמנות לפי תאריך</h2>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">בחר תאריך:</label>
            <input
              type="date"
              value={deleteDate}
              onChange={(e) => setDeleteDate(e.target.value)}
              className="h-10 px-3 rounded-lg border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200"
            />
          </div>
          <div className="text-sm">
            <span className="text-gray-600">הזמנות בתאריך זה: </span>
            <span className="font-bold text-lg text-red-600">{ordersToDelete}</span>
          </div>
          <button
            onClick={handleDeleteOrders}
            disabled={isDeleting || ordersToDelete === 0}
            className="h-10 px-6 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isDeleting ? "מוחק..." : `מחק ${ordersToDelete} הזמנות`}
          </button>
        </div>
        {deleteResult && (
          <div className={`mt-3 p-3 rounded-lg text-sm ${
            deleteResult.includes("בהצלחה") 
              ? "bg-green-100 text-green-800" 
              : deleteResult.includes("אין") 
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
          }`}>
            {deleteResult}
          </div>
        )}
      </div>

      <h2 className="text-xl font-bold mb-4">תוספות זמינות:</h2>
      <pre className="bg-gray-100 p-4 rounded mb-8 overflow-auto text-sm">
        {JSON.stringify(data?.addOns, null, 2)}
      </pre>

      <h2 className="text-xl font-bold mb-4">פריטי הזמנות ({data?.orderItems.length}):</h2>
      <div className="space-y-4">
        {data?.orderItems.map((item: unknown, i: number) => {
          const it = item as {
            id: string;
            food_item_id: string;
            add_on_id: string | null;
            liter_size_id: string | null;
            size_type: string | null;
            quantity: number;
            food_item?: { id: string; name: string };
            liter_size?: { id: string; label: string };
          };
          return (
            <div key={it.id} className="bg-white border p-4 rounded-lg">
              <div className="font-bold text-blue-600">{it.food_item?.name}</div>
              <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                <div>כמות: <span className="font-bold">{it.quantity}</span></div>
                <div>ליטר: <span className="font-bold">{it.liter_size?.label || "-"}</span></div>
                <div>גודל: <span className="font-bold">{it.size_type || "-"}</span></div>
                <div>add_on_id: <span className="font-bold text-purple-600">{it.add_on_id || "-"}</span></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        <a href="/summary" className="text-blue-500 underline">חזרה לסיכום</a>
      </div>
    </div>
  );
}
