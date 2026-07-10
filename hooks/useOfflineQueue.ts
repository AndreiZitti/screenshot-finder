'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  PendingCapture,
  getAllPendingCaptures,
  savePendingCapture,
  deletePendingCapture,
  updateCaptureStatus,
} from '@/lib/offlineStorage';
import { createDiscovery } from '@/lib/db/discoveries-dal';
import { getDB } from '@/lib/db/local-db';
import { syncUntilClean } from '@/lib/db/sync-service';

const MAX_RETRY_DELAY_MS = 60_000;
let queueDrainPromise: Promise<void> | null = null;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getLocalGeminiKey(): Promise<string | null> {
  const db = await getDB();
  const entry = await db.get('settings', 'gemini_api_key');
  return typeof entry?.value === 'string' && entry.value ? entry.value : null;
}

function nameFromTranscription(transcription: string): string {
  return transcription.length > 60 ? `${transcription.slice(0, 57)}...` : transcription;
}

export function useOfflineQueue() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCaptures, setPendingCaptures] = useState<PendingCapture[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Track online status
  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load pending captures
  const loadPending = useCallback(async () => {
    const captures = await getAllPendingCaptures();
    setPendingCaptures(captures);
    setPendingCount(captures.length);
  }, []);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  // Add a new pending capture
  const addPendingCapture = useCallback(
    async (type: 'image' | 'voice', blob: Blob, selectedType?: string) => {
      const capture: PendingCapture = {
        id: crypto.randomUUID(),
        type,
        blob,
        selectedType,
        createdAt: new Date().toISOString(),
        status: 'pending',
      };

      await savePendingCapture(capture);
      await loadPending();
      return capture.id;
    },
    [loadPending],
  );

  // Remove a pending capture
  const removePendingCapture = useCallback(
    async (id: string) => {
      await deletePendingCapture(id);
      await loadPending();
    },
    [loadPending],
  );

  // Retry a failed capture
  const retryCapture = useCallback(
    async (id: string) => {
      await updateCaptureStatus(id, 'pending');
      await loadPending();
    },
    [loadPending],
  );

  // Sync a single capture
  const syncCapture = useCallback(async (capture: PendingCapture): Promise<boolean> => {
    try {
      await updateCaptureStatus(capture.id, 'processing');
      const geminiKey = await getLocalGeminiKey();
      const headers = geminiKey ? { 'x-gemini-api-key': geminiKey } : undefined;

      if (capture.type === 'image') {
        const formData = new FormData();
        formData.append('images', capture.blob, 'offline-capture.jpg');
        formData.append('type', capture.selectedType || 'other');

        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers,
          body: formData,
        });

        if (!response.ok) throw new Error('Analysis failed');

        const data = await response.json();
        for (const result of data.results || []) {
          await createDiscovery({
            type: result.type,
            name: result.name,
            description: result.description,
            link: result.link,
            metadata: result.metadata,
            image_url: result.image_url,
            notes: null,
          });
        }
      } else {
        // Voice capture - transcribe first
        const formData = new FormData();
        formData.append('audio', capture.blob, 'recording.webm');

        const transcribeResponse = await fetch('/api/transcribe', {
          method: 'POST',
          headers,
          body: formData,
        });

        if (!transcribeResponse.ok) throw new Error('Transcription failed');

        const { transcription } = await transcribeResponse.json();

        await createDiscovery({
          type: 'note',
          name: nameFromTranscription(transcription),
          description: transcription,
          link: null,
          metadata: null,
          image_url: null,
          notes: null,
        });
      }

      await deletePendingCapture(capture.id);
      syncUntilClean().catch(() => {});
      return true;
    } catch (error) {
      console.error('Sync failed:', error);
      await updateCaptureStatus(capture.id, 'failed');
      return false;
    }
  }, []);

  const syncOnce = useCallback(async (): Promise<number> => {
    if (!navigator.onLine) return pendingCount;

    setIsSyncing(true);
    const captures = await getAllPendingCaptures();
    const retryable = captures.filter(
      (c) => c.status === 'pending' || c.status === 'failed' || c.status === 'processing',
    );

    for (const capture of retryable) {
      await syncCapture(capture);
    }

    await loadPending();
    setIsSyncing(false);
    const remaining = await getAllPendingCaptures();
    return remaining.length;
  }, [pendingCount, syncCapture, loadPending]);

  // Sync all pending captures, retrying with backoff until the queue is empty.
  const syncAll = useCallback(async () => {
    if (!isOnline) return;
    if (queueDrainPromise) {
      await queueDrainPromise;
      await loadPending();
      return;
    }

    let retryDelay = 1_000;

    queueDrainPromise = (async () => {
      while (navigator.onLine) {
        const remaining = await syncOnce();
        if (remaining === 0) break;

        await wait(retryDelay);
        retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY_MS);
      }
    })().finally(async () => {
      queueDrainPromise = null;
      await loadPending();
    });

    return queueDrainPromise;
  }, [isOnline, syncOnce, loadPending]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      syncAll();
    }
  }, [isOnline, pendingCount, syncAll]);

  return {
    isOnline,
    pendingCaptures,
    pendingCount,
    isSyncing,
    addPendingCapture,
    removePendingCapture,
    retryCapture,
    syncAll,
    refresh: loadPending,
  };
}
