'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  PendingCapture,
  getAllPendingCaptures,
  savePendingCapture,
  deletePendingCapture,
  updateCaptureStatus,
} from '@/lib/offlineStorage';

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
    [loadPending]
  );

  // Remove a pending capture
  const removePendingCapture = useCallback(
    async (id: string) => {
      await deletePendingCapture(id);
      await loadPending();
    },
    [loadPending]
  );

  // Retry a failed capture
  const retryCapture = useCallback(
    async (id: string) => {
      await updateCaptureStatus(id, 'pending');
      await loadPending();
    },
    [loadPending]
  );

  // Sync a single capture
  const syncCapture = useCallback(
    async (capture: PendingCapture): Promise<boolean> => {
      try {
        await updateCaptureStatus(capture.id, 'processing');

        if (capture.type === 'image') {
          const formData = new FormData();
          formData.append('images', capture.blob, 'offline-capture.jpg');
          formData.append('type', capture.selectedType || 'other');

          const response = await fetch('/api/analyze', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) throw new Error('Analysis failed');
        } else {
          // Voice capture - transcribe first
          const formData = new FormData();
          formData.append('audio', capture.blob, 'recording.webm');

          const transcribeResponse = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });

          if (!transcribeResponse.ok) throw new Error('Transcription failed');

          const { transcription } = await transcribeResponse.json();

          // Save as note
          const noteResponse = await fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcription }),
          });

          if (!noteResponse.ok) throw new Error('Failed to save note');
        }

        await deletePendingCapture(capture.id);
        return true;
      } catch (error) {
        console.error('Sync failed:', error);
        await updateCaptureStatus(capture.id, 'failed');
        return false;
      }
    },
    []
  );

  // Sync all pending captures
  const syncAll = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    const captures = await getAllPendingCaptures();
    const pendingOnly = captures.filter((c) => c.status === 'pending');

    for (const capture of pendingOnly) {
      await syncCapture(capture);
    }

    await loadPending();
    setIsSyncing(false);
  }, [isOnline, isSyncing, syncCapture, loadPending]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      syncAll();
    }
  }, [isOnline]); // eslint-disable-line react-hooks/exhaustive-deps

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
