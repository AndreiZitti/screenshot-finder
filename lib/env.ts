/**
 * Environment variable validation
 * Validates required environment variables at build/startup time
 */

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'GROQ_API_KEY',
  'GEMINI_API_KEY',
] as const;

const optionalEnvVars = [
  'NOTION_API_KEY',
  'NOTION_PAGE_ID',
] as const;

type RequiredEnvVar = typeof requiredEnvVars[number];
type OptionalEnvVar = typeof optionalEnvVars[number];

interface EnvConfig {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  GROQ_API_KEY: string;
  GEMINI_API_KEY: string;
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
    GROQ_API_KEY: process.env.GROQ_API_KEY!,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY!,
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

// For use in API routes to get validated env vars
export function getGroqApiKey(): string {
  return getEnv().GROQ_API_KEY;
}

export function getGeminiApiKey(): string {
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
