"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { FoodItem, LiterSize, MeasurementType } from "@/types";
import { Check } from "lucide-react";

interface LiterQuantity {
  liter_size_id: string;
  quantity: number;
}

// Size quantities for Big/Small measurement
interface SizeQuantity {
  big: number;   // ג - גדול
  small: number; // ק - קטן
}

interface SaladCardProps {
  item: FoodItem;
  selected: boolean;
  literQuantities: LiterQuantity[];
  sizeQuantity?: SizeQuantity;
  literSizes: LiterSize[];
  measurementType: MeasurementType;
  onSelect: () => void;
}

export function SaladCard({
  item,
  selected,
  literQuantities,
  sizeQuantity,
  literSizes,
  measurementType,
  onSelect,
}: SaladCardProps) {
  // Check if there's any selection based on measurement type
  const hasAnySelection = React.useMemo(() => {
    if (measurementType === "liters") {
      return literQuantities.some((lq) => lq.quantity > 0);
    } else if (measurementType === "size") {
      return (sizeQuantity?.big || 0) > 0 || (sizeQuantity?.small || 0) > 0;
    }
    return false;
  }, [measurementType, literQuantities, sizeQuantity]);

  // Build summary text based on measurement type
  const selectionSummary = React.useMemo(() => {
    if (measurementType === "liters") {
      return literQuantities
        .filter((lq) => lq.quantity > 0)
        .map((lq) => {
          const size = literSizes.find((ls) => ls.id === lq.liter_size_id);
          return `${size?.label}×${lq.quantity}`;
        })
        .join(" | ");
    } else if (measurementType === "size" && sizeQuantity) {
      const parts: string[] = [];
      if (sizeQuantity.big > 0) parts.push(`ג׳${sizeQuantity.big}`);
      if (sizeQuantity.small > 0) parts.push(`ק׳${sizeQuantity.small}`);
      return parts.join(" | ");
    }
    return "";
  }, [measurementType, literQuantities, sizeQuantity, literSizes]);

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
      
      {/* Measurement type indicator */}
      {measurementType === "size" && (
        <div className="absolute top-1 left-1 text-[10px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">
          ג׳/ק׳
        </div>
      )}
      
      {/* Salad name */}
      <span className={cn(
        "text-sm font-semibold leading-tight",
        selected ? "text-blue-900" : "text-gray-800"
      )}>
        {item.name}
      </span>
      
      {/* Selected quantity summary */}
      {selected && hasAnySelection && (
        <span className="text-xs text-blue-600 mt-1 font-medium leading-tight">
          {selectionSummary}
        </span>
      )}
      
      {/* Indicator when selected but no quantity chosen yet */}
      {selected && !hasAnySelection && (
        <span className="text-xs text-orange-500 mt-1">
          {measurementType === "size" ? "בחר גדלים (ג׳/ק׳)" : "בחר גדלים"}
        </span>
      )}
    </button>
  );
}

// Popup Modal for selecting quantities
interface SaladLiterPopupProps {
  item: FoodItem;
  literQuantities: LiterQuantity[];
  sizeQuantity?: SizeQuantity;
  literSizes: LiterSize[];
  measurementType: MeasurementType;
  onLiterChange: (literSizeId: string, quantity: number) => void;
  onSizeChange?: (size: "big" | "small", quantity: number) => void;
  onClose: () => void;
}

export function SaladLiterPopup({
  item,
  literQuantities,
  sizeQuantity,
  literSizes,
  measurementType,
  onLiterChange,
  onSizeChange,
  onClose,
}: SaladLiterPopupProps) {
  const getQuantityForLiter = (literId: string): number => {
    const found = literQuantities.find((lq) => lq.liter_size_id === literId);
    return found?.quantity || 0;
  };

  // Check for any selection
  const hasAnySelection = React.useMemo(() => {
    if (measurementType === "liters") {
      return literQuantities.some((lq) => lq.quantity > 0);
    } else if (measurementType === "size") {
      return (sizeQuantity?.big || 0) > 0 || (sizeQuantity?.small || 0) > 0;
    }
    return false;
  }, [measurementType, literQuantities, sizeQuantity]);

  // Build summary
  const selectionSummary = React.useMemo(() => {
    if (measurementType === "liters") {
      return literQuantities
        .filter((lq) => lq.quantity > 0)
        .map((lq) => {
          const size = literSizes.find((ls) => ls.id === lq.liter_size_id);
          return `${size?.label} × ${lq.quantity}`;
        })
        .join(", ");
    } else if (measurementType === "size" && sizeQuantity) {
      const parts: string[] = [];
      if (sizeQuantity.big > 0) parts.push(`גדול (ג׳) × ${sizeQuantity.big}`);
      if (sizeQuantity.small > 0) parts.push(`קטן (ק׳) × ${sizeQuantity.small}`);
      return parts.join(", ");
    }
    return "";
  }, [measurementType, literQuantities, sizeQuantity, literSizes]);

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Popup */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl animate-slide-up">
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
          
          {/* Liter options */}
          {measurementType === "liters" && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              {literSizes.map((literSize) => {
                const qty = getQuantityForLiter(literSize.id);
                const isActive = qty > 0;

                return (
                  <LiterSelector
                    key={literSize.id}
                    literSize={literSize}
                    quantity={qty}
                    isActive={isActive}
                    onChange={(newQty) => onLiterChange(literSize.id, newQty)}
                  />
                );
              })}
            </div>
          )}

          {/* Size options (Big/Small) */}
          {measurementType === "size" && onSizeChange && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <SizeSelector
                label="גדול"
                symbol="ג׳"
                quantity={sizeQuantity?.big || 0}
                isActive={(sizeQuantity?.big || 0) > 0}
                onChange={(qty) => onSizeChange("big", qty)}
                color="blue"
              />
              <SizeSelector
                label="קטן"
                symbol="ק׳"
                quantity={sizeQuantity?.small || 0}
                isActive={(sizeQuantity?.small || 0) > 0}
                onChange={(qty) => onSizeChange("small", qty)}
                color="green"
              />
            </div>
          )}
          
          {/* Summary */}
          {hasAnySelection && (
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <span className="text-blue-800 font-medium">
                סה״כ: {selectionSummary}
              </span>
            </div>
          )}
          
          {/* Done button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full h-12 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 active:scale-[0.98] transition-all"
          >
            אישור
          </button>
        </div>
      </div>
    </>
  );
}

interface LiterSelectorProps {
  literSize: LiterSize;
  quantity: number;
  isActive: boolean;
  onChange: (quantity: number) => void;
}

function LiterSelector({ literSize, quantity, isActive, onChange }: LiterSelectorProps) {
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

  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-xl border-2 px-3 py-2 transition-all",
        isActive
          ? "border-blue-500 bg-blue-500"
          : "border-gray-300 bg-white"
      )}
    >
      <span className={cn(
        "text-sm font-bold mb-1",
        isActive ? "text-white" : "text-gray-700"
      )}>
        {literSize.label}
      </span>
      
      <div className="flex items-center justify-center gap-1">
        <button
          type="button"
          onClick={decrement}
          className={cn(
            "w-6 h-6 flex items-center justify-center rounded text-sm font-bold transition-colors border",
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
            "w-8 h-6 text-center text-sm font-bold rounded focus:outline-none focus:ring-2",
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
            "w-6 h-6 flex items-center justify-center rounded text-sm font-bold transition-colors border",
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
