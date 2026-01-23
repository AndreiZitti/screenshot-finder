'use client';

import { useState, useCallback } from 'react';
import { useNotionConnections } from './useNotionConnections';
import type { NotionConnection } from '@/types/notion';

type SendStatus = 'idle' | 'sending' | 'success' | 'error';

interface SendToNotionOptions {
  type: 'discovery' | 'note';
  name?: string;
  description?: string;
  transcription?: string;
  link?: string;
  connectionId?: string; // Optional: specify which connection to use
}

export function useSendToNotion() {
  const { connections, getDefault, hasConnections } = useNotionConnections();
  const [status, setStatus] = useState<SendStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(async (options: SendToNotionOptions) => {
    // Find the connection to use
    let connection: NotionConnection | null = null;
    
    if (options.connectionId) {
      connection = connections.find(c => c.id === options.connectionId) || null;
    } else {
      connection = getDefault();
    }

    if (!connection) {
      setStatus('error');
      setError('No Notion connection configured');
      return { success: false, error: 'No Notion connection configured' };
    }

    setStatus('sending');
    setError(null);

    try {
      const response = await fetch('/api/notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...options,
          credentials: {
            apiKey: connection.api_key,
            pageId: connection.page_id,
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        setStatus('success');
        // Reset to idle after 2 seconds
        setTimeout(() => setStatus('idle'), 2000);
        return { success: true };
      } else {
        setStatus('error');
        setError(result.error || 'Failed to send to Notion');
        return { success: false, error: result.error };
      }
    } catch (err) {
      setStatus('error');
      const message = err instanceof Error ? err.message : 'Failed to send to Notion';
      setError(message);
      return { success: false, error: message };
    }
  }, [connections, getDefault]);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
  }, []);

  return {
    send,
    status,
    error,
    reset,
    isConfigured: hasConnections,
    connections, // Expose connections for UI to show picker
    defaultConnection: getDefault(),
  };
}
