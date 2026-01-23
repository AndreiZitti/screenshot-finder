'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Discovery, DiscoveryType, DISCOVERY_TYPES, DISCOVERY_TYPE_LABELS } from '@/types/discovery';
import { Note } from '@/types/note';
import DiscoveryCard from '@/components/DiscoveryCard';
import NoteCard from '@/components/NoteCard';
import { useStashCache } from '@/hooks/useStashCache';

const TYPE_ICONS: Record<DiscoveryType, string> = {
  series: '📺',
  api_library: '📦',
  ai_tip: '🤖',
  gadget: '🔌',
  other: '📌',
};

type FilterType = 'all' | 'notes' | DiscoveryType;

type StashItem = 
  | { kind: 'discovery'; data: Discovery }
  | { kind: 'note'; data: Note };

function LibraryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    discoveries,
    notes,
    isLoading,
    isOffline,
    isCached,
    removeDiscovery,
    removeNote,
  } = useStashCache();

  const activeFilter = (searchParams.get('type') as FilterType) || 'all';

  const setFilter = (type: FilterType) => {
    if (type === 'all') {
      router.push('/library');
    } else {
      router.push(`/library?type=${type}`);
    }
  };

  // Combine and sort all items by date
  const allItems: StashItem[] = [
    ...discoveries.map((d) => ({ kind: 'discovery' as const, data: d })),
    ...notes.map((n) => ({ kind: 'note' as const, data: n })),
  ].sort((a, b) => 
    new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime()
  );

  const filteredItems = activeFilter === 'all'
    ? allItems
    : activeFilter === 'notes'
    ? allItems.filter((item) => item.kind === 'note')
    : allItems.filter((item) => item.kind === 'discovery' && item.data.type === activeFilter);

  const handleDeleteDiscovery = (id: string) => {
    removeDiscovery(id);
  };

  const handleArchiveDiscovery = (id: string) => {
    removeDiscovery(id);
  };

  const handleDeleteNote = (id: string) => {
    removeNote(id);
  };

  const handleArchiveNote = (id: string) => {
    removeNote(id);
  };

  const totalCount = discoveries.length + notes.length;

  return (
    <div className="space-y-6">
      {isOffline && (
        <div className="rounded-lg bg-amber-100 px-4 py-2 text-center text-sm text-amber-800">
          You're offline. Showing cached data.
        </div>
      )}

      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Stash</h1>
        <p className="mt-2 text-gray-600">
          Your discoveries and notes
          {isCached && !isOffline && (
            <span className="ml-2 text-xs text-gray-400">(cached)</span>
          )}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:justify-center sm:overflow-x-visible sm:pb-0">
        <button
          onClick={() => setFilter('all')}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            activeFilter === 'all'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({totalCount})
        </button>
        {notes.length > 0 && (
          <button
            onClick={() => setFilter('notes')}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeFilter === 'notes'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🎙️ Notes ({notes.length})
          </button>
        )}
        {DISCOVERY_TYPES
          .map((type) => ({
            ...type,
            count: discoveries.filter((d) => d.type === type.value).length,
          }))
          .sort((a, b) => b.count - a.count)
          .map((type) => (
            <button
              key={type.value}
              onClick={() => setFilter(type.value)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeFilter === type.value
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {TYPE_ICONS[type.value]} {DISCOVERY_TYPE_LABELS[type.value]} ({type.count})
            </button>
          ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">Nothing here yet.</p>
          <p className="mt-1 text-sm text-gray-400">
            Capture screenshots or record notes to get started!
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) =>
            item.kind === 'discovery' ? (
              <DiscoveryCard
                key={`discovery-${item.data.id}`}
                discovery={item.data}
                onDelete={handleDeleteDiscovery}
                onArchive={handleArchiveDiscovery}
              />
            ) : (
              <NoteCard
                key={`note-${item.data.id}`}
                note={item.data}
                onDelete={handleDeleteNote}
                onArchive={handleArchiveNote}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

export default function Library() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
      </div>
    }>
      <LibraryContent />
    </Suspense>
  );
}
