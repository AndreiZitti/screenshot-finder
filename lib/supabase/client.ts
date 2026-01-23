import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// Extend window to store singleton client
declare global {
  interface Window {
    __supabaseClient: SupabaseClient | undefined;
  }
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
