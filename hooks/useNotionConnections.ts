'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { NotionConnection, NotionConnectionInput } from '@/types/notion';

export function useNotionConnections() {
  const [connections, setConnections] = useState<NotionConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadConnections = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setConnections([]);
        return;
      }

      const { data, error } = await supabase
        .from('notion_connections')
        .select('*')
        .eq('user_id', session.user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Failed to load Notion connections:', error);
        return;
      }

      setConnections(data || []);
    } catch (error) {
      console.error('Failed to load Notion connections:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  const addConnection = useCallback(async (input: NotionConnectionInput) => {
    setIsSaving(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        return { success: false, error: 'Not authenticated' };
      }

      // If this is the first connection or marked as default, update others
      if (input.is_default || connections.length === 0) {
        await supabase
          .from('notion_connections')
          .update({ is_default: false })
          .eq('user_id', session.user.id);
      }

      const { data, error } = await supabase
        .from('notion_connections')
        .insert({
          user_id: session.user.id,
          name: input.name,
          api_key: input.api_key,
          page_id: input.page_id,
          page_name: input.page_name || null,
          is_default: input.is_default || connections.length === 0,
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to add Notion connection:', error);
        return { success: false, error: error.message };
      }

      await loadConnections();
      return { success: true, connection: data };
    } catch (error) {
      console.error('Failed to add Notion connection:', error);
      return { success: false, error: 'Failed to save connection' };
    } finally {
      setIsSaving(false);
    }
  }, [connections.length, loadConnections]);

  const updateConnection = useCallback(async (id: string, input: Partial<NotionConnectionInput>) => {
    setIsSaving(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        return { success: false, error: 'Not authenticated' };
      }

      // If setting as default, unset others first
      if (input.is_default) {
        await supabase
          .from('notion_connections')
          .update({ is_default: false })
          .eq('user_id', session.user.id);
      }

      const { error } = await supabase
        .from('notion_connections')
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Failed to update Notion connection:', error);
        return { success: false, error: error.message };
      }

      await loadConnections();
      return { success: true };
    } catch (error) {
      console.error('Failed to update Notion connection:', error);
      return { success: false, error: 'Failed to update connection' };
    } finally {
      setIsSaving(false);
    }
  }, [loadConnections]);

  const deleteConnection = useCallback(async (id: string) => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        return { success: false, error: 'Not authenticated' };
      }

      const deletedConnection = connections.find(c => c.id === id);
      
      const { error } = await supabase
        .from('notion_connections')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Failed to delete Notion connection:', error);
        return { success: false, error: error.message };
      }

      // If we deleted the default, make the first remaining one default
      if (deletedConnection?.is_default && connections.length > 1) {
        const remaining = connections.filter(c => c.id !== id);
        if (remaining.length > 0) {
          await supabase
            .from('notion_connections')
            .update({ is_default: true })
            .eq('id', remaining[0].id);
        }
      }

      await loadConnections();
      return { success: true };
    } catch (error) {
      console.error('Failed to delete Notion connection:', error);
      return { success: false, error: 'Failed to delete connection' };
    }
  }, [connections, loadConnections]);

  const setDefault = useCallback(async (id: string) => {
    return updateConnection(id, { is_default: true });
  }, [updateConnection]);

  const getDefault = useCallback(() => {
    return connections.find(c => c.is_default) || connections[0] || null;
  }, [connections]);

  return {
    connections,
    isLoading,
    isSaving,
    addConnection,
    updateConnection,
    deleteConnection,
    setDefault,
    getDefault,
    refresh: loadConnections,
    hasConnections: connections.length > 0,
  };
}
