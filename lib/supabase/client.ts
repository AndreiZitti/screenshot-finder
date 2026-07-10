import { createBrowserClient } from '@supabase/ssr';
import { getAuthCookieOptions } from '@/lib/supabase/cookie-options';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: 'stash' },
      cookieOptions: getAuthCookieOptions(),
    },
  );
}
