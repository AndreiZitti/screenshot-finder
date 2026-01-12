'use client';

import { useState, useCallback } from 'react';
import { useNotionSettings } from './useNotionSettings';

type SendStatus = 'idle' | 'sending' | 'success' | 'error';

interface SendToNotionOptions {
  type: 'discovery' | 'note';
  name?: string;
  description?: string;
  transcription?: string;
  link?: string;
}

export function useSendToNotion() {
  const { settings } = useNotionSettings();
  const [status, setStatus] = useState<SendStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(async (options: SendToNotionOptions) => {
    setStatus('sending');
    setError(null);

    try {
      const response = await fetch('/api/notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...options,
          credentials: settings,
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
  }, [settings]);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
  }, []);

  return {
    send,
    status,
    error,
    reset,
    isConfigured: !!settings,
  };
}
