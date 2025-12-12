"use client";

import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const handleLogout = async () => {
    const supabase = createClient();
    // Clear browser session first
    await supabase.auth.signOut();
    // Clear server cookies via POST request
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    // Redirect to login page
    window.location.href = "/login";
  };

  return (
    <button
      onClick={handleLogout}
      className="inline-flex items-center gap-2 rounded-full bg-gray-800 text-white px-4 py-2 text-sm font-semibold shadow-sm hover:bg-gray-900 transition-colors"
    >
      <LogOut className="w-4 h-4" />
      יציאה
    </button>
  );
}
