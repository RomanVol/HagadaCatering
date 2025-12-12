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
        {/* Quick Navigation */}
        <div className="fixed top-4 left-4 z-50 flex gap-2">
          <Link
            href="/summary"
            className="bg-white shadow-lg rounded-full p-3 hover:bg-gray-50 transition-colors border border-gray-200"
            title="סיכום הזמנות"
          >
            <BarChart3 className="w-6 h-6 text-blue-600" />
          </Link>
          <Link
            href="/admin"
            className="bg-white shadow-lg rounded-full p-3 hover:bg-gray-50 transition-colors border border-gray-200"
            title="ניהול"
          >
            <Settings className="w-6 h-6 text-gray-600" />
          </Link>
          <LogoutButton />
        </div>

        <OrderForm />
      </div>
    </AuthGuard>
  );
}
