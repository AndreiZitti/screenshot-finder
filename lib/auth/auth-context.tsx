'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  isGuest: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isGuest: false,
    isLoading: true,
  });

  useEffect(() => {
    const supabase = createClient();

    // Check initial session
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error) {
        // Stale/invalid refresh token — clear local session only (no API call)
        supabase.auth.signOut({ scope: 'local' });
        setState({ user: null, isGuest: true, isLoading: false });
        return;
      }
      if (user) {
        setState({ user, isGuest: false, isLoading: false });
      } else {
        setState({ user: null, isGuest: true, isLoading: false });
      }
    });

    // Listen for auth state changes
    // IMPORTANT: Do NOT call async Supabase methods directly inside this callback.
    // It runs while an auth lock is held, causing deadlocks (auth-js#762).
    // Use setTimeout to defer any async work.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setState({ user: session.user, isGuest: false, isLoading: false });

        // Defer sync to avoid deadlock — this callback runs inside an auth lock
        setTimeout(() => {
          import('@/lib/db/sync-service')
            .then(({ fullSync }) => fullSync())
            .catch(() => {});
        }, 0);
      } else if (event === 'SIGNED_OUT') {
        setState({ user: null, isGuest: true, isLoading: false });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
