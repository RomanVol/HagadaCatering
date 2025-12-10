"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { FoodItem, FoodItemAddOn, LiterSize, MeasurementType } from "@/types";
import { Check, Plus } from "lucide-react";

interface LiterQuantity {
  liter_size_id: string;
  quantity: number;
}

// Size quantities for Big/Small measurement
interface SizeQuantity {
  big: number;   // ג - גדול
  small: number; // ק - קטן
}

// Add-on state
interface AddOnState {
  addon_id: string;
  quantity: number; // Simple quantity for add-ons
  liters: LiterQuantity[]; // Keep for backward compatibility
}

interface SaladCardProps {
  item: FoodItem;
  selected: boolean;
  literQuantities: LiterQuantity[];
  sizeQuantity?: SizeQuantity;
  regularQuantity?: number; // For measurement_type "none"
  addOns?: AddOnState[];
  note?: string;
  literSizes: LiterSize[];
  measurementType: MeasurementType;
  onSelect: () => void;
}

export function SaladCard({
  item,
  selected,
  literQuantities,
  sizeQuantity,
  regularQuantity,
  addOns,
  note,
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
    } else if (measurementType === "none") {
      return (regularQuantity || 0) > 0;
    }
    return false;
  }, [measurementType, literQuantities, sizeQuantity, regularQuantity]);

  // Check if there are any add-ons with selections
  const hasAddOnSelections = React.useMemo(() => {
    if (!addOns) return false;
    return addOns.some((ao) => 
      ao.quantity > 0 || ao.liters.some((l) => l.quantity > 0)
    );
  }, [addOns]);

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
      if (sizeQuantity.big > 0) parts.push(`${sizeQuantity.big}ג׳`);
      if (sizeQuantity.small > 0) parts.push(`${sizeQuantity.small}ק׳`);
      return parts.join(" ");
    } else if (measurementType === "none" && regularQuantity) {
      return `×${regularQuantity}`;
    }
    return "";
  }, [measurementType, literQuantities, sizeQuantity, regularQuantity, literSizes]);

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
      
      {/* Measurement type indicator + has add-ons indicator */}
      <div className="absolute top-1 left-1 flex gap-1">
        {measurementType === "size" && (
          <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">
            ג׳/ק׳
          </span>
        )}
        {item.add_ons && item.add_ons.length > 0 && (
          <span className="text-[10px] font-bold text-purple-500 bg-purple-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
            <Plus className="w-2.5 h-2.5" />
            {item.add_ons.length}
          </span>
        )}
      </div>
      
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

      {/* Add-ons indicator */}
      {selected && hasAddOnSelections && (
        <span className="text-[10px] text-purple-600 mt-0.5">
          + תוספות
        </span>
      )}

      {/* Note indicator */}
      {selected && note && (
        <span className="text-[10px] text-gray-500 mt-0.5">
          📝 יש הערה
        </span>
      )}
      
      {/* Indicator when selected but no quantity chosen yet */}
      {selected && !hasAnySelection && (
        <span className="text-xs text-orange-500 mt-1">
          {measurementType === "size" 
            ? "בחר גדלים (ג׳/ק׳)" 
            : measurementType === "none" 
              ? "בחר כמות" 
              : "בחר גדלים"}
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
  regularQuantity?: number; // For measurement_type "none"
  addOns?: AddOnState[];
  note?: string;
  literSizes: LiterSize[];
  measurementType: MeasurementType;
  onLiterChange: (literSizeId: string, quantity: number) => void;
  onSizeChange?: (size: "big" | "small", quantity: number) => void;
  onRegularQuantityChange?: (quantity: number) => void; // For measurement_type "none"
  onAddOnLiterChange?: (addonId: string, literSizeId: string, quantity: number) => void;
  onAddOnQuantityChange?: (addonId: string, quantity: number) => void; // Simple quantity for add-ons
  onNoteChange?: (note: string) => void;
  onCancel?: () => void; // Cancel/unselect the salad
  onClose: () => void;
}

export function SaladLiterPopup({
  item,
  literQuantities,
  sizeQuantity,
  regularQuantity,
  addOns,
  note,
  literSizes,
  measurementType,
  onLiterChange,
  onSizeChange,
  onRegularQuantityChange,
  onAddOnLiterChange,
  onAddOnQuantityChange,
  onNoteChange,
  onCancel,
  onClose,
}: SaladLiterPopupProps) {
  const getQuantityForLiter = (literId: string): number => {
    const found = literQuantities.find((lq) => lq.liter_size_id === literId);
    return found?.quantity || 0;
  };

  const getAddOnQuantity = (addonId: string, literId: string): number => {
    const addon = addOns?.find((ao) => ao.addon_id === addonId);
    const liter = addon?.liters.find((l) => l.liter_size_id === literId);
    return liter?.quantity || 0;
  };

  const getAddOnSimpleQuantity = (addonId: string): number => {
    const addon = addOns?.find((ao) => ao.addon_id === addonId);
    return addon?.quantity || 0;
  };

  // Check for any selection
  const hasAnySelection = React.useMemo(() => {
    if (measurementType === "liters") {
      return literQuantities.some((lq) => lq.quantity > 0);
    } else if (measurementType === "size") {
      return (sizeQuantity?.big || 0) > 0 || (sizeQuantity?.small || 0) > 0;
    } else if (measurementType === "none") {
      return (regularQuantity || 0) > 0;
    }
    return false;
  }, [measurementType, literQuantities, sizeQuantity, regularQuantity]);

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
    } else if (measurementType === "none" && regularQuantity) {
      return `כמות: ${regularQuantity}`;
    }
    return "";
  }, [measurementType, literQuantities, sizeQuantity, regularQuantity, literSizes]);

  // Build add-ons summary
  const addOnsSummary = React.useMemo(() => {
    if (!item.add_ons || !addOns) return "";
    
    const summaries: string[] = [];
    item.add_ons.forEach((addon) => {
      const addonState = addOns.find((ao) => ao.addon_id === addon.id);
      if (addonState) {
        // Check for simple quantity first
        if (addonState.quantity > 0) {
          summaries.push(`${addon.name}: ×${addonState.quantity}`);
        } else {
          // Check for liters
          const litersSummary = addonState.liters
            .filter((l) => l.quantity > 0)
            .map((l) => {
              const size = literSizes.find((ls) => ls.id === l.liter_size_id);
              return `${size?.label}×${l.quantity}`;
            })
            .join(", ");
          
          if (litersSummary) {
            summaries.push(`${addon.name}: ${litersSummary}`);
          }
        }
      }
    });
    
    return summaries.join(" | ");
  }, [item.add_ons, addOns, literSizes]);

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
          <div className="flex items-center justify-between mb-4 sticky top-0 bg-white py-2">
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

          {/* Regular quantity selector (for measurement_type "none") */}
          {measurementType === "none" && onRegularQuantityChange && (
            <div className="flex flex-col items-center gap-4 mb-6">
              <span className="text-gray-600 font-medium">בחר כמות:</span>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => (regularQuantity || 0) > 0 && onRegularQuantityChange((regularQuantity || 0) - 1)}
                  className="w-14 h-14 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-2xl font-bold transition-colors"
                >
                  −
                </button>
                <input
                  type="number"
                  min="0"
                  value={regularQuantity || 0}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") {
                      onRegularQuantityChange(0);
                    } else {
                      const num = parseInt(value, 10);
                      if (!isNaN(num) && num >= 0) {
                        onRegularQuantityChange(num);
                      }
                    }
                  }}
                  className="text-4xl font-bold w-24 text-center border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none py-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => onRegularQuantityChange((regularQuantity || 0) + 1)}
                  className="w-14 h-14 flex items-center justify-center rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-2xl font-bold transition-colors"
                >
                  +
                </button>
              </div>
              
              {/* Quick quantity buttons */}
              <div className="flex justify-center gap-2">
                {[1, 5, 10, 20, 50].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => onRegularQuantityChange(num)}
                    className={cn(
                      "px-4 py-2 rounded-lg font-medium transition-colors",
                      regularQuantity === num
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    )}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add-ons Section */}
          {item.add_ons && item.add_ons.length > 0 && (onAddOnLiterChange || onAddOnQuantityChange) && (
            <div className="mt-6 pt-4 border-t-2 border-purple-100">
              <h4 className="text-sm font-bold text-purple-700 mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                תוספות אופציונליות
              </h4>
              
              {item.add_ons.map((addon) => {
                // Use simple quantity for add-ons with measurement_type "none" or unspecified
                const useSimpleQuantity = !addon.measurement_type || addon.measurement_type === "none";
                
                if (useSimpleQuantity && onAddOnQuantityChange) {
                  const qty = getAddOnSimpleQuantity(addon.id);
                  return (
                    <div key={addon.id} className="mb-4">
                      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                        <h5 className="text-sm font-semibold text-gray-800">
                          {addon.name}
                        </h5>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => qty > 0 && onAddOnQuantityChange(addon.id, qty - 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-purple-200 hover:bg-purple-300 text-purple-700 font-bold transition-colors"
                          >
                            −
                          </button>
                          <span className={cn(
                            "w-10 text-center text-lg font-bold",
                            qty > 0 ? "text-purple-700" : "text-gray-400"
                          )}>
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => onAddOnQuantityChange(addon.id, qty + 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-bold transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }
                
                // Use liters for other measurement types
                if (onAddOnLiterChange) {
                  return (
                    <div key={addon.id} className="mb-4">
                      <h5 className="text-sm font-semibold text-gray-800 mb-2 pr-2 border-r-2 border-purple-400">
                        {addon.name}
                      </h5>
                      <div className="grid grid-cols-4 gap-2">
                        {literSizes.map((literSize) => {
                          const qty = getAddOnQuantity(addon.id, literSize.id);
                          const isActive = qty > 0;

                          return (
                            <AddOnLiterSelector
                              key={`${addon.id}-${literSize.id}`}
                              label={literSize.label}
                              quantity={qty}
                              isActive={isActive}
                              onChange={(newQty) => onAddOnLiterChange(addon.id, literSize.id, newQty)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                
                return null;
              })}
            </div>
          )}

          {/* Notes field */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📝 הערות לסלט
            </label>
            <textarea
              value={note || ""}
              onChange={(e) => onNoteChange?.(e.target.value)}
              placeholder="הוסף הערה (למשל: בלי בצל, פחות מלח...)"
              className="w-full h-20 px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              dir="rtl"
            />
          </div>
          
          {/* Summary */}
          {(hasAnySelection || addOnsSummary || note) && (
            <div className="bg-blue-50 rounded-lg p-3 mb-4 space-y-1">
              {hasAnySelection && (
                <div className="text-blue-800 font-medium">
                  {item.name}: {selectionSummary}
                </div>
              )}
              {addOnsSummary && (
                <div className="text-purple-700 text-sm">
                  {addOnsSummary}
                </div>
              )}
              {note && (
                <div className="text-gray-600 text-sm italic">
                  הערה: {note}
                </div>
              )}
            </div>
          )}
          
          {/* Action buttons */}
          <div className="flex gap-3">
            {/* Cancel/Unselect button */}
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 h-12 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 active:scale-[0.98] transition-all"
              >
                ביטול
              </button>
            )}

            {/* Confirm button */}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 active:scale-[0.98] transition-all"
            >
              אישור
            </button>
          </div>
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

// Compact add-on liter selector
interface AddOnLiterSelectorProps {
  label: string;
  quantity: number;
  isActive: boolean;
  onChange: (quantity: number) => void;
}

function AddOnLiterSelector({ label, quantity, isActive, onChange }: AddOnLiterSelectorProps) {
  const increment = () => onChange(quantity + 1);
  const decrement = () => {
    if (quantity > 0) onChange(quantity - 1);
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-lg border px-2 py-1.5 transition-all",
        isActive
          ? "border-purple-500 bg-purple-500"
          : "border-gray-200 bg-gray-50"
      )}
    >
      <span className={cn(
        "text-xs font-bold mb-1",
        isActive ? "text-white" : "text-gray-600"
      )}>
        {label}
      </span>
      
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={decrement}
          className={cn(
            "w-5 h-5 flex items-center justify-center rounded text-xs font-bold",
            isActive 
              ? "bg-white/20 text-white" 
              : "bg-gray-200 text-gray-600"
          )}
        >
          −
        </button>
        <span className={cn(
          "w-5 text-center text-xs font-bold",
          isActive ? "text-white" : "text-gray-700"
        )}>
          {quantity}
        </span>
        <button
          type="button"
          onClick={increment}
          className={cn(
            "w-5 h-5 flex items-center justify-center rounded text-xs font-bold",
            isActive 
              ? "bg-white/20 text-white" 
              : "bg-gray-200 text-gray-600"
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

// Export types for use in OrderForm
export type { LiterQuantity, SizeQuantity, AddOnState };
