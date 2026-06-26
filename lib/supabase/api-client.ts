import { NextRequest } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient as createCookieClient } from './server';

export async function createClientFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (bearerToken) {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${bearerToken}` } },
        db: { schema: 'stash' },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    return { supabase, user };
  }

  const supabase = await createCookieClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export function isExternalRequest(request: NextRequest): boolean {
  return request.headers.has('authorization');
}
