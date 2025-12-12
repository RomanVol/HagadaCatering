"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Category, FoodItem, LiterSize, FoodItemVariation } from "@/types";
import { GripVertical, X, Printer, ArrowRight, RotateCcw } from "lucide-react";
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
  customerName?: string;
  customerPhone: string;
  customerAddress?: string;
  orderNotes?: string;
  items: PrintOrderItem[];
  categories: Category[];
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
  customerName,
  customerPhone,
  customerAddress,
  orderNotes,
  items: initialItems,
  categories,
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

  // Format quantity display - for salads: show all quantities in one line
  // For items with add-ons (like כרוב אסייתי): show main item quantities AND each add-on separately
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
    
    // For add-ons - show EACH add-on with its own quantities SEPARATELY
    // Example: גזר מגורד (3L:2, 1.5L:1) | מלפפון מגורד (3L:1)
    if (item.addOns && item.addOns.length > 0) {
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
          parts.push(`${ao.name} (${aoParts.join(" ")})`);
        }
      });
    }
    
    return parts.join(" | ");
  };

  return (
    <div className="min-h-screen bg-gray-100">
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
      <div className="max-w-4xl mx-auto p-4 print:p-0 print:max-w-none">
        <div 
          className="bg-white shadow-lg print:shadow-none mx-auto"
          style={{
            width: "210mm",
            minHeight: "297mm",
            padding: "10mm",
          }}
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-4 border-b pb-2">
            <div className="text-right">
              <span className="text-lg font-bold">בס״ד</span>
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold">הזמנה מספר {orderNumber}</h1>
              <p className="text-sm text-gray-600">
                {orderDate} {orderTime && `| ${orderTime}`}
              </p>
            </div>
            <div className="text-left">
              <span className="text-lg font-bold">{orderNumber}</span>
            </div>
          </div>

          {/* Main Content - 3 columns layout: Salads (wide) | Middle+Extras | Sides+Mains */}
          <div className="grid grid-cols-3 gap-2 text-sm" style={{ direction: "rtl" }}>
            {/* Column 1: Salads - wider column */}
            <div className="border-l border-gray-300 pl-2">
              <h2 className="font-bold text-center mb-2 bg-gray-100 py-1">
                {sections[0]?.title}
              </h2>
              <div className="space-y-0.5">
                {sections[0]?.items.map((item, index) => (
                  <PrintItemRow
                    key={item.id}
                    item={item}
                    index={index + 1}
                    sectionId="salads"
                    isDragging={dragState.draggedItem?.id === item.id}
                    isDragOver={dragState.dragOverSection === "salads" && dragState.dragOverIndex === index}
                    onHide={() => handleHideItem("salads", item.id)}
                    onRestore={() => handleRestoreItem("salads", item.id)}
                    onDragStart={() => handleDragStart(item, "salads")}
                    onDragOver={(e) => handleDragOver(e, index, "salads")}
                    onDragEnd={handleDragEnd}
                    formatQuantity={formatQuantity}
                  />
                ))}
              </div>
            </div>

            {/* Column 2: Middle Courses + Extras */}
            <div className="border-l border-gray-300 pl-2">
              <h2 className="font-bold text-center mb-2 bg-gray-100 py-1">
                {sections[1]?.title}
              </h2>
              <div className="space-y-0.5">
                {sections[1]?.items.map((item, index) => (
                  <PrintItemRow
                    key={item.id}
                    item={item}
                    index={index + 1}
                    sectionId="middle_courses"
                    isDragging={dragState.draggedItem?.id === item.id}
                    isDragOver={dragState.dragOverSection === "middle_courses" && dragState.dragOverIndex === index}
                    onHide={() => handleHideItem("middle_courses", item.id)}
                    onRestore={() => handleRestoreItem("middle_courses", item.id)}
                    onDragStart={() => handleDragStart(item, "middle_courses")}
                    onDragOver={(e) => handleDragOver(e, index, "middle_courses")}
                    onDragEnd={handleDragEnd}
                    formatQuantity={formatQuantity}
                  />
                ))}
              </div>

              {/* Extras below middle courses */}
              <h2 className="font-bold text-center mb-2 mt-4 bg-gray-100 py-1">
                {sections[4]?.title}
              </h2>
              <div className="space-y-0.5">
                {sections[4]?.items.map((item, index) => (
                  <PrintItemRow
                    key={item.id}
                    item={item}
                    index={index + 1}
                    sectionId="extras"
                    isDragging={dragState.draggedItem?.id === item.id}
                    isDragOver={dragState.dragOverSection === "extras" && dragState.dragOverIndex === index}
                    onHide={() => handleHideItem("extras", item.id)}
                    onRestore={() => handleRestoreItem("extras", item.id)}
                    onDragStart={() => handleDragStart(item, "extras")}
                    onDragOver={(e) => handleDragOver(e, index, "extras")}
                    onDragEnd={handleDragEnd}
                    formatQuantity={formatQuantity}
                  />
                ))}
              </div>

              {/* Bakery below extras */}
              <h2 className="font-bold text-center mb-2 mt-4 bg-gray-100 py-1">
                {sections[5]?.title}
              </h2>
              <div className="space-y-0.5">
                {sections[5]?.items.map((item, index) => (
                  <PrintItemRow
                    key={item.id}
                    item={item}
                    index={index + 1}
                    sectionId="bakery"
                    isDragging={dragState.draggedItem?.id === item.id}
                    isDragOver={dragState.dragOverSection === "bakery" && dragState.dragOverIndex === index}
                    onHide={() => handleHideItem("bakery", item.id)}
                    onRestore={() => handleRestoreItem("bakery", item.id)}
                    onDragStart={() => handleDragStart(item, "bakery")}
                    onDragOver={(e) => handleDragOver(e, index, "bakery")}
                    onDragEnd={handleDragEnd}
                    formatQuantity={formatQuantity}
                  />
                ))}
              </div>
            </div>

            {/* Column 3: Sides + Mains (combined) */}
            <div>
              {/* Sides at top */}
              <h2 className="font-bold text-center mb-2 bg-gray-100 py-1">
                {sections[2]?.title}
              </h2>
              <div className="space-y-0.5">
                {sections[2]?.items.map((item, index) => (
                  <PrintItemRow
                    key={item.id}
                    item={item}
                    index={index + 1}
                    sectionId="sides"
                    isDragging={dragState.draggedItem?.id === item.id}
                    isDragOver={dragState.dragOverSection === "sides" && dragState.dragOverIndex === index}
                    onHide={() => handleHideItem("sides", item.id)}
                    onRestore={() => handleRestoreItem("sides", item.id)}
                    onDragStart={() => handleDragStart(item, "sides")}
                    onDragOver={(e) => handleDragOver(e, index, "sides")}
                    onDragEnd={handleDragEnd}
                    formatQuantity={formatQuantity}
                  />
                ))}
              </div>

              {/* Mains below sides */}
              <h2 className="font-bold text-center mb-2 mt-4 bg-gray-100 py-1">
                {sections[3]?.title}
              </h2>
              <div className="space-y-0.5">
                {sections[3]?.items.map((item, index) => (
                  <PrintItemRow
                    key={item.id}
                    item={item}
                    index={index + 1}
                    sectionId="mains"
                    isDragging={dragState.draggedItem?.id === item.id}
                    isDragOver={dragState.dragOverSection === "mains" && dragState.dragOverIndex === index}
                    onHide={() => handleHideItem("mains", item.id)}
                    onRestore={() => handleRestoreItem("mains", item.id)}
                    onDragStart={() => handleDragStart(item, "mains")}
                    onDragOver={(e) => handleDragOver(e, index, "mains")}
                    onDragEnd={handleDragEnd}
                    formatQuantity={formatQuantity}
                  />
                ))}
              </div>

              {/* Portions checkboxes */}
              <div className="mt-4 border-t pt-2">
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

          {/* Customer Details - Bottom */}
          <div className="mt-6 pt-4 border-t border-gray-300">
            <div className="grid grid-cols-4 gap-4 text-sm" style={{ direction: "rtl" }}>
              <div className="flex items-center gap-2">
                <span className="font-bold">שם:</span>
                <span className="border-b border-gray-400 flex-1 min-w-[80px]">
                  {customerName || ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">סה״כ מס׳ מנות:</span>
                <span className="border-b border-gray-400 flex-1 min-w-[40px]"></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">שעה:</span>
                <span className="border-b border-gray-400 flex-1 min-w-[40px]">
                  {orderTime || ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">יום:</span>
                <span className="border-b border-gray-400 flex-1 min-w-[40px]">
                  {orderDate}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm mt-2" style={{ direction: "rtl" }}>
              <div className="flex items-center gap-2">
                <span className="font-bold">טלפון:</span>
                <span className="border-b border-gray-400 flex-1">
                  {customerPhone}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">כתובת:</span>
                <span className="border-b border-gray-400 flex-1">
                  {customerAddress || ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">מחיר בסיס למנה:</span>
                <span className="border-b border-gray-400 flex-1 min-w-[40px]"></span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mt-2" style={{ direction: "rtl" }}>
              <div className="flex items-center gap-2">
                <span className="font-bold">הובלה:</span>
                <span className="border-b border-gray-400 flex-1 min-w-[60px]"></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">סה״כ לתשלום:</span>
                <span className="border-b border-gray-400 flex-1 min-w-[60px]"></span>
              </div>
            </div>

            {/* Order notes */}
            {orderNotes && (
              <div className="mt-2 text-sm" style={{ direction: "rtl" }}>
                <span className="font-bold">הערות: </span>
                <span>{orderNotes}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

// Individual item row component
interface PrintItemRowProps {
  item: PrintOrderItem;
  index: number;
  sectionId: string;
  isDragging: boolean;
  isDragOver: boolean;
  onHide: () => void;
  onRestore: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  formatQuantity: (item: PrintOrderItem) => string;
}

function PrintItemRow({
  item,
  index,
  sectionId,
  isDragging,
  isDragOver,
  onHide,
  onRestore,
  onDragStart,
  onDragOver,
  onDragEnd,
  formatQuantity,
}: PrintItemRowProps) {
  // Hidden placeholder (user manually hid this item)
  if (item.isPlaceholder && !item.isVisible) {
    return (
      <div 
        className={cn(
          "flex items-center gap-1 py-0.5 text-xs min-h-[20px]",
          "bg-gray-50 border border-dashed border-gray-300 rounded print:border-none print:bg-transparent"
        )}
      >
        <span className="w-5 text-gray-400">{index}.</span>
        <span className="flex-1 text-gray-400 italic">—</span>
        <button
          onClick={onRestore}
          className="text-blue-500 hover:text-blue-700 px-1 print:hidden"
          title="שחזר פריט"
        >
          <RotateCcw className="h-3 w-3" />
        </button>
      </div>
    );
  }

  // Unselected item - show as compact empty row with just the name (for all categories)
  const isUnselected = item.selected === false;
  if (isUnselected) {
    return (
      <div
        draggable
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        className={cn(
          "flex items-center gap-0.5 py-0 text-[9px] group cursor-move min-h-[14px] leading-tight",
          isDragging && "opacity-50 bg-blue-100",
          isDragOver && "border-t-2 border-blue-500"
        )}
      >
        <GripVertical className="h-2 w-2 text-gray-300 print:hidden flex-shrink-0" />
        <span className="w-4 text-gray-300">{index}.</span>
        <span className="flex-1 truncate text-gray-300">{item.name}</span>
        <span className="text-gray-200 text-[8px]">______</span>
      </div>
    );
  }

  const quantityStr = formatQuantity(item);
  const hasQuantityOrNote = quantityStr || item.note;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      className={cn(
        "text-sm group cursor-move",
        isDragging && "opacity-50 bg-blue-100",
        isDragOver && "border-t-2 border-blue-500",
        !item.isVisible && "opacity-40"
      )}
    >
      {/* Main row - item name */}
      <div className="flex items-center gap-1 leading-tight min-h-[18px]">
        {/* Drag handle - hidden when printing */}
        <GripVertical className="h-3 w-3 text-gray-400 print:hidden flex-shrink-0" />
        
        {/* Item number */}
        <span className="w-5 font-bold">{index}.</span>
        
        {/* Item name */}
        <span className="flex-shrink-0 font-bold">
          {item.name}
          {item.preparation_name && ` - ${item.preparation_name}`}
        </span>
        
        {/* Hide button - hidden when printing */}
        <button
          onClick={onHide}
          className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 px-1 print:hidden ml-auto"
          title="הסתר פריט"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      
      {/* Second row for quantity and note - tightly coupled to the name row */}
      {hasQuantityOrNote && (
        <div className="flex flex-wrap items-center gap-1 mr-6 text-xs leading-tight -mt-0.5" dir="rtl">
          {quantityStr && (
            <span className="text-gray-700 font-semibold">{quantityStr}</span>
          )}
          {item.note && (
            <span className="text-orange-600 italic">
              ({item.note})
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export type { PrintOrderItem };
