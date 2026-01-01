"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Category, FoodItem, LiterSize, FoodItemVariation } from "@/types";
import { GripVertical, X, Printer, ArrowRight, RotateCcw, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";

// Order item with all details for printing
interface PrintOrderItem {
  id: string;
  food_item_id: string;
  name: string;
  category_id: string;
  category_name: string;
  selected?: boolean;
  // Multiple quantity options in one row
  liters?: { label: string; quantity: number }[];
  size_big?: number;
  size_small?: number;
  regular_quantity?: number;
  // For non-salad items
  quantity?: number;
  size_type?: "big" | "small" | null;
  variation_name?: string;
  preparation_name?: string;
  // Variations for items like rice (אורז לבן, אורז ירוק, אשפלו, אדום, לבנוני)
  variations?: { name: string; size_big: number; size_small: number }[];
  // Add-ons with liters support (for כרוב אסייתי, רול)
  addOns?: { name: string; quantity: number; liters?: { label: string; quantity: number }[] }[];
  // For mains with special portion calculations (בשר מיוחד)
  portion_multiplier?: number;
  portion_unit?: string;
  calculatedQuantity?: string; // Pre-calculated display string (e.g., "6 קציצות", "500 גרם")
  note?: string;
  sort_order: number;
  isVisible: boolean;
  isPlaceholder?: boolean;
  // For extra items (from mains/sides/middle_courses with custom prices)
  price?: number;
  isExtraItem?: boolean;
}

interface PrintableSection {
  id: string;
  title: string;
  maxItems: number;
  items: PrintOrderItem[];
}

interface PrintOrderPageProps {
  orderNumber: number;
  orderDate: string;
  orderTime?: string;
  customerTime?: string; // זמן ללקוח
  kitchenTime?: string; // זמן למטבח
  customerName?: string;
  customerPhone: string;
  customerPhone2?: string;
  customerAddress?: string;
  orderNotes?: string;
  totalPortions?: number;
  pricePerPortion?: number;
  deliveryFee?: number;
  totalPayment?: number;
  items: PrintOrderItem[];
  categories: Category[];
  aggregatedLiters?: { sig: string; text: string; totalLiters: number | null; showTotal: boolean }[];
  aggregatedLitersTotal?: number;
  onBack: () => void;
}

// Drag and drop context
interface DragState {
  draggedItem: PrintOrderItem | null;
  draggedFromSection: string | null;
  dragOverIndex: number | null;
  dragOverSection: string | null;
}

export function PrintOrderPage({
  orderNumber,
  orderDate,
  orderTime,
  customerTime,
  kitchenTime,
  customerName,
  customerPhone,
  customerPhone2,
  customerAddress,
  orderNotes,
  totalPortions,
  pricePerPortion,
  deliveryFee,
  totalPayment,
  items: initialItems,
  categories,
  aggregatedLiters = [],
  aggregatedLitersTotal,
  onBack,
}: PrintOrderPageProps) {
  // Group items by category and manage state
  const [sections, setSections] = React.useState<PrintableSection[]>(() => {
    const saladsCategory = categories.find(c => c.name_en === "salads");
    const middleCategory = categories.find(c => c.name_en === "middle_courses");
    const sidesCategory = categories.find(c => c.name_en === "sides");
    const mainsCategory = categories.find(c => c.name_en === "mains");
    const extrasCategory = categories.find(c => c.name_en === "extras");
    const bakeryCategory = categories.find(c => c.name_en === "bakery");

    const groupItems = (categoryId: string | undefined) => {
      if (!categoryId) return [];
      return initialItems
        .filter(item => item.category_id === categoryId)
        .sort((a, b) => a.sort_order - b.sort_order);
    };

    return [
      {
        id: "salads",
        title: "סלטים: (10 לבחירה)",
        maxItems: 28,
        items: groupItems(saladsCategory?.id),
      },
      {
        id: "middle_courses",
        title: "מנות ביניים: (2 לבחירה)",
        maxItems: 11,
        items: groupItems(middleCategory?.id),
      },
      {
        id: "sides",
        title: "תוספות: (3 לבחירה)",
        maxItems: 11,
        items: groupItems(sidesCategory?.id),
      },
      {
        id: "mains",
        title: "עיקריות: (3 לבחירה)",
        maxItems: 11,
        items: groupItems(mainsCategory?.id),
      },
      {
        id: "extras",
        title: "אקסטרות",
        maxItems: 5,
        items: groupItems(extrasCategory?.id),
      },
      {
        id: "bakery",
        title: "לחם, מאפים וקינוחים",
        maxItems: 6,
        items: groupItems(bakeryCategory?.id),
      },
    ];
  });

  const [dragState, setDragState] = React.useState<DragState>({
    draggedItem: null,
    draggedFromSection: null,
    dragOverIndex: null,
    dragOverSection: null,
  });

  // State for item highlight colors
  const [itemColors, setItemColors] = React.useState<Record<string, string>>({});

  // Cycle through highlight colors: none -> yellow -> red -> green -> blue -> none
  const cycleItemColor = (itemId: string) => {
    const colors = ['none', 'yellow', 'red', 'green', 'blue'];
    const currentColor = itemColors[itemId] || 'none';
    const currentIndex = colors.indexOf(currentColor);
    const nextColor = colors[(currentIndex + 1) % colors.length];

    setItemColors(prev => ({
      ...prev,
      [itemId]: nextColor
    }));
  };

  // Handle hiding an item (keeps placeholder)
  const handleHideItem = (sectionId: string, itemId: string) => {
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;
      return {
        ...section,
        items: section.items.map(item => 
          item.id === itemId 
            ? { ...item, isVisible: false, isPlaceholder: true }
            : item
        ),
      };
    }));
  };

  // Handle restoring a hidden item
  const handleRestoreItem = (sectionId: string, itemId: string) => {
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;
      return {
        ...section,
        items: section.items.map(item => 
          item.id === itemId 
            ? { ...item, isVisible: true, isPlaceholder: false }
            : item
        ),
      };
    }));
  };

  // Drag handlers
  const handleDragStart = (item: PrintOrderItem, sectionId: string) => {
    setDragState({
      draggedItem: item,
      draggedFromSection: sectionId,
      dragOverIndex: null,
      dragOverSection: null,
    });
  };

  const handleDragOver = (e: React.DragEvent, index: number, sectionId: string) => {
    e.preventDefault();
    setDragState(prev => ({
      ...prev,
      dragOverIndex: index,
      dragOverSection: sectionId,
    }));
  };

  const handleDragEnd = () => {
    if (
      dragState.draggedItem &&
      dragState.draggedFromSection &&
      dragState.dragOverSection === dragState.draggedFromSection &&
      dragState.dragOverIndex !== null
    ) {
      setSections(prev => prev.map(section => {
        if (section.id !== dragState.draggedFromSection) return section;
        
        const items = [...section.items];
        const fromIndex = items.findIndex(i => i.id === dragState.draggedItem?.id);
        if (fromIndex === -1) return section;
        
        const [removed] = items.splice(fromIndex, 1);
        items.splice(dragState.dragOverIndex!, 0, removed);
        
        // Update sort orders
        const updatedItems = items.map((item, idx) => ({
          ...item,
          sort_order: idx + 1,
        }));
        
        return { ...section, items: updatedItems };
      }));
    }
    
    setDragState({
      draggedItem: null,
      draggedFromSection: null,
      dragOverIndex: null,
      dragOverSection: null,
    });
  };

  // Reset to original order
  const handleReset = () => {
    const saladsCategory = categories.find(c => c.name_en === "salads");
    const middleCategory = categories.find(c => c.name_en === "middle_courses");
    const sidesCategory = categories.find(c => c.name_en === "sides");
    const mainsCategory = categories.find(c => c.name_en === "mains");
    const extrasCategory = categories.find(c => c.name_en === "extras");
    const bakeryCategory = categories.find(c => c.name_en === "bakery");

    const groupItems = (categoryId: string | undefined) => {
      if (!categoryId) return [];
      return initialItems
        .filter(item => item.category_id === categoryId)
        .map(item => ({ ...item, isVisible: true, isPlaceholder: false }))
        .sort((a, b) => a.sort_order - b.sort_order);
    };

    setSections([
      {
        id: "salads",
        title: "סלטים: (10 לבחירה)",
        maxItems: 28,
        items: groupItems(saladsCategory?.id),
      },
      {
        id: "middle_courses",
        title: "מנות ביניים: (2 לבחירה)",
        maxItems: 11,
        items: groupItems(middleCategory?.id),
      },
      {
        id: "sides",
        title: "תוספות: (3 לבחירה)",
        maxItems: 11,
        items: groupItems(sidesCategory?.id),
      },
      {
        id: "mains",
        title: "עיקריות: (3 לבחירה)",
        maxItems: 11,
        items: groupItems(mainsCategory?.id),
      },
      {
        id: "extras",
        title: "אקסטרות",
        maxItems: 5,
        items: groupItems(extrasCategory?.id),
      },
      {
        id: "bakery",
        title: "לחם, מאפים וקינוחים",
        maxItems: 6,
        items: groupItems(bakeryCategory?.id),
      },
    ]);
  };

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  // Format MAIN quantity display (without add-ons) - stays on same line as item name
  const formatQuantity = (item: PrintOrderItem): string => {
    const parts: string[] = [];

    // For items with pre-calculated quantity string (mains with portion_multiplier)
    if (item.calculatedQuantity) {
      return item.calculatedQuantity;
    }

    // For items with liters (salads with liter measurement)
    if (item.liters && item.liters.length > 0) {
      const literParts = item.liters
        .filter(l => l.quantity > 0)
        .map(l => `${l.label}:${l.quantity}`);
      if (literParts.length > 0) {
        parts.push(literParts.join(" "));
      }
    }

    // Check if item has variations - if so, only show variations (not size_big/size_small)
    const hasVariationsWithQuantity = item.variations && item.variations.some(v => v.size_big > 0 || v.size_small > 0);

    // For items with size_big/size_small (but NOT if they have variations with quantities)
    // This is the MAIN item quantity (e.g., כרוב אסייתי itself)
    if (!hasVariationsWithQuantity) {
      const sizeParts: string[] = [];
      if (item.size_big && item.size_big > 0) {
        sizeParts.push(`ג׳:${item.size_big}`);
      }
      if (item.size_small && item.size_small > 0) {
        sizeParts.push(`ק׳:${item.size_small}`);
      }
      if (sizeParts.length > 0) {
        parts.push(sizeParts.join(" "));
      }
    }

    // For regular quantity
    if (item.regular_quantity && item.regular_quantity > 0) {
      parts.push(`×${item.regular_quantity}`);
    }

    // For items with variations (like rice)
    if (item.variations && item.variations.length > 0) {
      item.variations.forEach(v => {
        const vParts: string[] = [];
        if (v.size_big > 0) vParts.push(`ג׳:${v.size_big}`);
        if (v.size_small > 0) vParts.push(`ק׳:${v.size_small}`);
        if (vParts.length > 0) {
          parts.push(`${v.name} ${vParts.join(" ")}`);
        }
      });
    }

    // For simple quantity (mains, middle courses) - only if no calculatedQuantity
    if (item.quantity && item.quantity > 0 && !item.liters && !item.size_big && !item.size_small && !item.variations?.length) {
      parts.push(`×${item.quantity}`);
    }

    // NOTE: Add-ons are NOT included here - they are displayed separately below the item

    return parts.join(" | ");
  };

  // Format add-ons display - shown on separate line below item
  const formatAddOns = (item: PrintOrderItem): string[] => {
    if (!item.addOns || item.addOns.length === 0) return [];

    const addOnStrings: string[] = [];
    item.addOns.forEach(ao => {
      const aoParts: string[] = [];

      // Regular quantity for add-on
      if (ao.quantity > 0) {
        aoParts.push(`×${ao.quantity}`);
      }

      // Liters for add-ons - each liter size separately
      if (ao.liters && ao.liters.length > 0) {
        const literParts = ao.liters
          .filter(l => l.quantity > 0)
          .map(l => `${l.label}:${l.quantity}`);
        if (literParts.length > 0) {
          aoParts.push(literParts.join(" "));
        }
      }

      // Only add if there are quantities
      if (aoParts.length > 0) {
        addOnStrings.push(`${ao.name} ${aoParts.join(" ")}`);
      }
    });

    return addOnStrings;
  };

  return (
    <div className="min-h-screen bg-gray-100 print:min-h-0 print:bg-white">
      {/* Toolbar - hidden when printing */}
      <div className="print:hidden sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowRight className="h-5 w-5" />
            <span>חזרה</span>
          </button>
          
          <h1 className="text-xl font-bold">תצוגה מקדימה להדפסה</h1>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 ml-1" />
              איפוס
            </Button>
            <Button size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 ml-1" />
              הדפס
            </Button>
          </div>
        </div>
      </div>

      {/* Print Preview - A4 size */}
      <div className="max-w-4xl mx-auto p-4 print:p-0 print:max-w-none print:m-0">
        <div
          id="print-page"
          className="bg-white shadow-lg print:shadow-none mx-auto relative print:m-0 print-page-container"
          style={{
            width: "210mm",
            minHeight: "297mm",
            padding: "10mm",
          }}
        >
          {/* Header */}
          <div className="mb-1 border-b pb-1">
            {/* First row: בס״ד on right, date in center, name on left */}
            <div className="flex justify-between items-center">
              <div className="text-right">
                <span className="text-base font-bold">בס״ד</span>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  {orderDate}
                </p>
              </div>
              <div className="text-left text-sm">
                <div className="font-bold">{customerName}</div>
              </div>
            </div>
            {/* Second row: order number in center, phone numbers on left - same line */}
            <div className="flex justify-between items-center">
              <div className="flex-1"></div>
              <div className="text-center flex-1">
                <span className="font-bold text-lg">{orderNumber}</span>
              </div>
              <div className="text-left flex-1">
                <span className="text-sm">{customerPhone}</span>
                {customerPhone2 && <span className="text-sm mr-4">&nbsp;&nbsp;&nbsp;{customerPhone2}</span>}
              </div>
            </div>
            {/* Third row: Times */}
            {(kitchenTime || customerTime) && (
              <div className="flex justify-start items-center text-sm mt-1 pt-1 border-t border-gray-200 gap-6">
                {kitchenTime && (
                  <span><span className="text-gray-600">זמן למטבח:</span> <span className="font-bold">{kitchenTime}</span></span>
                )}
                {customerTime && (
                  <span><span className="text-gray-600">זמן ללקוח:</span> <span className="font-bold">{customerTime}</span></span>
                )}
              </div>
            )}
          </div>

          {/* Main Content - 3 columns layout: Salads (wide) | Middle+Extras | Sides+Mains */}
          <div className="grid grid-cols-3 gap-2 text-lg print-content-grid" style={{ direction: "rtl" }}>
            {/* Column 1: Salads - wider column */}
            <div className="border-l border-gray-300 pl-2">
              <h2 className="font-bold text-center mb-1 bg-gray-100 py-0.5 text-xl">
                {sections[0]?.title}
              </h2>
              {aggregatedLiters.length > 0 && (
                <div className="mb-2 space-y-0 text-lg text-gray-800">
                  {aggregatedLiters.map(({ sig, text, totalLiters, showTotal }) => (
                    <div key={sig} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded px-2 py-0.5">
                      <span className="font-bold">{text}</span>
                      {showTotal && totalLiters !== null ? (
                        <span className="text-gray-700">סה״כ {totalLiters}L</span>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-0">
                {sections[0]?.items.map((item, index) => (
                  <PrintItemRow
                    key={item.id}
                    item={item}
                    sectionId="salads"
                    isDragging={dragState.draggedItem?.id === item.id}
                    isDragOver={dragState.dragOverSection === "salads" && dragState.dragOverIndex === index}
                    highlightColor={itemColors[item.id]}
                    onHide={() => handleHideItem("salads", item.id)}
                    onRestore={() => handleRestoreItem("salads", item.id)}
                    onColorCycle={() => cycleItemColor(item.id)}
                    onDragStart={() => handleDragStart(item, "salads")}
                    onDragOver={(e) => handleDragOver(e, index, "salads")}
                    onDragEnd={handleDragEnd}
                    formatQuantity={formatQuantity}
                    formatAddOns={formatAddOns}
                  />
                ))}
              </div>
            </div>

            {/* Column 2: Middle Courses + Extras + Bakery (at bottom) */}
            <div className="border-l border-gray-300 pl-2 flex flex-col h-full">
              <div>
                <h2 className="font-bold text-center mb-1 bg-gray-100 py-0.5 text-xl">
                  {sections[1]?.title}
                </h2>
                <div className="space-y-0">
                  {sections[1]?.items.map((item, index) => (
                    <PrintItemRow
                      key={item.id}
                      item={item}
                      sectionId="middle_courses"
                      isDragging={dragState.draggedItem?.id === item.id}
                      isDragOver={dragState.dragOverSection === "middle_courses" && dragState.dragOverIndex === index}
                      highlightColor={itemColors[item.id]}
                      onHide={() => handleHideItem("middle_courses", item.id)}
                      onRestore={() => handleRestoreItem("middle_courses", item.id)}
                      onColorCycle={() => cycleItemColor(item.id)}
                      onDragStart={() => handleDragStart(item, "middle_courses")}
                      onDragOver={(e) => handleDragOver(e, index, "middle_courses")}
                      onDragEnd={handleDragEnd}
                      formatQuantity={formatQuantity}
                      formatAddOns={formatAddOns}
                    />
                  ))}
                </div>

                {/* Extras below middle courses */}
                <h2 className="font-bold text-center mb-1 mt-2 bg-gray-100 py-0.5 text-xl">
                  {sections[4]?.title}
                </h2>
                <div className="space-y-0">
                  {sections[4]?.items.map((item, index) => (
                    <PrintItemRow
                      key={item.id}
                      item={item}
                      sectionId="extras"
                      isDragging={dragState.draggedItem?.id === item.id}
                      isDragOver={dragState.dragOverSection === "extras" && dragState.dragOverIndex === index}
                      highlightColor={itemColors[item.id]}
                      onHide={() => handleHideItem("extras", item.id)}
                      onRestore={() => handleRestoreItem("extras", item.id)}
                      onColorCycle={() => cycleItemColor(item.id)}
                      onDragStart={() => handleDragStart(item, "extras")}
                      onDragOver={(e) => handleDragOver(e, index, "extras")}
                      onDragEnd={handleDragEnd}
                      formatQuantity={formatQuantity}
                      formatAddOns={formatAddOns}
                    />
                  ))}
                </div>
              </div>

              {/* Bakery - pushed to bottom of column, items grow upward from bottom */}
              <div className="mt-auto flex flex-col-reverse">
                {/* Items in reverse order - first item at bottom, new items stack upward */}
                <div className="flex flex-col-reverse space-y-reverse space-y-0">
                  {sections[5]?.items.map((item, index) => (
                    <PrintItemRow
                      key={item.id}
                      item={item}
                      sectionId="bakery"
                      isDragging={dragState.draggedItem?.id === item.id}
                      isDragOver={dragState.dragOverSection === "bakery" && dragState.dragOverIndex === index}
                      highlightColor={itemColors[item.id]}
                      onHide={() => handleHideItem("bakery", item.id)}
                      onRestore={() => handleRestoreItem("bakery", item.id)}
                      onColorCycle={() => cycleItemColor(item.id)}
                      onDragStart={() => handleDragStart(item, "bakery")}
                      onDragOver={(e) => handleDragOver(e, index, "bakery")}
                      onDragEnd={handleDragEnd}
                      formatQuantity={formatQuantity}
                      formatAddOns={formatAddOns}
                    />
                  ))}
                </div>
                {/* Header above items */}
                <h2 className="font-bold text-center mb-1 bg-gray-100 py-0.5 text-xl">
                  {sections[5]?.title}
                </h2>
              </div>
            </div>

            {/* Column 3: Sides + Mains (combined) */}
            <div>
              {/* Sides at top */}
              <h2 className="font-bold text-center mb-1 bg-gray-100 py-0.5 text-xl">
                {sections[2]?.title}
              </h2>
              <div className="space-y-0">
                {sections[2]?.items.map((item, index) => (
                  <PrintItemRow
                    key={item.id}
                    item={item}
                    sectionId="sides"
                    isDragging={dragState.draggedItem?.id === item.id}
                    isDragOver={dragState.dragOverSection === "sides" && dragState.dragOverIndex === index}
                    highlightColor={itemColors[item.id]}
                    onHide={() => handleHideItem("sides", item.id)}
                    onRestore={() => handleRestoreItem("sides", item.id)}
                    onColorCycle={() => cycleItemColor(item.id)}
                    onDragStart={() => handleDragStart(item, "sides")}
                    onDragOver={(e) => handleDragOver(e, index, "sides")}
                    onDragEnd={handleDragEnd}
                    formatQuantity={formatQuantity}
                    formatAddOns={formatAddOns}
                  />
                ))}
              </div>

              {/* Mains below sides */}
              <h2 className="font-bold text-center mb-1 mt-2 bg-gray-100 py-0.5 text-xl">
                {sections[3]?.title}
              </h2>
              <div className="space-y-0">
                {sections[3]?.items.map((item, index) => (
                  <PrintItemRow
                    key={item.id}
                    item={item}
                    sectionId="mains"
                    isDragging={dragState.draggedItem?.id === item.id}
                    isDragOver={dragState.dragOverSection === "mains" && dragState.dragOverIndex === index}
                    onHide={() => handleHideItem("mains", item.id)}
                    onRestore={() => handleRestoreItem("mains", item.id)}
                    onDragStart={() => handleDragStart(item, "mains")}
                    onDragOver={(e) => handleDragOver(e, index, "mains")}
                    onDragEnd={handleDragEnd}
                    formatQuantity={formatQuantity}
                    formatAddOns={formatAddOns}
                    highlightColor={itemColors[item.id]}
                    onColorCycle={() => cycleItemColor(item.id)}
                  />
                ))}
              </div>

              {/* Portions checkboxes */}
              <div className="mt-2 border-t pt-1">
                <div className="flex items-center gap-2 text-xs">
                  <span>ק.</span>
                  <div className="w-4 h-4 border border-gray-400"></div>
                </div>
                <div className="flex items-center gap-2 text-xs mt-1">
                  <span>ע.</span>
                  <div className="w-4 h-4 border border-gray-400"></div>
                  <span>א.</span>
                  <div className="w-4 h-4 border border-gray-400"></div>
                </div>
                <div className="flex items-center gap-2 text-xs mt-1">
                  <span>0.</span>
                  <div className="w-4 h-4 border border-gray-400"></div>
                  <span>ב.</span>
                  <div className="w-4 h-4 border border-gray-400"></div>
                </div>
              </div>


            </div>
          </div>

          {/* Order Details - absolute bottom left corner */}
          <div className="absolute bottom-[10mm] left-[10mm] print:bottom-[5mm] print:left-[8mm] text-sm space-y-1 print:space-y-0.5" style={{ direction: "rtl" }}>
            <div className="flex items-center gap-2">
              <span className="font-bold">זמן ללקוח:</span>
              <span className="font-bold border-b border-gray-400 min-w-[60px]">
                {customerTime || ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">זמן למטבח:</span>
              <span className="font-bold border-b border-gray-400 min-w-[60px]">
                {kitchenTime || ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">סה״כ מס׳ מנות:</span>
              <span className="font-bold border-b border-gray-400 min-w-[40px]">
                {totalPortions || ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">יום:</span>
              <span className="font-bold border-b border-gray-400 min-w-[60px]">
                {orderDate}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">כתובת:</span>
              <span className="font-bold border-b border-gray-400 min-w-[80px]">
                {customerAddress || ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">מחיר בסיס למנה:</span>
              <span className="font-bold border-b border-gray-400 min-w-[40px]">
                {pricePerPortion ? `₪${pricePerPortion}` : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">הובלה:</span>
              <span className="font-bold border-b border-gray-400 min-w-[40px]">
                {deliveryFee ? `₪${deliveryFee}` : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">סה״כ לתשלום:</span>
              <span className="font-bold border-b border-gray-400 min-w-[60px]">
                {totalPayment ? `₪${totalPayment.toLocaleString()}` : ""}
              </span>
            </div>
            {orderNotes && (
              <div className="flex items-center gap-2">
                <span className="font-bold">הערות:</span>
                <span className="font-bold">{orderNotes}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            min-height: 0 !important;
            height: auto !important;
            overflow: visible !important;
            background: white !important;
          }

          .print\\:hidden {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            width: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }

          /* Reset min-height on all containers */
          .min-h-screen, .min-h-full {
            min-height: 0 !important;
            height: auto !important;
          }

          /* Print page container - exact A4 with ID for high specificity */
          #print-page {
            width: 210mm !important;
            height: 297mm !important;
            min-height: 0 !important;
            max-height: 297mm !important;
            padding: 8mm !important;
            margin: 0 !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
            position: relative !important;
          }

          /* Content grid sizing for print */
          .print-content-grid {
            height: calc(297mm - 16mm - 40px - 90px) !important;
            overflow: hidden !important;
          }

          /* Ensure text wraps properly in columns - critical for print */
          .print-content-grid > div {
            overflow: hidden !important;
            min-width: 0 !important;
          }

          /* Force text wrapping in print mode */
          .print-content-grid span,
          .print-content-grid div {
            overflow-wrap: break-word !important;
            word-wrap: break-word !important;
            word-break: break-word !important;
            hyphens: auto !important;
          }
        }

        /* Screen preview height */
        .print-content-grid {
          height: calc(297mm - 20mm - 60px);
        }

        /* Ensure proper text wrapping in columns */
        .print-content-grid > div {
          overflow: hidden;
          min-width: 0;
        }
      `}</style>
    </div>
  );
}

// Individual item row component
interface PrintItemRowProps {
  item: PrintOrderItem;
  sectionId: string;
  isDragging: boolean;
  isDragOver: boolean;
  highlightColor?: string;
  onHide: () => void;
  onRestore: () => void;
  onColorCycle: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  formatQuantity: (item: PrintOrderItem) => string;
  formatAddOns: (item: PrintOrderItem) => string[];
}

function PrintItemRow({
  item,
  sectionId,
  isDragging,
  isDragOver,
  highlightColor,
  onHide,
  onRestore,
  onColorCycle,
  onDragStart,
  onDragOver,
  onDragEnd,
  formatQuantity,
  formatAddOns,
}: PrintItemRowProps) {
  // Get background color class based on highlight
  const bgColorClass = {
    none: '',
    yellow: 'bg-yellow-100 print:bg-yellow-100',
    red: 'bg-red-100 print:bg-red-100',
    green: 'bg-green-100 print:bg-green-100',
    blue: 'bg-blue-100 print:bg-blue-100',
  }[highlightColor || 'none'] || '';
  // Hidden placeholder (user manually hid this item)
  if (item.isPlaceholder && !item.isVisible) {
    return (
      <div
        className={cn(
          "flex items-center gap-1 py-0.5 text-sm min-h-[20px]",
          "bg-gray-50 border border-dashed border-gray-300 rounded print:border-none print:bg-transparent"
        )}
      >
        <span className="flex-1 text-gray-400 italic">—</span>
        <button
          onClick={onRestore}
          className="text-blue-500 hover:text-blue-700 px-1 print:hidden"
          title="שחזר פריט"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // Unselected item - don't show at all (return null to skip rendering)
  const isUnselected = item.selected === false;
  if (isUnselected) {
    return null;
  }

  const quantityStr = formatQuantity(item);
  const addOnsArr = formatAddOns(item);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      className={cn(
        "text-lg group cursor-move rounded-sm",
        bgColorClass,
        isDragging && "opacity-50 bg-blue-100",
        isDragOver && "border-t-2 border-blue-500",
        !item.isVisible && "opacity-40"
      )}
    >
      {/* Main row - item name and quantity on same line */}
      <div className="leading-tight min-h-[28px]">
        <div className="flex items-start gap-1">
          {/* Drag handle - hidden when printing */}
          <GripVertical className="h-5 w-5 text-gray-400 print:hidden flex-shrink-0 mt-0.5" />

          <div className="flex-1 min-w-0 overflow-hidden">
            {/* First line: Item name + quantity + price - wraps naturally */}
            <div className="break-words" style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>
              <span className={cn(
                "font-bold text-xl",
                item.isExtraItem && "text-red-600"
              )}>
                {item.name}
              </span>
              {/* Main Quantity - inline with name, wraps if needed */}
              {quantityStr && (
                <span className={cn(
                  "font-bold text-lg mr-2 whitespace-nowrap",
                  item.isExtraItem ? "text-red-600" : "text-gray-700"
                )}> {quantityStr}</span>
              )}
              {/* Price display for extras items */}
              {item.price && item.price > 0 && (
                <span className="font-bold text-lg mr-2 text-red-600 whitespace-nowrap">
                  (₪{item.price})
                </span>
              )}
            </div>
            {/* Second line: Preparation name (if exists) - wraps naturally */}
            {item.preparation_name && (
              <div className="text-lg font-bold text-gray-700 mr-6 break-words" style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                {item.preparation_name}
              </div>
            )}
          </div>

          {/* Color toggle button - hidden when printing */}
          <button
            onClick={onColorCycle}
            className="opacity-0 group-hover:opacity-100 px-1 print:hidden flex-shrink-0"
            title="שנה צבע סימון"
          >
            <Palette
              className="h-5 w-5"
              style={{
                color: highlightColor && highlightColor !== 'none' ? highlightColor : '#9ca3af'
              }}
            />
          </button>

          {/* Hide button - hidden when printing */}
          <button
            onClick={onHide}
            className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 px-1 print:hidden flex-shrink-0"
            title="הסתר פריט"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Add-ons row - displayed on separate line below item */}
      {addOnsArr.length > 0 && (
        <div className="mr-6 text-base leading-tight text-gray-700 font-bold">
          {addOnsArr.join(" | ")}
        </div>
      )}

      {/* Note row */}
      {item.note && (
        <div className="mr-6 text-base leading-tight" dir="rtl">
          <span className="text-orange-600 italic font-medium">
            ({item.note})
          </span>
        </div>
      )}
    </div>
  );
}

export type { PrintOrderItem };
