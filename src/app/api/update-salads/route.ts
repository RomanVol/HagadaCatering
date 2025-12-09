import { createBrowserClient } from "@supabase/ssr";
import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";

function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

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

export async function GET() {
  try {
    const supabase = createClient();

    // Get salads category
    const { data: category, error: catError } = await supabase
      .from("categories")
      .select("*")
      .eq("name_en", "salads")
      .single();

    if (catError || !category) {
      return NextResponse.json(
        { error: "Error finding salads category", details: catError },
        { status: 500 }
      );
    }

    const saladsCategoryId = category.id;

    // First delete add-ons for salads in this category
    const { data: existingSalads } = await supabase
      .from("food_items")
      .select("id")
      .eq("category_id", saladsCategoryId);

    if (existingSalads && existingSalads.length > 0) {
      const saladIds = existingSalads.map((s) => s.id);

      // Delete add-ons for these salads
      await supabase
        .from("food_item_add_ons")
        .delete()
        .in("parent_food_item_id", saladIds);
    }

    // Delete all existing salads (permanently)
    const { error: deleteError } = await supabase
      .from("food_items")
      .delete()
      .eq("category_id", saladsCategoryId);

    if (deleteError) {
      return NextResponse.json(
        { error: "Error deleting existing salads", details: deleteError },
        { status: 500 }
      );
    }

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
      return NextResponse.json(
        { error: "Error inserting new salads", details: insertError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully updated salads: deleted old ones and inserted ${insertedSalads?.length} new salads`,
      salads: insertedSalads?.map((s) => s.name),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Unexpected error", details: String(error) },
      { status: 500 }
    );
  }
}
