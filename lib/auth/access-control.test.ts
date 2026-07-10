import { afterEach, describe, expect, it, vi } from 'vitest';
import { isAccessControlEnforced, isAllowedEmail, isAllowedUser } from './access-control';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('access control', () => {
  it('allows guest access in development when no allowlist is configured', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('APP_ALLOWED_EMAILS', '');

    expect(isAccessControlEnforced()).toBe(false);
    expect(isAllowedEmail(null)).toBe(true);
  });

  it('matches allowlisted emails case-insensitively', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('APP_ALLOWED_EMAILS', 'Owner@Example.com, teammate@example.com');

    expect(isAccessControlEnforced()).toBe(true);
    expect(isAllowedEmail('owner@example.com')).toBe(true);
    expect(isAllowedUser({ email: 'TEAMMATE@example.com' })).toBe(true);
    expect(isAllowedEmail('other@example.com')).toBe(false);
  });

  it('fails closed in production when no allowlist is configured', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('APP_ALLOWED_EMAILS', '');

    expect(isAccessControlEnforced()).toBe(true);
    expect(isAllowedEmail('owner@example.com')).toBe(false);
  });
});
