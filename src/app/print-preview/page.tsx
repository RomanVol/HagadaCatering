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
  // Variations (e.g., rice types: לבן, ירוק, אשפלו, אדום, לבנוני)
  variations?: {
    variation_id: string;
    name: string;
    size_big: number;
    size_small: number;
  }[];
  // For mains with special calculations (בשר מיוחד)
  calculatedQuantity?: string; // e.g., "6 קציצות (×3)", "500 גרם"
}

interface StoredPrintData {
  customer: {
    name: string;
    phone: string;
    address: string;
  };
  order: {
    date: string;
    time: string;
    notes: string;
  };
  salads: PrintSaladData[];
  middleCourses: PrintItemData[];
  sides: PrintItemData[];
  mains: PrintItemData[];
  extras: PrintItemData[];
  bakery: PrintItemData[];
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

  // Build liter signatures to identify common liter selections across salads
  const saladSignatures = printData.salads.map((salad) => {
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
      signatureSummary.set(sig, { text, totalLiters, firstTotalLiters: totalLiters, count: 1, liters });
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

    // Add ALL salad items - one row per salad with all details
    printData.salads.forEach((salad) => {
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
    printData.middleCourses.forEach((item) => {
      items.push({
        id: item.food_item_id,
        food_item_id: item.food_item_id,
        name: item.name,
        category_id: middleCategory?.id || "",
        category_name: "מנות ביניים",
        selected: item.selected,
        quantity: item.quantity || 0,
        preparation_name: item.preparation_name,
        note: item.note,
        sort_order: sortOrder++,
        isVisible: true,
      });
    });

    // Add sides items - all items with selected status
    printData.sides.forEach((item) => {
      items.push({
        id: item.food_item_id,
        food_item_id: item.food_item_id,
        name: item.name,
        category_id: sidesCategory?.id || "",
        category_name: "תוספות",
        selected: item.selected,
        size_big: item.size_big,
        size_small: item.size_small,
        variations: item.variations?.map(v => ({
          name: v.name,
          size_big: v.size_big,
          size_small: v.size_small,
        })),
        note: item.note,
        sort_order: sortOrder++,
        isVisible: true,
      });
    });

    // Add mains items - all items with selected status, with calculated quantities
    printData.mains.forEach((item) => {
      // Calculate display quantity based on portion_multiplier and portion_unit
      let calculatedQuantity: string | undefined;
      if (item.selected && item.quantity && item.quantity > 0 && item.portion_multiplier && item.portion_unit) {
        const total = item.quantity * item.portion_multiplier;
        if (item.portion_unit === "גרם") {
          calculatedQuantity = `${total} גרם`;
        } else if (item.portion_unit === "חצאים") {
          // Display: quantity = total (e.g., "3 = 9")
          calculatedQuantity = `${item.quantity} = ${total}`;
        } else if (item.portion_unit === "קציצות") {
          // Display: quantity = total (e.g., "5 = 10")
          calculatedQuantity = `${item.quantity} = ${total}`;
        } else {
          calculatedQuantity = `${total} ${item.portion_unit}`;
        }
      }
      
      items.push({
        id: item.food_item_id,
        food_item_id: item.food_item_id,
        name: item.name,
        category_id: mainsCategory?.id || "",
        category_name: "עיקריות",
        selected: item.selected,
        quantity: item.quantity || 0,
        portion_multiplier: item.portion_multiplier,
        portion_unit: item.portion_unit,
        calculatedQuantity,
        note: item.note,
        sort_order: sortOrder++,
        isVisible: true,
      });
    });

    // Add extras items - all items with selected status
    printData.extras.forEach((item) => {
      items.push({
        id: item.food_item_id,
        food_item_id: item.food_item_id,
        name: item.name,
        category_id: extrasCategory?.id || "",
        category_name: "אקסטרות",
        selected: item.selected,
        quantity: item.quantity || 0,
        note: item.note,
        sort_order: sortOrder++,
        isVisible: true,
      });
    });

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

  return (
    <AuthGuard>
      <PrintOrderPage
        orderNumber={Math.floor(Math.random() * 10000)}
        orderDate={formatDate(printData.order.date)}
        orderTime={printData.order.time}
        customerName={printData.customer.name}
        customerPhone={printData.customer.phone}
        customerAddress={printData.customer.address}
        orderNotes={printData.order.notes}
        items={printItems}
        categories={categories}
        aggregatedLiters={commonSignatureDisplay}
        aggregatedLitersTotal={parseFloat(totalCommonLiters.toFixed(2))}
        onBack={() => router.push("/")}
      />
    </AuthGuard>
  );
}
