import { createClient } from "@supabase/supabase-js";
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

async function updateSalads() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get salads category
  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("*")
    .eq("name_en", "salads")
    .single();

  if (catError || !categories) {
    console.error("Error finding salads category:", catError);
    process.exit(1);
  }

  const saladsCategoryId = categories.id;
  console.log("Salads category ID:", saladsCategoryId);

  // Delete all existing salads (permanently)
  const { error: deleteError } = await supabase
    .from("food_items")
    .delete()
    .eq("category_id", saladsCategoryId);

  if (deleteError) {
    console.error("Error deleting existing salads:", deleteError);
    process.exit(1);
  }

  console.log("Deleted existing salads");

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
    console.error("Error inserting new salads:", insertError);
    process.exit(1);
  }

  console.log(`Successfully inserted ${insertedSalads?.length} salads:`);
  insertedSalads?.forEach((salad, i) => {
    console.log(`  ${i + 1}. ${salad.name}`);
  });
}

updateSalads();
