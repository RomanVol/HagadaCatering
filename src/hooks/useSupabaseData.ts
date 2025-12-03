"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Category, FoodItem, FoodItemAddOn, FoodItemPreparation, FoodItemVariation, LiterSize, MeasurementType } from "@/types";

interface UseSupabaseDataResult {
  categories: Category[];
  foodItems: FoodItem[];
  literSizes: LiterSize[];
  isLoading: boolean;
  error: string | null;
}

export function useSupabaseData(): UseSupabaseDataResult {
  const [categories, setCategories] = useState<Category[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [literSizes, setLiterSizes] = useState<LiterSize[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      try {
        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("categories")
          .select("*")
          .order("sort_order");

        if (categoriesError) throw categoriesError;

        // Fetch food items
        const { data: foodItemsData, error: foodItemsError } = await supabase
          .from("food_items")
          .select("*")
          .eq("is_active", true)
          .order("sort_order");

        if (foodItemsError) throw foodItemsError;

        // Fetch liter sizes
        const { data: literSizesData, error: literSizesError } = await supabase
          .from("liter_sizes")
          .select("*")
          .order("sort_order");

        if (literSizesError) throw literSizesError;

        // Fetch add-ons for food items
        let addOnsData: FoodItemAddOn[] = [];
        try {
          const { data, error: addOnsError } = await supabase
            .from("food_item_add_ons")
            .select("*")
            .eq("is_active", true)
            .order("sort_order");
          
          if (!addOnsError && data) {
            addOnsData = data;
          }
        } catch {
          // Table might not exist yet, ignore
          console.log("Add-ons table not available yet");
        }

        // Fetch preparations for food items
        let preparationsData: FoodItemPreparation[] = [];
        try {
          const { data, error: preparationsError } = await supabase
            .from("food_item_preparations")
            .select("*")
            .eq("is_active", true)
            .order("sort_order");
          
          if (!preparationsError && data) {
            preparationsData = data;
          }
        } catch {
          // Table might not exist yet, ignore
          console.log("Preparations table not available yet");
        }

        // Fetch variations for food items (e.g., rice types)
        let variationsData: FoodItemVariation[] = [];
        try {
          const { data, error: variationsError } = await supabase
            .from("food_item_variations")
            .select("*")
            .eq("is_active", true)
            .order("sort_order");
          
          if (!variationsError && data) {
            variationsData = data;
          }
        } catch {
          // Table might not exist yet, ignore
          console.log("Variations table not available yet");
        }

        setCategories(categoriesData || []);
        
        // Add measurement_type fallback and attach add-ons, preparations, and variations
        const itemsWithExtras = (foodItemsData || []).map((item) => {
          const itemAddOns = addOnsData.filter(
            (addon) => addon.parent_food_item_id === item.id
          );
          const itemPreparations = preparationsData.filter(
            (prep) => prep.parent_food_item_id === item.id
          );
          const itemVariations = variationsData.filter(
            (variation) => variation.parent_food_item_id === item.id
          );
          return {
            ...item,
            measurement_type: (item.measurement_type || 
              (item.has_liters ? "liters" : "none")) as MeasurementType,
            add_ons: itemAddOns.length > 0 ? itemAddOns : undefined,
            preparations: itemPreparations.length > 0 ? itemPreparations : undefined,
            variations: itemVariations.length > 0 ? itemVariations : undefined,
          };
        });
        setFoodItems(itemsWithExtras);
        
        setLiterSizes(literSizesData || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  return { categories, foodItems, literSizes, isLoading, error };
}

// Helper to get food items by category
export function getFoodItemsByCategoryName(
  foodItems: FoodItem[],
  categories: Category[],
  categoryNameEn: string
): FoodItem[] {
  const category = categories.find((c) => c.name_en === categoryNameEn);
  if (!category) return [];
  return foodItems.filter((item) => item.category_id === category.id);
}
