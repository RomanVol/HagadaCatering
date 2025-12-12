import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const origin = request.nextUrl.origin;
    const redirect = request.nextUrl.searchParams.get("redirect") ?? "/order";

    // Create a temporary response to collect cookies
    const tempResponse = NextResponse.next();
    const supabase = createServerSupabaseClient(request, tempResponse);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/api/auth/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    });

    if (error || !data?.url) {
      const msg = encodeURIComponent(error?.message ?? "login_error");
      return NextResponse.redirect(`${origin}/login?error=${msg}`);
    }

    // Create redirect response and copy cookies from temp response
    const redirectResponse = NextResponse.redirect(data.url);

    // Copy all cookies (including PKCE code_verifier) to the redirect response
    tempResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        path: cookie.path,
        domain: cookie.domain,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite as "lax" | "strict" | "none" | undefined,
        maxAge: cookie.maxAge,
      });
    });

    return redirectResponse;
  } catch (error) {
    console.error("OAuth login error:", error);
    return NextResponse.json(
      { error: "login_failed", message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
