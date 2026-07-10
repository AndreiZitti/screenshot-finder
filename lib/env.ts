/** Resolve server-side credentials with per-user settings taking precedence. */

import { createClient } from '@/lib/supabase/server';

/**
 * Resolve Gemini API key: user's key from DB > env var > null
 */
export async function resolveGeminiKey(userId?: string): Promise<string | null> {
  if (userId) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from('user_settings')
        .select('gemini_api_key')
        .eq('user_id', userId)
        .single();

      if (data?.gemini_api_key) {
        return data.gemini_api_key;
      }
    } catch {
      // Fall through to env var
    }
  }

  return process.env.GEMINI_API_KEY || null;
}
