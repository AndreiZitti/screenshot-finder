'use client';

import { useState, useEffect, useCallback } from 'react';
import { Discovery } from '@/types/discovery';
import { Link } from '@/types/link';
import {
  getAllDiscoveries,
  deleteDiscovery as deleteLocalDiscovery,
} from '@/lib/db/discoveries-dal';
import { getAllLinks, deleteLink as deleteLocalLink } from '@/lib/db/links-dal';

interface UseStashCacheReturn {
  discoveries: Discovery[];
  links: Link[];
  isLoading: boolean;
  isOffline: boolean;
  refetch: () => Promise<void>;
  removeDiscovery: (id: string) => void;
  removeLink: (id: string) => void;
}

export function useStashCache(): UseStashCacheReturn {
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  // Load all data from local IndexedDB
  const loadFromLocal = useCallback(async () => {
    try {
      const [localDiscoveries, localLinks] = await Promise.all([
        getAllDiscoveries(false),
        getAllLinks(false),
      ]);
      setDiscoveries(localDiscoveries);
      setLinks(localLinks);
    } catch (error) {
      console.error('Failed to load from local DB:', error);
      setDiscoveries([]);
      setLinks([]);
    }
  }, []);

  // Main fetch: load from local DB (source of truth)
  const refetch = useCallback(async () => {
    setIsLoading(true);
    setIsOffline(!navigator.onLine);
    await loadFromLocal();
    setIsLoading(false);
  }, [loadFromLocal]);

  // Remove discovery from local DB and state
  const removeDiscovery = useCallback((id: string) => {
    deleteLocalDiscovery(id).then(() => {
      setDiscoveries((prev) => prev.filter((d) => d.id !== id));
    });
  }, []);

  // Remove link from local DB and state
  const removeLink = useCallback((id: string) => {
    deleteLocalLink(id).then(() => {
      setLinks((prev) => prev.filter((l) => l.id !== id));
    });
  }, []);

  // Initial load
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
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
  }, []);

  return {
    discoveries,
    links,
    isLoading,
    isOffline,
    refetch,
    removeDiscovery,
    removeLink,
  };
}
