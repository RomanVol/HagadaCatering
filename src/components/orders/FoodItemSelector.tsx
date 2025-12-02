"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { FoodItem } from "@/types";
import { Check } from "lucide-react";

interface FoodItemCardProps {
  item: FoodItem;
  selected: boolean;
  quantity: number;
  onSelect: () => void;
}

export function FoodItemCard({
  item,
  selected,
  quantity,
  onSelect,
}: FoodItemCardProps) {
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
      
      {/* Item name */}
      <span className={cn(
        "text-sm font-semibold leading-tight",
        selected ? "text-blue-900" : "text-gray-800"
      )}>
        {item.name}
      </span>
      
      {/* Quantity display */}
      {selected && quantity > 0 && (
        <span className="text-lg text-blue-600 mt-1 font-bold">
          × {quantity}
        </span>
      )}
      
      {/* Indicator when selected but no quantity */}
      {selected && quantity === 0 && (
        <span className="text-xs text-orange-500 mt-1">
          בחר כמות
        </span>
      )}
    </button>
  );
}

// Popup Modal for selecting quantity
interface FoodItemPopupProps {
  item: FoodItem;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onClose: () => void;
}

export function FoodItemPopup({
  item,
  quantity,
  onQuantityChange,
  onClose,
}: FoodItemPopupProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      onQuantityChange(0);
    } else {
      const num = parseInt(value, 10);
      if (!isNaN(num) && num >= 0) {
        onQuantityChange(num);
      }
    }
  };

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
          
          {/* Quantity selector */}
          <div className="flex flex-col items-center gap-4 mb-6">
            <span className="text-gray-600">בחר כמות:</span>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => quantity > 0 && onQuantityChange(quantity - 1)}
                className="w-14 h-14 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-2xl font-bold transition-colors"
              >
                −
              </button>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={handleInputChange}
                className="text-4xl font-bold w-24 text-center border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none py-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => onQuantityChange(quantity + 1)}
                className="w-14 h-14 flex items-center justify-center rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-2xl font-bold transition-colors"
              >
                +
              </button>
            </div>
          </div>
          
          {/* Quick quantity buttons */}
          <div className="flex justify-center gap-2 mb-6">
            {[1, 5, 10, 20, 50].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => onQuantityChange(num)}
                className={cn(
                  "px-4 py-2 rounded-lg font-medium transition-colors",
                  quantity === num
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                )}
              >
                {num}
              </button>
            ))}
          </div>
          
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
