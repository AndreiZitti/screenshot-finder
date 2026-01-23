'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface NotionSettings {
  apiKey: string;
  pageId: string;
}

const STORAGE_KEY = 'notion_settings';

export function useNotionSettings() {
  const [settings, setSettings] = useState<NotionSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      // First check localStorage
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
        setIsLoading(false);
        return;
      }

      // Fall back to Supabase
      const supabase = createClient();
      // Use getSession() instead of getUser() to avoid triggering token refresh
      // The middleware handles token refresh; client should use cached session
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      
      if (user) {
        const { data } = await supabase
          .from('user_settings')
          .select('notion_api_key, notion_page_id')
          .eq('user_id', user.id)
          .single();
        
        if (data?.notion_api_key && data?.notion_page_id) {
          const loadedSettings = {
            apiKey: data.notion_api_key,
            pageId: data.notion_page_id,
          };
          setSettings(loadedSettings);
          // Cache to localStorage
          localStorage.setItem(STORAGE_KEY, JSON.stringify(loadedSettings));
        }
      }
    } catch (error) {
      console.error('Failed to load Notion settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = useCallback(async (newSettings: NotionSettings) => {
    setIsSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);

      // Also save to Supabase for cross-device sync
      const supabase = createClient();
      // Use getSession() instead of getUser() to avoid triggering token refresh
      // The middleware handles token refresh; client should use cached session
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      
      if (user) {
        await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            notion_api_key: newSettings.apiKey,
            notion_page_id: newSettings.pageId,
            updated_at: new Date().toISOString(),
          });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to save Notion settings:', error);
      return { success: false, error: 'Failed to save settings' };
    } finally {
      setIsSaving(false);
    }
  }, []);

  const clearSettings = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEY);
    setSettings(null);
    
    const supabase = createClient();
    // Use getSession() instead of getUser() to avoid triggering token refresh
    // The middleware handles token refresh; client should use cached session
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    
    if (user) {
      await supabase
        .from('user_settings')
        .delete()
        .eq('user_id', user.id);
    }
  }, []);

  return {
    settings,
    isLoading,
    isSaving,
    saveSettings,
    clearSettings,
    hasSettings: !!settings,
  };
}
