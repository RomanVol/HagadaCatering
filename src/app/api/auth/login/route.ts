import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
    const origin = request.nextUrl.origin;

    const cookieStore = await cookies();

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore errors in Server Components
          }
        },
      },
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/api/auth/callback`,
      },
    });

    if (error || !data?.url) {
      const msg = encodeURIComponent(error?.message ?? "login_error");
      return NextResponse.redirect(`${origin}/login?error=${msg}`);
    }

    return NextResponse.redirect(data.url);
  } catch (error) {
    console.error("OAuth login error:", error);
    return NextResponse.json(
      { error: "login_failed", message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
