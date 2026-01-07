import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const PUBLIC_PATHS = ["/login", "/favicon.ico"];

function isPublicPath(pathname: string) {
  return (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next")
  );
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Handle OAuth callback at root level (Supabase redirects here with ?code=)
  const code = searchParams.get("code");
  console.log("[MIDDLEWARE] Path:", pathname, "Code:", code ? "present" : "none");

  if (code) {
    console.log("[MIDDLEWARE] Redirecting to callback handler");
    // Redirect to our callback handler
    const callbackUrl = new URL("/api/auth/callback", request.url);
    callbackUrl.searchParams.set("code", code);
    callbackUrl.searchParams.set("redirect", "/order");
    return NextResponse.redirect(callbackUrl);
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  // Prevent caching of protected pages
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  const supabase = createServerSupabaseClient(request, response);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Check if user's email is in allowed_emails table
  console.log("[MIDDLEWARE] User found:", user.email);

  if (user.email) {
    const { data: allowedEmail, error: queryError } = await supabase
      .from("allowed_emails")
      .select("email")
      .ilike("email", user.email)
      .single();

    console.log("[MIDDLEWARE] Allowed check:", { allowedEmail, queryError });

    if (!allowedEmail) {
      // User not authorized - sign them out and redirect to login
      await supabase.auth.signOut();
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("error", "אימייל לא מורשה. אנא פנה למנהל המערכת.");
      const redirectResponse = NextResponse.redirect(redirectUrl);

      // Clear all Supabase auth cookies
      request.cookies.getAll().forEach((cookie) => {
        if (cookie.name.startsWith('sb-')) {
          redirectResponse.cookies.set(cookie.name, '', {
            path: '/',
            maxAge: 0,
          });
        }
      });

      return redirectResponse;
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     */
    "/",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
