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
import { Printer, Save, Loader2, RotateCcw } from "lucide-react";
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
  isBulkApplied: boolean;
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

// Extras form item - supports all measurement types like salads
interface ExtrasFormItem {
  food_item_id: string;
  selected: boolean;
  measurement_type: MeasurementType;
  // For liters measurement
  liters: { liter_size_id: string; quantity: number }[];
  // For size measurement (Big/Small)
  size_big: number;
  size_small: number;
  // For regular quantity (measurement_type "none")
  quantity: number;
  // For preparations
  preparation_id?: string;
  preparation_name?: string;
  note?: string;
  // Optional price for extras
  price?: number;
}

// Extra item entry - for items added as extras from mains/sides/middle_courses
interface ExtraItemEntry {
  id: string;                      // Unique ID (uuid)
  source_food_item_id: string;     // Original food item ID
  source_category: 'mains' | 'sides' | 'middle_courses';
  name: string;                    // Food item name

  // Quantity (based on source category type)
  quantity?: number;               // For mains/middle_courses
  size_big?: number;               // For sides (ג׳)
  size_small?: number;             // For sides (ק׳)
  variations?: { variation_id: string; name: string; size_big: number; size_small: number }[];

  price: number;                   // Custom price (required)
  note?: string;
  preparation_name?: string;
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
  customer_time: string; 
  customer_name: string;
  phone: string;
  phone_alt: string;
  order_date: string;
  order_time: string;
  address: string;
  notes: string;
  // Pricing fields
  total_portions: number;
  price_per_portion: number;
  delivery_fee: number;
  // Food items
  salads: SaladFormItem[];
  middle_courses: RegularFormItem[];
  sides: SidesFormItem[];
  mains: RegularFormItem[];
  extras: ExtrasFormItem[];
  bakery: ExtrasFormItem[];
  // Extra items from mains/sides/middle_courses with custom prices
  extra_items: ExtraItemEntry[];
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
  const bakeryCategory = categories.find((c) => c.name_en === "bakery");

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
  const bakeryItems = React.useMemo(
    () => getFoodItemsByCategoryName(foodItems, categories, "bakery"),
    [foodItems, categories]
  );

  const buildInitialFormState = React.useCallback((): OrderFormState => ({
    customer_time: "",
    customer_name: "",
    phone: "",
    phone_alt: "",
    order_date: new Date().toISOString().split("T")[0],
    order_time: "",
    address: "",
    notes: "",
    total_portions: 0,
    price_per_portion: 0,
    delivery_fee: 0,
    salads: saladItems.map((item) => ({
      food_item_id: item.id,
      selected: false,
      measurement_type: item.measurement_type || "liters",
      isBulkApplied: false,
      liters: [
        // Global liter sizes
        ...literSizes.map((ls) => ({
          liter_size_id: ls.id,
          quantity: 0,
        })),
        // Custom liter sizes for this item (prefixed with "custom_")
        ...(item.custom_liters || []).filter(cl => cl.is_active).map((cl) => ({
          liter_size_id: `custom_${cl.id}`,
          quantity: 0,
        })),
      ],
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
      size_big: 0,
      size_small: 0,
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
    extra_items: [],
  }), [saladItems, middleItems, sideItems, mainItems, extraItems, bakeryItems, literSizes]);

  const buildInitialBulkLiters = React.useCallback(() => {
    const initial: { [key: string]: number } = {};
    literSizes.forEach((ls) => {
      initial[ls.id] = 0;
    });
    return initial;
  }, [literSizes]);

  // Initialize form state only after data is loaded
  const [formState, setFormState] = React.useState<OrderFormState>({
    customer_time: "",
    customer_name: "",
    phone: "",
    phone_alt: "",
    order_date: "", // Will be set on client side
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
      setFormState(buildInitialFormState());
      setIsDataInitialized(true);
    }
  }, [isDataInitialized, isLoading, foodItems, literSizes, buildInitialFormState]);

  // Restore form state if returning from print preview
  React.useEffect(() => {
    if (isDataInitialized) {
      const savedFormState = sessionStorage.getItem("orderFormState");
      if (savedFormState) {
        try {
          const parsed = JSON.parse(savedFormState);
          setFormState(parsed);
          // Clear after restoration to avoid stale data on fresh visits
          sessionStorage.removeItem("orderFormState");
        } catch (e) {
          console.error("Error restoring form state:", e);
        }
      }
    }
  }, [isDataInitialized]);

  // Bulk apply state for salads - now with all 4 liter sizes
  const [bulkLiters, setBulkLiters] = React.useState<{ [key: string]: number }>({});

  // Initialize bulk liters when liter sizes load
  React.useEffect(() => {
    if (literSizes.length > 0) {
      setBulkLiters(buildInitialBulkLiters());
    }
  }, [literSizes, buildInitialBulkLiters]);

  // Track which salad has its liter options expanded (only one at a time)
  const [expandedSaladId, setExpandedSaladId] = React.useState<string | null>(null);
  
  // Track expanded items for each food category (bento popup)
  const [expandedMiddleId, setExpandedMiddleId] = React.useState<string | null>(null);
  const [expandedSideId, setExpandedSideId] = React.useState<string | null>(null);
  const [expandedMainId, setExpandedMainId] = React.useState<string | null>(null);
  const [expandedExtraId, setExpandedExtraId] = React.useState<string | null>(null);
  const [expandedBakeryId, setExpandedBakeryId] = React.useState<string | null>(null);
  const handleResetForm = () => {
    setFormState(buildInitialFormState());
    setBulkLiters(buildInitialBulkLiters());
    setExpandedSaladId(null);
    setExpandedMiddleId(null);
    setExpandedSideId(null);
    setExpandedMainId(null);
    setExpandedExtraId(null);
    setExpandedBakeryId(null);
    setSaveError(null);
    setIsSaving(false);
    sessionStorage.removeItem("orderFormState");
  };

  // Saving state - must be before early returns!
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  // Calculate selection counts
  const saladCount = formState.salads.filter((s) => s.selected).length;
  const middleCount = formState.middle_courses.filter((m) => m.selected).length;
  const sidesCount = formState.sides.filter((s) => s.selected).length;
  const mainsCount = formState.mains.filter((m) => m.selected).length;
  const extrasCount = formState.extras.filter((e) => e.selected).length;
  const bakeryCount = formState.bakery.filter((b) => b.selected).length;
  const customerPhones = React.useMemo(
    () => [formState.phone, formState.phone_alt].filter(Boolean).join(" • "),
    [formState.phone, formState.phone_alt]
  );

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
      salads: prev.salads.map((s) => {
        if (s.food_item_id !== foodItemId) return s;

        // Check if liter size already exists in the array
        const existingIndex = s.liters.findIndex((l) => l.liter_size_id === literSizeId);

        if (existingIndex >= 0) {
          // Update existing liter
          return {
            ...s,
            liters: s.liters.map((l) =>
              l.liter_size_id === literSizeId ? { ...l, quantity } : l
            ),
          };
        } else {
          // Add new liter (for custom liters added after form initialization)
          return {
            ...s,
            liters: [...s.liters, { liter_size_id: literSizeId, quantity }],
          };
        }
      }),
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
                      l.liter_size_id === literSizeId
                        ? { ...l, quantity }
                        : l
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
                // Add new liter size entry if it doesn't exist
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

  const handleNoteChange = (
    category: "middle_courses" | "mains" | "extras" | "bakery",
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

  // Cancel handlers for non-salad categories - reset item to initial state
  const handleCancelMiddleCourse = (foodItemId: string) => {
    setFormState((prev) => ({
      ...prev,
      middle_courses: prev.middle_courses.map((item) =>
        item.food_item_id === foodItemId
          ? { ...item, selected: false, quantity: 0, preparation_id: undefined, preparation_name: undefined, note: undefined }
          : item
      ),
    }));
    // Also remove any extra items for this food item
    setFormState((prev) => ({
      ...prev,
      extra_items: prev.extra_items.filter(e => e.source_food_item_id !== foodItemId),
    }));
  };

  const handleCancelSide = (foodItemId: string) => {
    const sideItem = sideItems.find(s => s.id === foodItemId);
    setFormState((prev) => ({
      ...prev,
      sides: prev.sides.map((item) =>
        item.food_item_id === foodItemId
          ? {
              ...item,
              selected: false,
              size_big: 0,
              size_small: 0,
              preparation_id: undefined,
              preparation_name: undefined,
              note: undefined,
              variations: (sideItem?.variations || []).map((v) => ({
                variation_id: v.id,
                size_big: 0,
                size_small: 0,
              })),
            }
          : item
      ),
    }));
    // Also remove any extra items for this food item
    setFormState((prev) => ({
      ...prev,
      extra_items: prev.extra_items.filter(e => e.source_food_item_id !== foodItemId),
    }));
  };

  const handleCancelMain = (foodItemId: string) => {
    setFormState((prev) => ({
      ...prev,
      mains: prev.mains.map((item) =>
        item.food_item_id === foodItemId
          ? { ...item, selected: false, quantity: 0, preparation_id: undefined, preparation_name: undefined, note: undefined }
          : item
      ),
    }));
    // Also remove any extra items for this food item
    setFormState((prev) => ({
      ...prev,
      extra_items: prev.extra_items.filter(e => e.source_food_item_id !== foodItemId),
    }));
  };

  const handleCancelExtra = (foodItemId: string) => {
    setFormState((prev) => ({
      ...prev,
      extras: prev.extras.map((item) =>
        item.food_item_id === foodItemId
          ? {
              ...item,
              selected: false,
              quantity: 0,
              liters: item.liters.map((l) => ({ ...l, quantity: 0 })),
              size_big: 0,
              size_small: 0,
              preparation_id: undefined,
              preparation_name: undefined,
              note: undefined,
              price: undefined,
            }
          : item
      ),
    }));
  };

  const handleCancelBakery = (foodItemId: string) => {
    setFormState((prev) => ({
      ...prev,
      bakery: prev.bakery.map((item) =>
        item.food_item_id === foodItemId
          ? {
              ...item,
              selected: false,
              quantity: 0,
              liters: item.liters.map((l) => ({ ...l, quantity: 0 })),
              size_big: 0,
              size_small: 0,
              preparation_id: undefined,
              preparation_name: undefined,
              note: undefined,
            }
          : item
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
          // Auto-select if any liters > 0
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
          // Auto-select if any size > 0
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

  const handleExtrasPriceChange = (
    foodItemId: string,
    price: number
  ) => {
    setFormState((prev) => ({
      ...prev,
      extras: prev.extras.map((item) =>
        item.food_item_id === foodItemId
          ? { ...item, price }
          : item
      ),
    }));
  };

  // Bakery category handlers - supports all measurement types like extras
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

  // Sides category uses size-based quantities (ג/ק)
  const handleSidesToggle = (foodItemId: string, checked: boolean) => {
    setFormState((prev) => ({
      ...prev,
      sides: prev.sides.map((item) =>
        item.food_item_id === foodItemId
          ? { ...item, selected: checked }
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

  // Note handlers for non-salad categories
  const handleRegularNoteChange = (
    category: "middle_courses" | "mains" | "extras" | "bakery",
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
        if (s.measurement_type !== "liters") return s;
        // Only apply to salads that are selected but have no liters chosen yet
        const hasNoLitersSelected = s.liters.every((l) => l.quantity === 0);
        if (s.selected && hasNoLitersSelected) {
          return {
            ...s,
            isBulkApplied: true,
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
        phone2: formState.phone_alt || undefined,
        address: formState.address,
      },
      order: {
        date: formState.order_date,
        time: formState.order_time,
        customerTime: formState.customer_time || undefined,
        notes: formState.notes,
        totalPortions: formState.total_portions || undefined,
        pricePerPortion: formState.price_per_portion || undefined,
        deliveryFee: formState.delivery_fee || undefined,
        totalPayment: formState.total_portions && formState.price_per_portion
          ? (formState.total_portions * formState.price_per_portion) + (formState.delivery_fee || 0) + totalExtraPrice
          : (totalExtraPrice > 0 ? totalExtraPrice : undefined),
      },
      salads: formState.salads.map(s => {
          const foodItem = saladItems.find(f => f.id === s.food_item_id);
          return {
            food_item_id: s.food_item_id,
            name: foodItem?.name || "",
            selected: s.selected,
            measurement_type: s.measurement_type,
            isBulkApplied: s.isBulkApplied,
            liters: s.liters.filter(l => l.quantity > 0).map(l => {
              // Check if this is a custom liter size (prefixed with "custom_")
              if (l.liter_size_id.startsWith("custom_")) {
                const customId = l.liter_size_id.replace("custom_", "");
                const customLiter = foodItem?.custom_liters?.find(cl => cl.id === customId);
                return {
                  liter_size_id: l.liter_size_id,
                  label: customLiter?.label || "",
                  quantity: l.quantity,
                };
              }
              // Global liter size
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
                      // Check if this is a custom liter size (prefixed with "custom_")
                      if (l.liter_size_id.startsWith("custom_")) {
                        const customId = l.liter_size_id.replace("custom_", "");
                        const customLiter = foodItem?.custom_liters?.find(cl => cl.id === customId);
                        return {
                          liter_size_id: l.liter_size_id,
                          label: customLiter?.label || "",
                          quantity: l.quantity,
                        };
                      }
                      // Global liter size
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
            measurement_type: e.measurement_type,
            quantity: e.quantity,
            liters: e.liters,
            size_big: e.size_big,
            size_small: e.size_small,
            preparation_name: e.preparation_name,
            note: e.note,
            price: e.price,
            portion_multiplier: foodItem?.portion_multiplier,
            portion_unit: foodItem?.portion_unit,
          };
        }),
      bakery: formState.bakery.map(b => {
          const foodItem = bakeryItems.find(f => f.id === b.food_item_id);
          return {
            food_item_id: b.food_item_id,
            name: foodItem?.name || "",
            selected: b.selected,
            quantity: b.quantity,
            preparation_name: b.preparation_name,
            note: b.note,
          };
        }),
      // Extra items from mains/sides/middle_courses with custom prices
      extraItems: formState.extra_items.map(e => ({
        id: e.id,
        source_food_item_id: e.source_food_item_id,
        name: e.name,
        source_category: e.source_category,
        quantity: e.quantity,
        size_big: e.size_big,
        size_small: e.size_small,
        variations: e.variations,
        price: e.price,
        note: e.note,
        preparation_name: e.preparation_name,
      })),
      totalExtraPrice: totalExtraPrice,
    };

    // Store in sessionStorage
    sessionStorage.setItem("printOrderData", JSON.stringify(printData));

    // Save form state for restoration when returning from print preview
    sessionStorage.setItem("orderFormState", JSON.stringify(formState));

    // Set navigation source so back button returns to order page
    sessionStorage.setItem("navigationSource", "order");

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

      // Add regular items (middle courses, mains) - simple quantity only
      const regularCategories = [
        { key: "middle_courses" as const, data: formState.middle_courses },
        { key: "mains" as const, data: formState.mains },
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

      // Add bakery items (supports all measurement types like extras)
      formState.bakery.forEach((item) => {
        if (item.selected) {
          const bakeryItem = bakeryItems.find((b) => b.id === item.food_item_id);
          const measurementType = bakeryItem?.measurement_type || "none";
          let isFirstItem = true;

          if (measurementType === "liters") {
            // Save liter-based quantities
            item.liters.forEach((liter) => {
              if (liter.quantity > 0) {
                items.push({
                  food_item_id: item.food_item_id,
                  liter_size_id: liter.liter_size_id,
                  quantity: liter.quantity,
                  preparation_id: item.preparation_id || null,
                  item_note: isFirstItem && item.note ? item.note : null,
                });
                isFirstItem = false;
              }
            });
          } else if (measurementType === "size") {
            // Save size-based quantities (big/small)
            if (item.size_big > 0) {
              items.push({
                food_item_id: item.food_item_id,
                liter_size_id: null,
                size_type: "big",
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
                size_type: "small",
                quantity: item.size_small,
                preparation_id: item.preparation_id || null,
                item_note: isFirstItem && item.note ? item.note : null,
              });
            }
          } else {
            // Regular quantity
            if (item.quantity > 0) {
              items.push({
                food_item_id: item.food_item_id,
                liter_size_id: null,
                quantity: item.quantity,
                preparation_id: item.preparation_id || null,
                item_note: item.note || null,
              });
            }
          }
        }
      });

      // Add extras items (supports all measurement types)
      formState.extras.forEach((item) => {
        if (item.selected) {
          const extraItem = extraItems.find((e) => e.id === item.food_item_id);
          const measurementType = extraItem?.measurement_type || "none";
          let isFirstItem = true;

          if (measurementType === "liters") {
            // Save liter-based quantities
            item.liters.forEach((liter) => {
              if (liter.quantity > 0) {
                items.push({
                  food_item_id: item.food_item_id,
                  liter_size_id: liter.liter_size_id,
                  quantity: liter.quantity,
                  preparation_id: item.preparation_id || null,
                  item_note: isFirstItem && item.note ? item.note : null,
                  price: item.price || null,
                });
                isFirstItem = false;
              }
            });
          } else if (measurementType === "size") {
            // Save size-based quantities (big/small)
            if (item.size_big > 0) {
              items.push({
                food_item_id: item.food_item_id,
                liter_size_id: null,
                size_type: "big",
                quantity: item.size_big,
                preparation_id: item.preparation_id || null,
                item_note: isFirstItem && item.note ? item.note : null,
                price: item.price || null,
              });
              isFirstItem = false;
            }
            if (item.size_small > 0) {
              items.push({
                food_item_id: item.food_item_id,
                liter_size_id: null,
                size_type: "small",
                quantity: item.size_small,
                preparation_id: item.preparation_id || null,
                item_note: isFirstItem && item.note ? item.note : null,
                price: item.price || null,
              });
            }
          } else {
            // Regular quantity
            if (item.quantity > 0) {
              items.push({
                food_item_id: item.food_item_id,
                liter_size_id: null,
                quantity: item.quantity,
                preparation_id: item.preparation_id || null,
                item_note: item.note || null,
                price: item.price || null,
              });
            }
          }
        }
      });

      // Add sides items (supports variations)
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
              isFirstItem = false;
            }
          }
        }
      });

      // Save order
      const result = await saveOrder({
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
        items,
        extra_items: formState.extra_items,
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

const getHebrewDay = (dateString: string): string => {
  if (!dateString) return "";
  
  const date = new Date(dateString);
  
  // Safety check: if date is invalid, return empty string
  if (isNaN(date.getTime())) return ""; 

  // 'he-IL' sets the locale to Hebrew
  // weekday: 'long' gives the full name (e.g., יום ראשון)
  return new Intl.DateTimeFormat("he-IL", { weekday: "long" }).format(date);
};
const dayName = getHebrewDay(formState.order_date);
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Mobile optimized */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="w-16 sm:w-20" />
          <h1 className="text-lg sm:text-xl font-bold">{LABELS.orderForm.newOrder}</h1>
          <div className="w-16 sm:w-20" /> {/* Spacer for alignment */}
        </div>
      </header>

      {/* Form Content - Mobile optimized */}
      <main className="max-w-2xl mx-auto px-3 sm:p-4 py-3 sm:py-4 space-y-3 sm:space-y-4 pb-28 sm:pb-32">
        {/* Customer Details - Expandable */}
        <Accordion
          type="multiple"
          defaultValue={["customer-details"]}
          className="space-y-2"
        >
          <AccordionItem value="customer-details" className="bg-white rounded-xl border border-gray-200">
            <AccordionTrigger className="px-3 sm:px-4 hover:no-underline">
              <div className="flex items-center justify-between w-full pl-2 sm:pl-4">
                <span className="text-base sm:text-lg font-semibold">
                  {LABELS.orderForm.customerDetails}
                </span>
                {(formState.customer_name || customerPhones) && (
                  <span className="text-xs sm:text-sm text-gray-600 font-normal truncate max-w-[120px] sm:max-w-[200px]">
                    {formState.customer_name}
                    {formState.customer_name && customerPhones ? " • " : ""}
                    {customerPhones}
                  </span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-3 sm:px-4">
              <div className="space-y-3">
                {/* Customer Name - Full width on mobile for better input */}
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

                {/* Phone numbers - side by side */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <Input
                    label={LABELS.orderForm.phone}
                    type="tel"
                    value={formState.phone}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    placeholder="050-0000000"
                  />
                  <Input
                    label="טלפון נוסף"
                    type="tel"
                    value={formState.phone_alt}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, phone_alt: e.target.value }))
                    }
                    placeholder="אופציונלי"
                  />
                </div>

                {/* Date field - full width with day name */}
                <div className="relative w-full">
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
                    className="pl-16 sm:pl-20"
                  />
                  {dayName && (
                    <span className="absolute left-2 sm:left-3 bottom-2.5 sm:bottom-3 text-xs sm:text-sm text-blue-600 font-medium pointer-events-none">
                      {dayName}
                    </span>
                  )}
                </div>

                {/* Time fields - exactly 50% each on mobile */}
                <div className="flex gap-2 sm:gap-3 w-full">
                  <div className="flex-1 min-w-0">
                    <Input
                      label="זמן ללקוח"
                      type="time"
                      value={formState.customer_time || ""}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          customer_time: e.target.value,
                        }))
                      }
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Input
                      label="זמן למטבח"
                      type="time"
                      value={formState.order_time}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          order_time: e.target.value,
                        }))
                      }
                      className="w-full"
                    />
                  </div>
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

                {/* Pricing Section */}
                <div className="pt-3 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">תמחור</h4>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
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
                      label="מחיר למנה"
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
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-2 sm:mt-3">
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
                      <label className="text-xs sm:text-sm font-medium text-gray-700">סה״כ לתשלום</label>
                      <div className="h-11 sm:h-12 px-3 sm:px-4 rounded-lg border border-gray-300 bg-gray-50 flex items-center justify-center">
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

        {/* Food Selection Accordion */}
        <Accordion
          type="multiple"
          defaultValue={[]}
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
              {/* Warning if no liter sizes */}
              {literSizes.length === 0 && (
                <div className="mb-4 p-3 bg-yellow-100 rounded-lg text-yellow-800 text-sm">
                  ⚠️ אין גדלי ליטרים בבסיס הנתונים - יש להוסיף אותם בלוח הניהול
                </div>
              )}

              {/* Bulk apply section */}
              {saladCount > 0 && literSizes.length > 0 && (
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
                    onCancel={() => {
                      // Reset all quantities and unselect
                      setFormState((prev) => ({
                        ...prev,
                        salads: prev.salads.map((s) =>
                          s.food_item_id === expandedSaladId
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
                    }}
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
                      extraQuantity={getExtraForItem(item.id)}
                      onSelect={() => {
                        // Only select if quantity > 0
                        if (!itemState?.selected && (itemState?.quantity || 0) > 0) {
                          handleRegularToggle("middle_courses", item.id, true);
                        } else if ((itemState?.quantity || 0) === 0) {
                          handleRegularToggle("middle_courses", item.id, false);
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
                    onCancel={() => handleCancelMiddleCourse(expandedMiddleId)}
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
                      extraQuantity={getExtraForItem(item.id)}
                      onSelect={() => {
                        // Only select if size_big or size_small > 0
                        const isSelected = (itemState?.size_big || 0) > 0 || (itemState?.size_small || 0) > 0;
                        handleSidesToggle(item.id, isSelected);
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
                    onCancel={() => handleCancelSide(expandedSideId)}
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
                      extraQuantity={getExtraForItem(item.id)}
                      onSelect={() => {
                        // Only select if quantity > 0
                        if (!itemState?.selected && (itemState?.quantity || 0) > 0) {
                          handleRegularToggle("mains", item.id, true);
                        } else if ((itemState?.quantity || 0) === 0) {
                          handleRegularToggle("mains", item.id, false);
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
                    onCancel={() => handleCancelMain(expandedMainId)}
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
                        const parts = [];
                        if (extraItem.size_big) parts.push(`ג׳:${extraItem.size_big}`);
                        if (extraItem.size_small) parts.push(`ק׳:${extraItem.size_small}`);
                        qtyDisplay = parts.join(" ");
                      } else if (extraItem.variations && extraItem.variations.length > 0) {
                        qtyDisplay = extraItem.variations
                          .filter(v => v.size_big > 0 || v.size_small > 0)
                          .map(v => {
                            const parts = [];
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
                  {/* Bento Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {extraItems.map((item) => {
                      const itemState = formState.extras.find(
                        (e) => e.food_item_id === item.id
                      );
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
                            // Only select if quantity/size/liters > 0
                            const measurementType = item.measurement_type || "none";
                            let isSelected = false;
                            if (measurementType === "size") {
                              isSelected = (itemState?.size_big || 0) > 0 || (itemState?.size_small || 0) > 0;
                            } else if (measurementType === "liters") {
                              isSelected = itemState?.liters?.some(l => l.quantity > 0) || false;
                            } else {
                              isSelected = (itemState?.quantity || 0) > 0;
                            }
                            handleExtrasToggle(item.id, isSelected);
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

                              {/* Price field */}
                              <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  💰 מחיר (₪)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={expandedState?.price || ""}
                                  onChange={(e) => handleExtrasPriceChange(expandedExtraId!, parseFloat(e.target.value) || 0)}
                                  placeholder="הזן מחיר..."
                                  className="w-full h-12 px-3 py-2 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                  onChange={(e) => handleNoteChange("extras", expandedExtraId, e.target.value)}
                                  placeholder="הוסף הערה..."
                                  className="w-full h-20 px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  dir="rtl"
                                />
                              </div>

                              {/* Cancel button */}
                              <button
                                type="button"
                                onClick={() => {
                                  handleCancelExtra(expandedExtraId);
                                  setExpandedExtraId(null);
                                }}
                                className="w-full h-10 mb-4 bg-gray-100 text-gray-600 font-semibold rounded-xl border-2 border-gray-300 hover:bg-gray-200 active:scale-[0.98] transition-all"
                              >
                                ביטול
                              </button>

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
                        onQuantityChange={(qty) =>
                          handleExtrasQuantityChange(expandedExtraId, qty)
                        }
                        onSizeChange={useSizeMode ? (size, qty) =>
                          handleExtrasSizeChange(expandedExtraId, size, qty)
                        : undefined}
                        onPreparationChange={(prepId, prepName) =>
                          handlePreparationChange("extras", expandedExtraId, prepId, prepName)
                        }
                        onNoteChange={(note) =>
                          handleNoteChange("extras", expandedExtraId, note)
                        }
                        onClose={() => setExpandedExtraId(null)}
                        onCancel={() => handleCancelExtra(expandedExtraId)}
                        price={expandedState?.price}
                        onPriceChange={(newPrice) =>
                          handleExtrasPriceChange(expandedExtraId, newPrice)
                        }
                        showPriceInput={true}
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

          {/* Bakery Section */}
          <AccordionItem value="bakery" className="bg-white rounded-xl border border-gray-200">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center justify-between w-full pl-4">
                <span className="text-lg font-semibold">
                  {LABELS.categories.bakery} ({LABELS.selection.unlimited})
                </span>
                <span
                  className={cn(
                    "text-sm font-medium px-2 py-1 rounded",
                    bakeryCount > 0
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-500"
                  )}
                >
                  {bakeryCount}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 relative">
              {bakeryItems.length > 0 ? (
                <>
                  {/* Bento Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {bakeryItems.map((item) => {
                      const itemState = formState.bakery.find(
                        (b) => b.food_item_id === item.id
                      );
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
                            // Only select if quantity/size/liters > 0
                            const measurementType = item.measurement_type || "none";
                            let isSelected = false;
                            if (measurementType === "size") {
                              isSelected = (itemState?.size_big || 0) > 0 || (itemState?.size_small || 0) > 0;
                            } else if (measurementType === "liters") {
                              isSelected = itemState?.liters?.some(l => l.quantity > 0) || false;
                            } else {
                              isSelected = (itemState?.quantity || 0) > 0;
                            }
                            handleBakeryToggle(item.id, isSelected);
                            setExpandedBakeryId(item.id);
                          }}
                        />
                      );
                    })}
                  </div>
                  
                  {/* Popup for selected item */}
                  {expandedBakeryId && (() => {
                    const expandedItem = bakeryItems.find((i) => i.id === expandedBakeryId);
                    const expandedState = formState.bakery.find(
                      (b) => b.food_item_id === expandedBakeryId
                    );
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
                                  onChange={(e) => handleNoteChange("bakery", expandedBakeryId, e.target.value)}
                                  placeholder="הוסף הערה..."
                                  className="w-full h-20 px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  dir="rtl"
                                />
                              </div>

                              {/* Cancel button */}
                              <button
                                type="button"
                                onClick={() => {
                                  handleCancelBakery(expandedBakeryId);
                                  setExpandedBakeryId(null);
                                }}
                                className="w-full h-10 mb-4 bg-gray-100 text-gray-600 font-semibold rounded-xl border-2 border-gray-300 hover:bg-gray-200 active:scale-[0.98] transition-all"
                              >
                                ביטול
                              </button>
                              
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
                        onQuantityChange={(qty) =>
                          handleBakeryQuantityChange(expandedBakeryId, qty)
                        }
                        onSizeChange={(size, qty) =>
                          handleBakerySizeChange(expandedBakeryId, size, qty)
                        }
                        onPreparationChange={(prepId, prepName) =>
                          handlePreparationChange("bakery", expandedBakeryId, prepId, prepName)
                        }
                        onNoteChange={(note) =>
                          handleRegularNoteChange("bakery", expandedBakeryId, note)
                        }
                        onClose={() => setExpandedBakeryId(null)}
                        onCancel={() => handleCancelBakery(expandedBakeryId)}
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

      {/* Fixed Bottom Action Bar - Mobile optimized */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 p-3 sm:p-4 safe-area-bottom">
        <div className="max-w-2xl mx-auto flex gap-2 sm:gap-3">
          <Button
            variant="secondary"
            className="gap-1.5 sm:gap-2 px-3 sm:px-4 text-sm"
            disabled={isSaving}
            onClick={handleResetForm}
          >
            <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden xs:inline">חדש</span>
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 gap-1.5 sm:gap-2 text-sm"
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
            ) : (
              <Save className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
            {isSaving ? "שומר..." : LABELS.actions.save}
          </Button>
          <Button
            variant="secondary"
            className="gap-1.5 sm:gap-2 px-3 sm:px-4 text-sm"
            disabled={isSaving}
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden xs:inline">{LABELS.actions.print}</span>
          </Button>
        </div>
        {saveError && (
          <p className="text-red-500 text-xs sm:text-sm text-center mt-2">{saveError}</p>
        )}
      </div>
    </div>
  );
}
