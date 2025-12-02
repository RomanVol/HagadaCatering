"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Category, FoodItem, LiterSize, MeasurementType } from "@/types";

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

        setCategories(categoriesData || []);
        
        // Add measurement_type fallback for existing items that don't have it
        const itemsWithMeasurementType = (foodItemsData || []).map((item) => ({
          ...item,
          measurement_type: (item.measurement_type || 
            (item.has_liters ? "liters" : "none")) as MeasurementType,
        }));
        setFoodItems(itemsWithMeasurementType);
        
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
