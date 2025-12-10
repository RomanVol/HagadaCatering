"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { v4 as uuidv4 } from "uuid";

// New salad list
const NEW_SALADS = [
  "מטבוחה",
  "חציל מטוגן",
  "כרוב סגול",
  "חציל זעלוק",
  "חציל בלאדי",
  "סלק",
  "גזר מבושל",
  "גזר חי",
  "פלפל חריף",
  "חומוס",
  "טחינה",
  "ערבי",
  "ירקות",
  "חסה",
  "כרוב",
  "חמוצי הבית",
  "זיתים",
  "מלפפון בשמיר",
  "קונסולו",
  "כרוב אדום במיונז",
  "כרוב אדום חמוץ",
  "תירס ופתריות",
  "פול",
  "מיונז",
  "טאבולה ירוק",
  "לימון צ'רמלה",
  "ירק פיצוחים",
];

export default function UpdateSaladsPage() {
  const [status, setStatus] = React.useState<string>("Ready to update");
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [result, setResult] = React.useState<string[]>([]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    setStatus("Updating...");
    setResult([]);

    try {
      const supabase = createClient();

      // Get salads category
      const { data: category, error: catError } = await supabase
        .from("categories")
        .select("*")
        .eq("name_en", "salads")
        .single();

      if (catError || !category) {
        setStatus(`Error finding salads category: ${catError?.message}`);
        setIsUpdating(false);
        return;
      }

      const saladsCategoryId = category.id;
      setResult((prev) => [...prev, `Found salads category: ${saladsCategoryId}`]);

      // First get existing salads to delete their add-ons
      const { data: existingSalads } = await supabase
        .from("food_items")
        .select("id")
        .eq("category_id", saladsCategoryId);

      if (existingSalads && existingSalads.length > 0) {
        const saladIds = existingSalads.map((s) => s.id);
        setResult((prev) => [...prev, `Found ${saladIds.length} existing salads to delete`]);

        // Delete add-ons for these salads
        await supabase
          .from("food_item_add_ons")
          .delete()
          .in("parent_food_item_id", saladIds);

        setResult((prev) => [...prev, "Deleted add-ons for existing salads"]);
      }

      // Delete all existing salads
      const { error: deleteError } = await supabase
        .from("food_items")
        .delete()
        .eq("category_id", saladsCategoryId);

      if (deleteError) {
        setStatus(`Error deleting salads: ${deleteError.message}`);
        setIsUpdating(false);
        return;
      }

      setResult((prev) => [...prev, "Deleted existing salads"]);

      // Insert new salads
      const newSalads = NEW_SALADS.map((name, index) => ({
        id: uuidv4(),
        name,
        category_id: saladsCategoryId,
        has_liters: true,
        measurement_type: "liters",
        is_active: true,
        sort_order: index + 1,
      }));

      const { data: insertedSalads, error: insertError } = await supabase
        .from("food_items")
        .insert(newSalads)
        .select();

      if (insertError) {
        setStatus(`Error inserting salads: ${insertError.message}`);
        setIsUpdating(false);
        return;
      }

      setResult((prev) => [
        ...prev,
        `Successfully inserted ${insertedSalads?.length} salads:`,
        ...(insertedSalads?.map((s, i) => `  ${i + 1}. ${s.name}`) || []),
      ]);

      setStatus("✅ Update complete!");
    } catch (error) {
      setStatus(`Unexpected error: ${String(error)}`);
    }

    setIsUpdating(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">עדכון רשימת סלטים</h1>

        <div className="bg-white rounded-lg border p-6 mb-6">
          <h2 className="font-semibold mb-4">סלטים חדשים ({NEW_SALADS.length}):</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {NEW_SALADS.map((salad, i) => (
              <div key={i} className="bg-gray-100 px-2 py-1 rounded">
                {i + 1}. {salad}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleUpdate}
          disabled={isUpdating}
          className="w-full bg-red-500 text-white font-bold py-4 rounded-lg hover:bg-red-600 disabled:opacity-50 mb-6"
        >
          {isUpdating ? "מעדכן..." : "🗑️ מחק את כל הסלטים הישנים והוסף את החדשים"}
        </button>

        <div className="bg-gray-800 text-green-400 rounded-lg p-4 font-mono text-sm">
          <div className="mb-2">Status: {status}</div>
          {result.length > 0 && (
            <div className="border-t border-gray-600 pt-2 mt-2">
              {result.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
