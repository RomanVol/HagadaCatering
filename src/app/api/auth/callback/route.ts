import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = request.nextUrl;
  const code = requestUrl.searchParams.get("code");
  const redirect = requestUrl.searchParams.get("redirect") ?? "/order";

  if (!code) {
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent("missing_code")}`
    );
  }

  // Create a temporary response to exchange the code
  const tempResponse = NextResponse.next();
  const supabase = createServerSupabaseClient(request, tempResponse);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  // Check if user's email is in the allowed_emails table
  const { data: { user } } = await supabase.auth.getUser();

  console.log("Checking user email:", user?.email);

  if (user?.email) {
    const { data: allowedEmail, error: allowedError } = await supabase
      .from("allowed_emails")
      .select("email")
      .ilike("email", user.email)
      .single();

    console.log("Allowed email check:", { allowedEmail, allowedError });

    if (!allowedEmail) {
      // User not authorized - sign them out and clear ALL auth cookies
      await supabase.auth.signOut();

      const errorResponse = NextResponse.redirect(
        `${requestUrl.origin}/login?error=${encodeURIComponent("אימייל לא מורשה. אנא פנה למנהל המערכת.")}`
      );

      // Explicitly delete all Supabase auth cookies
      const cookiesToClear = [
        'sb-access-token',
        'sb-refresh-token',
        'sb-auth-token',
        'sb-127-auth-token',
        'sb-127-auth-token.0',
        'sb-127-auth-token.1',
      ];

      // Also clear any cookies that start with 'sb-'
      request.cookies.getAll().forEach((cookie) => {
        if (cookie.name.startsWith('sb-')) {
          errorResponse.cookies.set(cookie.name, '', {
            path: '/',
            maxAge: 0,
          });
        }
      });

      cookiesToClear.forEach((name) => {
        errorResponse.cookies.set(name, '', {
          path: '/',
          maxAge: 0,
        });
      });

      return errorResponse;
    }
  }

  // User is authorized - create success redirect with session cookies
  const successResponse = NextResponse.redirect(`${requestUrl.origin}${redirect}`);

  tempResponse.cookies.getAll().forEach((cookie) => {
    successResponse.cookies.set(cookie.name, cookie.value, {
      path: cookie.path,
      domain: cookie.domain,
      secure: cookie.secure,
      httpOnly: cookie.httpOnly,
      sameSite: cookie.sameSite as "lax" | "strict" | "none" | undefined,
      maxAge: cookie.maxAge,
    });
  });

  return successResponse;
}
