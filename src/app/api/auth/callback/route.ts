import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  const requestUrl = request.nextUrl;
  const code = requestUrl.searchParams.get("code");
  const redirect = requestUrl.searchParams.get("redirect") ?? "/order";

  if (!code) {
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent("missing_code")}`
    );
  }

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
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing sessions.
        }
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[CALLBACK] Exchange error:", error.message);
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  // Check if user's email is in the allowed_emails table
  const { data: { user } } = await supabase.auth.getUser();

  console.log("[CALLBACK] User email:", user?.email);

  if (user?.email) {
    const { data: allowedEmail, error: allowedError } = await supabase
      .from("allowed_emails")
      .select("email")
      .ilike("email", user.email)
      .single();

    console.log("[CALLBACK] Allowed check:", { allowedEmail, allowedError });

    if (!allowedEmail) {
      // User not authorized - sign them out
      await supabase.auth.signOut();
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=${encodeURIComponent("אימייל לא מורשה. אנא פנה למנהל המערכת.")}`
      );
    }
  }

  // User is authorized - redirect to requested page
  return NextResponse.redirect(`${requestUrl.origin}${redirect}`);
}
