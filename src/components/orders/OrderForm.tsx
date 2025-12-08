"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SaladCard, SaladLiterPopup } from "./SaladSelector";
import { FoodItemCard, FoodItemPopup } from "./FoodItemSelector";
import { LABELS } from "@/lib/constants/labels";
import { cn } from "@/lib/utils";
import { ArrowRight, Printer, Save, Loader2 } from "lucide-react";
import { saveOrder, SaveOrderInput } from "@/lib/services/order-service";
import { useSupabaseData, getFoodItemsByCategoryName } from "@/hooks/useSupabaseData";
import { MeasurementType } from "@/types";

// Types for form state
interface AddOnFormItem {
  addon_id: string;
  quantity: number; // Simple quantity for add-ons
  liters: { liter_size_id: string; quantity: number }[]; // Keep for backward compatibility
}

interface SaladFormItem {
  food_item_id: string;
  selected: boolean;
  measurement_type: MeasurementType;
  liters: { liter_size_id: string; quantity: number }[];
  // For size measurement (Big/Small)
  size_big: number;
  size_small: number;
  // For regular quantity (measurement_type "none")
  regular_quantity: number;
  // For add-ons
  addOns: AddOnFormItem[];
  // Free-text note for the salad
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

// Sides use size-based quantities (ג/ק)
interface SidesFormItem {
  food_item_id: string;
  selected: boolean;
  size_big: number;   // ג - גדול
  size_small: number; // ק - קטן
  preparation_id?: string;
  preparation_name?: string;
  note?: string;
  // For items with variations (like אורז)
  variations?: { variation_id: string; size_big: number; size_small: number }[];
}

interface OrderFormState {
  customer_name: string;
  phone: string;
  order_date: string;
  order_time: string;
  address: string;
  notes: string;
  salads: SaladFormItem[];
  middle_courses: RegularFormItem[];
  sides: SidesFormItem[];
  mains: RegularFormItem[];
  extras: RegularFormItem[];
}

export function OrderForm() {
  // Router for navigation
  const router = useRouter();
  
  // Fetch data from Supabase
  const { categories, foodItems, literSizes, isLoading, error } = useSupabaseData();

  // Get categories
  const saladCategory = categories.find((c) => c.name_en === "salads");
  const middleCategory = categories.find((c) => c.name_en === "middle_courses");
  const sidesCategory = categories.find((c) => c.name_en === "sides");
  const mainsCategory = categories.find((c) => c.name_en === "mains");
  const extrasCategory = categories.find((c) => c.name_en === "extras");

  // Get food items by category
  // Memoize food items by category to prevent infinite loops
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

  // Initialize form state only after data is loaded
  const [formState, setFormState] = React.useState<OrderFormState>({
    customer_name: "",
    phone: "",
    order_date: "", // Will be set on client side
    order_time: "",
    address: "",
    notes: "",
    salads: [],
    middle_courses: [],
    sides: [],
    mains: [],
    extras: [],
  });

  // Set date on client side to avoid hydration mismatch
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [isDataInitialized, setIsDataInitialized] = React.useState(false);
  
  React.useEffect(() => {
    if (!isInitialized) {
      setFormState(prev => ({
        ...prev,
        order_date: new Date().toISOString().split("T")[0],
      }));
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Update form state when data loads (only once)
  React.useEffect(() => {
    if (!isDataInitialized && !isLoading && foodItems.length > 0 && literSizes.length > 0) {
      setFormState((prev) => ({
        ...prev,
        salads: saladItems.map((item) => ({
          food_item_id: item.id,
          selected: false,
          measurement_type: item.measurement_type || "liters",
          liters: literSizes.map((ls) => ({
            liter_size_id: ls.id,
            quantity: 0,
          })),
          size_big: 0,
          size_small: 0,
          regular_quantity: 0, // For measurement_type "none"
          // Initialize add-ons if the item has any
          addOns: (item.add_ons || []).map((addon) => ({
            addon_id: addon.id,
            quantity: 0, // Simple quantity for add-ons
            liters: literSizes.map((ls) => ({
              liter_size_id: ls.id,
              quantity: 0,
            })),
          })),
          note: "", // Free-text note for the salad
        })),
        middle_courses: middleItems.map((item) => ({
          food_item_id: item.id,
          selected: false,
          quantity: 0,
        })),
        sides: sideItems.map((item) => ({
          food_item_id: item.id,
          selected: false,
          size_big: 0,
          size_small: 0,
          // Initialize variations if the item has any
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
          quantity: 0,
        })),
      }));
      setIsDataInitialized(true);
    }
  }, [isDataInitialized, isLoading, foodItems, literSizes, saladItems, middleItems, sideItems, mainItems, extraItems]);

  // Bulk apply state for salads - now with all 4 liter sizes
  const [bulkLiters, setBulkLiters] = React.useState<{ [key: string]: number }>({});

  // Initialize bulk liters when liter sizes load
  React.useEffect(() => {
    if (literSizes.length > 0) {
      const initial: { [key: string]: number } = {};
      literSizes.forEach((ls) => {
        initial[ls.id] = 0;
      });
      setBulkLiters(initial);
    }
  }, [literSizes]);

  // Track which salad has its liter options expanded (only one at a time)
  const [expandedSaladId, setExpandedSaladId] = React.useState<string | null>(null);
  
  // Track expanded items for each food category (bento popup)
  const [expandedMiddleId, setExpandedMiddleId] = React.useState<string | null>(null);
  const [expandedSideId, setExpandedSideId] = React.useState<string | null>(null);
  const [expandedMainId, setExpandedMainId] = React.useState<string | null>(null);
  const [expandedExtraId, setExpandedExtraId] = React.useState<string | null>(null);

  // Saving state - must be before early returns!
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  // Calculate selection counts
  const saladCount = formState.salads.filter((s) => s.selected).length;
  const middleCount = formState.middle_courses.filter((m) => m.selected).length;
  const sidesCount = formState.sides.filter((s) => s.selected).length;
  const mainsCount = formState.mains.filter((m) => m.selected).length;
  const extrasCount = formState.extras.filter((e) => e.selected).length;

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-500">
          <p className="text-lg font-semibold mb-2">שגיאה בטעינת נתונים</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Handlers
  const handleSaladToggle = (foodItemId: string, checked: boolean) => {
    setFormState((prev) => ({
      ...prev,
      salads: prev.salads.map((s) =>
        s.food_item_id === foodItemId
          ? { ...s, selected: checked }
          : s
      ),
    }));
  };

  const handleSaladLiterChange = (
    foodItemId: string,
    literSizeId: string,
    quantity: number
  ) => {
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

  // Handler for size (Big/Small) changes
  const handleSaladSizeChange = (
    foodItemId: string,
    size: "big" | "small",
    quantity: number
  ) => {
    setFormState((prev) => ({
      ...prev,
      salads: prev.salads.map((s) =>
        s.food_item_id === foodItemId
          ? {
              ...s,
              [size === "big" ? "size_big" : "size_small"]: quantity,
            }
          : s
      ),
    }));
  };

  // Handler for regular quantity changes (for salads with measurement_type "none")
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

  // Handler for add-on liter changes (keeping for backward compatibility)
  const handleAddOnLiterChange = (
    foodItemId: string,
    addonId: string,
    literSizeId: string,
    quantity: number
  ) => {
    setFormState((prev) => ({
      ...prev,
      salads: prev.salads.map((s) =>
        s.food_item_id === foodItemId
          ? {
              ...s,
              addOns: s.addOns.map((ao) =>
                ao.addon_id === addonId
                  ? {
                      ...ao,
                      liters: ao.liters.map((l) =>
                        l.liter_size_id === literSizeId
                          ? { ...l, quantity }
                          : l
                      ),
                    }
                  : ao
              ),
            }
          : s
      ),
    }));
  };

  // Handler for add-on quantity changes (simple quantity)
  const handleAddOnQuantityChange = (
    foodItemId: string,
    addonId: string,
    quantity: number
  ) => {
    setFormState((prev) => ({
      ...prev,
      salads: prev.salads.map((s) =>
        s.food_item_id === foodItemId
          ? {
              ...s,
              addOns: s.addOns.map((ao) =>
                ao.addon_id === addonId
                  ? { ...ao, quantity }
                  : ao
              ),
            }
          : s
      ),
    }));
  };

  // Handler for salad note changes
  const handleSaladNoteChange = (foodItemId: string, note: string) => {
    setFormState((prev) => ({
      ...prev,
      salads: prev.salads.map((s) =>
        s.food_item_id === foodItemId ? { ...s, note } : s
      ),
    }));
  };

  const handleRegularToggle = (
    category: "middle_courses" | "mains" | "extras",
    foodItemId: string,
    checked: boolean
  ) => {
    setFormState((prev) => ({
      ...prev,
      [category]: prev[category].map((item) =>
        item.food_item_id === foodItemId
          ? { ...item, selected: checked, quantity: checked ? 1 : 0 }
          : item
      ),
    }));
  };

  const handleRegularQuantityChange = (
    category: "middle_courses" | "mains" | "extras",
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

  const handleNoteChange = (
    category: "middle_courses" | "mains" | "extras",
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

  // Sides category uses size-based quantities (ג/ק)
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

  const handleSidesSizeChange = (
    foodItemId: string,
    size: "big" | "small",
    quantity: number
  ) => {
    setFormState((prev) => ({
      ...prev,
      sides: prev.sides.map((item) => {
        if (item.food_item_id === foodItemId) {
          const newItem = {
            ...item,
            [size === "big" ? "size_big" : "size_small"]: quantity,
          };
          // Auto-select if any size > 0
          newItem.selected = newItem.size_big > 0 || newItem.size_small > 0;
          return newItem;
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
    category: "middle_courses" | "mains" | "extras",
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

  // Note handlers for non-salad categories
  const handleRegularNoteChange = (
    category: "middle_courses" | "mains" | "extras",
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

  const handleSidesNoteChange = (foodItemId: string, note: string) => {
    setFormState((prev) => ({
      ...prev,
      sides: prev.sides.map((item) =>
        item.food_item_id === foodItemId ? { ...item, note } : item
      ),
    }));
  };

  // Handler for variation size changes (for items like אורז with multiple types)
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
          // Check if any variation has a quantity > 0 to set selected state
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

  const handleBulkApply = () => {
    setFormState((prev) => ({
      ...prev,
      salads: prev.salads.map((s) => {
        // Only apply to salads that are selected but have no liters chosen yet
        const hasNoLitersSelected = s.liters.every((l) => l.quantity === 0);
        if (s.selected && hasNoLitersSelected) {
          return {
            ...s,
            liters: s.liters.map((l) => ({
              ...l,
              quantity: bulkLiters[l.liter_size_id] || 0,
            })),
          };
        }
        return s;
      }),
    }));
  };

  // Handle print - saves order data to sessionStorage and navigates to print preview
  const handlePrint = () => {
    // Build print data from form state
    const printData = {
      customer: {
        name: formState.customer_name,
        phone: formState.phone,
        address: formState.address,
      },
      order: {
        date: formState.order_date,
        time: formState.order_time,
        notes: formState.notes,
      },
      salads: formState.salads.map(s => {
          const foodItem = saladItems.find(f => f.id === s.food_item_id);
          return {
            food_item_id: s.food_item_id,
            name: foodItem?.name || "",
            selected: s.selected,
            measurement_type: s.measurement_type,
            liters: s.liters.filter(l => l.quantity > 0).map(l => {
              const literSize = literSizes.find(ls => ls.id === l.liter_size_id);
              return {
                liter_size_id: l.liter_size_id,
                label: literSize?.label || "",
                quantity: l.quantity,
              };
            }),
            size_big: s.size_big,
            size_small: s.size_small,
            regular_quantity: s.regular_quantity,
            note: s.note,
            addOns: s.addOns
              .filter(ao => ao.quantity > 0 || ao.liters.some(l => l.quantity > 0))
              .map(ao => {
                const addOn = foodItem?.add_ons?.find(a => a.id === ao.addon_id);
                return {
                  addon_id: ao.addon_id,
                  name: addOn?.name || "",
                  quantity: ao.quantity,
                  liters: ao.liters
                    .filter(l => l.quantity > 0)
                    .map(l => {
                      const literSize = literSizes.find(ls => ls.id === l.liter_size_id);
                      return {
                        liter_size_id: l.liter_size_id,
                        label: literSize?.label || "",
                        quantity: l.quantity,
                      };
                    }),
                };
              }),
          };
        }),
      middleCourses: formState.middle_courses.map(m => {
          const foodItem = middleItems.find(f => f.id === m.food_item_id);
          return {
            food_item_id: m.food_item_id,
            name: foodItem?.name || "",
            selected: m.selected,
            quantity: m.quantity,
            preparation_name: m.preparation_name,
            note: m.note,
          };
        }),
      sides: formState.sides.map(s => {
          const foodItem = sideItems.find(f => f.id === s.food_item_id);
          return {
            food_item_id: s.food_item_id,
            name: foodItem?.name || "",
            selected: s.selected,
            size_big: s.size_big,
            size_small: s.size_small,
            preparation_name: s.preparation_name,
            note: s.note,
            variations: s.variations
              ?.filter(v => v.size_big > 0 || v.size_small > 0)
              .map(v => {
                const variation = foodItem?.variations?.find(fv => fv.id === v.variation_id);
                return {
                  variation_id: v.variation_id,
                  name: variation?.name || "",
                  size_big: v.size_big,
                  size_small: v.size_small,
                };
              }),
          };
        }),
      mains: formState.mains.map(m => {
          const foodItem = mainItems.find(f => f.id === m.food_item_id);
          return {
            food_item_id: m.food_item_id,
            name: foodItem?.name || "",
            selected: m.selected,
            quantity: m.quantity,
            preparation_name: m.preparation_name,
            note: m.note,
            portion_multiplier: foodItem?.portion_multiplier,
            portion_unit: foodItem?.portion_unit,
          };
        }),
      extras: formState.extras.map(e => {
          const foodItem = extraItems.find(f => f.id === e.food_item_id);
          return {
            food_item_id: e.food_item_id,
            name: foodItem?.name || "",
            selected: e.selected,
            quantity: e.quantity,
            preparation_name: e.preparation_name,
            note: e.note,
          };
        }),
    };

    // Store in sessionStorage
    sessionStorage.setItem("printOrderData", JSON.stringify(printData));
    
    // Navigate to print preview
    router.push("/print-preview");
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formState.phone.trim()) {
      alert("נא להזין מספר טלפון");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      // Build order items from form state
      const items: SaveOrderInput["items"] = [];

      // Add salad items (with liter sizes or big/small quantities)
      formState.salads.forEach((salad) => {
        if (salad.selected) {
          let isFirstItem = true; // Track if this is the first item for this salad (to attach the note)
          
          if (salad.measurement_type === "liters") {
            // Add liter-based quantities
            salad.liters.forEach((liter) => {
              if (liter.quantity > 0) {
                items.push({
                  food_item_id: salad.food_item_id,
                  liter_size_id: liter.liter_size_id,
                  quantity: liter.quantity,
                  item_note: isFirstItem && salad.note ? salad.note : null, // Attach note to first item only
                });
                isFirstItem = false;
              }
            });
          } else if (salad.measurement_type === "size") {
            // Add size-based quantities (Big/Small)
            if (salad.size_big > 0) {
              items.push({
                food_item_id: salad.food_item_id,
                liter_size_id: null,
                size_type: "big", // ג׳ - גדול
                quantity: salad.size_big,
                item_note: isFirstItem && salad.note ? salad.note : null,
              });
              isFirstItem = false;
            }
            if (salad.size_small > 0) {
              items.push({
                food_item_id: salad.food_item_id,
                liter_size_id: null,
                size_type: "small", // ק׳ - קטן
                quantity: salad.size_small,
                item_note: isFirstItem && salad.note ? salad.note : null,
              });
              isFirstItem = false;
            }
          } else if (salad.measurement_type === "none") {
            // Add regular quantity
            if (salad.regular_quantity > 0) {
              items.push({
                food_item_id: salad.food_item_id,
                liter_size_id: null,
                quantity: salad.regular_quantity,
                item_note: salad.note || null,
              });
            }
          }

          // Add add-on items (use parent's food_item_id and add_on_id)
          salad.addOns.forEach((addOn) => {
            // Check for simple quantity first
            if (addOn.quantity > 0) {
              items.push({
                food_item_id: salad.food_item_id, // Use parent's food_item_id
                liter_size_id: null,
                quantity: addOn.quantity,
                add_on_id: addOn.addon_id, // Reference to the add-on
              });
            } else {
              // Check for liter-based quantities
              addOn.liters.forEach((liter) => {
                if (liter.quantity > 0) {
                  items.push({
                    food_item_id: salad.food_item_id, // Use parent's food_item_id
                    liter_size_id: liter.liter_size_id,
                    quantity: liter.quantity,
                    add_on_id: addOn.addon_id, // Reference to the add-on
                  });
                }
              });
            }
          });
        }
      });

      // Add regular items (middle courses, mains, extras)
      const regularCategories = [
        { key: "middle_courses" as const, data: formState.middle_courses },
        { key: "mains" as const, data: formState.mains },
        { key: "extras" as const, data: formState.extras },
      ];

      regularCategories.forEach(({ data }) => {
        data.forEach((item) => {
          if (item.selected && item.quantity > 0) {
            items.push({
              food_item_id: item.food_item_id,
              liter_size_id: null,
              quantity: item.quantity,
              preparation_id: item.preparation_id || null,
              item_note: item.note || null,
            });
          }
        });
      });

      // Add sides items (using size-based quantities ג/ק or variations)
      formState.sides.forEach((item) => {
        if (item.selected) {
          let isFirstItem = true;
          
          // Check if item has variations (like אורז)
          if (item.variations && item.variations.length > 0) {
            // Add each variation with its quantities
            item.variations.forEach((variation) => {
              if (variation.size_big > 0) {
                items.push({
                  food_item_id: item.food_item_id,
                  liter_size_id: null,
                  size_type: "big", // ג׳ - גדול
                  quantity: variation.size_big,
                  variation_id: variation.variation_id,
                  preparation_id: item.preparation_id || null,
                  item_note: isFirstItem && item.note ? item.note : null,
                });
                isFirstItem = false;
              }
              if (variation.size_small > 0) {
                items.push({
                  food_item_id: item.food_item_id,
                  liter_size_id: null,
                  size_type: "small", // ק׳ - קטן
                  quantity: variation.size_small,
                  variation_id: variation.variation_id,
                  preparation_id: item.preparation_id || null,
                  item_note: isFirstItem && item.note ? item.note : null,
                });
                isFirstItem = false;
              }
            });
          } else {
            // Regular size-based items (no variations)
            if (item.size_big > 0) {
              items.push({
                food_item_id: item.food_item_id,
                liter_size_id: null,
                size_type: "big", // ג׳ - גדול
                quantity: item.size_big,
                preparation_id: item.preparation_id || null,
                item_note: isFirstItem && item.note ? item.note : null,
              });
              isFirstItem = false;
            }
            if (item.size_small > 0) {
              items.push({
                food_item_id: item.food_item_id,
                liter_size_id: null,
                size_type: "small", // ק׳ - קטן
                quantity: item.size_small,
                preparation_id: item.preparation_id || null,
                item_note: isFirstItem && item.note ? item.note : null,
              });
            }
          }
        }
      });

      // Save order
      const result = await saveOrder({
        customer: {
          name: formState.customer_name,
          phone: formState.phone,
          address: formState.address,
        },
        order: {
          order_date: formState.order_date,
          order_time: formState.order_time,
          delivery_address: formState.address,
          notes: formState.notes,
        },
        items,
      });

      if (result.success) {
        alert(`הזמנה נשמרה בהצלחה!\nמספר הזמנה: ${result.order?.order_number}`);
        // Optionally reset form or redirect
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowRight className="h-5 w-5" />
            <span>{LABELS.actions.back}</span>
          </button>
          <h1 className="text-xl font-bold">{LABELS.orderForm.newOrder}</h1>
          <div className="w-20" /> {/* Spacer for alignment */}
        </div>
      </header>

      {/* Form Content */}
      <main className="max-w-2xl mx-auto p-4 space-y-4 pb-32">
        {/* Customer Details - Expandable */}
        <Accordion
          type="multiple"
          defaultValue={["customer-details"]}
          className="space-y-2"
        >
          <AccordionItem value="customer-details" className="bg-white rounded-xl border border-gray-200">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center justify-between w-full pl-4">
                <span className="text-lg font-semibold">
                  {LABELS.orderForm.customerDetails}
                </span>
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
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        customer_name: e.target.value,
                      }))
                    }
                    placeholder="שם הלקוח"
                  />
                  <Input
                    label={LABELS.orderForm.phone}
                    type="tel"
                    value={formState.phone}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    placeholder="050-0000000"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label={LABELS.orderForm.date}
                    type="date"
                    value={formState.order_date}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        order_date: e.target.value,
                      }))
                    }
                  />
                  <Input
                    label={LABELS.orderForm.time}
                    type="time"
                    value={formState.order_time}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        order_time: e.target.value,
                      }))
                    }
                  />
                </div>
                <Input
                  label={LABELS.orderForm.address}
                  value={formState.address}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, address: e.target.value }))
                  }
                  placeholder="כתובת למשלוח"
                />
                <Input
                  label={LABELS.orderForm.notes}
                  value={formState.notes}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="הערות להזמנה"
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Food Selection Accordion */}
        <Accordion
          type="multiple"
          defaultValue={["salads"]}
          className="space-y-2"
        >
          {/* Salads Section */}
          <AccordionItem value="salads" className="bg-white rounded-xl border border-gray-200">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center justify-between w-full pl-4">
                <span className="text-lg font-semibold">
                  {LABELS.categories.salads} ({saladCategory?.max_selection}{" "}
                  {LABELS.selection.toSelect})
                </span>
                <span
                  className={cn(
                    "text-sm font-medium px-2 py-1 rounded",
                    saladCount > 0
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-500"
                  )}
                >
                  {saladCount}/{saladCategory?.max_selection}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4">
              {/* Bulk apply section */}
              {saladCount > 0 && (
                <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                  <div className="flex flex-col gap-3">
                    <span className="text-sm font-medium">
                      {LABELS.actions.applyToAll}:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {literSizes.map((ls) => (
                        <div key={ls.id} className="flex items-center gap-1 bg-white rounded-lg px-2 py-1 border border-gray-300">
                          <span className="text-sm font-medium w-12">{ls.label}</span>
                          <span className="text-gray-400">×</span>
                          <input
                            type="number"
                            min="0"
                            value={bulkLiters[ls.id] || 0}
                            onChange={(e) =>
                              setBulkLiters((prev) => ({
                                ...prev,
                                [ls.id]: parseInt(e.target.value) || 0,
                              }))
                            }
                            className="h-8 w-12 px-2 rounded border border-gray-300 bg-white text-center text-sm"
                          />
                        </div>
                      ))}
                    </div>
                    <Button size="sm" onClick={handleBulkApply} className="self-start">
                      החל על כולם
                    </Button>
                  </div>
                </div>
              )}

              {/* Bento-style grid - 3 columns */}
              <div className="grid grid-cols-3 gap-2">
                {saladItems.map((item) => {
                  const saladState = formState.salads.find(
                    (s) => s.food_item_id === item.id
                  );
                  const measurementType = saladState?.measurement_type || item.measurement_type || "liters";
                  return (
                    <SaladCard
                      key={item.id}
                      item={item}
                      selected={saladState?.selected || false}
                      literQuantities={saladState?.liters || []}
                      sizeQuantity={{
                        big: saladState?.size_big || 0,
                        small: saladState?.size_small || 0,
                      }}
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

              {/* Liter/Size selection popup */}
              {expandedSaladId && (() => {
                const expandedItem = saladItems.find((s) => s.id === expandedSaladId);
                const expandedState = formState.salads.find((s) => s.food_item_id === expandedSaladId);
                const measurementType = expandedState?.measurement_type || expandedItem?.measurement_type || "liters";
                
                if (!expandedItem) return null;
                
                return (
                  <SaladLiterPopup
                    item={expandedItem}
                    literQuantities={expandedState?.liters || []}
                    sizeQuantity={{
                      big: expandedState?.size_big || 0,
                      small: expandedState?.size_small || 0,
                    }}
                    regularQuantity={expandedState?.regular_quantity || 0}
                    addOns={expandedState?.addOns || []}
                    note={expandedState?.note || ""}
                    literSizes={literSizes}
                    measurementType={measurementType}
                    onLiterChange={(literId, qty) =>
                      handleSaladLiterChange(expandedSaladId, literId, qty)
                    }
                    onSizeChange={(size, qty) =>
                      handleSaladSizeChange(expandedSaladId, size, qty)
                    }
                    onRegularQuantityChange={(qty) =>
                      handleSaladRegularQuantityChange(expandedSaladId, qty)
                    }
                    onAddOnLiterChange={(addonId, literId, qty) =>
                      handleAddOnLiterChange(expandedSaladId, addonId, literId, qty)
                    }
                    onAddOnQuantityChange={(addonId, qty) =>
                      handleAddOnQuantityChange(expandedSaladId, addonId, qty)
                    }
                    onNoteChange={(note) =>
                      handleSaladNoteChange(expandedSaladId, note)
                    }
                    onClose={() => setExpandedSaladId(null)}
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
                  {LABELS.categories.middle_courses} ({middleCategory?.max_selection}{" "}
                  {LABELS.selection.toSelect})
                </span>
                <span
                  className={cn(
                    "text-sm font-medium px-2 py-1 rounded",
                    middleCount > 0
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-500"
                  )}
                >
                  {middleCount}/{middleCategory?.max_selection}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 relative">
              {/* Bento Grid */}
              <div className="grid grid-cols-3 gap-2">
                {middleItems.map((item) => {
                  const itemState = formState.middle_courses.find(
                    (m) => m.food_item_id === item.id
                  );
                  return (
                    <FoodItemCard
                      key={item.id}
                      item={item}
                      selected={itemState?.selected || false}
                      quantity={itemState?.quantity || 0}
                      preparationName={itemState?.preparation_name}
                      note={itemState?.note}
                      onSelect={() => {
                        // Select the item if not already selected
                        if (!itemState?.selected) {
                          handleRegularToggle("middle_courses", item.id, true);
                        }
                        setExpandedMiddleId(item.id);
                      }}
                    />
                  );
                })}
              </div>
              
              {/* Popup for selected item */}
              {expandedMiddleId && (() => {
                const expandedItem = middleItems.find((i) => i.id === expandedMiddleId);
                const expandedState = formState.middle_courses.find(
                  (m) => m.food_item_id === expandedMiddleId
                );
                if (!expandedItem) return null;
                
                return (
                  <FoodItemPopup
                    item={expandedItem}
                    quantity={expandedState?.quantity || 0}
                    selectedPreparationId={expandedState?.preparation_id}
                    note={expandedState?.note}
                    onQuantityChange={(qty) =>
                      handleRegularQuantityChange("middle_courses", expandedMiddleId, qty)
                    }
                    onPreparationChange={(prepId, prepName) =>
                      handlePreparationChange("middle_courses", expandedMiddleId, prepId, prepName)
                    }
                    onNoteChange={(note) =>
                      handleRegularNoteChange("middle_courses", expandedMiddleId, note)
                    }
                    onClose={() => setExpandedMiddleId(null)}
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
                  {LABELS.categories.sides} ({sidesCategory?.max_selection}{" "}
                  {LABELS.selection.toSelect})
                </span>
                <span
                  className={cn(
                    "text-sm font-medium px-2 py-1 rounded",
                    sidesCount > 0
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-500"
                  )}
                >
                  {sidesCount}/{sidesCategory?.max_selection}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 relative">
              {/* Bento Grid */}
              <div className="grid grid-cols-3 gap-2">
                {sideItems.map((item) => {
                  const itemState = formState.sides.find(
                    (s) => s.food_item_id === item.id
                  );
                  const hasVariations = item.variations && item.variations.length > 0;
                  return (
                    <FoodItemCard
                      key={item.id}
                      item={item}
                      selected={itemState?.selected || false}
                      quantity={0}
                      sizeQuantity={{
                        big: itemState?.size_big || 0,
                        small: itemState?.size_small || 0,
                      }}
                      useSizeMode={!hasVariations}
                      preparationName={itemState?.preparation_name}
                      note={itemState?.note}
                      variationQuantities={itemState?.variations}
                      onSelect={() => {
                        // Select the item if not already selected
                        if (!itemState?.selected) {
                          handleSidesToggle(item.id, true);
                        }
                        setExpandedSideId(item.id);
                      }}
                    />
                  );
                })}
              </div>
              
              {/* Popup for selected item */}
              {expandedSideId && (() => {
                const expandedItem = sideItems.find((i) => i.id === expandedSideId);
                const expandedState = formState.sides.find(
                  (s) => s.food_item_id === expandedSideId
                );
                if (!expandedItem) return null;
                
                const hasVariations = expandedItem.variations && expandedItem.variations.length > 0;
                
                return (
                  <FoodItemPopup
                    item={expandedItem}
                    quantity={0}
                    sizeQuantity={{
                      big: expandedState?.size_big || 0,
                      small: expandedState?.size_small || 0,
                    }}
                    useSizeMode={!hasVariations}
                    selectedPreparationId={expandedState?.preparation_id}
                    note={expandedState?.note}
                    variationQuantities={expandedState?.variations}
                    onQuantityChange={() => {}}
                    onSizeChange={(size, qty) =>
                      handleSidesSizeChange(expandedSideId, size, qty)
                    }
                    onPreparationChange={(prepId, prepName) =>
                      handleSidesPreparationChange(expandedSideId, prepId, prepName)
                    }
                    onNoteChange={(note) =>
                      handleSidesNoteChange(expandedSideId, note)
                    }
                    onVariationSizeChange={(variationId, size, qty) =>
                      handleSidesVariationSizeChange(expandedSideId, variationId, size, qty)
                    }
                    onClose={() => setExpandedSideId(null)}
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
                  {LABELS.categories.mains} ({mainsCategory?.max_selection}{" "}
                  {LABELS.selection.toSelect})
                </span>
                <span
                  className={cn(
                    "text-sm font-medium px-2 py-1 rounded",
                    mainsCount > 0
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-500"
                  )}
                >
                  {mainsCount}/{mainsCategory?.max_selection}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 relative">
              {/* Bento Grid */}
              <div className="grid grid-cols-3 gap-2">
                {mainItems.map((item) => {
                  const itemState = formState.mains.find(
                    (m) => m.food_item_id === item.id
                  );
                  return (
                    <FoodItemCard
                      key={item.id}
                      item={item}
                      selected={itemState?.selected || false}
                      quantity={itemState?.quantity || 0}
                      preparationName={itemState?.preparation_name}
                      note={itemState?.note}
                      onSelect={() => {
                        // Select the item if not already selected
                        if (!itemState?.selected) {
                          handleRegularToggle("mains", item.id, true);
                        }
                        setExpandedMainId(item.id);
                      }}
                    />
                  );
                })}
              </div>
              
              {/* Popup for selected item */}
              {expandedMainId && (() => {
                const expandedItem = mainItems.find((i) => i.id === expandedMainId);
                const expandedState = formState.mains.find(
                  (m) => m.food_item_id === expandedMainId
                );
                if (!expandedItem) return null;
                
                return (
                  <FoodItemPopup
                    item={expandedItem}
                    quantity={expandedState?.quantity || 0}
                    selectedPreparationId={expandedState?.preparation_id}
                    note={expandedState?.note}
                    onQuantityChange={(qty) =>
                      handleRegularQuantityChange("mains", expandedMainId, qty)
                    }
                    onPreparationChange={(prepId, prepName) =>
                      handlePreparationChange("mains", expandedMainId, prepId, prepName)
                    }
                    onNoteChange={(note) =>
                      handleNoteChange("mains", expandedMainId, note)
                    }
                    onClose={() => setExpandedMainId(null)}
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
                <span
                  className={cn(
                    "text-sm font-medium px-2 py-1 rounded",
                    extrasCount > 0
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-500"
                  )}
                >
                  {extrasCount}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 relative">
              {extraItems.length > 0 ? (
                <>
                  {/* Bento Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {extraItems.map((item) => {
                      const itemState = formState.extras.find(
                        (e) => e.food_item_id === item.id
                      );
                      return (
                        <FoodItemCard
                          key={item.id}
                          item={item}
                          selected={itemState?.selected || false}
                          quantity={itemState?.quantity || 0}
                          preparationName={itemState?.preparation_name}
                          note={itemState?.note}
                          onSelect={() => {
                            // Select the item if not already selected
                            if (!itemState?.selected) {
                              handleRegularToggle("extras", item.id, true);
                            }
                            setExpandedExtraId(item.id);
                          }}
                        />
                      );
                    })}
                  </div>
                  
                  {/* Popup for selected item */}
                  {expandedExtraId && (() => {
                    const expandedItem = extraItems.find((i) => i.id === expandedExtraId);
                    const expandedState = formState.extras.find(
                      (e) => e.food_item_id === expandedExtraId
                    );
                    if (!expandedItem) return null;
                    
                    return (
                      <FoodItemPopup
                        item={expandedItem}
                        quantity={expandedState?.quantity || 0}
                        selectedPreparationId={expandedState?.preparation_id}
                        note={expandedState?.note}
                        onQuantityChange={(qty) =>
                          handleRegularQuantityChange("extras", expandedExtraId, qty)
                        }
                        onPreparationChange={(prepId, prepName) =>
                          handlePreparationChange("extras", expandedExtraId, prepId, prepName)
                        }
                        onNoteChange={(note) =>
                          handleNoteChange("extras", expandedExtraId, note)
                        }
                        onClose={() => setExpandedExtraId(null)}
                      />
                    );
                  })()}
                </>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  {LABELS.empty.noItems}
                </p>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </main>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          <Button 
            onClick={handleSave} 
            className="flex-1 gap-2"
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            {isSaving ? "שומר..." : LABELS.actions.save}
          </Button>
          <Button 
            variant="secondary" 
            className="gap-2" 
            disabled={isSaving}
            onClick={handlePrint}
          >
            <Printer className="h-5 w-5" />
            {LABELS.actions.print}
          </Button>
        </div>
        {saveError && (
          <p className="text-red-500 text-sm text-center mt-2">{saveError}</p>
        )}
      </div>
    </div>
  );
}
