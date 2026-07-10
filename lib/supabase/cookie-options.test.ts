import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAuthCookieOptions } from './cookie-options';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('auth cookie options', () => {
  it('uses host-only cookies by default', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_COOKIE_DOMAIN', '');

    expect(getAuthCookieOptions()).toEqual({
      path: '/',
      sameSite: 'lax',
      secure: false,
    });
  });

  it('supports an explicit shared production domain', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_COOKIE_DOMAIN', '.example.com');

    expect(getAuthCookieOptions()).toEqual({
      path: '/',
      sameSite: 'lax',
      secure: true,
      domain: '.example.com',
    });
  });
});
