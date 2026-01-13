"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PrintOrderPage, PrintOrderItem } from "@/components/print/PrintOrderPage";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { Loader2 } from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";

// Types for stored print data
interface PrintSaladData {
  food_item_id: string;
  name: string;
  selected: boolean;
  measurement_type: string;
  isBulkApplied?: boolean;
  liters: { liter_size_id: string; label: string; quantity: number }[];
  size_big: number;
  size_small: number;
  regular_quantity: number;
  note?: string;
  addOns: {
    addon_id: string;
    name: string;
    quantity: number;
    liters: { liter_size_id: string; label: string; quantity: number }[];
  }[];
}

interface PrintItemData {
  food_item_id: string;
  name: string;
  selected?: boolean;
  quantity?: number;
  size_big?: number;
  size_small?: number;
  preparation_name?: string;
  note?: string;
  portion_multiplier?: number;
  portion_unit?: string;
  // Liters for extras with liter measurement
  liters?: { liter_size_id: string; label: string; quantity: number }[];
  // Variations (e.g., rice types: לבן, ירוק, אשפלו, אדום, לבנוני)
  variations?: {
    variation_id: string;
    name: string;
    size_big: number;
    size_small: number;
  }[];
  // For mains with special calculations (בשר מיוחד)
  calculatedQuantity?: string; // e.g., "6 קציצות (×3)", "500 גרם"
  // Price for extras category items
  price?: number;
}

// Extra items from mains/sides/middle_courses with custom prices
interface PrintExtraItemData {
  id: string;
  source_food_item_id: string;
  source_category: 'mains' | 'sides' | 'middle_courses';
  name: string;
  quantity?: number;
  size_big?: number;
  size_small?: number;
  variations?: {
    variation_id: string;
    name: string;
    size_big: number;
    size_small: number;
  }[];
  price: number;
  note?: string;
  preparation_name?: string;
}

interface StoredPrintData {
  customer: {
    name: string;
    phone: string;
    phone2?: string;
    address: string;
  };
  order: {
    date: string;
    time: string;
    customerTime?: string;
    notes: string;
    totalPortions?: number;
    pricePerPortion?: number;
    deliveryFee?: number;
    totalPayment?: number;
  };
  salads: PrintSaladData[];
  middleCourses: PrintItemData[];
  sides: PrintItemData[];
  mains: PrintItemData[];
  extras: PrintItemData[];
  bakery: PrintItemData[];
  extraItems?: PrintExtraItemData[];
}

export default function PrintPreviewPage() {
  const router = useRouter();
  const { categories, foodItems, isLoading, error } = useSupabaseData();
  const [printData, setPrintData] = React.useState<StoredPrintData | null>(null);

  // Load print data from sessionStorage
  React.useEffect(() => {
    const storedData = sessionStorage.getItem("printOrderData");
    if (storedData) {
      try {
        setPrintData(JSON.parse(storedData));
      } catch (e) {
        console.error("Error parsing print data:", e);
      }
    }
  }, []);

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600">טוען נתונים...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center text-red-500">
            <p className="text-lg font-semibold mb-2">שגיאה בטעינת נתונים</p>
            <p>{error}</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!printData) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold mb-2">אין נתוני הזמנה להדפסה</p>
            <button
              onClick={() => router.push("/order")}
              className="text-blue-500 hover:underline"
            >
              חזרה לדף ההזמנה
            </button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  // Build liter signatures ONLY for bulk-applied salads (those that received quantities via handleBulkApply)
  const saladSignatures = printData.salads
    .filter((salad) => salad.isBulkApplied)
    .map((salad) => {
    const liters = salad.liters
      .filter((l) => l.quantity > 0)
      .map((l) => ({ label: l.label, quantity: l.quantity }))
      .sort((a, b) => a.label.localeCompare(b.label));
    if (liters.length === 0) {
      return { id: salad.food_item_id, sig: null as string | null, totalLiters: 0, text: "" };
    }
    const sig = JSON.stringify(liters);
    const totalLiters = liters.reduce((sum, l) => {
      const parsed = parseFloat(String(l.label).replace(/[^\d.]/g, ""));
      return sum + (isNaN(parsed) ? 0 : parsed * l.quantity);
    }, 0);
    const text = liters.map((l) => `${l.label} × ${l.quantity}`).join(", ");
    return { id: salad.food_item_id, sig, totalLiters, text, liters };
  });

  const signatureSummary = new Map<string, { text: string; totalLiters: number; firstTotalLiters: number; count: number; liters: { label: string; quantity: number }[] }>();
  saladSignatures.forEach(({ sig, totalLiters, text, liters }) => {
    if (!sig) return;
    const existing = signatureSummary.get(sig);
    if (existing) {
      existing.count += 1;
      existing.totalLiters += totalLiters;
    } else {
      signatureSummary.set(sig, { text, totalLiters, firstTotalLiters: totalLiters, count: 1, liters: liters || [] });
    }
  });

  // Show only common signatures (count > 1) that are non-trivial:
  // trivial = single standard liter size (1.5/2.5/3/4.5) with quantity 1
  const STANDARD_SINGLE = new Set(["1.5", "2.5", "3", "4.5"]);
  const isTrivialSignature = (liters?: { label: string; quantity: number }[]) => {
    if (!liters || liters.length !== 1) return false;
    const parsedLabel = parseFloat(String(liters[0].label).replace(/[^\d.]/g, ""));
    return STANDARD_SINGLE.has(parsedLabel.toString()) && liters[0].quantity === 1;
  };

  const commonSigs = new Set(
    Array.from(signatureSummary.entries())
      .filter(([, value]) => value.count > 1)
      .map(([sig]) => sig)
  );

  const commonSignatureDisplay = Array.from(signatureSummary.entries())
    .filter(([, value]) => value.count > 1)
    .map(([sig, value]) => {
      const trivial = isTrivialSignature(value.liters);
      return {
        sig,
        text: value.text,
        // Show only a single salad's liters total (firstTotalLiters), not multiplied by count
        totalLiters: trivial ? null : parseFloat(value.firstTotalLiters.toFixed(2)),
        showTotal: !trivial,
      };
    });

  const totalCommonLiters = commonSignatureDisplay
    .filter((entry) => entry.showTotal && entry.totalLiters !== null)
    .reduce((sum, entry) => sum + (entry.totalLiters || 0), 0);

  // Convert stored data to PrintOrderItem format
  const createPrintItems = (): PrintOrderItem[] => {
    const items: PrintOrderItem[] = [];
    let sortOrder = 1;

    const saladsCategory = categories.find(c => c.name_en === "salads");
    const middleCategory = categories.find(c => c.name_en === "middle_courses");
    const sidesCategory = categories.find(c => c.name_en === "sides");
    const mainsCategory = categories.find(c => c.name_en === "mains");
    const extrasCategory = categories.find(c => c.name_en === "extras");
    const bakeryCategory = categories.find(c => c.name_en === "bakery");

    // Define the specific order for salads (סלטים)
    const saladsOrder = [
      "מטבוחה",
      "חציל מטוגן",
      "חציל במיונז",
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
      "תירס ופטריות",
      "פול",
      "מיונז",
      "טאבולה",
      "ירוק",
      "לימון צ׳רמלה",
      "ירק פיצוחים",
    ];

    // Sort salads according to predefined order
    const sortedSalads = [...printData.salads].sort((a, b) => {
      const indexA = saladsOrder.findIndex(name => a.name.includes(name) || name.includes(a.name));
      const indexB = saladsOrder.findIndex(name => b.name.includes(name) || name.includes(b.name));
      // Items not in the list go to the end
      const orderA = indexA === -1 ? 999 : indexA;
      const orderB = indexB === -1 ? 999 : indexB;
      return orderA - orderB;
    });

    // Add ALL salad items - one row per salad with all details
    sortedSalads.forEach((salad) => {
      const signatureForSalad = saladSignatures.find((s) => s.id === salad.food_item_id)?.sig;
      const hideLiters = signatureForSalad ? commonSigs.has(signatureForSalad) : false;
      items.push({
        id: salad.food_item_id,
        food_item_id: salad.food_item_id,
        name: salad.name,
        category_id: saladsCategory?.id || "",
        category_name: "סלטים",
        selected: salad.selected,
        liters: hideLiters ? [] : salad.liters.map(l => ({ label: l.label, quantity: l.quantity })),
        size_big: salad.size_big,
        size_small: salad.size_small,
        regular_quantity: salad.regular_quantity,
        note: salad.note,
        // Include add-ons with their liters (for items like גזר מגורד, מלפפון מגורד)
        addOns: salad.addOns.map(ao => ({ 
          name: ao.name, 
          quantity: ao.quantity,
          liters: ao.liters?.map(l => ({ label: l.label, quantity: l.quantity })) || []
        })),
        sort_order: sortOrder++,
        isVisible: true,
      });
    });

    // Add middle course items - all items with selected status
    // If item has an extra entry, add extra quantity to the display AND mark as selected
    printData.middleCourses.forEach((item) => {
      // Find if this item has an extra entry
      const extraItem = printData.extraItems?.find(e => e.source_food_item_id === item.food_item_id && e.source_category === 'middle_courses');
      const combinedQuantity = (item.quantity || 0) + (extraItem?.quantity || 0);
      // If there's an extra item for this food item, mark as selected even if not originally selected
      const isSelected = item.selected || !!extraItem;

      items.push({
        id: item.food_item_id,
        food_item_id: item.food_item_id,
        name: item.name,
        category_id: middleCategory?.id || "",
        category_name: "מנות ביניים",
        selected: isSelected,
        quantity: combinedQuantity,
        preparation_name: item.preparation_name || extraItem?.preparation_name,
        note: item.note || extraItem?.note,
        sort_order: sortOrder++,
        isVisible: true,
      });
    });

    // Define the specific order for sides (תוספות)
    const sidesOrder = [
      "אורז",
      "תפו״א אפויים",
      "זיתים מרוקאים",
      "ארטישוק ופטריות",
      "אפונה וגזר",
      "אפונה וארטישוק",
      "ירקות מוקפצים",
      "שעועית ברוטב",
      "שעועית מוקפצת",
      "קוסקוס",
      "ירקות לקוסקוס",
    ];

    // Sort sides according to predefined order
    const sortedSides = [...printData.sides].sort((a, b) => {
      const indexA = sidesOrder.findIndex(name => a.name.includes(name) || name.includes(a.name));
      const indexB = sidesOrder.findIndex(name => b.name.includes(name) || name.includes(b.name));
      // Items not in the list go to the end
      const orderA = indexA === -1 ? 999 : indexA;
      const orderB = indexB === -1 ? 999 : indexB;
      return orderA - orderB;
    });

    // Add sides items - all items with selected status
    // If item has an extra entry, add extra quantity to the display AND mark as selected
    sortedSides.forEach((item) => {
      // Find if this item has an extra entry
      const extraItem = printData.extraItems?.find(e => e.source_food_item_id === item.food_item_id && e.source_category === 'sides');
      const combinedSizeBig = (item.size_big || 0) + (extraItem?.size_big || 0);
      const combinedSizeSmall = (item.size_small || 0) + (extraItem?.size_small || 0);
      const combinedQuantity = (item.quantity || 0) + (extraItem?.quantity || 0);
      // If there's an extra item for this food item, mark as selected even if not originally selected
      const isSelected = item.selected || !!extraItem;

      // For variations, also combine with extra variations if they exist
      let combinedVariations = item.variations?.map(v => ({
        name: v.name,
        size_big: v.size_big,
        size_small: v.size_small,
      }));

      // If extra item has variations, merge them
      if (extraItem?.variations && extraItem.variations.length > 0) {
        combinedVariations = combinedVariations || [];
        extraItem.variations.forEach(extraVar => {
          const existingVar = combinedVariations!.find(v => v.name === extraVar.name);
          if (existingVar) {
            existingVar.size_big += extraVar.size_big;
            existingVar.size_small += extraVar.size_small;
          } else {
            combinedVariations!.push({
              name: extraVar.name,
              size_big: extraVar.size_big,
              size_small: extraVar.size_small,
            });
          }
        });
      }

      items.push({
        id: item.food_item_id,
        food_item_id: item.food_item_id,
        name: item.name,
        category_id: sidesCategory?.id || "",
        category_name: "תוספות",
        selected: isSelected,
        size_big: combinedSizeBig,
        size_small: combinedSizeSmall,
        quantity: combinedQuantity,
        regular_quantity: combinedQuantity,
        liters: item.liters?.filter(l => l.quantity > 0).map(l => ({
          label: l.label || "",
          quantity: l.quantity,
        })),
        variations: combinedVariations,
        preparation_name: item.preparation_name || extraItem?.preparation_name,
        note: item.note || extraItem?.note,
        sort_order: sortOrder++,
        isVisible: true,
      });
    });

    // Helper to calculate portion display: portionTotal = quantity
    const calculatePortionDisplay = (quantity: number, multiplier?: number, unit?: string): string | undefined => {
      if (!quantity || quantity === 0 || !multiplier || !unit) return undefined;
      const total = quantity * multiplier;
      // Format: total = quantity (e.g., "30 = 10" for 30 קציצות from 10 portions)
      if (unit === "גרם") {
        // For grams, show the total grams
        if (total >= 1000) {
          const kg = total / 1000;
          return `${kg % 1 === 0 ? kg.toFixed(0) : kg.toFixed(1)}ק״ג = ${quantity}`;
        }
        return `${total} = ${quantity}`;
      }
      return `${total} = ${quantity}`;
    };

    // Define the specific order for mains (עיקריות)
    const mainsOrder = [
      "כרעיים אפוי",
      "חצאי כרעיים",
      "פרגיות",
      "שניצל מטוגן",
      "חצאי שניצל",
      "בשר ברוטב",
      "לשון ברוטב",
      "אסאדו",
      "שיפודי קבב",
      "שיפודי עוף",
      "חזה עוף",
    ];

    // Sort mains according to predefined order
    const sortedMains = [...printData.mains].sort((a, b) => {
      const indexA = mainsOrder.findIndex(name => a.name.includes(name) || name.includes(a.name));
      const indexB = mainsOrder.findIndex(name => b.name.includes(name) || name.includes(b.name));
      const orderA = indexA === -1 ? 999 : indexA;
      const orderB = indexB === -1 ? 999 : indexB;
      return orderA - orderB;
    });

    // Add mains items - all items with selected status, with calculated quantities
    // If item has an extra entry, add extra quantity to the display AND mark as selected
    sortedMains.forEach((item) => {
      // Find if this item has an extra entry
      const extraItem = printData.extraItems?.find(e => e.source_food_item_id === item.food_item_id && e.source_category === 'mains');
      const combinedQuantity = (item.quantity || 0) + (extraItem?.quantity || 0);
      // If there's an extra item for this food item, mark as selected even if not originally selected
      const isSelected = item.selected || !!extraItem;

      const calculatedQuantity = calculatePortionDisplay(
        combinedQuantity,
        item.portion_multiplier,
        item.portion_unit
      );

      items.push({
        id: item.food_item_id,
        food_item_id: item.food_item_id,
        name: item.name,
        category_id: mainsCategory?.id || "",
        category_name: "עיקריות",
        selected: isSelected,
        quantity: combinedQuantity,
        portion_multiplier: item.portion_multiplier,
        portion_unit: item.portion_unit,
        calculatedQuantity,
        preparation_name: item.preparation_name || extraItem?.preparation_name,
        note: item.note || extraItem?.note,
        sort_order: sortOrder++,
        isVisible: true,
      });
    });

    // Add extras items - all items with selected status, with calculated quantities
    printData.extras.forEach((item) => {
      const calculatedQuantity = calculatePortionDisplay(
        item.quantity || 0,
        item.portion_multiplier,
        item.portion_unit
      );

      items.push({
        id: item.food_item_id,
        food_item_id: item.food_item_id,
        name: item.name,
        category_id: extrasCategory?.id || "",
        category_name: "אקסטרות",
        selected: item.selected,
        quantity: item.quantity || 0,
        size_big: item.size_big,
        size_small: item.size_small,
        liters: item.liters?.filter(l => l.quantity > 0).map(l => ({
          label: l.label || "",
          quantity: l.quantity,
        })),
        portion_multiplier: item.portion_multiplier,
        portion_unit: item.portion_unit,
        calculatedQuantity,
        preparation_name: item.preparation_name,
        note: item.note,
        price: item.price,
        sort_order: sortOrder++,
        isVisible: true,
      });
    });

    // Add extra items (from mains/sides/middle_courses with custom prices)
    if (printData.extraItems && printData.extraItems.length > 0) {
      printData.extraItems.forEach((extraItem) => {
        items.push({
          id: extraItem.id,
          food_item_id: extraItem.source_food_item_id,
          name: extraItem.name,
          category_id: extrasCategory?.id || "",
          category_name: "אקסטרות",
          selected: true,
          quantity: extraItem.quantity || 0,
          size_big: extraItem.size_big,
          size_small: extraItem.size_small,
          variations: extraItem.variations?.map(v => ({
            name: v.name,
            size_big: v.size_big,
            size_small: v.size_small,
          })),
          note: extraItem.note,
          preparation_name: extraItem.preparation_name,
          price: extraItem.price,
          isExtraItem: true,
          sort_order: sortOrder++,
          isVisible: true,
        });
      });
    }

    // Add bakery items - all items with selected status
    if (printData.bakery) {
      printData.bakery.forEach((item) => {
        items.push({
          id: item.food_item_id,
          food_item_id: item.food_item_id,
          name: item.name,
          category_id: bakeryCategory?.id || "",
          category_name: "לחם, מאפים וקינוחים",
          selected: item.selected,
          quantity: item.quantity || 0,
          preparation_name: item.preparation_name,
          note: item.note,
          sort_order: sortOrder++,
          isVisible: true,
        });
      });
    }

    return items;
  };

  const printItems = createPrintItems();

  // Format date for display
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("he-IL");
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
      <PrintOrderPage
        orderNumber={Math.floor(Math.random() * 10000)}
        orderDate={formatDate(printData.order.date)}
        orderTime={printData.order.time}
        customerTime={printData.order.customerTime}
        kitchenTime={printData.order.time}
        customerName={printData.customer.name}
        customerPhone={printData.customer.phone}
        customerPhone2={printData.customer.phone2}
        customerAddress={printData.customer.address}
        orderNotes={printData.order.notes}
        totalPortions={printData.order.totalPortions}
        pricePerPortion={printData.order.pricePerPortion}
        deliveryFee={printData.order.deliveryFee}
        totalPayment={printData.order.totalPayment}
        items={printItems}
        categories={categories}
        aggregatedLiters={commonSignatureDisplay}
        aggregatedLitersTotal={parseFloat(totalCommonLiters.toFixed(2))}
        onBack={handleBack}
      />
    </AuthGuard>
  );
}
