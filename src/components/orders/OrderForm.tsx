"use client";

import * as React from "react";
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
interface SaladFormItem {
  food_item_id: string;
  selected: boolean;
  measurement_type: MeasurementType;
  liters: { liter_size_id: string; quantity: number }[];
  // For size measurement (Big/Small)
  size_big: number;
  size_small: number;
}

interface RegularFormItem {
  food_item_id: string;
  selected: boolean;
  quantity: number;
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
  sides: RegularFormItem[];
  mains: RegularFormItem[];
  extras: RegularFormItem[];
}

export function OrderForm() {
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
        })),
        middle_courses: middleItems.map((item) => ({
          food_item_id: item.id,
          selected: false,
          quantity: 0,
        })),
        sides: sideItems.map((item) => ({
          food_item_id: item.id,
          selected: false,
          quantity: 0,
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

  const handleRegularToggle = (
    category: "middle_courses" | "sides" | "mains" | "extras",
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
    category: "middle_courses" | "sides" | "mains" | "extras",
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

      // Add salad items (with liter sizes)
      formState.salads.forEach((salad) => {
        if (salad.selected) {
          salad.liters.forEach((liter) => {
            if (liter.quantity > 0) {
              items.push({
                food_item_id: salad.food_item_id,
                liter_size_id: liter.liter_size_id,
                quantity: liter.quantity,
              });
            }
          });
        }
      });

      // Add regular items (middle courses, sides, mains, extras)
      const regularCategories = [
        { key: "middle_courses" as const, data: formState.middle_courses },
        { key: "sides" as const, data: formState.sides },
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
            });
          }
        });
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
                    literSizes={literSizes}
                    measurementType={measurementType}
                    onLiterChange={(literId, qty) =>
                      handleSaladLiterChange(expandedSaladId, literId, qty)
                    }
                    onSizeChange={(size, qty) =>
                      handleSaladSizeChange(expandedSaladId, size, qty)
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
                      onSelect={() => setExpandedMiddleId(expandedMiddleId === item.id ? null : item.id)}
                    />
                  );
                })}
              </div>
              
              {/* Popup for selected item */}
              {expandedMiddleId && (
                <FoodItemPopup
                  item={middleItems.find((i) => i.id === expandedMiddleId)!}
                  quantity={
                    formState.middle_courses.find(
                      (m) => m.food_item_id === expandedMiddleId
                    )?.quantity || 0
                  }
                  onQuantityChange={(qty) =>
                    handleRegularQuantityChange("middle_courses", expandedMiddleId, qty)
                  }
                  onClose={() => setExpandedMiddleId(null)}
                />
              )}
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
                  return (
                    <FoodItemCard
                      key={item.id}
                      item={item}
                      selected={itemState?.selected || false}
                      quantity={itemState?.quantity || 0}
                      onSelect={() => setExpandedSideId(expandedSideId === item.id ? null : item.id)}
                    />
                  );
                })}
              </div>
              
              {/* Popup for selected item */}
              {expandedSideId && (
                <FoodItemPopup
                  item={sideItems.find((i) => i.id === expandedSideId)!}
                  quantity={
                    formState.sides.find(
                      (s) => s.food_item_id === expandedSideId
                    )?.quantity || 0
                  }
                  onQuantityChange={(qty) =>
                    handleRegularQuantityChange("sides", expandedSideId, qty)
                  }
                  onClose={() => setExpandedSideId(null)}
                />
              )}
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
                      onSelect={() => setExpandedMainId(expandedMainId === item.id ? null : item.id)}
                    />
                  );
                })}
              </div>
              
              {/* Popup for selected item */}
              {expandedMainId && (
                <FoodItemPopup
                  item={mainItems.find((i) => i.id === expandedMainId)!}
                  quantity={
                    formState.mains.find(
                      (m) => m.food_item_id === expandedMainId
                    )?.quantity || 0
                  }
                  onQuantityChange={(qty) =>
                    handleRegularQuantityChange("mains", expandedMainId, qty)
                  }
                  onClose={() => setExpandedMainId(null)}
                />
              )}
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
                          onSelect={() => setExpandedExtraId(expandedExtraId === item.id ? null : item.id)}
                        />
                      );
                    })}
                  </div>
                  
                  {/* Popup for selected item */}
                  {expandedExtraId && (
                    <FoodItemPopup
                      item={extraItems.find((i) => i.id === expandedExtraId)!}
                      quantity={
                        formState.extras.find(
                          (e) => e.food_item_id === expandedExtraId
                        )?.quantity || 0
                      }
                      onQuantityChange={(qty) =>
                        handleRegularQuantityChange("extras", expandedExtraId, qty)
                      }
                      onClose={() => setExpandedExtraId(null)}
                    />
                  )}
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
          <Button variant="secondary" className="gap-2" disabled={isSaving}>
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
