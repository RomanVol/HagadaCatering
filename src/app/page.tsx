"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function Home() {
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      // Check if user's email is in allowed_emails table
      const { data: allowedEmail } = await supabase
        .from("allowed_emails")
        .select("email")
        .ilike("email", user.email || "")
        .single();

      if (!allowedEmail) {
        // User not authorized - sign them out
        await supabase.auth.signOut();
        window.location.href = "/login?error=" + encodeURIComponent("אימייל לא מורשה. אנא פנה למנהל המערכת.");
        return;
      }

      window.location.href = "/order";
    };

    checkAuthAndRedirect();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    </div>
  );
}
