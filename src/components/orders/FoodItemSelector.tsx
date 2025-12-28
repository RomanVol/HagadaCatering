"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { FoodItem, FoodItemPreparation, FoodItemVariation } from "@/types";
import { Check } from "lucide-react";

// Size quantities for Big/Small measurement
interface SizeQuantity {
  big: number;   // ג - גדול
  small: number; // ק - קטן
}

// Variation with quantities (for items like אורז)
interface VariationQuantity {
  variation_id: string;
  size_big: number;
  size_small: number;
}

// Helper function to calculate and format portion display
function formatPortionTotal(quantity: number, multiplier?: number | null, unit?: string | null): string | null {
  if (!multiplier || !unit || quantity === 0) return null;
  
  const total = quantity * multiplier;
  
  // Special handling for gram-based items - convert to kg if >= 1000
  if (unit === 'גרם' && total >= 1000) {
    const kg = total / 1000;
    // Format nicely: 1.5 ק״ג, 2 ק״ג, etc.
    return `${kg % 1 === 0 ? kg.toFixed(0) : kg.toFixed(1)} ק״ג`;
  }
  
  return `${total} ${unit}`;
}

// Extra quantity data for items that have both regular and extra selections
interface ExtraQuantityData {
  quantity?: number;           // For mains/middle_courses
  size_big?: number;           // For sides
  size_small?: number;
  variations?: { name: string; size_big: number; size_small: number }[];
  price: number;               // Extra price
}

interface FoodItemCardProps {
  item: FoodItem;
  selected: boolean;
  quantity: number;
  sizeQuantity?: SizeQuantity; // For size-based categories like תוספות
  useSizeMode?: boolean; // Whether this category uses size mode
  useLitersMode?: boolean; // Whether this category uses liters mode
  literQuantities?: { liter_size_id: string; label: string; quantity: number }[]; // For liters display
  preparationName?: string;
  note?: string;
  variationQuantities?: VariationQuantity[]; // For items with variations like אורז
  extraQuantity?: ExtraQuantityData; // For displaying extra quantity in red
  onSelect: () => void;
}

export function FoodItemCard({
  item,
  selected,
  quantity,
  sizeQuantity,
  useSizeMode,
  useLitersMode,
  literQuantities,
  preparationName,
  note,
  variationQuantities,
  extraQuantity,
  onSelect,
}: FoodItemCardProps) {
  // Check if this item has variations
  const hasVariations = item.variations && item.variations.length > 0;
  
  // Build summary text based on mode
  const selectionSummary = React.useMemo(() => {
    // For items with variations, show variation summary
    if (hasVariations && variationQuantities) {
      const parts: string[] = [];
      variationQuantities.forEach((vq) => {
        const variation = item.variations?.find((v) => v.id === vq.variation_id);
        if (variation) {
          const sizeParts: string[] = [];
          if (vq.size_big > 0) sizeParts.push(`${vq.size_big}ג׳`);
          if (vq.size_small > 0) sizeParts.push(`${vq.size_small}ק׳`);
          if (sizeParts.length > 0) {
            parts.push(`${variation.name}: ${sizeParts.join(" ")}`);
          }
        }
      });
      return parts.join("\n");
    }
    
    // For liters mode, show liter quantities
    if (useLitersMode && literQuantities) {
      const parts: string[] = [];
      literQuantities.forEach((lq) => {
        if (lq.quantity > 0) {
          parts.push(`${lq.label}×${lq.quantity}`);
        }
      });
      return parts.join(" ");
    }
    
    if (useSizeMode && sizeQuantity) {
      const parts: string[] = [];
      if (sizeQuantity.big > 0) parts.push(`${sizeQuantity.big}ג׳`);
      if (sizeQuantity.small > 0) parts.push(`${sizeQuantity.small}ק׳`);
      return parts.join(" ");
    }
    return quantity > 0 ? `× ${quantity}` : "";
  }, [hasVariations, variationQuantities, item.variations, useLitersMode, literQuantities, useSizeMode, sizeQuantity, quantity]);

  // Calculate portion total for items with portion_multiplier
  const portionTotal = React.useMemo(() => {
    return formatPortionTotal(quantity, item.portion_multiplier, item.portion_unit);
  }, [quantity, item.portion_multiplier, item.portion_unit]);

  // Build extra quantity summary (for items that have both regular and extra selections)
  const extraSummary = React.useMemo(() => {
    if (!extraQuantity) return null;

    const parts: string[] = [];

    // For variations
    if (extraQuantity.variations?.length) {
      extraQuantity.variations.forEach(v => {
        const vParts: string[] = [];
        if (v.size_big > 0) vParts.push(`${v.size_big}ג׳`);
        if (v.size_small > 0) vParts.push(`${v.size_small}ק׳`);
        if (vParts.length) parts.push(`${v.name}: ${vParts.join(' ')}`);
      });
    }
    // For size mode
    else if (extraQuantity.size_big || extraQuantity.size_small) {
      if (extraQuantity.size_big) parts.push(`${extraQuantity.size_big}ג׳`);
      if (extraQuantity.size_small) parts.push(`${extraQuantity.size_small}ק׳`);
    }
    // For regular quantity
    else if (extraQuantity.quantity) {
      parts.push(`×${extraQuantity.quantity}`);
    }

    if (parts.length === 0) return null;

    return {
      text: parts.join(' '),
      price: extraQuantity.price,
    };
  }, [extraQuantity]);

  // Check if item has any selection
  const hasAnySelection = React.useMemo(() => {
    if (hasVariations && variationQuantities) {
      return variationQuantities.some((vq) => vq.size_big > 0 || vq.size_small > 0);
    }
    if (useLitersMode && literQuantities) {
      return literQuantities.some((lq) => lq.quantity > 0);
    }
    if (useSizeMode) {
      return (sizeQuantity?.big || 0) > 0 || (sizeQuantity?.small || 0) > 0;
    }
    return quantity > 0;
  }, [hasVariations, variationQuantities, useLitersMode, literQuantities, useSizeMode, sizeQuantity, quantity]);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all",
        "min-h-[90px] text-center",
        "hover:shadow-md active:scale-[0.98]",
        selected
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 bg-white hover:border-gray-300"
      )}
    >
      {/* Checkmark badge */}
      {selected && (
        <div className="absolute top-1 right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
          <Check className="w-3 h-3 text-white" strokeWidth={3} />
        </div>
      )}

      {/* Liters mode indicator */}
      {useLitersMode && !hasVariations && (
        <span className="absolute top-1 left-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
          L
        </span>
      )}

      {/* Size mode indicator */}
      {useSizeMode && !hasVariations && !useLitersMode && (
        <span className="absolute top-1 left-1 text-[10px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">
          ג׳/ק׳
        </span>
      )}

      {/* Variations indicator */}
      {hasVariations && (
        <span className="absolute top-1 left-1 text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
          סוגים
        </span>
      )}
      
      {/* Item name */}
      <span className={cn(
        "text-sm font-semibold leading-tight",
        selected ? "text-blue-900" : "text-gray-800"
      )}>
        {item.name}
      </span>
      
      {/* Preparation display */}
      {selected && preparationName && (
        <span className="text-xs text-purple-600 mt-0.5">
          {preparationName}
        </span>
      )}
      
      {/* Quantity/Size/Variations display */}
      {selected && hasAnySelection && (
        <span className={cn(
          "mt-1 font-bold",
          hasVariations ? "text-xs text-purple-600 whitespace-pre-line" : "text-lg text-blue-600"
        )}>
          {selectionSummary}
        </span>
      )}

      {/* Extra quantity display (in red) */}
      {extraSummary && (
        <span className="text-xs text-red-600 font-bold mt-0.5">
          {extraSummary.text} אקסטרה ₪{extraSummary.price}
        </span>
      )}

      {/* Portion total display (e.g., "= 30 קציצות") */}
      {selected && hasAnySelection && portionTotal && (
        <span className="text-xs text-green-600 font-medium">
          = {portionTotal}
        </span>
      )}

      {/* Note indicator */}
      {selected && note && (
        <span className="text-[10px] text-gray-500 mt-0.5">
          📝 יש הערה
        </span>
      )}
      
      {/* Indicator when selected but no quantity */}
      {selected && !hasAnySelection && (
        <span className="text-xs text-orange-500 mt-1">
          {hasVariations ? "בחר סוגים" : (useLitersMode ? "בחר ליטרים" : (useSizeMode ? "בחר גדלים (ג׳/ק׳)" : "בחר כמות"))}
        </span>
      )}
    </button>
  );
}

// Popup Modal for selecting quantity
interface FoodItemPopupProps {
  item: FoodItem;
  quantity: number;
  sizeQuantity?: SizeQuantity;
  useSizeMode?: boolean;
  selectedPreparationId?: string;
  note?: string;
  variationQuantities?: VariationQuantity[]; // For items with variations
  onQuantityChange: (quantity: number) => void;
  onSizeChange?: (size: "big" | "small", quantity: number) => void;
  onPreparationChange?: (preparationId: string | undefined, preparationName: string | undefined) => void;
  onNoteChange?: (note: string) => void;
  onVariationSizeChange?: (variationId: string, size: "big" | "small", quantity: number) => void;
  onClose: () => void;
  // Extra item props
  showExtraButton?: boolean;
  onAddAsExtra?: (price: number, quantityData: {
    quantity?: number;
    size_big?: number;
    size_small?: number;
    variations?: { variation_id: string; name: string; size_big: number; size_small: number }[];
  }) => void;
}

export function FoodItemPopup({
  item,
  quantity,
  sizeQuantity,
  useSizeMode,
  selectedPreparationId,
  note,
  variationQuantities,
  onQuantityChange,
  onSizeChange,
  onPreparationChange,
  onNoteChange,
  onVariationSizeChange,
  onClose,
  showExtraButton,
  onAddAsExtra,
}: FoodItemPopupProps) {
  // Extra mode state
  const [isExtraMode, setIsExtraMode] = React.useState(false);
  const [extraPrice, setExtraPrice] = React.useState<number>(0);

  // Local state for extra quantities (separate from regular item state)
  const [extraQuantityLocal, setExtraQuantityLocal] = React.useState<number>(0);
  const [extraSizeLocal, setExtraSizeLocal] = React.useState<{ big: number; small: number }>({ big: 0, small: 0 });
  const [extraVariationsLocal, setExtraVariationsLocal] = React.useState<{ variation_id: string; size_big: number; size_small: number }[]>([]);

  // Initialize extra variations when entering extra mode
  React.useEffect(() => {
    if (isExtraMode && item.variations && item.variations.length > 0 && extraVariationsLocal.length === 0) {
      setExtraVariationsLocal(item.variations.map(v => ({ variation_id: v.id, size_big: 0, size_small: 0 })));
    }
  }, [isExtraMode, item.variations, extraVariationsLocal.length]);

  // Handler for extra size in extra mode
  const handleExtraSizeChange = (size: "big" | "small", qty: number) => {
    setExtraSizeLocal(prev => ({
      ...prev,
      [size]: qty,
    }));
  };

  // Handler for extra variations in extra mode
  const handleExtraVariationSizeChange = (variationId: string, size: "big" | "small", qty: number) => {
    setExtraVariationsLocal(prev => {
      const existing = prev.find(v => v.variation_id === variationId);
      if (existing) {
        return prev.map(v =>
          v.variation_id === variationId
            ? { ...v, [size === "big" ? "size_big" : "size_small"]: qty }
            : v
        );
      } else {
        return [...prev, {
          variation_id: variationId,
          size_big: size === "big" ? qty : 0,
          size_small: size === "small" ? qty : 0
        }];
      }
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      if (isExtraMode) {
        setExtraQuantityLocal(0);
      } else {
        onQuantityChange(0);
      }
    } else {
      const num = parseInt(value, 10);
      if (!isNaN(num) && num >= 0) {
        if (isExtraMode) {
          setExtraQuantityLocal(num);
        } else {
          onQuantityChange(num);
        }
      }
    }
  };

  const handlePreparationSelect = (prep: FoodItemPreparation | null) => {
    if (onPreparationChange) {
      onPreparationChange(prep?.id, prep?.name);
    }
  };

  const hasPreparations = item.preparations && item.preparations.length > 0;
  const activePreparations = hasPreparations 
    ? item.preparations!.filter(p => p.is_active)
    : [];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Popup */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl animate-slide-up max-h-[85vh] overflow-y-auto">
        <div className="max-w-lg mx-auto p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Preparation options - hidden for items with variations */}
          {activePreparations.length > 0 && !(item.variations && item.variations.length > 0) && (
            <div className="mb-6">
              <label className="block text-gray-600 mb-3 text-center">אופן הכנה:</label>
              <div className="flex flex-wrap gap-2 justify-center">
                {activePreparations.map((prep) => (
                  <button
                    key={prep.id}
                    type="button"
                    onClick={() => handlePreparationSelect(
                      selectedPreparationId === prep.id ? null : prep
                    )}
                    className={cn(
                      "px-4 py-2 rounded-lg font-medium transition-all border-2",
                      selectedPreparationId === prep.id
                        ? "bg-purple-500 text-white border-purple-500"
                        : "bg-white hover:bg-purple-50 text-gray-700 border-gray-200 hover:border-purple-300"
                    )}
                  >
                    {prep.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Variations selector (for items like אורז with multiple types) */}
          {item.variations && item.variations.length > 0 && onVariationSizeChange ? (
            <div className="mb-6">
              <span className="block text-gray-600 mb-3 text-center">
                {isExtraMode ? "בחר כמויות לאקסטרה:" : "בחר סוגים וכמויות:"}
              </span>
              <div className="space-y-3">
                {item.variations.map((variation) => {
                  // Use local extra state or regular state based on mode
                  const vq = isExtraMode
                    ? extraVariationsLocal.find((v) => v.variation_id === variation.id)
                    : variationQuantities?.find((v) => v.variation_id === variation.id);
                  const hasQuantity = (vq?.size_big || 0) > 0 || (vq?.size_small || 0) > 0;
                  return (
                    <VariationSelector
                      key={variation.id}
                      variation={variation}
                      sizeBig={vq?.size_big || 0}
                      sizeSmall={vq?.size_small || 0}
                      isActive={hasQuantity}
                      onSizeChange={(size, qty) => {
                        if (isExtraMode) {
                          handleExtraVariationSizeChange(variation.id, size, qty);
                        } else {
                          onVariationSizeChange(variation.id, size, qty);
                        }
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ) : useSizeMode && onSizeChange ? (
            /* Size-based quantity selector (ג׳/ק׳) */
            <div className="mb-6">
              <span className="block text-gray-600 mb-3 text-center">
                {isExtraMode ? "בחר כמויות לאקסטרה:" : "בחר כמויות:"}
              </span>
              <div className="grid grid-cols-2 gap-4">
                <SizeSelector
                  label="גדול"
                  symbol="ג׳"
                  quantity={isExtraMode ? extraSizeLocal.big : (sizeQuantity?.big || 0)}
                  isActive={isExtraMode ? extraSizeLocal.big > 0 : (sizeQuantity?.big || 0) > 0}
                  onChange={(qty) => {
                    if (isExtraMode) {
                      handleExtraSizeChange("big", qty);
                    } else {
                      onSizeChange("big", qty);
                    }
                  }}
                  color="blue"
                />
                <SizeSelector
                  label="קטן"
                  symbol="ק׳"
                  quantity={isExtraMode ? extraSizeLocal.small : (sizeQuantity?.small || 0)}
                  isActive={isExtraMode ? extraSizeLocal.small > 0 : (sizeQuantity?.small || 0) > 0}
                  onChange={(qty) => {
                    if (isExtraMode) {
                      handleExtraSizeChange("small", qty);
                    } else {
                      onSizeChange("small", qty);
                    }
                  }}
                  color="green"
                />
              </div>
            </div>
          ) : (
            /* Regular quantity selector */
            <>
              <div className="flex flex-col items-center gap-4 mb-6">
                <span className="text-gray-600">
                  {isExtraMode ? "בחר כמות לאקסטרה:" : "בחר כמות:"}
                </span>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (isExtraMode) {
                        if (extraQuantityLocal > 0) setExtraQuantityLocal(extraQuantityLocal - 1);
                      } else {
                        if (quantity > 0) onQuantityChange(quantity - 1);
                      }
                    }}
                    className="w-14 h-14 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-2xl font-bold transition-colors"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={isExtraMode ? extraQuantityLocal : quantity}
                    onChange={handleInputChange}
                    className={cn(
                      "text-4xl font-bold w-24 text-center border-2 rounded-xl focus:outline-none py-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                      isExtraMode
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-200 focus:border-blue-500"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (isExtraMode) {
                        setExtraQuantityLocal(extraQuantityLocal + 1);
                      } else {
                        onQuantityChange(quantity + 1);
                      }
                    }}
                    className={cn(
                      "w-14 h-14 flex items-center justify-center rounded-xl text-white text-2xl font-bold transition-colors",
                      isExtraMode
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-blue-500 hover:bg-blue-600"
                    )}
                  >
                    +
                  </button>
                </div>

                {/* Portion total display */}
                {item.portion_multiplier && item.portion_unit && (isExtraMode ? extraQuantityLocal : quantity) > 0 && (
                  <div className={cn(
                    "border rounded-lg px-4 py-2 text-center",
                    isExtraMode ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
                  )}>
                    <span className={cn(
                      "font-medium",
                      isExtraMode ? "text-red-700" : "text-green-700"
                    )}>
                      = {formatPortionTotal(isExtraMode ? extraQuantityLocal : quantity, item.portion_multiplier, item.portion_unit)}
                    </span>
                    <span className={cn(
                      "text-sm mr-2",
                      isExtraMode ? "text-red-600" : "text-green-600"
                    )}>
                      ({isExtraMode ? extraQuantityLocal : quantity} × {item.portion_multiplier} {item.portion_unit === 'גרם' ? 'גרם' : ''})
                    </span>
                  </div>
                )}
              </div>

              {/* Quick quantity buttons */}
              <div className="flex justify-center gap-2 mb-6">
                {[1, 5, 10, 20, 50].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      if (isExtraMode) {
                        setExtraQuantityLocal(num);
                      } else {
                        onQuantityChange(num);
                      }
                    }}
                    className={cn(
                      "px-4 py-2 rounded-lg font-medium transition-colors",
                      (isExtraMode ? extraQuantityLocal : quantity) === num
                        ? isExtraMode
                          ? "bg-red-500 text-white"
                          : "bg-blue-500 text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    )}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Notes field */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📝 הערות
            </label>
            <textarea
              value={note || ""}
              onChange={(e) => onNoteChange?.(e.target.value)}
              placeholder="הוסף הערה (למשל: בלי בצל, פחות מלח...)"
              className="w-full h-20 px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              dir="rtl"
            />
          </div>

          {/* Extra mode toggle button */}
          {showExtraButton && onAddAsExtra && !isExtraMode && (
            <button
              type="button"
              onClick={() => setIsExtraMode(true)}
              className="w-full h-10 mb-4 bg-red-100 text-red-600 font-semibold rounded-xl border-2 border-red-300 hover:bg-red-200 active:scale-[0.98] transition-all"
            >
              🏷️ אקסטרה
            </button>
          )}

          {/* Extra price input - shown in extra mode */}
          {isExtraMode && (
            <div className="mb-4 p-4 bg-red-50 border-2 border-red-300 rounded-xl">
              <label className="block text-sm font-bold text-red-700 mb-2">
                💰 מחיר אקסטרה (₪)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={extraPrice || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "") {
                    setExtraPrice(0);
                  } else {
                    const num = parseFloat(val);
                    if (!isNaN(num) && num >= 0) {
                      setExtraPrice(num);
                    }
                  }
                }}
                placeholder="הזן מחיר..."
                className="w-full h-12 px-4 text-xl font-bold text-center border-2 border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => {
                  setIsExtraMode(false);
                  setExtraPrice(0);
                  // Reset local extra state
                  setExtraQuantityLocal(0);
                  setExtraSizeLocal({ big: 0, small: 0 });
                  setExtraVariationsLocal([]);
                }}
                className="mt-2 text-sm text-gray-500 hover:text-gray-700 underline"
              >
                ביטול אקסטרה
              </button>
            </div>
          )}

          {/* Done button - changes style in extra mode */}
          <button
            type="button"
            onClick={() => {
              if (isExtraMode && onAddAsExtra) {
                // Build quantity data from LOCAL extra state (not regular state)
                const quantityData: {
                  quantity?: number;
                  size_big?: number;
                  size_small?: number;
                  variations?: { variation_id: string; name: string; size_big: number; size_small: number }[];
                } = {};

                if (item.variations && item.variations.length > 0) {
                  // Item with variations - use LOCAL extra variations state
                  quantityData.variations = extraVariationsLocal
                    .filter(v => v.size_big > 0 || v.size_small > 0)
                    .map(v => {
                      const variation = item.variations?.find(iv => iv.id === v.variation_id);
                      return {
                        variation_id: v.variation_id,
                        name: variation?.name || "",
                        size_big: v.size_big,
                        size_small: v.size_small,
                      };
                    });
                } else if (useSizeMode) {
                  // Size-based item (sides) - use LOCAL extra size state
                  quantityData.size_big = extraSizeLocal.big;
                  quantityData.size_small = extraSizeLocal.small;
                } else {
                  // Regular quantity item (mains, middle_courses) - use LOCAL extra quantity state
                  quantityData.quantity = extraQuantityLocal;
                }

                onAddAsExtra(extraPrice, quantityData);
                // Reset local extra state
                setIsExtraMode(false);
                setExtraPrice(0);
                setExtraQuantityLocal(0);
                setExtraSizeLocal({ big: 0, small: 0 });
                setExtraVariationsLocal([]);
              }
              onClose();
            }}
            className={cn(
              "w-full h-12 font-semibold rounded-xl active:scale-[0.98] transition-all",
              isExtraMode
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-blue-500 text-white hover:bg-blue-600"
            )}
          >
            {isExtraMode ? "הוסף כאקסטרה" : "אישור"}
          </button>
        </div>
      </div>
    </>
  );
}

// Size Selector for Big/Small measurement
interface SizeSelectorProps {
  label: string;
  symbol: string;
  quantity: number;
  isActive: boolean;
  onChange: (quantity: number) => void;
  color: "blue" | "green";
}

function SizeSelector({ label, symbol, quantity, isActive, onChange, color }: SizeSelectorProps) {
  const increment = () => onChange(quantity + 1);
  const decrement = () => {
    if (quantity > 0) onChange(quantity - 1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      onChange(0);
    } else {
      const num = parseInt(value, 10);
      if (!isNaN(num) && num >= 0) {
        onChange(num);
      }
    }
  };

  const colorClasses = {
    blue: {
      active: "border-blue-500 bg-blue-500",
      symbol: "bg-blue-600",
    },
    green: {
      active: "border-green-500 bg-green-500",
      symbol: "bg-green-600",
    },
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-xl border-2 px-3 py-3 transition-all",
        isActive
          ? colorClasses[color].active
          : "border-gray-300 bg-white"
      )}
    >
      {/* Symbol badge */}
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center mb-2",
        isActive ? colorClasses[color].symbol : "bg-gray-100"
      )}>
        <span className={cn(
          "text-xl font-bold",
          isActive ? "text-white" : "text-gray-600"
        )}>
          {symbol}
        </span>
      </div>

      <span className={cn(
        "text-sm font-bold mb-2",
        isActive ? "text-white" : "text-gray-700"
      )}>
        {label}
      </span>
      
      <div className="flex items-center justify-center gap-1">
        <button
          type="button"
          onClick={decrement}
          className={cn(
            "w-8 h-8 flex items-center justify-center rounded-lg text-lg font-bold transition-colors border",
            isActive 
              ? "bg-white/20 text-white border-white/40 hover:bg-white/30" 
              : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
          )}
        >
          −
        </button>
        <input
          type="number"
          min="0"
          value={quantity}
          onChange={handleInputChange}
          className={cn(
            "w-12 h-8 text-center text-lg font-bold rounded-lg focus:outline-none focus:ring-2",
            isActive 
              ? "bg-white/20 text-white border-2 border-white/40 focus:ring-white/50" 
              : "bg-gray-50 text-gray-700 border-2 border-gray-300 focus:ring-blue-300",
            "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          )}
        />
        <button
          type="button"
          onClick={increment}
          className={cn(
            "w-8 h-8 flex items-center justify-center rounded-lg text-lg font-bold transition-colors border",
            isActive 
              ? "bg-white/20 text-white border-white/40 hover:bg-white/30" 
              : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
          )}
        >
          +
        </button>
      </div>
    </div>
  );
}

// Export types
export type { SizeQuantity, VariationQuantity };

// Variation Selector for items with multiple types (e.g., אורז)
interface VariationSelectorProps {
  variation: FoodItemVariation;
  sizeBig: number;
  sizeSmall: number;
  isActive: boolean;
  onSizeChange: (size: "big" | "small", quantity: number) => void;
}

function VariationSelector({
  variation,
  sizeBig,
  sizeSmall,
  isActive,
  onSizeChange,
}: VariationSelectorProps) {
  const handleInputChange = (size: "big" | "small", e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      onSizeChange(size, 0);
    } else {
      const num = parseInt(value, 10);
      if (!isNaN(num) && num >= 0) {
        onSizeChange(size, num);
      }
    }
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-xl border-2 px-4 py-3 transition-all",
        isActive
          ? "border-purple-500 bg-purple-50"
          : "border-gray-200 bg-white"
      )}
    >
      {/* Variation name */}
      <span className={cn(
        "text-lg font-bold min-w-[60px]",
        isActive ? "text-purple-700" : "text-gray-700"
      )}>
        {variation.name}
      </span>

      {/* Size selectors */}
      <div className="flex items-center gap-4">
        {/* Big (ג׳) */}
        <div className="flex items-center gap-1">
          <span className={cn(
            "text-sm font-bold w-6 h-6 rounded-full flex items-center justify-center",
            sizeBig > 0 ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600"
          )}>
            ג׳
          </span>
          <button
            type="button"
            onClick={() => sizeBig > 0 && onSizeChange("big", sizeBig - 1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold"
          >
            −
          </button>
          <input
            type="number"
            min="0"
            value={sizeBig}
            onChange={(e) => handleInputChange("big", e)}
            className="w-10 h-7 text-center text-sm font-bold rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            type="button"
            onClick={() => onSizeChange("big", sizeBig + 1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold"
          >
            +
          </button>
        </div>

        {/* Small (ק׳) */}
        <div className="flex items-center gap-1">
          <span className={cn(
            "text-sm font-bold w-6 h-6 rounded-full flex items-center justify-center",
            sizeSmall > 0 ? "bg-green-500 text-white" : "bg-gray-100 text-gray-600"
          )}>
            ק׳
          </span>
          <button
            type="button"
            onClick={() => sizeSmall > 0 && onSizeChange("small", sizeSmall - 1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold"
          >
            −
          </button>
          <input
            type="number"
            min="0"
            value={sizeSmall}
            onChange={(e) => handleInputChange("small", e)}
            className="w-10 h-7 text-center text-sm font-bold rounded-lg border border-gray-300 focus:border-green-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            type="button"
            onClick={() => onSizeChange("small", sizeSmall + 1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-500 hover:bg-green-600 text-white font-bold"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
