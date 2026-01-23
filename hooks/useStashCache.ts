'use client';

import { useState, useEffect, useCallback } from 'react';
import { get, set } from 'idb-keyval';
import { Discovery } from '@/types/discovery';
import { Note } from '@/types/note';

const DISCOVERIES_CACHE_KEY = 'stash-discoveries-cache';
const NOTES_CACHE_KEY = 'stash-notes-cache';
const CACHE_TIMESTAMP_KEY = 'stash-cache-timestamp';
const CACHE_MAX_AGE = 1000 * 60 * 5; // 5 minutes

interface StashCache {
  discoveries: Discovery[];
  notes: Note[];
  timestamp: number;
}

interface UseStashCacheReturn {
  discoveries: Discovery[];
  notes: Note[];
  isLoading: boolean;
  isOffline: boolean;
  isCached: boolean;
  refetch: () => Promise<void>;
  removeDiscovery: (id: string) => void;
  removeNote: (id: string) => void;
}

export function useStashCache(): UseStashCacheReturn {
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [isCached, setIsCached] = useState(false);

  // Load cached data from IndexedDB
  const loadCache = useCallback(async (): Promise<StashCache | null> => {
    try {
      const [cachedDiscoveries, cachedNotes, timestamp] = await Promise.all([
        get<Discovery[]>(DISCOVERIES_CACHE_KEY),
        get<Note[]>(NOTES_CACHE_KEY),
        get<number>(CACHE_TIMESTAMP_KEY),
      ]);

      if (cachedDiscoveries && cachedNotes && timestamp) {
        return {
          discoveries: cachedDiscoveries,
          notes: cachedNotes,
          timestamp,
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to load cache:', error);
      return null;
    }
  }, []);

  // Save data to IndexedDB cache
  const saveCache = useCallback(async (newDiscoveries: Discovery[], newNotes: Note[]) => {
    try {
      await Promise.all([
        set(DISCOVERIES_CACHE_KEY, newDiscoveries),
        set(NOTES_CACHE_KEY, newNotes),
        set(CACHE_TIMESTAMP_KEY, Date.now()),
      ]);
    } catch (error) {
      console.error('Failed to save cache:', error);
    }
  }, []);

  // Fetch fresh data from API
  const fetchFromAPI = useCallback(async () => {
    const [discoveriesRes, notesRes] = await Promise.all([
      fetch('/api/discoveries'),
      fetch('/api/notes'),
    ]);

    if (!discoveriesRes.ok || !notesRes.ok) {
      throw new Error('Failed to fetch data');
    }

    const discoveriesData = await discoveriesRes.json();
    const notesData = await notesRes.json();

    return {
      discoveries: discoveriesData.discoveries || [],
      notes: notesData.notes || [],
    };
  }, []);

  // Main fetch function with cache fallback
  const refetch = useCallback(async () => {
    setIsLoading(true);

    // Try to load cache first for immediate display
    const cache = await loadCache();
    if (cache) {
      setDiscoveries(cache.discoveries);
      setNotes(cache.notes);
      setIsCached(true);
    }

    // Check if online
    if (!navigator.onLine) {
      setIsOffline(true);
      setIsLoading(false);
      return;
    }

    setIsOffline(false);

    try {
      const data = await fetchFromAPI();
      setDiscoveries(data.discoveries);
      setNotes(data.notes);
      setIsCached(false);
      await saveCache(data.discoveries, data.notes);
    } catch (error) {
      console.error('Failed to fetch from API:', error);
      // Keep cached data if available
      if (!cache) {
        setDiscoveries([]);
        setNotes([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [loadCache, fetchFromAPI, saveCache]);

  // Remove discovery from local state and cache
  const removeDiscovery = useCallback((id: string) => {
    setDiscoveries((prev) => {
      const updated = prev.filter((d) => d.id !== id);
      // Update cache in background
      get<Note[]>(NOTES_CACHE_KEY).then((cachedNotes) => {
        if (cachedNotes) {
          saveCache(updated, cachedNotes);
        }
      });
      return updated;
    });
  }, [saveCache]);

  // Remove note from local state and cache
  const removeNote = useCallback((id: string) => {
    setNotes((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      // Update cache in background
      get<Discovery[]>(DISCOVERIES_CACHE_KEY).then((cachedDiscoveries) => {
        if (cachedDiscoveries) {
          saveCache(cachedDiscoveries, updated);
        }
      });
      return updated;
    });
  }, [saveCache]);

  // Initial fetch
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      refetch();
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refetch]);

  return {
    discoveries,
    notes,
    isLoading,
    isOffline,
    isCached,
    refetch,
    removeDiscovery,
    removeNote,
  };
}
