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

interface SidesFormItem {
  food_item_id: string;
  selected: boolean;
  size_big: number;
  size_small: number;
  preparation_id?: string;
  preparation_name?: string;
  note?: string;
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

  // Initialize form state
  const [formState, setFormState] = React.useState<OrderFormState>({
    customer_name: "",
    phone: "",
    order_date: "",
    order_time: "",
    address: "",
    notes: "",
    salads: [],
    middle_courses: [],
    sides: [],
    mains: [],
    extras: [],
  });

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
          quantity: 0,
        })),
      }));
      setIsFormInitialized(true);
    }
  }, [isFormInitialized, dataLoading, foodItems, literSizes, saladItems, middleItems, sideItems, mainItems, extraItems]);

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

        // Populate form with order data
        setFormState((prev) => {
          const newState = { ...prev };
          
          // Customer info
          newState.customer_name = order.customer?.name || "";
          newState.phone = order.customer?.phone || "";
          newState.address = order.delivery_address || "";
          newState.order_date = order.order_date || "";
          newState.order_time = order.order_time || "";
          newState.notes = order.notes || "";

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
                  } else if (item.size_type === "big") {
                    newState.sides[itemIndex].size_big = item.quantity;
                  } else if (item.size_type === "small") {
                    newState.sides[itemIndex].size_small = item.quantity;
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
                  newState.extras[itemIndex].quantity = item.quantity;
                  if (item.item_note) {
                    newState.extras[itemIndex].note = item.item_note;
                  }
                }
              }
            }
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

  // Saving state
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  // Calculate selection counts
  const saladCount = formState.salads.filter((s) => s.selected).length;
  const middleCount = formState.middle_courses.filter((m) => m.selected).length;
  const sidesCount = formState.sides.filter((s) => s.selected).length;
  const mainsCount = formState.mains.filter((m) => m.selected).length;
  const extrasCount = formState.extras.filter((e) => e.selected).length;

  // Show loading state
  if (dataLoading || orderLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">טוען הזמנה...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (dataError || orderError) {
    return (
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
              addOns: s.addOns.map((ao) =>
                ao.addon_id === addonId
                  ? {
                      ...ao,
                      liters: ao.liters.map((l) =>
                        l.liter_size_id === literSizeId ? { ...l, quantity } : l
                      ),
                    }
                  : ao
              ),
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
          address: formState.address,
        },
        order: {
          order_date: formState.order_date,
          order_time: formState.order_time,
          delivery_address: formState.address,
          notes: formState.notes,
        },
        salads: formState.salads,
        middle_courses: formState.middle_courses,
        sides: formState.sides,
        mains: formState.mains,
        extras: formState.extras,
      });

      if (result.success) {
        alert("ההזמנה עודכנה בהצלחה!");
        router.push("/summary");
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
          <button 
            onClick={() => router.push("/summary")}
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
                    label={LABELS.orderForm.date}
                    type="date"
                    value={formState.order_date}
                    onChange={(e) => setFormState((prev) => ({ ...prev, order_date: e.target.value }))}
                  />
                  <Input
                    label={LABELS.orderForm.time}
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
                  return (
                    <FoodItemCard
                      key={item.id}
                      item={item}
                      selected={itemState?.selected || false}
                      quantity={0}
                      sizeQuantity={{ big: itemState?.size_big || 0, small: itemState?.size_small || 0 }}
                      useSizeMode={!hasVariations}
                      preparationName={itemState?.preparation_name}
                      note={itemState?.note}
                      variationQuantities={itemState?.variations}
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
                return (
                  <FoodItemPopup
                    item={expandedItem}
                    quantity={0}
                    sizeQuantity={{ big: expandedState?.size_big || 0, small: expandedState?.size_small || 0 }}
                    useSizeMode={!hasVariations}
                    selectedPreparationId={expandedState?.preparation_id}
                    note={expandedState?.note}
                    variationQuantities={expandedState?.variations}
                    onQuantityChange={() => {}}
                    onSizeChange={(size, qty) => handleSidesSizeChange(expandedSideId, size, qty)}
                    onPreparationChange={(prepId, prepName) => handleSidesPreparationChange(expandedSideId, prepId, prepName)}
                    onNoteChange={(note) => handleSidesNoteChange(expandedSideId, note)}
                    onVariationSizeChange={(variationId, size, qty) => handleSidesVariationSizeChange(expandedSideId, variationId, size, qty)}
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
                <span className={cn(
                  "text-sm font-medium px-2 py-1 rounded",
                  extrasCount > 0 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
                )}>
                  {extrasCount}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 relative">
              {extraItems.length > 0 ? (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    {extraItems.map((item) => {
                      const itemState = formState.extras.find((e) => e.food_item_id === item.id);
                      return (
                        <FoodItemCard
                          key={item.id}
                          item={item}
                          selected={itemState?.selected || false}
                          quantity={itemState?.quantity || 0}
                          preparationName={itemState?.preparation_name}
                          note={itemState?.note}
                          onSelect={() => {
                            if (!itemState?.selected) {
                              handleRegularToggle("extras", item.id, true);
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
                    return (
                      <FoodItemPopup
                        item={expandedItem}
                        quantity={expandedState?.quantity || 0}
                        selectedPreparationId={expandedState?.preparation_id}
                        note={expandedState?.note}
                        onQuantityChange={(qty) => handleRegularQuantityChange("extras", expandedExtraId, qty)}
                        onPreparationChange={(prepId, prepName) => handlePreparationChange("extras", expandedExtraId, prepId, prepName)}
                        onNoteChange={(note) => handleRegularNoteChange("extras", expandedExtraId, note)}
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
  );
}
