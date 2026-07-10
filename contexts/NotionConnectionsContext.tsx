'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useNotionConnectionsState } from '@/hooks/useNotionConnections';

type NotionConnectionsValue = ReturnType<typeof useNotionConnectionsState>;

const NotionConnectionsContext = createContext<NotionConnectionsValue | null>(null);

export function NotionConnectionsProvider({ children }: { children: ReactNode }) {
  const value = useNotionConnectionsState();

  return (
    <NotionConnectionsContext.Provider value={value}>{children}</NotionConnectionsContext.Provider>
  );
}

export function useNotionConnections(): NotionConnectionsValue {
  const context = useContext(NotionConnectionsContext);
  if (!context) {
    throw new Error('useNotionConnections must be used within NotionConnectionsProvider');
  }
  return context;
}
