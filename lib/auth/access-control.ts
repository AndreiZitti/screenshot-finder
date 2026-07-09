import type { User } from '@supabase/supabase-js';

function parseAllowedEmails(): string[] {
  return (process.env.APP_ALLOWED_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAccessControlEnforced(): boolean {
  return process.env.NODE_ENV === 'production' || parseAllowedEmails().length > 0;
}

export function isAllowedEmail(email?: string | null): boolean {
  const allowedEmails = parseAllowedEmails();

  if (allowedEmails.length === 0) {
    return process.env.NODE_ENV !== 'production';
  }

  return Boolean(email && allowedEmails.includes(email.toLowerCase()));
}

export function isAllowedUser(user?: Pick<User, 'email'> | null): boolean {
  return isAllowedEmail(user?.email);
}
