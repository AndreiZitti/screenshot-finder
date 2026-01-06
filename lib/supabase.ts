import { createClient as createServerClient } from '@/lib/supabase/server';

// For API routes - creates authenticated server client
export async function getSupabase() {
  return await createServerClient();
}

// Wrapper for backwards compatibility with existing API routes
// Note: This uses a simple client without auth for basic operations
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

function getSimpleClient(): SupabaseClient {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClient;
}

export const supabase = {
  from: (table: string) => getSimpleClient().from(table),
};
