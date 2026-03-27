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
        // Stale/invalid refresh token — sign out to clear cookies
        supabase.auth.signOut();
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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setState({ user: session.user, isGuest: false, isLoading: false });

        // Trigger sync after sign-in
        try {
          const { fullSync } = await import('@/lib/db/sync-service');
          fullSync();
        } catch {
          // sync-service may not exist yet; ignore
        }
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
