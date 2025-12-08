"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";

export default function DebugPage() {
  const [data, setData] = React.useState<{
    categories: number;
    foodItems: number;
    customers: number;
    orders: number;
    orderItems: number;
    latestOrders: unknown[];
  } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient();

        const [
          { count: catCount },
          { count: foodCount },
          { count: custCount },
          { count: ordCount },
          { count: itemCount },
          { data: latestOrders },
        ] = await Promise.all([
          supabase.from("categories").select("*", { count: "exact", head: true }),
          supabase.from("food_items").select("*", { count: "exact", head: true }),
          supabase.from("customers").select("*", { count: "exact", head: true }),
          supabase.from("orders").select("*", { count: "exact", head: true }),
          supabase.from("order_items").select("*", { count: "exact", head: true }),
          supabase
            .from("orders")
            .select("*, customer:customers(*)")
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

        setData({
          categories: catCount || 0,
          foodItems: foodCount || 0,
          customers: custCount || 0,
          orders: ordCount || 0,
          orderItems: itemCount || 0,
          latestOrders: latestOrders || [],
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <h1 className="text-2xl font-bold mb-4">טוען נתונים...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <h1 className="text-2xl font-bold mb-4 text-red-600">שגיאה</h1>
        <pre className="bg-red-100 p-4 rounded">{error}</pre>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8" dir="rtl">
      <h1 className="text-2xl font-bold mb-6">דיבאג - מצב בסיס הנתונים</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border">
          <div className="text-sm text-gray-600">קטגוריות</div>
          <div className="text-3xl font-bold text-blue-600">{data?.categories}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <div className="text-sm text-gray-600">פריטי מזון</div>
          <div className="text-3xl font-bold text-blue-600">{data?.foodItems}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <div className="text-sm text-gray-600">לקוחות</div>
          <div className="text-3xl font-bold text-green-600">{data?.customers}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <div className="text-sm text-gray-600">הזמנות</div>
          <div className="text-3xl font-bold text-orange-600">{data?.orders}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <div className="text-sm text-gray-600">פריטי הזמנה</div>
          <div className="text-3xl font-bold text-purple-600">{data?.orderItems}</div>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">5 הזמנות אחרונות:</h2>
      {data?.latestOrders.length === 0 ? (
        <div className="bg-yellow-100 p-4 rounded-xl text-yellow-800">
          <p className="font-bold">אין הזמנות בבסיס הנתונים!</p>
          <p className="mt-2">
            כדי לראות סיכום כמויות, צריך קודם ליצור הזמנה:
          </p>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>לך לעמוד הבית ולחץ על &ldquo;הזמנה חדשה&rdquo;</li>
            <li>מלא פרטי לקוח (לפחות טלפון)</li>
            <li>בחר פריטים וכמויות</li>
            <li>לחץ על כפתור &ldquo;שמור&rdquo; (לא &ldquo;הדפס&rdquo;!)</li>
            <li>חזור לעמוד סיכום ולחץ &ldquo;סנן&rdquo;</li>
          </ol>
        </div>
      ) : (
        <div className="space-y-2">
          {data?.latestOrders.map((order: unknown, i: number) => {
            const o = order as {
              id: string;
              order_number: number;
              order_date: string;
              status: string;
              customer?: { name: string; phone: string } | null;
            };
            return (
              <div key={o.id} className="bg-white p-4 rounded-xl border">
                <div className="flex items-center gap-4">
                  <span className="text-blue-600 font-bold">#{o.order_number}</span>
                  <span>{o.customer?.name || "ללא שם"}</span>
                  <span className="text-gray-500">{o.customer?.phone}</span>
                  <span className="text-gray-400">{o.order_date}</span>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      o.status === "active"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {o.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8">
        <a
          href="/"
          className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-600"
        >
          חזרה לעמוד הבית
        </a>
      </div>
    </div>
  );
}
