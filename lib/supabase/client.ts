import { createBrowserClient } from "@supabase/ssr";
import { parse, serialize } from "cookie";

/**
 * Cookie adapter with circuit breaker to prevent infinite refresh token loops.
 *
 * When the Supabase client has a stale refresh token, it enters a loop:
 * _callRefreshToken → 400 → _removeSession → _notifyAllSubscribers →
 * _handleTokenChanged → getSession → _callRefreshToken → 400 → repeat.
 *
 * The circuit breaker detects rapid repeated reads (>5 in 2 seconds) and
 * returns empty cookies, breaking the loop. It also clears the stale cookies.
 */
function createCookieAdapter() {
  let readCount = 0;
  let firstReadTime = 0;
  let circuitBroken = false;

  return {
    getAll() {
      if (circuitBroken) return [];

      const now = Date.now();
      if (now - firstReadTime > 2000) {
        readCount = 0;
        firstReadTime = now;
      }
      readCount++;

      if (readCount > 5) {
        // Infinite loop detected — clear stale cookies and break the circuit
        circuitBroken = true;
        document.cookie.split(';').forEach(c => {
          const name = c.split('=')[0].trim();
          if (name.includes('auth-token')) {
            document.cookie = serialize(name, '', { path: '/', maxAge: 0 });
          }
        });
        return [];
      }

      const parsed = parse(document.cookie);
      return Object.keys(parsed).map(name => ({ name, value: parsed[name] ?? '' }));
    },
    setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
      cookiesToSet.forEach(({ name, value, options }) => {
        document.cookie = serialize(name, value, options as Parameters<typeof serialize>[2]);
      });
      // A successful setAll (e.g. after login) means the circuit should reset
      if (circuitBroken && cookiesToSet.some(c => c.name.includes('auth-token') && c.value)) {
        circuitBroken = false;
        readCount = 0;
      }
    },
    /** Reset the circuit breaker (e.g. after fresh login) */
    reset() {
      circuitBroken = false;
      readCount = 0;
      firstReadTime = 0;
    },
  };
}

let cookieAdapter: ReturnType<typeof createCookieAdapter> | null = null;
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (typeof window !== 'undefined') {
    if (!browserClient) {
      cookieAdapter = createCookieAdapter();
      browserClient = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: cookieAdapter,
          isSingleton: false, // we manage the singleton ourselves
        }
      );
    }
    return browserClient;
  }

  // Fallback for SSR (shouldn't be called, but just in case)
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/** Reset the client after signOut to allow fresh login */
export function resetClient() {
  cookieAdapter?.reset();
  browserClient = null;
}
