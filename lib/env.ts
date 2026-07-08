/**
 * Environment variable validation
 * Validates required environment variables at build/startup time
 */

import { createClient } from '@/lib/supabase/server';

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

const optionalEnvVars = [
  'GEMINI_API_KEY',
  'NOTION_API_KEY',
  'NOTION_PAGE_ID',
] as const;

type RequiredEnvVar = typeof requiredEnvVars[number];
type OptionalEnvVar = typeof optionalEnvVars[number];

interface EnvConfig {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  GEMINI_API_KEY?: string;
  NOTION_API_KEY?: string;
  NOTION_PAGE_ID?: string;
}

function validateEnv(): EnvConfig {
  const missingVars: string[] = [];

  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missingVars.map(v => `  - ${v}`).join('\n')}\n\nPlease check your .env.local file.`
    );
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    NOTION_API_KEY: process.env.NOTION_API_KEY,
    NOTION_PAGE_ID: process.env.NOTION_PAGE_ID,
  };
}

// Validate on module load (server-side only)
let env: EnvConfig | null = null;

export function getEnv(): EnvConfig {
  if (!env) {
    env = validateEnv();
  }
  return env;
}

export function getGeminiApiKey(): string | undefined {
  return getEnv().GEMINI_API_KEY;
}

export function getSupabaseConfig() {
  const config = getEnv();
  return {
    url: config.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: config.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

export function getNotionConfig() {
  const config = getEnv();
  return {
    apiKey: config.NOTION_API_KEY,
    pageId: config.NOTION_PAGE_ID,
  };
}

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
