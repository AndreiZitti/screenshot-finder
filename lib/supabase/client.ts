import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        // The auth cookie is set with domain .zitti.ro (shared across subdomains).
        // Without specifying the domain here, cookie deletion targets only the
        // current hostname (stash.zitti.ro) and silently fails, causing stale
        // tokens to persist and trigger infinite refresh loops.
        domain: '.zitti.ro',
        secure: process.env.NODE_ENV === 'production',
      },
    }
  );
}
