import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const cookieOptions = {
  path: '/',
  domain: '.zitti.ro',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production'
};

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: 'stash' },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, { ...options, ...cookieOptions })
          );
        },
      },
    }
  );

  // Refresh session if expired - this also validates the session
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Stale auth cookies: getUser() failed but auth cookies exist
  // Clear them and redirect to login so the user can sign in fresh
  if (error && !user) {
    const hasAuthCookies = request.cookies.getAll().some(c => c.name.includes('auth-token'));
    if (hasAuthCookies) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      const response = request.nextUrl.pathname === '/login'
        ? NextResponse.next({ request })
        : NextResponse.redirect(url);
      // Delete all Supabase auth cookies
      request.cookies.getAll().forEach(cookie => {
        if (cookie.name.includes('auth-token')) {
          response.cookies.delete(cookie.name);
        }
      });
      return response;
    }
  }

  // Redirect logged-in users away from login page
  if (request.nextUrl.pathname === "/login" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
