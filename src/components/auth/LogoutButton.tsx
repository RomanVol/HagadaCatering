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
      className="inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-full bg-gray-800/95 backdrop-blur-sm text-white px-3 py-2 sm:px-4 text-xs sm:text-sm font-semibold shadow-lg hover:bg-gray-900 active:scale-95 transition-all min-h-[36px] sm:min-h-[44px] min-w-[36px] sm:min-w-auto"
    >
      <LogOut className="w-4 h-4" />
      <span className="hidden xs:inline sm:inline">יציאה</span>
    </button>
  );
}
