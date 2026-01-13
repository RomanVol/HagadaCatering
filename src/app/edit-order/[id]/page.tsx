"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SaladCard, SaladLiterPopup } from "@/components/orders/SaladSelector";
import { FoodItemCard, FoodItemPopup } from "@/components/orders/FoodItemSelector";
import { LABELS } from "@/lib/constants/labels";
import { cn } from "@/lib/utils";
import { ArrowRight, Save, Loader2, Trash2 } from "lucide-react";
import { getOrderWithItems, updateOrder } from "@/lib/services/order-service";
import { useSupabaseData, getFoodItemsByCategoryName } from "@/hooks/useSupabaseData";
import { MeasurementType } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { AuthGuard } from "@/components/auth/AuthGuard";

// Types for form state (same as OrderForm)
interface AddOnFormItem {
  addon_id: string;
  quantity: number;
  liters: { liter_size_id: string; quantity: number }[];
}

interface SaladFormItem {
  food_item_id: string;
  selected: boolean;
  measurement_type: MeasurementType;
  isBulkApplied: boolean;
  liters: { liter_size_id: string; quantity: number }[];
  size_big: number;
  size_small: number;
  regular_quantity: number;
  addOns: AddOnFormItem[];
  note: string;
}

interface RegularFormItem {
  food_item_id: string;
  selected: boolean;
  quantity: number;
  preparation_id?: string;
  preparation_name?: string;
  note?: string;
}

// Extras form item - supports all measurement types
interface ExtrasFormItem {
  food_item_id: string;
  selected: boolean;
  measurement_type: MeasurementType;
  liters: { liter_size_id: string; quantity: number }[];
  size_big: number;
  size_small: number;
  quantity: number;
  preparation_id?: string;
  preparation_name?: string;
  note?: string;
  price?: number;
}

interface SidesFormItem {
  food_item_id: string;
  selected: boolean;
  measurement_type: "liters" | "size" | "none";
  liters: { liter_size_id: string; quantity: number }[];
  size_big: number;
  size_small: number;
  quantity: number;
  preparation_id?: string;
  preparation_name?: string;
  note?: string;
  variations?: { variation_id: string; size_big: number; size_small: number }[];
}

// Extra item entry - for items added as extras from mains/sides/middle_courses
interface ExtraItemEntry {
  id: string;
  source_food_item_id: string;
  source_category: 'mains' | 'sides' | 'middle_courses';
  name: string;
  quantity?: number;
  size_big?: number;
  size_small?: number;
  variations?: { variation_id: string; name: string; size_big: number; size_small: number }[];
  price: number;
  note?: string;
  preparation_name?: string;
}

interface OrderFormState {
  customer_name: string;
  phone: string;
  phone_alt: string;
  customer_time: string;
  order_date: string;
  order_time: string;
  address: string;
  notes: string;
  // Pricing fields
  total_portions: number;
  price_per_portion: number;
  delivery_fee: number;
  salads: SaladFormItem[];
  middle_courses: RegularFormItem[];
  sides: SidesFormItem[];
  mains: RegularFormItem[];
  extras: ExtrasFormItem[];
  bakery: ExtrasFormItem[];
  // Extra items from mains/sides/middle_courses with custom prices
  extra_items: ExtraItemEntry[];
}

export default function EditOrderPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  // Fetch data from Supabase
  const { categories, foodItems, literSizes, isLoading: dataLoading, error: dataError } = useSupabaseData();

  // Order loading state
  const [orderLoading, setOrderLoading] = React.useState(true);
  const [orderError, setOrderError] = React.useState<string | null>(null);
  const [orderNumber, setOrderNumber] = React.useState<number | null>(null);

  // Get categories
  const saladCategory = categories.find((c) => c.name_en === "salads");
  const middleCategory = categories.find((c) => c.name_en === "middle_courses");
  const sidesCategory = categories.find((c) => c.name_en === "sides");
  const mainsCategory = categories.find((c) => c.name_en === "mains");
  const bakeryCategory = categories.find((c) => c.name_en === "bakery");

  // Get food items by category
  const saladItems = React.useMemo(
    () => getFoodItemsByCategoryName(foodItems, categories, "salads"),
    [foodItems, categories]
  );
  const middleItems = React.useMemo(
    () => getFoodItemsByCategoryName(foodItems, categories, "middle_courses"),
    [foodItems, categories]
  );
  const sideItems = React.useMemo(
    () => getFoodItemsByCategoryName(foodItems, categories, "sides"),
    [foodItems, categories]
  );
  const mainItems = React.useMemo(
    () => getFoodItemsByCategoryName(foodItems, categories, "mains"),
    [foodItems, categories]
  );
  const extraItems = React.useMemo(
    () => getFoodItemsByCategoryName(foodItems, categories, "extras"),
    [foodItems, categories]
  );
  const bakeryItems = React.useMemo(
    () => getFoodItemsByCategoryName(foodItems, categories, "bakery"),
    [foodItems, categories]
  );

  // Initialize form state
  const [formState, setFormState] = React.useState<OrderFormState>({
    customer_name: "",
    phone: "",
    phone_alt: "",
    customer_time: "",
    order_date: "",
    order_time: "",
    address: "",
    notes: "",
    total_portions: 0,
    price_per_portion: 0,
    delivery_fee: 0,
    salads: [],
    middle_courses: [],
    sides: [],
    mains: [],
    extras: [],
    bakery: [],
    extra_items: [],
  });

  // Total extra price calculation - includes both extra_items and extras category items with prices
  const totalExtraPrice = React.useMemo(() => {
    const extraItemsTotal = formState.extra_items.reduce((sum, item) => sum + item.price, 0);
    const extrasTotal = formState.extras.reduce((sum, item) => sum + (item.price || 0), 0);
    return extraItemsTotal + extrasTotal;
  }, [formState.extra_items, formState.extras]);

  // Helper to get extra quantity for a food item (for displaying on cards)
  const getExtraForItem = React.useCallback((foodItemId: string) => {
    const extras = formState.extra_items.filter(
      e => e.source_food_item_id === foodItemId
    );

    if (extras.length === 0) return undefined;

    // If single extra, return it directly
    if (extras.length === 1) {
      const e = extras[0];
      return {
        quantity: e.quantity,
        size_big: e.size_big,
        size_small: e.size_small,
        variations: e.variations,
        price: e.price,
      };
    }

    // Multiple extras - aggregate quantities, sum prices
    const totalPrice = extras.reduce((sum, e) => sum + e.price, 0);
    return {
      quantity: extras.reduce((sum, e) => sum + (e.quantity || 0), 0),
      size_big: extras.reduce((sum, e) => sum + (e.size_big || 0), 0),
      size_small: extras.reduce((sum, e) => sum + (e.size_small || 0), 0),
      variations: extras[0].variations, // Use first item's variations
      price: totalPrice,
    };
  }, [formState.extra_items]);

  // Initialize form with food items
  const [isFormInitialized, setIsFormInitialized] = React.useState(false);

  React.useEffect(() => {
    if (!isFormInitialized && !dataLoading && foodItems.length > 0 && literSizes.length > 0) {
      setFormState((prev) => ({
        ...prev,
        salads: saladItems.map((item) => ({
          food_item_id: item.id,
          selected: false,
          measurement_type: item.measurement_type || "liters",
          isBulkApplied: false,
          liters: literSizes.map((ls) => ({
            liter_size_id: ls.id,
            quantity: 0,
          })),
          size_big: 0,
          size_small: 0,
          regular_quantity: 0,
          addOns: (item.add_ons || []).map((addon) => ({
            addon_id: addon.id,
            quantity: 0,
            liters: literSizes.map((ls) => ({
              liter_size_id: ls.id,
              quantity: 0,
            })),
          })),
          note: "",
        })),
        middle_courses: middleItems.map((item) => ({
          food_item_id: item.id,
          selected: false,
          quantity: 0,
        })),
        sides: sideItems.map((item) => ({
          food_item_id: item.id,
          selected: false,
          measurement_type: item.measurement_type || "size",
          liters: [
            ...literSizes.map((ls) => ({ liter_size_id: ls.id, quantity: 0 })),
            ...(item.custom_liters || []).filter((cl: { is_active: boolean }) => cl.is_active).map((cl: { id: string }) => ({
              liter_size_id: `custom_${cl.id}`,
              quantity: 0,
            })),
          ],
          size_big: 0,
          size_small: 0,
          quantity: 0,
          variations: (item.variations || []).map((v) => ({
            variation_id: v.id,
            size_big: 0,
            size_small: 0,
          })),
        })),
        mains: mainItems.map((item) => ({
          food_item_id: item.id,
          selected: false,
          quantity: 0,
        })),
        extras: extraItems.map((item) => ({
          food_item_id: item.id,
          selected: false,
          measurement_type: item.measurement_type || "none",
          liters: literSizes.map((ls) => ({
            liter_size_id: ls.id,
            quantity: 0,
          })),
          size_big: 0,
          size_small: 0,
          quantity: 0,
        })),
        bakery: bakeryItems.map((item) => ({
          food_item_id: item.id,
          selected: false,
          measurement_type: item.measurement_type || "none",
          liters: literSizes.map((ls) => ({
            liter_size_id: ls.id,
            quantity: 0,
          })),
          size_big: 0,
          size_small: 0,
          quantity: 0,
        })),
      }));
      setIsFormInitialized(true);
    }
  }, [isFormInitialized, dataLoading, foodItems, literSizes, saladItems, middleItems, sideItems, mainItems, extraItems, bakeryItems]);

  // Load order data and populate form
  React.useEffect(() => {
    async function loadOrder() {
      if (!isFormInitialized || !orderId) return;

      try {
        const supabase = createClient();
        
        // Get order with customer
        const { data: order, error: orderErr } = await supabase
          .from("orders")
          .select("*, customer:customers(*)")
          .eq("id", orderId)
          .single();

        if (orderErr || !order) {
          setOrderError("לא נמצאה הזמנה");
          setOrderLoading(false);
          return;
        }

        setOrderNumber(order.order_number);

        // Get order items with joins
        const { data: items } = await supabase
          .from("order_items")
          .select(`
            *,
            food_item:food_items(id, name, category_id),
            liter_size:liter_sizes(id, label, size)
          `)
          .eq("order_id", orderId);

        // Get extra order items (custom items)
        const { data: extraOrderItems, error: extraItemsErr } = await supabase
          .from("extra_order_items")
          .select(`
            *,
            variations:extra_order_item_variations(*)
          `)
          .eq("order_id", orderId);

        if (extraItemsErr) {
          console.error("Error loading extra items:", extraItemsErr);
        }

        // Populate form with order data
        setFormState((prev) => {
          const newState = { ...prev };
          
          // Customer info
          newState.customer_name = order.customer?.name || "";
          newState.phone = order.customer?.phone || "";
          newState.phone_alt = order.customer?.phone_alt || "";
          newState.customer_time = order.customer_time || "";
          newState.address = order.delivery_address || "";
          newState.order_date = order.order_date || "";
          newState.order_time = order.order_time || "";
          newState.notes = order.notes || "";
          // Pricing info
          newState.total_portions = order.total_portions || 0;
          newState.price_per_portion = order.price_per_portion || 0;
          newState.delivery_fee = order.delivery_fee || 0;

          // Populate items
          if (items) {
            for (const item of items) {
              if (!item.food_item) continue;

              const categoryId = item.food_item.category_id;
              const category = categories.find(c => c.id === categoryId);
              if (!category) continue;

              if (category.name_en === "salads") {
                const saladIndex = newState.salads.findIndex(s => s.food_item_id === item.food_item_id);
                if (saladIndex !== -1) {
                  newState.salads[saladIndex].selected = true;
                  
                  if (item.add_on_id) {
                    // This is an add-on item
                    const addOnIndex = newState.salads[saladIndex].addOns.findIndex(
                      ao => ao.addon_id === item.add_on_id
                    );
                    if (addOnIndex !== -1) {
                      if (item.liter_size_id) {
                        const literIndex = newState.salads[saladIndex].addOns[addOnIndex].liters.findIndex(
                          l => l.liter_size_id === item.liter_size_id
                        );
                        if (literIndex !== -1) {
                          newState.salads[saladIndex].addOns[addOnIndex].liters[literIndex].quantity = item.quantity;
                        }
                      } else {
                        newState.salads[saladIndex].addOns[addOnIndex].quantity = item.quantity;
                      }
                    }
                  } else if (item.liter_size_id) {
                    const literIndex = newState.salads[saladIndex].liters.findIndex(
                      l => l.liter_size_id === item.liter_size_id
                    );
                    if (literIndex !== -1) {
                      newState.salads[saladIndex].liters[literIndex].quantity = item.quantity;
                    }
                  } else if (item.size_type === "big") {
                    newState.salads[saladIndex].size_big = item.quantity;
                  } else if (item.size_type === "small") {
                    newState.salads[saladIndex].size_small = item.quantity;
                  } else {
                    newState.salads[saladIndex].regular_quantity = item.quantity;
                  }
                  
                  if (item.item_note) {
                    newState.salads[saladIndex].note = item.item_note;
                  }
                }
              } else if (category.name_en === "middle_courses") {
                const itemIndex = newState.middle_courses.findIndex(m => m.food_item_id === item.food_item_id);
                if (itemIndex !== -1) {
                  newState.middle_courses[itemIndex].selected = true;
                  newState.middle_courses[itemIndex].quantity = item.quantity;
                  if (item.preparation_id) {
                    newState.middle_courses[itemIndex].preparation_id = item.preparation_id;
                  }
                  if (item.item_note) {
                    newState.middle_courses[itemIndex].note = item.item_note;
                  }
                }
              } else if (category.name_en === "sides") {
                const itemIndex = newState.sides.findIndex(s => s.food_item_id === item.food_item_id);
                if (itemIndex !== -1) {
                  const foodItem = sideItems.find(si => si.id === item.food_item_id);
                  const measurementType = foodItem?.measurement_type || "size";

                  newState.sides[itemIndex].selected = true;

                  if (item.variation_id) {
                    const varIndex = newState.sides[itemIndex].variations?.findIndex(
                      v => v.variation_id === item.variation_id
                    );
                    if (varIndex !== undefined && varIndex !== -1 && newState.sides[itemIndex].variations) {
                      if (item.size_type === "big") {
                        newState.sides[itemIndex].variations![varIndex].size_big = item.quantity;
                      } else if (item.size_type === "small") {
                        newState.sides[itemIndex].variations![varIndex].size_small = item.quantity;
                      }
                    }
                  } else if (item.liter_size_id) {
                    // Handle liters measurement
                    const literIndex = newState.sides[itemIndex].liters?.findIndex(
                      l => l.liter_size_id === item.liter_size_id
                    );
                    if (literIndex !== undefined && literIndex !== -1 && newState.sides[itemIndex].liters) {
                      newState.sides[itemIndex].liters[literIndex].quantity = item.quantity;
                    }
                  } else if (measurementType === "size" || item.size_type) {
                    // Handle size measurement (ג׳/ק׳)
                    if (item.size_type === "big") {
                      newState.sides[itemIndex].size_big = item.quantity;
                    } else if (item.size_type === "small") {
                      newState.sides[itemIndex].size_small = item.quantity;
                    } else if (item.quantity > 0) {
                      // Fallback: if size_type is null but there's a quantity, default to size_big
                      newState.sides[itemIndex].size_big = item.quantity;
                    }
                  } else {
                    // Handle regular quantity (measurement_type="none")
                    newState.sides[itemIndex].quantity = item.quantity;
                  }

                  if (item.item_note) {
                    newState.sides[itemIndex].note = item.item_note;
                  }
                }
              } else if (category.name_en === "mains") {
                const itemIndex = newState.mains.findIndex(m => m.food_item_id === item.food_item_id);
                if (itemIndex !== -1) {
                  newState.mains[itemIndex].selected = true;
                  newState.mains[itemIndex].quantity = item.quantity;
                  if (item.preparation_id) {
                    newState.mains[itemIndex].preparation_id = item.preparation_id;
                  }
                  if (item.item_note) {
                    newState.mains[itemIndex].note = item.item_note;
                  }
                }
              } else if (category.name_en === "extras") {
                const itemIndex = newState.extras.findIndex(e => e.food_item_id === item.food_item_id);
                if (itemIndex !== -1) {
                  newState.extras[itemIndex].selected = true;
                  newState.extras[itemIndex].price = item.price || undefined;

                  // Handle different measurement types (same as salads)
                  if (item.liter_size_id) {
                    const literIndex = newState.extras[itemIndex].liters?.findIndex(
                      l => l.liter_size_id === item.liter_size_id
                    );
                    if (literIndex !== undefined && literIndex !== -1 && newState.extras[itemIndex].liters) {
                      newState.extras[itemIndex].liters[literIndex].quantity = item.quantity;
                    }
                  } else if (item.size_type === "big") {
                    newState.extras[itemIndex].size_big = item.quantity;
                  } else if (item.size_type === "small") {
                    newState.extras[itemIndex].size_small = item.quantity;
                  } else if (item.quantity > 0 && !item.liter_size_id) {
                    // Fallback: if size_type is null but there's a quantity, default to size_big for size-based items
                    // or quantity for regular items
                    const foodItem = extraItems.find(ei => ei.id === item.food_item_id);
                    if (foodItem?.measurement_type === "size") {
                      newState.extras[itemIndex].size_big = item.quantity;
                    } else {
                      newState.extras[itemIndex].quantity = item.quantity;
                    }
                  } else {
                    newState.extras[itemIndex].quantity = item.quantity;
                  }

                  if (item.item_note) {
                    newState.extras[itemIndex].note = item.item_note;
                  }
                }
              } else if (category.name_en === "bakery") {
                const itemIndex = newState.bakery.findIndex(b => b.food_item_id === item.food_item_id);
                if (itemIndex !== -1) {
                  newState.bakery[itemIndex].selected = true;
                  newState.bakery[itemIndex].quantity = item.quantity;
                  if (item.preparation_id) {
                    newState.bakery[itemIndex].preparation_id = item.preparation_id;
                  }
                  if (item.item_note) {
                    newState.bakery[itemIndex].note = item.item_note;
                  }
                }
              }
            }
          }

          // Populate extra items
          if (extraOrderItems) {
            newState.extra_items = extraOrderItems.map(item => ({
              id: item.id,
              source_food_item_id: item.source_food_item_id,
              source_category: item.source_category,
              name: item.name,
              quantity: item.quantity,
              size_big: item.size_big,
              size_small: item.size_small,
              price: item.price,
              note: item.note || undefined,
              preparation_name: item.preparation_name || undefined,
              variations: item.variations?.map((v: any) => ({
                variation_id: v.variation_id,
                name: v.name,
                size_big: v.size_big,
                size_small: v.size_small
              }))
            }));
          }

          return newState;
        });

        setOrderLoading(false);
      } catch (err) {
        setOrderError(err instanceof Error ? err.message : "שגיאה בטעינת ההזמנה");
        setOrderLoading(false);
      }
    }

    loadOrder();
  }, [isFormInitialized, orderId, categories]);

  // Track expanded items
  const [expandedSaladId, setExpandedSaladId] = React.useState<string | null>(null);
  const [expandedMiddleId, setExpandedMiddleId] = React.useState<string | null>(null);
  const [expandedSideId, setExpandedSideId] = React.useState<string | null>(null);
  const [expandedMainId, setExpandedMainId] = React.useState<string | null>(null);
  const [expandedExtraId, setExpandedExtraId] = React.useState<string | null>(null);
  const [expandedBakeryId, setExpandedBakeryId] = React.useState<string | null>(null);

  // Saving state
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  // Calculate selection counts
  const saladCount = formState.salads.filter((s) => s.selected).length;
  const middleCount = formState.middle_courses.filter((m) => m.selected).length;
  const sidesCount = formState.sides.filter((s) => s.selected).length;
  const mainsCount = formState.mains.filter((m) => m.selected).length;
  const extrasCount = formState.extras.filter((e) => e.selected).length;
  const bakeryCount = formState.bakery.filter((b) => b.selected).length;

  // Show loading state
  if (dataLoading || orderLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600">טוען הזמנה...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  // Show error state
  if (dataError || orderError) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center text-red-500">
            <p className="text-lg font-semibold mb-2">שגיאה</p>
            <p>{dataError || orderError}</p>
            <button
              onClick={() => router.push("/summary")}
              className="mt-4 text-blue-500 underline"
            >
              חזרה לסיכום
            </button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  // Handlers (same as OrderForm)
  const handleSaladToggle = (foodItemId: string, checked: boolean) => {
    setFormState((prev) => ({
      ...prev,
      salads: prev.salads.map((s) =>
        s.food_item_id === foodItemId ? { ...s, selected: checked } : s
      ),
    }));
  };

  const handleSaladLiterChange = (foodItemId: string, literSizeId: string, quantity: number) => {
    setFormState((prev) => ({
      ...prev,
      salads: prev.salads.map((s) =>
        s.food_item_id === foodItemId
          ? {
              ...s,
              liters: s.liters.map((l) =>
                l.liter_size_id === literSizeId ? { ...l, quantity } : l
              ),
            }
          : s
      ),
    }));
  };

  const handleSaladSizeChange = (foodItemId: string, size: "big" | "small", quantity: number) => {
    setFormState((prev) => ({
      ...prev,
      salads: prev.salads.map((s) =>
        s.food_item_id === foodItemId
          ? { ...s, [size === "big" ? "size_big" : "size_small"]: quantity }
          : s
      ),
    }));
  };

  const handleSaladRegularQuantityChange = (foodItemId: string, quantity: number) => {
    setFormState((prev) => ({
      ...prev,
      salads: prev.salads.map((s) =>
        s.food_item_id === foodItemId
          ? { ...s, regular_quantity: quantity, selected: quantity > 0 }
          : s
      ),
    }));
  };

  const handleAddOnLiterChange = (foodItemId: string, addonId: string, literSizeId: string, quantity: number) => {
    setFormState((prev) => ({
      ...prev,
      salads: prev.salads.map((s) =>
        s.food_item_id === foodItemId
          ? {
              ...s,
              addOns: s.addOns.map((ao) => {
                if (ao.addon_id !== addonId) return ao;

                // Check if liter entry exists
                const existingIndex = ao.liters.findIndex(
                  (l) => l.liter_size_id === literSizeId
                );

                if (existingIndex >= 0) {
                  // Update existing entry
                  return {
                    ...ao,
                    liters: ao.liters.map((l) =>
                      l.liter_size_id === literSizeId ? { ...l, quantity } : l
                    ),
                  };
                } else {
                  // Add new entry for custom liter
                  return {
                    ...ao,
                    liters: [...ao.liters, { liter_size_id: literSizeId, quantity }],
                  };
                }
              }),
            }
          : s
      ),
    }));
  };

  const handleAddOnQuantityChange = (foodItemId: string, addonId: string, quantity: number) => {
    setFormState((prev) => ({
      ...prev,
      salads: prev.salads.map((s) =>
        s.food_item_id === foodItemId
          ? {
              ...s,
              addOns: s.addOns.map((ao) =>
                ao.addon_id === addonId ? { ...ao, quantity } : ao
              ),
            }
          : s
      ),
    }));
  };

  // Handler for merging add-on quantities into linked food item
  const handleMergeAddOnToLinkedItem = (
    linkedFoodItemId: string,
    addOnQuantities: { quantity?: number; liters?: { liter_size_id: string; quantity: number }[] },
    sourceSaladName: string
  ) => {
    // Find the linked food item to look up custom liter labels
    const linkedItem = saladItems.find(s => s.id === linkedFoodItemId);

    // Special case: Skip note for זעלוק + טחינה (treated as implicit)
    const skipNote = sourceSaladName.includes("זעלוק") && linkedItem?.name.includes("טחינה");

    // Build note string (only if not skipped)
    let noteText = "";
    if (!skipNote) {
      noteText = `תוספת מ-${sourceSaladName}: `;
      if (addOnQuantities.liters && addOnQuantities.liters.length > 0) {
        const literParts = addOnQuantities.liters
          .filter(l => l.quantity > 0)
          .map(l => {
            // Check for custom liter IDs (format: custom_<uuid>)
            if (l.liter_size_id.startsWith("custom_")) {
              const customId = l.liter_size_id.replace("custom_", "");
              const customLiter = linkedItem?.custom_liters?.find(cl => cl.id === customId);
              return customLiter ? `${customLiter.label}×${l.quantity}` : `×${l.quantity}`;
            }
            // Global liter size
            const literSize = literSizes.find(ls => ls.id === l.liter_size_id);
            return literSize ? `${literSize.label}×${l.quantity}` : `×${l.quantity}`;
          });
        noteText += literParts.join(" ");
      } else if (addOnQuantities.quantity && addOnQuantities.quantity > 0) {
        noteText += `×${addOnQuantities.quantity}`;
      }
    }

    // Update linked salad item - auto-select and merge quantities
    setFormState(prev => ({
      ...prev,
      salads: prev.salads.map(salad => {
        if (salad.food_item_id !== linkedFoodItemId) return salad;

        // Merge liter quantities
        let newLiters = [...salad.liters];
        if (addOnQuantities.liters) {
          addOnQuantities.liters.forEach(addOnLiter => {
            if (addOnLiter.quantity > 0) {
              const idx = newLiters.findIndex(l => l.liter_size_id === addOnLiter.liter_size_id);
              if (idx >= 0) {
                newLiters[idx] = { ...newLiters[idx], quantity: newLiters[idx].quantity + addOnLiter.quantity };
              } else {
                newLiters.push({ liter_size_id: addOnLiter.liter_size_id, quantity: addOnLiter.quantity });
              }
            }
          });
        }

        // Append note (only if not skipped)
        let newNote = salad.note || "";
        if (!skipNote && noteText) {
          newNote = newNote ? `${newNote} | ${noteText}` : noteText;
        }

        return { ...salad, selected: true, liters: newLiters, note: newNote };
      }),
    }));
  };

  const handleSaladNoteChange = (foodItemId: string, note: string) => {
    setFormState((prev) => ({
      ...prev,
      salads: prev.salads.map((s) =>
        s.food_item_id === foodItemId ? { ...s, note } : s
      ),
    }));
  };

  const handleRegularToggle = (
    category: "middle_courses" | "mains" | "extras" | "bakery",
    foodItemId: string,
    checked: boolean
  ) => {
    setFormState((prev) => ({
      ...prev,
      [category]: prev[category].map((item) =>
        item.food_item_id === foodItemId
          ? { ...item, selected: checked }
          : item
      ),
    }));
  };

  const handleRegularQuantityChange = (
    category: "middle_courses" | "mains" | "extras" | "bakery",
    foodItemId: string,
    quantity: number
  ) => {
    setFormState((prev) => ({
      ...prev,
      [category]: prev[category].map((item) =>
        item.food_item_id === foodItemId
          ? { ...item, quantity, selected: quantity > 0 }
          : item
      ),
    }));
  };

  const handleRegularNoteChange = (
    category: "middle_courses" | "mains" | "bakery",
    foodItemId: string,
    note: string
  ) => {
    setFormState((prev) => ({
      ...prev,
      [category]: prev[category].map((item) =>
        item.food_item_id === foodItemId ? { ...item, note } : item
      ),
    }));
  };

  // Cancel handlers - reset item selection and quantities
  const handleCancelSalad = (foodItemId: string) => {
    setFormState((prev) => ({
      ...prev,
      salads: prev.salads.map((s) =>
        s.food_item_id === foodItemId
          ? {
              ...s,
              selected: false,
              liters: s.liters.map((l) => ({ ...l, quantity: 0 })),
              size_big: 0,
              size_small: 0,
              regular_quantity: 0,
              addOns: s.addOns.map((ao) => ({
                ...ao,
                quantity: 0,
                liters: ao.liters.map((l) => ({ ...l, quantity: 0 })),
              })),
              note: "",
            }
          : s
      ),
    }));
    setExpandedSaladId(null);
  };

  const handleCancelMiddleCourse = (foodItemId: string) => {
    setFormState((prev) => ({
      ...prev,
      middle_courses: prev.middle_courses.map((item) =>
        item.food_item_id === foodItemId
          ? { ...item, selected: false, quantity: 0, preparation_id: undefined, preparation_name: undefined, note: "" }
          : item
      ),
    }));
    setExpandedMiddleId(null);
  };

  const handleCancelSide = (foodItemId: string) => {
    setFormState((prev) => ({
      ...prev,
      sides: prev.sides.map((item) =>
        item.food_item_id === foodItemId
          ? {
              ...item,
              selected: false,
              size_big: 0,
              size_small: 0,
              quantity: 0,
              liters: item.liters.map((l) => ({ ...l, quantity: 0 })),
              variations: item.variations?.map((v) => ({ ...v, size_big: 0, size_small: 0 })),
              preparation_id: undefined,
              preparation_name: undefined,
              note: "",
            }
          : item
      ),
    }));
    setExpandedSideId(null);
  };

  const handleCancelMain = (foodItemId: string) => {
    setFormState((prev) => ({
      ...prev,
      mains: prev.mains.map((item) =>
        item.food_item_id === foodItemId
          ? { ...item, selected: false, quantity: 0, preparation_id: undefined, preparation_name: undefined, note: "" }
          : item
      ),
    }));
    setExpandedMainId(null);
  };

  const handleCancelExtra = (foodItemId: string) => {
    setFormState((prev) => ({
      ...prev,
      extras: prev.extras.map((item) =>
        item.food_item_id === foodItemId
          ? { ...item, selected: false, quantity: 0, size_big: 0, size_small: 0, preparation_id: undefined, preparation_name: undefined, note: "", price: 0 }
          : item
      ),
    }));
    setExpandedExtraId(null);
  };

  const handleCancelBakery = (foodItemId: string) => {
    setFormState((prev) => ({
      ...prev,
      bakery: prev.bakery.map((item) =>
        item.food_item_id === foodItemId
          ? { ...item, selected: false, quantity: 0, size_big: 0, size_small: 0, preparation_id: undefined, preparation_name: undefined, note: "" }
          : item
      ),
    }));
    setExpandedBakeryId(null);
  };

  // Extra item handlers - for adding items as extras with custom prices
  // Items are added ONLY to extra_items[], original category stays unchanged
  // If item already exists in extra_items, merge quantities
  const handleAddAsExtra = (
    sourceCategory: 'mains' | 'sides' | 'middle_courses',
    foodItemId: string,
    quantityData: {
      quantity?: number;
      size_big?: number;
      size_small?: number;
      variations?: { variation_id: string; name: string; size_big: number; size_small: number }[];
    },
    price: number,
    name: string,
    preparation_name?: string,
    note?: string
  ) => {
    setFormState((prev) => {
      // DO NOT modify original category - keep it unchanged
      // Extra stores only the extra quantity

      // Check if item already exists in extra_items
      const existingIndex = prev.extra_items.findIndex(
        e => e.source_food_item_id === foodItemId
      );

      if (existingIndex >= 0) {
        // Merge into existing extra entry
        const existing = prev.extra_items[existingIndex];
        const updated = {
          ...existing,
          quantity: (existing.quantity || 0) + (quantityData.quantity || 0),
          size_big: (existing.size_big || 0) + (quantityData.size_big || 0),
          size_small: (existing.size_small || 0) + (quantityData.size_small || 0),
          price: existing.price + price, // Sum prices
        };
        return {
          ...prev,
          extra_items: prev.extra_items.map((e, i) => i === existingIndex ? updated : e),
        };
      }

      // Create new extra entry with only the extra quantity
      return {
        ...prev,
        extra_items: [
          ...prev.extra_items,
          {
            id: crypto.randomUUID(),
            source_food_item_id: foodItemId,
            source_category: sourceCategory,
            name,
            quantity: quantityData.quantity,
            size_big: quantityData.size_big,
            size_small: quantityData.size_small,
            variations: quantityData.variations,
            price,
            note,
            preparation_name,
          },
        ],
      };
    });
  };

  const handleRemoveExtraItem = (id: string) => {
    setFormState(prev => ({
      ...prev,
      extra_items: prev.extra_items.filter(e => e.id !== id),
    }));
  };

  const handleEditExtraItemPrice = (id: string, newPrice: number) => {
    setFormState(prev => ({
      ...prev,
      extra_items: prev.extra_items.map(e =>
        e.id === id ? { ...e, price: newPrice } : e
      ),
    }));
  };

  // Extras category handlers - supports all measurement types
  const handleExtrasToggle = (foodItemId: string, checked: boolean) => {
    setFormState((prev) => ({
      ...prev,
      extras: prev.extras.map((item) =>
        item.food_item_id === foodItemId
          ? { ...item, selected: checked }
          : item
      ),
    }));
  };

  const handleExtrasLiterChange = (
    foodItemId: string,
    literSizeId: string,
    quantity: number
  ) => {
    setFormState((prev) => ({
      ...prev,
      extras: prev.extras.map((item) => {
        if (item.food_item_id === foodItemId) {
          const newLiters = item.liters.map((l) =>
            l.liter_size_id === literSizeId ? { ...l, quantity } : l
          );
          const hasAnyLiters = newLiters.some((l) => l.quantity > 0);
          return { ...item, liters: newLiters, selected: hasAnyLiters };
        }
        return item;
      }),
    }));
  };

  const handleExtrasSizeChange = (
    foodItemId: string,
    size: "big" | "small",
    quantity: number
  ) => {
    setFormState((prev) => ({
      ...prev,
      extras: prev.extras.map((item) => {
        if (item.food_item_id === foodItemId) {
          const newItem = {
            ...item,
            [size === "big" ? "size_big" : "size_small"]: quantity,
          };
          newItem.selected = newItem.size_big > 0 || newItem.size_small > 0;
          return newItem;
        }
        return item;
      }),
    }));
  };

  const handleExtrasQuantityChange = (
    foodItemId: string,
    quantity: number
  ) => {
    setFormState((prev) => ({
      ...prev,
      extras: prev.extras.map((item) =>
        item.food_item_id === foodItemId
          ? { ...item, quantity, selected: quantity > 0 }
          : item
      ),
    }));
  };

  const handleExtrasNoteChange = (foodItemId: string, note: string) => {
    setFormState((prev) => ({
      ...prev,
      extras: prev.extras.map((item) =>
        item.food_item_id === foodItemId ? { ...item, note } : item
      ),
    }));
  };

  const handleExtrasPriceChange = (foodItemId: string, price: number) => {
    setFormState((prev) => ({
      ...prev,
      extras: prev.extras.map((item) =>
        item.food_item_id === foodItemId ? { ...item, price } : item
      ),
    }));
  };

  // Bakery category handlers - supports all measurement types (like extras)
  const handleBakeryToggle = (foodItemId: string, checked: boolean) => {
    setFormState((prev) => ({
      ...prev,
      bakery: prev.bakery.map((item) =>
        item.food_item_id === foodItemId
          ? { ...item, selected: checked }
          : item
      ),
    }));
  };

  const handleBakeryLiterChange = (
    foodItemId: string,
    literSizeId: string,
    quantity: number
  ) => {
    setFormState((prev) => ({
      ...prev,
      bakery: prev.bakery.map((item) => {
        if (item.food_item_id === foodItemId) {
          const newLiters = item.liters.map((l) =>
            l.liter_size_id === literSizeId ? { ...l, quantity } : l
          );
          const hasAnyLiters = newLiters.some((l) => l.quantity > 0);
          return { ...item, liters: newLiters, selected: hasAnyLiters };
        }
        return item;
      }),
    }));
  };

  const handleBakerySizeChange = (
    foodItemId: string,
    size: "big" | "small",
    quantity: number
  ) => {
    setFormState((prev) => ({
      ...prev,
      bakery: prev.bakery.map((item) => {
        if (item.food_item_id === foodItemId) {
          const newItem = {
            ...item,
            [size === "big" ? "size_big" : "size_small"]: quantity,
          };
          newItem.selected = newItem.size_big > 0 || newItem.size_small > 0;
          return newItem;
        }
        return item;
      }),
    }));
  };

  const handleBakeryQuantityChange = (
    foodItemId: string,
    quantity: number
  ) => {
    setFormState((prev) => ({
      ...prev,
      bakery: prev.bakery.map((item) =>
        item.food_item_id === foodItemId
          ? { ...item, quantity, selected: quantity > 0 }
          : item
      ),
    }));
  };

  const handleBakeryNoteChange = (foodItemId: string, note: string) => {
    setFormState((prev) => ({
      ...prev,
      bakery: prev.bakery.map((item) =>
        item.food_item_id === foodItemId ? { ...item, note } : item
      ),
    }));
  };

  const handleSidesToggle = (foodItemId: string, checked: boolean) => {
    setFormState((prev) => ({
      ...prev,
      sides: prev.sides.map((item) =>
        item.food_item_id === foodItemId
          ? { ...item, selected: checked, size_big: checked ? 1 : 0, size_small: 0 }
          : item
      ),
    }));
  };

  const handleSidesSizeChange = (foodItemId: string, size: "big" | "small", quantity: number) => {
    setFormState((prev) => ({
      ...prev,
      sides: prev.sides.map((item) => {
        if (item.food_item_id === foodItemId) {
          const newItem = {
            ...item,
            [size === "big" ? "size_big" : "size_small"]: quantity,
          };
          newItem.selected = newItem.size_big > 0 || newItem.size_small > 0;
          return newItem;
        }
        return item;
      }),
    }));
  };

  const handleSidesQuantityChange = (foodItemId: string, quantity: number) => {
    setFormState((prev) => ({
      ...prev,
      sides: prev.sides.map((item) =>
        item.food_item_id === foodItemId
          ? { ...item, quantity, selected: quantity > 0 }
          : item
      ),
    }));
  };

  const handleSidesLiterChange = (foodItemId: string, literSizeId: string, quantity: number) => {
    setFormState((prev) => ({
      ...prev,
      sides: prev.sides.map((item) => {
        if (item.food_item_id === foodItemId) {
          const newLiters = item.liters.map((l) =>
            l.liter_size_id === literSizeId ? { ...l, quantity } : l
          );
          const hasAnyLiters = newLiters.some((l) => l.quantity > 0);
          return { ...item, liters: newLiters, selected: hasAnyLiters };
        }
        return item;
      }),
    }));
  };

  const handleSidesPreparationChange = (
    foodItemId: string,
    preparationId: string | undefined,
    preparationName: string | undefined
  ) => {
    setFormState((prev) => ({
      ...prev,
      sides: prev.sides.map((item) =>
        item.food_item_id === foodItemId
          ? { ...item, preparation_id: preparationId, preparation_name: preparationName }
          : item
      ),
    }));
  };

  const handlePreparationChange = (
    category: "middle_courses" | "mains" | "extras" | "bakery",
    foodItemId: string,
    preparationId: string | undefined,
    preparationName: string | undefined
  ) => {
    setFormState((prev) => ({
      ...prev,
      [category]: prev[category].map((item) =>
        item.food_item_id === foodItemId
          ? { ...item, preparation_id: preparationId, preparation_name: preparationName }
          : item
      ),
    }));
  };

  const handleSidesNoteChange = (foodItemId: string, note: string) => {
    setFormState((prev) => ({
      ...prev,
      sides: prev.sides.map((item) =>
        item.food_item_id === foodItemId ? { ...item, note } : item
      ),
    }));
  };

  const handleSidesVariationSizeChange = (
    foodItemId: string,
    variationId: string,
    size: "big" | "small",
    quantity: number
  ) => {
    setFormState((prev) => ({
      ...prev,
      sides: prev.sides.map((item) => {
        if (item.food_item_id === foodItemId) {
          const updatedVariations = (item.variations || []).map((v) =>
            v.variation_id === variationId
              ? { ...v, [size === "big" ? "size_big" : "size_small"]: quantity }
              : v
          );
          const hasAnyVariation = updatedVariations.some(
            (v) => v.size_big > 0 || v.size_small > 0
          );
          return {
            ...item,
            variations: updatedVariations,
            selected: hasAnyVariation || item.size_big > 0 || item.size_small > 0,
          };
        }
        return item;
      }),
    }));
  };

  const handleSave = async () => {
    if (!formState.phone.trim()) {
      alert("נא להזין מספר טלפון");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const result = await updateOrder(orderId, {
        customer: {
          name: formState.customer_name,
          phone: formState.phone,
          phone_alt: formState.phone_alt || undefined,
          address: formState.address,
        },
        order: {
          order_date: formState.order_date,
          order_time: formState.order_time,
          customer_time: formState.customer_time || undefined,
          delivery_address: formState.address,
          notes: formState.notes,
          total_portions: formState.total_portions || undefined,
          price_per_portion: formState.price_per_portion || undefined,
          delivery_fee: formState.delivery_fee || undefined,
        },
        salads: formState.salads,
        middle_courses: formState.middle_courses,
        sides: formState.sides,
        mains: formState.mains,
        extras: formState.extras,
        bakery: formState.bakery,
        extra_items: formState.extra_items,
      });

      if (result.success) {
        alert("ההזמנה עודכנה בהצלחה!");
        // Navigate back to source page (summary or order)
        const source = sessionStorage.getItem("navigationSource");
        if (source === "summary") {
          router.push("/summary");
        } else {
          router.push("/order");
        }
      } else {
        setSaveError(result.error || "שגיאה בשמירת ההזמנה");
        alert(`שגיאה: ${result.error}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "שגיאה לא ידועה";
      setSaveError(message);
      alert(`שגיאה: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle back navigation based on where user came from
  const handleBack = () => {
    const source = sessionStorage.getItem("navigationSource");
    if (source === "summary") {
      router.push("/summary");
    } else {
      router.push("/order");
    }
  };

  return (
    <AuthGuard>
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowRight className="h-5 w-5" />
            <span>{LABELS.actions.back}</span>
          </button>
          <h1 className="text-xl font-bold">
            עריכת הזמנה #{orderNumber}
          </h1>
          <div className="w-20" />
        </div>
      </header>

      {/* Form Content */}
      <main className="max-w-2xl mx-auto p-4 space-y-4 pb-32">
        {/* Customer Details */}
        <Accordion type="multiple" defaultValue={["customer-details"]} className="space-y-2">
          <AccordionItem value="customer-details" className="bg-white rounded-xl border border-gray-200">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center justify-between w-full pl-4">
                <span className="text-lg font-semibold">{LABELS.orderForm.customerDetails}</span>
                {(formState.customer_name || formState.phone) && (
                  <span className="text-sm text-gray-600 font-normal truncate max-w-[200px]">
                    {formState.customer_name}{formState.customer_name && formState.phone ? " • " : ""}{formState.phone}
                  </span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label={LABELS.orderForm.customerName}
                    value={formState.customer_name}
                    onChange={(e) => setFormState((prev) => ({ ...prev, customer_name: e.target.value }))}
                    placeholder="שם הלקוח"
                  />
                  <Input
                    label={LABELS.orderForm.phone}
                    type="tel"
                    value={formState.phone}
                    onChange={(e) => setFormState((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="050-0000000"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="טלפון נוסף"
                    type="tel"
                    value={formState.phone_alt}
                    onChange={(e) => setFormState((prev) => ({ ...prev, phone_alt: e.target.value }))}
                    placeholder="טלפון נוסף (אופציונלי)"
                  />
                  <Input
                    label="זמן ללקוח"
                    type="time"
                    value={formState.customer_time}
                    onChange={(e) => setFormState((prev) => ({ ...prev, customer_time: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label={LABELS.orderForm.date}
                    type="date"
                    value={formState.order_date}
                    onChange={(e) => setFormState((prev) => ({ ...prev, order_date: e.target.value }))}
                  />
                  <Input
                    label="זמן למטבח"
                    type="time"
                    value={formState.order_time}
                    onChange={(e) => setFormState((prev) => ({ ...prev, order_time: e.target.value }))}
                  />
                </div>
                <Input
                  label={LABELS.orderForm.address}
                  value={formState.address}
                  onChange={(e) => setFormState((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="כתובת למשלוח"
                />
                <Input
                  label={LABELS.orderForm.notes}
                  value={formState.notes}
                  onChange={(e) => setFormState((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="הערות להזמנה"
                />

                {/* Pricing Section */}
                <div className="pt-3 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">תמחור</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="סה״כ מנות"
                      type="number"
                      min="0"
                      value={formState.total_portions || ""}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          total_portions: parseInt(e.target.value) || 0,
                        }))
                      }
                      placeholder="0"
                    />
                    <Input
                      label="מחיר בסיס למנה"
                      type="number"
                      min="0"
                      value={formState.price_per_portion || ""}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          price_per_portion: parseFloat(e.target.value) || 0,
                        }))
                      }
                      placeholder="₪0"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <Input
                      label="הובלה"
                      type="number"
                      min="0"
                      value={formState.delivery_fee || ""}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          delivery_fee: parseFloat(e.target.value) || 0,
                        }))
                      }
                      placeholder="₪0"
                    />
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">סה״כ לתשלום</label>
                      <div className="h-12 px-4 rounded-lg border border-gray-300 bg-gray-50 flex items-center justify-center">
                        <span className="text-lg font-bold text-green-600">
                          ₪{((formState.total_portions * formState.price_per_portion) + formState.delivery_fee + totalExtraPrice).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Food Selection */}
        <Accordion type="multiple" defaultValue={["salads"]} className="space-y-2">
          {/* Salads Section */}
          <AccordionItem value="salads" className="bg-white rounded-xl border border-gray-200">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center justify-between w-full pl-4">
                <span className="text-lg font-semibold">
                  {LABELS.categories.salads} ({saladCategory?.max_selection} {LABELS.selection.toSelect})
                </span>
                <span className={cn(
                  "text-sm font-medium px-2 py-1 rounded",
                  saladCount > 0 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
                )}>
                  {saladCount}/{saladCategory?.max_selection}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4">
              <div className="grid grid-cols-3 gap-2">
                {saladItems.map((item) => {
                  const saladState = formState.salads.find((s) => s.food_item_id === item.id);
                  const measurementType = saladState?.measurement_type || item.measurement_type || "liters";
                  return (
                    <SaladCard
                      key={item.id}
                      item={item}
                      selected={saladState?.selected || false}
                      literQuantities={saladState?.liters || []}
                      sizeQuantity={{ big: saladState?.size_big || 0, small: saladState?.size_small || 0 }}
                      regularQuantity={saladState?.regular_quantity || 0}
                      addOns={saladState?.addOns || []}
                      note={saladState?.note || ""}
                      literSizes={literSizes}
                      measurementType={measurementType}
                      onSelect={() => {
                        if (!saladState?.selected) {
                          handleSaladToggle(item.id, true);
                        }
                        setExpandedSaladId(item.id);
                      }}
                    />
                  );
                })}
              </div>

              {expandedSaladId && (() => {
                const expandedItem = saladItems.find((s) => s.id === expandedSaladId);
                const expandedState = formState.salads.find((s) => s.food_item_id === expandedSaladId);
                const measurementType = expandedState?.measurement_type || expandedItem?.measurement_type || "liters";
                if (!expandedItem) return null;
                return (
                  <SaladLiterPopup
                    item={expandedItem}
                    literQuantities={expandedState?.liters || []}
                    sizeQuantity={{ big: expandedState?.size_big || 0, small: expandedState?.size_small || 0 }}
                    regularQuantity={expandedState?.regular_quantity || 0}
                    addOns={expandedState?.addOns || []}
                    note={expandedState?.note || ""}
                    literSizes={literSizes}
                    measurementType={measurementType}
                    onLiterChange={(literId, qty) => handleSaladLiterChange(expandedSaladId, literId, qty)}
                    onSizeChange={(size, qty) => handleSaladSizeChange(expandedSaladId, size, qty)}
                    onRegularQuantityChange={(qty) => handleSaladRegularQuantityChange(expandedSaladId, qty)}
                    onAddOnLiterChange={(addonId, literId, qty) => handleAddOnLiterChange(expandedSaladId, addonId, literId, qty)}
                    onAddOnQuantityChange={(addonId, qty) => handleAddOnQuantityChange(expandedSaladId, addonId, qty)}
                    onNoteChange={(note) => handleSaladNoteChange(expandedSaladId, note)}
                    onCancel={() => handleCancelSalad(expandedSaladId)}
                    onClose={() => setExpandedSaladId(null)}
                    onMergeAddOnToLinkedItem={handleMergeAddOnToLinkedItem}
                    allSaladItems={saladItems}
                  />
                );
              })()}
            </AccordionContent>
          </AccordionItem>

          {/* Middle Courses Section */}
          <AccordionItem value="middle_courses" className="bg-white rounded-xl border border-gray-200">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center justify-between w-full pl-4">
                <span className="text-lg font-semibold">
                  {LABELS.categories.middle_courses} ({middleCategory?.max_selection} {LABELS.selection.toSelect})
                </span>
                <span className={cn(
                  "text-sm font-medium px-2 py-1 rounded",
                  middleCount > 0 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
                )}>
                  {middleCount}/{middleCategory?.max_selection}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 relative">
              <div className="grid grid-cols-3 gap-2">
                {middleItems.map((item) => {
                  const itemState = formState.middle_courses.find((m) => m.food_item_id === item.id);
                  return (
                    <FoodItemCard
                      key={item.id}
                      item={item}
                      selected={itemState?.selected || false}
                      quantity={itemState?.quantity || 0}
                      preparationName={itemState?.preparation_name}
                      note={itemState?.note}
                      extraQuantity={getExtraForItem(item.id)}
                      onSelect={() => {
                        if (!itemState?.selected) {
                          handleRegularToggle("middle_courses", item.id, true);
                        }
                        setExpandedMiddleId(item.id);
                      }}
                    />
                  );
                })}
              </div>

              {expandedMiddleId && (() => {
                const expandedItem = middleItems.find((i) => i.id === expandedMiddleId);
                const expandedState = formState.middle_courses.find((m) => m.food_item_id === expandedMiddleId);
                if (!expandedItem) return null;
                return (
                  <FoodItemPopup
                    item={expandedItem}
                    quantity={expandedState?.quantity || 0}
                    selectedPreparationId={expandedState?.preparation_id}
                    note={expandedState?.note}
                    onQuantityChange={(qty) => handleRegularQuantityChange("middle_courses", expandedMiddleId, qty)}
                    onPreparationChange={(prepId, prepName) => handlePreparationChange("middle_courses", expandedMiddleId, prepId, prepName)}
                    onNoteChange={(note) => handleRegularNoteChange("middle_courses", expandedMiddleId, note)}
                    onCancel={() => handleCancelMiddleCourse(expandedMiddleId)}
                    onClose={() => setExpandedMiddleId(null)}
                    showExtraButton={true}
                    onAddAsExtra={(price, quantityData) => {
                      handleAddAsExtra(
                        'middle_courses',
                        expandedMiddleId,
                        quantityData,
                        price,
                        expandedItem.name,
                        expandedState?.preparation_name,
                        expandedState?.note
                      );
                    }}
                  />
                );
              })()}
            </AccordionContent>
          </AccordionItem>

          {/* Sides Section */}
          <AccordionItem value="sides" className="bg-white rounded-xl border border-gray-200">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center justify-between w-full pl-4">
                <span className="text-lg font-semibold">
                  {LABELS.categories.sides} ({sidesCategory?.max_selection} {LABELS.selection.toSelect})
                </span>
                <span className={cn(
                  "text-sm font-medium px-2 py-1 rounded",
                  sidesCount > 0 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
                )}>
                  {sidesCount}/{sidesCategory?.max_selection}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 relative">
              <div className="grid grid-cols-3 gap-2">
                {sideItems.map((item) => {
                  const itemState = formState.sides.find((s) => s.food_item_id === item.id);
                  const hasVariations = item.variations && item.variations.length > 0;
                  const measurementType = item.measurement_type || "size";
                  const useSizeMode = measurementType === "size" && !hasVariations;
                  const useLitersMode = measurementType === "liters";

                  const literQuantitiesForCard = useLitersMode ?
                    itemState?.liters.map((l) => {
                      const literSize = literSizes.find((ls) => ls.id === l.liter_size_id);
                      return {
                        liter_size_id: l.liter_size_id,
                        label: literSize?.label || "",
                        quantity: l.quantity,
                      };
                    }).filter((l) => l.quantity > 0) : undefined;

                  return (
                    <FoodItemCard
                      key={item.id}
                      item={item}
                      selected={itemState?.selected || false}
                      quantity={itemState?.quantity || 0}
                      sizeQuantity={useSizeMode ? { big: itemState?.size_big || 0, small: itemState?.size_small || 0 } : undefined}
                      useSizeMode={useSizeMode}
                      useLitersMode={useLitersMode}
                      literQuantities={literQuantitiesForCard}
                      preparationName={itemState?.preparation_name}
                      note={itemState?.note}
                      variationQuantities={itemState?.variations}
                      extraQuantity={getExtraForItem(item.id)}
                      onSelect={() => {
                        if (!itemState?.selected) {
                          handleSidesToggle(item.id, true);
                        }
                        setExpandedSideId(item.id);
                      }}
                    />
                  );
                })}
              </div>

              {expandedSideId && (() => {
                const expandedItem = sideItems.find((i) => i.id === expandedSideId);
                const expandedState = formState.sides.find((s) => s.food_item_id === expandedSideId);
                if (!expandedItem) return null;
                const hasVariations = expandedItem.variations && expandedItem.variations.length > 0;
                const measurementType = expandedItem.measurement_type || "size";
                const useSizeMode = measurementType === "size" && !hasVariations;
                const useLitersMode = measurementType === "liters";

                // For liters mode, create a special popup
                if (useLitersMode) {
                  return (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 bg-black/50 z-40"
                        onClick={() => setExpandedSideId(null)}
                      />

                      {/* Popup */}
                      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl animate-slide-up max-h-[85vh] overflow-y-auto">
                        <div className="max-w-lg mx-auto p-4">
                          {/* Header */}
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900">{expandedItem.name}</h3>
                            <button
                              type="button"
                              onClick={() => setExpandedSideId(null)}
                              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                              ✕
                            </button>
                          </div>

                          {/* Liter Size Selectors */}
                          <div className="mb-6">
                            <span className="block text-gray-600 mb-3 text-center">בחר כמויות לפי ליטרים:</span>
                            <div className="grid grid-cols-2 gap-3">
                              {literSizes.map((ls) => {
                                const literQuantity = expandedState?.liters.find(
                                  (l) => l.liter_size_id === ls.id
                                )?.quantity || 0;
                                return (
                                  <div
                                    key={ls.id}
                                    className={cn(
                                      "flex flex-col items-center rounded-xl border-2 p-3 transition-all",
                                      literQuantity > 0
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-gray-200 bg-white"
                                    )}
                                  >
                                    <span className={cn(
                                      "text-lg font-bold mb-2",
                                      literQuantity > 0 ? "text-blue-700" : "text-gray-700"
                                    )}>
                                      {ls.label}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => literQuantity > 0 && handleSidesLiterChange(expandedSideId, ls.id, literQuantity - 1)}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold"
                                      >
                                        −
                                      </button>
                                      <span className="w-8 text-center text-lg font-bold">{literQuantity}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleSidesLiterChange(expandedSideId, ls.id, literQuantity + 1)}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Notes field */}
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              📝 הערות
                            </label>
                            <textarea
                              value={expandedState?.note || ""}
                              onChange={(e) => handleSidesNoteChange(expandedSideId, e.target.value)}
                              placeholder="הוסף הערה..."
                              className="w-full h-20 px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              dir="rtl"
                            />
                          </div>

                          {/* Done button */}
                          <button
                            type="button"
                            onClick={() => setExpandedSideId(null)}
                            className="w-full h-12 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 active:scale-[0.98] transition-all"
                          >
                            אישור
                          </button>
                        </div>
                      </div>
                    </>
                  );
                }

                return (
                  <FoodItemPopup
                    item={expandedItem}
                    quantity={expandedState?.quantity || 0}
                    sizeQuantity={useSizeMode ? { big: expandedState?.size_big || 0, small: expandedState?.size_small || 0 } : undefined}
                    useSizeMode={useSizeMode}
                    selectedPreparationId={expandedState?.preparation_id}
                    note={expandedState?.note}
                    variationQuantities={expandedState?.variations}
                    onQuantityChange={(qty) => handleSidesQuantityChange(expandedSideId, qty)}
                    onSizeChange={useSizeMode ? (size, qty) => handleSidesSizeChange(expandedSideId, size, qty) : undefined}
                    onPreparationChange={(prepId, prepName) => handleSidesPreparationChange(expandedSideId, prepId, prepName)}
                    onNoteChange={(note) => handleSidesNoteChange(expandedSideId, note)}
                    onVariationSizeChange={(variationId, size, qty) => handleSidesVariationSizeChange(expandedSideId, variationId, size, qty)}
                    onCancel={() => handleCancelSide(expandedSideId)}
                    onClose={() => setExpandedSideId(null)}
                    showExtraButton={true}
                    onAddAsExtra={(price, quantityData) => {
                      handleAddAsExtra(
                        'sides',
                        expandedSideId,
                        quantityData,
                        price,
                        expandedItem.name,
                        expandedState?.preparation_name,
                        expandedState?.note
                      );
                    }}
                  />
                );
              })()}
            </AccordionContent>
          </AccordionItem>

          {/* Mains Section */}
          <AccordionItem value="mains" className="bg-white rounded-xl border border-gray-200">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center justify-between w-full pl-4">
                <span className="text-lg font-semibold">
                  {LABELS.categories.mains} ({mainsCategory?.max_selection} {LABELS.selection.toSelect})
                </span>
                <span className={cn(
                  "text-sm font-medium px-2 py-1 rounded",
                  mainsCount > 0 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
                )}>
                  {mainsCount}/{mainsCategory?.max_selection}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 relative">
              <div className="grid grid-cols-3 gap-2">
                {mainItems.map((item) => {
                  const itemState = formState.mains.find((m) => m.food_item_id === item.id);
                  return (
                    <FoodItemCard
                      key={item.id}
                      item={item}
                      selected={itemState?.selected || false}
                      quantity={itemState?.quantity || 0}
                      preparationName={itemState?.preparation_name}
                      note={itemState?.note}
                      extraQuantity={getExtraForItem(item.id)}
                      onSelect={() => {
                        if (!itemState?.selected) {
                          handleRegularToggle("mains", item.id, true);
                        }
                        setExpandedMainId(item.id);
                      }}
                    />
                  );
                })}
              </div>

              {expandedMainId && (() => {
                const expandedItem = mainItems.find((i) => i.id === expandedMainId);
                const expandedState = formState.mains.find((m) => m.food_item_id === expandedMainId);
                if (!expandedItem) return null;
                return (
                  <FoodItemPopup
                    item={expandedItem}
                    quantity={expandedState?.quantity || 0}
                    selectedPreparationId={expandedState?.preparation_id}
                    note={expandedState?.note}
                    onQuantityChange={(qty) => handleRegularQuantityChange("mains", expandedMainId, qty)}
                    onPreparationChange={(prepId, prepName) => handlePreparationChange("mains", expandedMainId, prepId, prepName)}
                    onNoteChange={(note) => handleRegularNoteChange("mains", expandedMainId, note)}
                    onCancel={() => handleCancelMain(expandedMainId)}
                    onClose={() => setExpandedMainId(null)}
                    showExtraButton={true}
                    onAddAsExtra={(price, quantityData) => {
                      handleAddAsExtra(
                        'mains',
                        expandedMainId,
                        quantityData,
                        price,
                        expandedItem.name,
                        expandedState?.preparation_name,
                        expandedState?.note
                      );
                    }}
                  />
                );
              })()}
            </AccordionContent>
          </AccordionItem>

          {/* Extras Section */}
          <AccordionItem value="extras" className="bg-white rounded-xl border border-gray-200">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center justify-between w-full pl-4">
                <span className="text-lg font-semibold">
                  {LABELS.categories.extras} ({LABELS.selection.unlimited})
                </span>
                <span className={cn(
                  "text-sm font-medium px-2 py-1 rounded",
                  extrasCount > 0 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
                )}>
                  {extrasCount}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 relative">
              {/* Extra Items from other categories (mains/sides/middle_courses) */}
              {formState.extra_items.length > 0 && (
                <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-xl">
                  <h4 className="text-sm font-bold text-red-700 mb-2">🏷️ פריטי אקסטרה</h4>
                  <div className="space-y-2">
                    {formState.extra_items.map((extraItem) => {
                      // Format quantity display
                      let qtyDisplay = "";
                      if (extraItem.quantity && extraItem.quantity > 0) {
                        qtyDisplay = `×${extraItem.quantity}`;
                      } else if ((extraItem.size_big || 0) > 0 || (extraItem.size_small || 0) > 0) {
                        const parts: string[] = [];
                        if (extraItem.size_big) parts.push(`ג׳:${extraItem.size_big}`);
                        if (extraItem.size_small) parts.push(`ק׳:${extraItem.size_small}`);
                        qtyDisplay = parts.join(" ");
                      } else if (extraItem.variations && extraItem.variations.length > 0) {
                        qtyDisplay = extraItem.variations
                          .filter(v => v.size_big > 0 || v.size_small > 0)
                          .map(v => {
                            const parts: string[] = [];
                            if (v.size_big > 0) parts.push(`ג׳:${v.size_big}`);
                            if (v.size_small > 0) parts.push(`ק׳:${v.size_small}`);
                            return `${v.name} ${parts.join(" ")}`;
                          })
                          .join(" | ");
                      }

                      return (
                        <div
                          key={extraItem.id}
                          className="flex items-center justify-between bg-white rounded-lg p-2 border border-red-200"
                        >
                          <div className="flex-1">
                            <span className="font-bold text-red-700">{extraItem.name}</span>
                            {extraItem.preparation_name && (
                              <span className="text-gray-500 text-xs mr-1">({extraItem.preparation_name})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Quantity (visually on right in RTL) */}
                            {qtyDisplay && (
                              <span className="text-red-600 text-sm font-medium">{qtyDisplay}</span>
                            )}
                            {/* Price input (visually to left of quantity in RTL) */}
                            <input
                              type="number"
                              min="0"
                              value={extraItem.price || ""}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val) && val >= 0) {
                                  handleEditExtraItemPrice(extraItem.id, val);
                                } else if (e.target.value === "") {
                                  handleEditExtraItemPrice(extraItem.id, 0);
                                }
                              }}
                              className="w-20 h-8 text-center text-sm font-bold border border-red-300 rounded bg-red-50 text-red-700"
                              dir="ltr"
                            />
                            <span className="text-red-600 text-sm">₪</span>
                            {/* Delete button (leftmost in RTL) */}
                            <button
                              type="button"
                              onClick={() => handleRemoveExtraItem(extraItem.id)}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-red-100 hover:bg-red-200 text-red-600"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-2 pt-2 border-t border-red-200 flex justify-between items-center">
                    <span className="font-bold text-red-700">סה״כ אקסטרות:</span>
                    <span className="font-bold text-red-700 text-lg">₪{totalExtraPrice.toLocaleString()}</span>
                  </div>
                </div>
              )}
              {extraItems.length > 0 ? (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    {extraItems.map((item) => {
                      const itemState = formState.extras.find((e) => e.food_item_id === item.id);
                      const measurementType = item.measurement_type || "none";
                      const useSizeMode = measurementType === "size";
                      const useLitersMode = measurementType === "liters";
                      
                      const literQuantitiesForCard = useLitersMode ? 
                        itemState?.liters.map((l) => {
                          const literSize = literSizes.find((ls) => ls.id === l.liter_size_id);
                          return {
                            liter_size_id: l.liter_size_id,
                            label: literSize?.label || "",
                            quantity: l.quantity,
                          };
                        }).filter((l) => l.quantity > 0) : undefined;
                      
                      return (
                        <FoodItemCard
                          key={item.id}
                          item={item}
                          selected={itemState?.selected || false}
                          quantity={itemState?.quantity || 0}
                          sizeQuantity={useSizeMode ? {
                            big: itemState?.size_big || 0,
                            small: itemState?.size_small || 0,
                          } : undefined}
                          useSizeMode={useSizeMode}
                          useLitersMode={useLitersMode}
                          literQuantities={literQuantitiesForCard}
                          preparationName={itemState?.preparation_name}
                          note={itemState?.note}
                          onSelect={() => {
                            if (!itemState?.selected) {
                              handleExtrasToggle(item.id, true);
                            }
                            setExpandedExtraId(item.id);
                          }}
                        />
                      );
                    })}
                  </div>

                  {expandedExtraId && (() => {
                    const expandedItem = extraItems.find((i) => i.id === expandedExtraId);
                    const expandedState = formState.extras.find((e) => e.food_item_id === expandedExtraId);
                    if (!expandedItem) return null;
                    
                    const measurementType = expandedItem.measurement_type || "none";
                    const useSizeMode = measurementType === "size";
                    const useLitersMode = measurementType === "liters";
                    
                    // For liters mode, create a special popup
                    if (useLitersMode) {
                      return (
                        <>
                          {/* Backdrop */}
                          <div 
                            className="fixed inset-0 bg-black/50 z-40"
                            onClick={() => setExpandedExtraId(null)}
                          />
                          
                          {/* Popup */}
                          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl animate-slide-up max-h-[85vh] overflow-y-auto">
                            <div className="max-w-lg mx-auto p-4">
                              {/* Header */}
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-gray-900">{expandedItem.name}</h3>
                                <button
                                  type="button"
                                  onClick={() => setExpandedExtraId(null)}
                                  className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                                >
                                  ✕
                                </button>
                              </div>

                              {/* Liter Size Selectors */}
                              <div className="mb-6">
                                <span className="block text-gray-600 mb-3 text-center">בחר כמויות לפי ליטרים:</span>
                                <div className="grid grid-cols-2 gap-3">
                                  {literSizes.map((ls) => {
                                    const literQuantity = expandedState?.liters.find(
                                      (l) => l.liter_size_id === ls.id
                                    )?.quantity || 0;
                                    return (
                                      <div
                                        key={ls.id}
                                        className={cn(
                                          "flex flex-col items-center rounded-xl border-2 p-3 transition-all",
                                          literQuantity > 0
                                            ? "border-blue-500 bg-blue-50"
                                            : "border-gray-200 bg-white"
                                        )}
                                      >
                                        <span className={cn(
                                          "text-lg font-bold mb-2",
                                          literQuantity > 0 ? "text-blue-700" : "text-gray-700"
                                        )}>
                                          {ls.label}
                                        </span>
                                        <div className="flex items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={() => literQuantity > 0 && handleExtrasLiterChange(expandedExtraId, ls.id, literQuantity - 1)}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold"
                                          >
                                            −
                                          </button>
                                          <span className="w-8 text-center text-lg font-bold">{literQuantity}</span>
                                          <button
                                            type="button"
                                            onClick={() => handleExtrasLiterChange(expandedExtraId, ls.id, literQuantity + 1)}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold"
                                          >
                                            +
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Price input for extras */}
                              <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  💰 מחיר (₪)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={expandedState?.price || ""}
                                  onChange={(e) => handleExtrasPriceChange(expandedExtraId, parseFloat(e.target.value) || 0)}
                                  placeholder="הזן מחיר..."
                                  className="w-full h-12 px-4 text-lg font-bold text-center border-2 border-green-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-green-50"
                                  dir="ltr"
                                />
                              </div>

                              {/* Notes field */}
                              <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  📝 הערות
                                </label>
                                <textarea
                                  value={expandedState?.note || ""}
                                  onChange={(e) => handleExtrasNoteChange(expandedExtraId, e.target.value)}
                                  placeholder="הוסף הערה..."
                                  className="w-full h-20 px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  dir="rtl"
                                />
                              </div>

                              {/* Done button */}
                              <button
                                type="button"
                                onClick={() => setExpandedExtraId(null)}
                                className="w-full h-12 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 active:scale-[0.98] transition-all"
                              >
                                אישור
                              </button>
                            </div>
                          </div>
                        </>
                      );
                    }

                    return (
                      <FoodItemPopup
                        item={expandedItem}
                        quantity={expandedState?.quantity || 0}
                        sizeQuantity={useSizeMode ? {
                          big: expandedState?.size_big || 0,
                          small: expandedState?.size_small || 0,
                        } : undefined}
                        useSizeMode={useSizeMode}
                        selectedPreparationId={expandedState?.preparation_id}
                        note={expandedState?.note}
                        price={expandedState?.price}
                        onQuantityChange={(qty) => handleExtrasQuantityChange(expandedExtraId, qty)}
                        onSizeChange={useSizeMode ? (size, qty) => handleExtrasSizeChange(expandedExtraId, size, qty) : undefined}
                        onPreparationChange={(prepId, prepName) => handlePreparationChange("extras", expandedExtraId, prepId, prepName)}
                        onNoteChange={(note) => handleExtrasNoteChange(expandedExtraId, note)}
                        onPriceChange={(price) => handleExtrasPriceChange(expandedExtraId, price)}
                        showPriceInput={true}
                        onCancel={() => handleCancelExtra(expandedExtraId)}
                        onClose={() => setExpandedExtraId(null)}
                      />
                    );
                  })()}
                </>
              ) : (
                <p className="text-gray-500 text-center py-4">{LABELS.empty.noItems}</p>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Bakery Section */}
          <AccordionItem value="bakery" className="bg-white rounded-xl border border-gray-200">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center justify-between w-full pl-4">
                <span className="text-lg font-semibold">
                  {LABELS.categories.bakery} ({LABELS.selection.unlimited})
                </span>
                <span className={cn(
                  "text-sm font-medium px-2 py-1 rounded",
                  bakeryCount > 0 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
                )}>
                  {bakeryCount}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 relative">
              {bakeryItems.length > 0 ? (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    {bakeryItems.map((item) => {
                      const itemState = formState.bakery.find((b) => b.food_item_id === item.id);
                      const measurementType = item.measurement_type || "none";
                      
                      // Calculate quantity based on measurement type for display
                      const displayQuantity = itemState?.quantity || 0;
                      const useSizeMode = measurementType === "size";
                      const useLitersMode = measurementType === "liters";
                      
                      // Prepare liter quantities for display
                      const literQuantitiesForCard = useLitersMode ? 
                        itemState?.liters.map((l) => {
                          const literSize = literSizes.find((ls) => ls.id === l.liter_size_id);
                          return {
                            liter_size_id: l.liter_size_id,
                            label: literSize?.label || "",
                            quantity: l.quantity,
                          };
                        }).filter((l) => l.quantity > 0) : undefined;
                      
                      return (
                        <FoodItemCard
                          key={item.id}
                          item={item}
                          selected={itemState?.selected || false}
                          quantity={displayQuantity}
                          sizeQuantity={useSizeMode ? {
                            big: itemState?.size_big || 0,
                            small: itemState?.size_small || 0,
                          } : undefined}
                          useSizeMode={useSizeMode}
                          useLitersMode={useLitersMode}
                          literQuantities={literQuantitiesForCard}
                          preparationName={itemState?.preparation_name}
                          note={itemState?.note}
                          onSelect={() => {
                            if (!itemState?.selected) {
                              handleBakeryToggle(item.id, true);
                            }
                            setExpandedBakeryId(item.id);
                          }}
                        />
                      );
                    })}
                  </div>

                  {expandedBakeryId && (() => {
                    const expandedItem = bakeryItems.find((i) => i.id === expandedBakeryId);
                    const expandedState = formState.bakery.find((b) => b.food_item_id === expandedBakeryId);
                    if (!expandedItem) return null;
                    
                    const measurementType = expandedItem.measurement_type || "none";
                    const useSizeMode = measurementType === "size";
                    const useLitersMode = measurementType === "liters";
                    
                    // For liters mode, create a special popup
                    if (useLitersMode) {
                      return (
                        <>
                          {/* Backdrop */}
                          <div 
                            className="fixed inset-0 bg-black/50 z-40"
                            onClick={() => setExpandedBakeryId(null)}
                          />
                          
                          {/* Popup */}
                          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl animate-slide-up max-h-[85vh] overflow-y-auto">
                            <div className="max-w-lg mx-auto p-4">
                              {/* Header */}
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-gray-900">{expandedItem.name}</h3>
                                <button
                                  type="button"
                                  onClick={() => setExpandedBakeryId(null)}
                                  className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                                >
                                  ✕
                                </button>
                              </div>

                              {/* Liter Size Selectors */}
                              <div className="mb-6">
                                <span className="block text-gray-600 mb-3 text-center">בחר כמויות לפי ליטרים:</span>
                                <div className="grid grid-cols-2 gap-3">
                                  {literSizes.map((ls) => {
                                    const literQuantity = expandedState?.liters.find(
                                      (l) => l.liter_size_id === ls.id
                                    )?.quantity || 0;
                                    return (
                                      <div
                                        key={ls.id}
                                        className={cn(
                                          "flex flex-col items-center rounded-xl border-2 p-3 transition-all",
                                          literQuantity > 0
                                            ? "border-blue-500 bg-blue-50"
                                            : "border-gray-200 bg-white"
                                        )}
                                      >
                                        <span className={cn(
                                          "text-lg font-bold mb-2",
                                          literQuantity > 0 ? "text-blue-700" : "text-gray-700"
                                        )}>
                                          {ls.label}
                                        </span>
                                        <div className="flex items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={() => literQuantity > 0 && handleBakeryLiterChange(expandedBakeryId, ls.id, literQuantity - 1)}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold"
                                          >
                                            −
                                          </button>
                                          <span className="w-8 text-center text-lg font-bold">{literQuantity}</span>
                                          <button
                                            type="button"
                                            onClick={() => handleBakeryLiterChange(expandedBakeryId, ls.id, literQuantity + 1)}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold"
                                          >
                                            +
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Notes field */}
                              <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  📝 הערות
                                </label>
                                <textarea
                                  value={expandedState?.note || ""}
                                  onChange={(e) => handleBakeryNoteChange(expandedBakeryId, e.target.value)}
                                  placeholder="הוסף הערה..."
                                  className="w-full h-20 px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  dir="rtl"
                                />
                              </div>
                              
                              {/* Done button */}
                              <button
                                type="button"
                                onClick={() => setExpandedBakeryId(null)}
                                className="w-full h-12 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 active:scale-[0.98] transition-all"
                              >
                                אישור
                              </button>
                            </div>
                          </div>
                        </>
                      );
                    }
                    
                    return (
                      <FoodItemPopup
                        item={expandedItem}
                        quantity={expandedState?.quantity || 0}
                        sizeQuantity={useSizeMode ? {
                          big: expandedState?.size_big || 0,
                          small: expandedState?.size_small || 0,
                        } : undefined}
                        useSizeMode={useSizeMode}
                        selectedPreparationId={expandedState?.preparation_id}
                        note={expandedState?.note}
                        onQuantityChange={(qty) => handleBakeryQuantityChange(expandedBakeryId, qty)}
                        onSizeChange={useSizeMode ? (size, qty) => handleBakerySizeChange(expandedBakeryId, size, qty) : undefined}
                        onPreparationChange={(prepId, prepName) => handlePreparationChange("bakery", expandedBakeryId, prepId, prepName)}
                        onNoteChange={(note) => handleBakeryNoteChange(expandedBakeryId, note)}
                        onCancel={() => handleCancelBakery(expandedBakeryId)}
                        onClose={() => setExpandedBakeryId(null)}
                      />
                    );
                  })()}
                </>
              ) : (
                <p className="text-gray-500 text-center py-4">{LABELS.empty.noItems}</p>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </main>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          <Button onClick={handleSave} className="flex-1 gap-2" disabled={isSaving}>
            {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            {isSaving ? "שומר..." : "שמור שינויים"}
          </Button>
          <Button
            variant="outline"
            className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => router.push("/summary")}
          >
            ביטול
          </Button>
        </div>
        {saveError && (
          <p className="text-red-500 text-sm text-center mt-2">{saveError}</p>
        )}
      </div>
    </div>
    </AuthGuard>
  );
}
