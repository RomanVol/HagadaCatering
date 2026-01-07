"use client";

import { OrderForm } from "@/components/orders/OrderForm";
import Link from "next/link";
import { BarChart3, Settings } from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function OrderPage() {
  return (
    <AuthGuard>
      <div className="relative">
        {/* Quick Navigation - Mobile optimized */}
        <div className="fixed top-2 left-2 sm:top-4 sm:left-4 z-50 flex gap-1.5 sm:gap-2">
          <Link
            href="/summary"
            className="bg-white/95 backdrop-blur-sm shadow-lg rounded-full p-2 sm:p-3 hover:bg-gray-50 active:scale-95 transition-all border border-gray-200/80"
            title="סיכום הזמנות"
          >
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          </Link>
          <Link
            href="/admin"
            className="bg-white/95 backdrop-blur-sm shadow-lg rounded-full p-2 sm:p-3 hover:bg-gray-50 active:scale-95 transition-all border border-gray-200/80"
            title="ניהול"
          >
            <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
          </Link>
          <LogoutButton />
        </div>

        <OrderForm />
      </div>
    </AuthGuard>
  );
}
