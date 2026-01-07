import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  const requestUrl = request.nextUrl;
  const code = requestUrl.searchParams.get("code");
  const redirectPath = requestUrl.searchParams.get("redirect") ?? "/order";

  if (!code) {
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent("missing_code")}`
    );
  }

  // Create the response first - cookies will be set on this response
  const redirectUrl = `${requestUrl.origin}${redirectPath}`;
  const response = NextResponse.redirect(redirectUrl);

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options as CookieOptions);
        });
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email) {
    const { data: allowedEmail } = await supabase
      .from("allowed_emails")
      .select("email")
      .ilike("email", user.email)
      .single();

    if (!allowedEmail) {
      // User not authorized - sign them out and redirect to login
      await supabase.auth.signOut();

      const errorResponse = NextResponse.redirect(
        `${requestUrl.origin}/login?error=${encodeURIComponent("אימייל לא מורשה. אנא פנה למנהל המערכת.")}`
      );

      // Clear auth cookies
      request.cookies.getAll().forEach((cookie) => {
        if (cookie.name.startsWith("sb-")) {
          errorResponse.cookies.set(cookie.name, "", { maxAge: 0, path: "/" });
        }
      });

      return errorResponse;
    }
  }

  // User is authorized - return response with session cookies
  return response;
}
