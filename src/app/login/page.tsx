"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LogIn, ShieldCheck, Loader2 } from "lucide-react";

function LoginContent() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const errorMessage = searchParams.get("error");
  const redirectPath = useMemo(
    () => searchParams.get("redirect") ?? "/order",
    [searchParams]
  );

  const handleLogin = useCallback(() => {
    setIsLoading(true);
    const redirect = encodeURIComponent(redirectPath);
    window.location.href = `/api/auth/login?redirect=${redirect}`;
  }, [redirectPath]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center px-4">
      <div className="w-full max-w-3xl bg-white/80 backdrop-blur-xl shadow-xl rounded-3xl border border-gray-200 overflow-hidden">
        <div className="grid md:grid-cols-2">
          <div className="p-10 flex flex-col gap-6 bg-gradient-to-b from-white to-primary-50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-primary-100 border border-primary-500/30 flex items-center justify-center text-primary-700">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">מערכת ניהול הזמנות</p>
                <h1 className="text-2xl font-semibold text-gray-900">כניסה מאובטחת</h1>
              </div>
            </div>

            <p className="text-gray-600 leading-relaxed">
              התחברו עם חשבון Google כדי לגשת למערכת ההזמנות, לעדכן פריטים ולראות סטטוסים בזמן אמת.
            </p>

            <div className="grid gap-3 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <LogIn className="w-4 h-4 text-primary-600" />
                <span>כניסה מהירה עם OAuth של Google</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary-600" />
                <span>סשן מאובטח באמצעות Supabase Auth</span>
              </div>
            </div>
          </div>

          <div className="p-10 flex flex-col gap-6 border-t md:border-t-0 md:border-r border-gray-200 bg-white">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900">התחברות</h2>
              <p className="text-gray-600 text-sm">
                לחצו על הכפתור כדי להתחבר עם Google.
              </p>
            </div>

            {errorMessage ? (
              <div className="rounded-xl border border-red-200 bg-error-50 text-error-600 px-4 py-3 text-sm">
                שגיאת התחברות: {decodeURIComponent(errorMessage)}
              </div>
            ) : null}

            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-3 rounded-xl bg-blue-600 text-white px-6 py-4 text-base font-semibold shadow-md hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
              התחברו עם Google
            </button>

            <p className="text-xs text-gray-500">
              בהתחברות אתם מאשרים שימוש ב-Supabase Auth והגדרת עוגיות סשן בדפדפן.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center px-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </main>
    }>
      <LoginContent />
    </Suspense>
  );
}
