import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        // Must match middleware cookie options — without `secure`, the client
        // can't delete Secure cookies set by middleware, causing stale tokens
        // to persist and trigger infinite refresh loops.
        secure: process.env.NODE_ENV === 'production',
      },
    }
  );
}
