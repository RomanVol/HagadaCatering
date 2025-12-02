"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

export function QuantityStepper({
  value,
  onChange,
  min = 0,
  max = 999,
  className,
}: QuantityStepperProps) {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <button
        type="button"
        onClick={handleDecrement}
        disabled={value <= min}
        className={cn(
          "h-10 w-10 flex items-center justify-center rounded-lg border border-gray-300 bg-white",
          "hover:bg-gray-50 active:bg-gray-100 transition-colors",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        <Minus className="h-4 w-4" />
      </button>
      <div className="h-10 w-12 flex items-center justify-center text-lg font-medium">
        {value}
      </div>
      <button
        type="button"
        onClick={handleIncrement}
        disabled={value >= max}
        className={cn(
          "h-10 w-10 flex items-center justify-center rounded-lg border border-gray-300 bg-white",
          "hover:bg-gray-50 active:bg-gray-100 transition-colors",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
