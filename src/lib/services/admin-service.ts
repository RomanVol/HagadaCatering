import { createClient } from "@/lib/supabase/client";
import { FoodItem, Category, MeasurementType, FoodItemPreparation, FoodItemAddOn } from "@/types";
import { v4 as uuidv4 } from "uuid";

export interface CreateFoodItemInput {
  name: string;
  category_id: string;
  measurement_type: MeasurementType;
}

export interface UpdateFoodItemInput {
  id: string;
  name?: string;
  measurement_type?: MeasurementType;
  is_active?: boolean;
  sort_order?: number;
  portion_multiplier?: number | null;
  portion_unit?: string | null;
}

/**
 * Get all categories
 */
export async function getCategories(): Promise<Category[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }

  return data || [];
}

/**
 * Get all food items, optionally filtered by category
 */
export async function getFoodItems(categoryId?: string): Promise<FoodItem[]> {
  const supabase = createClient();

  let query = supabase
    .from("food_items")
    .select("*")
    .order("sort_order");

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching food items:", error);
    return [];
  }

  // Add default measurement_type for items that don't have it
  return (data || []).map((item) => ({
    ...item,
    measurement_type: item.measurement_type || (item.has_liters ? "liters" : "none"),
  }));
}

/**
 * Create a new food item
 */
export async function createFoodItem(
  input: CreateFoodItemInput
): Promise<{ success: boolean; item?: FoodItem; error?: string }> {
  const supabase = createClient();

  // Get the max sort_order for the category
  const { data: existingItems } = await supabase
    .from("food_items")
    .select("sort_order")
    .eq("category_id", input.category_id)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextSortOrder = existingItems && existingItems.length > 0 
    ? existingItems[0].sort_order + 1 
    : 1;

  const newItem = {
    id: uuidv4(),
    name: input.name,
    category_id: input.category_id,
    has_liters: input.measurement_type === "liters" || input.measurement_type === "size",
    measurement_type: input.measurement_type,
    is_active: true,
    sort_order: nextSortOrder,
  };

  const { data, error } = await supabase
    .from("food_items")
    .insert(newItem)
    .select()
    .single();

  if (error) {
    console.error("Error creating food item:", error);
    return { success: false, error: error.message };
  }

  return { success: true, item: data };
}

/**
 * Update a food item
 */
export async function updateFoodItem(
  input: UpdateFoodItemInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const updates: Record<string, unknown> = {};
  
  if (input.name !== undefined) updates.name = input.name;
  if (input.measurement_type !== undefined) {
    updates.measurement_type = input.measurement_type;
    updates.has_liters = input.measurement_type === "liters" || input.measurement_type === "size";
  }
  if (input.is_active !== undefined) updates.is_active = input.is_active;
  if (input.sort_order !== undefined) updates.sort_order = input.sort_order;
  if (input.portion_multiplier !== undefined) updates.portion_multiplier = input.portion_multiplier;
  if (input.portion_unit !== undefined) updates.portion_unit = input.portion_unit;

  const { error } = await supabase
    .from("food_items")
    .update(updates)
    .eq("id", input.id);

  if (error) {
    console.error("Error updating food item:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Delete a food item (soft delete by setting is_active to false)
 */
export async function deleteFoodItem(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  // Soft delete - set is_active to false
  const { error } = await supabase
    .from("food_items")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    console.error("Error deleting food item:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Permanently delete a food item
 */
export async function permanentlyDeleteFoodItem(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  // Check if the item is used in any orders
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("id")
    .eq("food_item_id", id)
    .limit(1);

  if (orderItems && orderItems.length > 0) {
    return { 
      success: false, 
      error: "לא ניתן למחוק פריט שקיים בהזמנות. השתמש במחיקה רכה (ביטול הפעלה)" 
    };
  }

  const { error } = await supabase
    .from("food_items")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error permanently deleting food item:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Restore a soft-deleted food item
 */
export async function restoreFoodItem(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .from("food_items")
    .update({ is_active: true })
    .eq("id", id);

  if (error) {
    console.error("Error restoring food item:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ========== Preparation Management ==========

export interface CreatePreparationInput {
  parent_food_item_id: string;
  name: string;
}

export interface UpdatePreparationInput {
  id: string;
  name?: string;
  is_active?: boolean;
  sort_order?: number;
}

/**
 * Get preparations for a food item
 */
export async function getPreparations(foodItemId: string): Promise<FoodItemPreparation[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("food_item_preparations")
    .select("*")
    .eq("parent_food_item_id", foodItemId)
    .order("sort_order");

  if (error) {
    console.error("Error fetching preparations:", error);
    return [];
  }

  return data || [];
}

/**
 * Create a new preparation option
 */
export async function createPreparation(
  input: CreatePreparationInput
): Promise<{ success: boolean; preparation?: FoodItemPreparation; error?: string }> {
  const supabase = createClient();

  // Get the max sort_order for the food item
  const { data: existingPreps } = await supabase
    .from("food_item_preparations")
    .select("sort_order")
    .eq("parent_food_item_id", input.parent_food_item_id)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextSortOrder = existingPreps && existingPreps.length > 0 
    ? existingPreps[0].sort_order + 1 
    : 1;

  const newPrep = {
    id: uuidv4(),
    parent_food_item_id: input.parent_food_item_id,
    name: input.name,
    is_active: true,
    sort_order: nextSortOrder,
  };

  const { data, error } = await supabase
    .from("food_item_preparations")
    .insert(newPrep)
    .select()
    .single();

  if (error) {
    console.error("Error creating preparation:", error);
    return { success: false, error: error.message };
  }

  return { success: true, preparation: data };
}

/**
 * Update a preparation option
 */
export async function updatePreparation(
  input: UpdatePreparationInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const updates: Record<string, unknown> = {};
  
  if (input.name !== undefined) updates.name = input.name;
  if (input.is_active !== undefined) updates.is_active = input.is_active;
  if (input.sort_order !== undefined) updates.sort_order = input.sort_order;

  const { error } = await supabase
    .from("food_item_preparations")
    .update(updates)
    .eq("id", input.id);

  if (error) {
    console.error("Error updating preparation:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Delete a preparation option
 */
export async function deletePreparation(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  // Soft delete - set is_active to false
  const { error } = await supabase
    .from("food_item_preparations")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    console.error("Error deleting preparation:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Permanently delete a preparation option
 */
export async function permanentlyDeletePreparation(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .from("food_item_preparations")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error permanently deleting preparation:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ========== Add-On Management (תוספות אופציונליות) ==========

export interface CreateAddOnInput {
  parent_food_item_id: string;
  name: string;
  measurement_type: MeasurementType;
}

export interface UpdateAddOnInput {
  id: string;
  name?: string;
  measurement_type?: MeasurementType;
  is_active?: boolean;
  sort_order?: number;
}

/**
 * Get add-ons for a food item
 */
export async function getAddOns(foodItemId: string): Promise<FoodItemAddOn[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("food_item_add_ons")
    .select("*")
    .eq("parent_food_item_id", foodItemId)
    .order("sort_order");

  if (error) {
    console.error("Error fetching add-ons:", error);
    return [];
  }

  return data || [];
}

/**
 * Create a new add-on
 */
export async function createAddOn(
  input: CreateAddOnInput
): Promise<{ success: boolean; addOn?: FoodItemAddOn; error?: string }> {
  const supabase = createClient();

  // Get the max sort_order for the food item
  const { data: existingAddOns } = await supabase
    .from("food_item_add_ons")
    .select("sort_order")
    .eq("parent_food_item_id", input.parent_food_item_id)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextSortOrder = existingAddOns && existingAddOns.length > 0
    ? existingAddOns[0].sort_order + 1
    : 1;

  const newAddOn = {
    id: uuidv4(),
    parent_food_item_id: input.parent_food_item_id,
    name: input.name,
    measurement_type: input.measurement_type,
    is_active: true,
    sort_order: nextSortOrder,
  };

  const { data, error } = await supabase
    .from("food_item_add_ons")
    .insert(newAddOn)
    .select()
    .single();

  if (error) {
    console.error("Error creating add-on:", error);
    return { success: false, error: error.message };
  }

  return { success: true, addOn: data };
}

/**
 * Update an add-on
 */
export async function updateAddOn(
  input: UpdateAddOnInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const updates: Record<string, unknown> = {};

  if (input.name !== undefined) updates.name = input.name;
  if (input.measurement_type !== undefined) updates.measurement_type = input.measurement_type;
  if (input.is_active !== undefined) updates.is_active = input.is_active;
  if (input.sort_order !== undefined) updates.sort_order = input.sort_order;

  const { error } = await supabase
    .from("food_item_add_ons")
    .update(updates)
    .eq("id", input.id);

  if (error) {
    console.error("Error updating add-on:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Delete an add-on (soft delete)
 */
export async function deleteAddOn(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  // Soft delete - set is_active to false
  const { error } = await supabase
    .from("food_item_add_ons")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    console.error("Error deleting add-on:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Permanently delete an add-on
 */
export async function permanentlyDeleteAddOn(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .from("food_item_add_ons")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error permanently deleting add-on:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
