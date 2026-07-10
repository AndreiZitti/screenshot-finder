'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { getDB } from '@/lib/db/local-db';
import { createClient } from '@/lib/supabase/client';

interface ApiKeysState {
  geminiApiKey: string;
  isLoading: boolean;
}

export function useApiKeys() {
  const { user, isGuest } = useAuth();
  const [state, setState] = useState<ApiKeysState>({
    geminiApiKey: '',
    isLoading: true,
  });

  // Load keys on mount
  useEffect(() => {
    async function loadKeys() {
      try {
        if (user && !isGuest) {
          // Authenticated: load from Supabase
          const supabase = createClient();
          const { data } = await supabase
            .from('user_settings')
            .select('gemini_api_key')
            .eq('user_id', user.id)
            .single();

          setState({
            geminiApiKey: data?.gemini_api_key || '',
            isLoading: false,
          });
        } else {
          // Guest: load from IndexedDB settings store
          const db = await getDB();
          const geminiEntry = await db.get('settings', 'gemini_api_key');

          setState({
            geminiApiKey: (geminiEntry?.value as string) || '',
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Failed to load API keys:', error);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    }

    loadKeys();
  }, [user, isGuest]);

  const saveGeminiApiKey = useCallback(
    async (key: string) => {
      try {
        if (user && !isGuest) {
          const supabase = createClient();
          await supabase
            .from('user_settings')
            .upsert(
              { user_id: user.id, gemini_api_key: key, updated_at: new Date().toISOString() },
              { onConflict: 'user_id' },
            );
        } else {
          const db = await getDB();
          await db.put('settings', { key: 'gemini_api_key', value: key });
        }
        setState((prev) => ({ ...prev, geminiApiKey: key }));
      } catch (error) {
        console.error('Failed to save Gemini API key:', error);
        throw error;
      }
    },
    [user, isGuest],
  );

  const hasApiKeys = Boolean(state.geminiApiKey);

  return {
    geminiApiKey: state.geminiApiKey,
    saveGeminiApiKey,
    hasApiKeys,
    isLoading: state.isLoading,
  };
}
