import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Create a JSON response (not redirect) to avoid service worker issues
  const response = NextResponse.json({ success: true });
  const supabase = createServerSupabaseClient(request, response);

  // Sign out from Supabase
  await supabase.auth.signOut();

  // Explicitly clear all Supabase auth cookies to ensure complete logout
  const cookiesToClear = request.cookies.getAll()
    .filter(cookie =>
      cookie.name.startsWith('sb-') ||
      cookie.name.includes('supabase') ||
      cookie.name.includes('auth')
    );

  for (const cookie of cookiesToClear) {
    response.cookies.set(cookie.name, '', {
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });
  }

  return response;
}
