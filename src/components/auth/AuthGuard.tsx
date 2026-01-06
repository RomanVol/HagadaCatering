"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // Check for test mode authentication (for Playwright tests)
      const isTestMode = typeof window !== 'undefined' && localStorage.getItem('mock-auth') === 'true';

      if (isTestMode) {
        setIsAuthenticated(true);
        setIsChecking(false);
        return;
      }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Not authenticated, use hard redirect to trigger middleware
        window.location.href = `/login?redirect=${encodeURIComponent(pathname)}`;
        return;
      } else {
        setIsAuthenticated(true);
      }
      setIsChecking(false);
    };

    checkAuth();

    // Check for test mode - skip auth state listener in test mode
    const isTestMode = typeof window !== 'undefined' && localStorage.getItem('mock-auth') === 'true';
    if (isTestMode) {
      return;
    }

    // Listen for auth state changes
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        // Hard redirect to ensure proper auth check
        window.location.href = "/login";
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
