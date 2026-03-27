import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// Extend window to store singleton client
declare global {
  interface Window {
    __supabaseClient: SupabaseClient | undefined;
  }
}

/**
 * Clear all Supabase auth cookies directly from the browser.
 * Used as a fallback when signOut({ scope: 'local' }) may not
 * fully clear cookies (e.g. during stale refresh token recovery).
 */
export function clearSupabaseCookies() {
  if (typeof document === 'undefined') return;
  document.cookie.split(';').forEach(cookie => {
    const name = cookie.split('=')[0].trim();
    if (name.includes('auth-token')) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
  });
}

export function createClient() {
  // Return singleton instance to prevent multiple clients with inconsistent token state
  if (typeof window !== 'undefined') {
    if (!window.__supabaseClient) {
      window.__supabaseClient = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
    }
    return window.__supabaseClient;
  }

  // Fallback for SSR (shouldn't be called, but just in case)
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
