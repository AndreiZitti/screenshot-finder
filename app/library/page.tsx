'use client';

import { Suspense, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Discovery, DiscoveryType, DISCOVERY_TYPES, DISCOVERY_TYPE_LABELS } from '@/types/discovery';
import { Note } from '@/types/note';
import { Link } from '@/types/link';
import DiscoveryCard from '@/components/DiscoveryCard';
import NoteCard from '@/components/NoteCard';
import LinkCard from '@/components/LinkCard';
import { SkeletonGrid } from '@/components/SkeletonCard';
import { useStashCache } from '@/hooks/useStashCache';

const TYPE_ICONS: Record<DiscoveryType, string> = {
  series: '📺',
  api_library: '📦',
  ai_tip: '🤖',
  gadget: '🔌',
  other: '📌',
};

type FilterType = 'all' | 'notes' | 'links' | DiscoveryType;

type StashItem =
  | { kind: 'discovery'; data: Discovery }
  | { kind: 'note'; data: Note }
  | { kind: 'link'; data: Link };

function LibraryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    discoveries,
    notes,
    links,
    isLoading,
    isOffline,
    isCached,
    removeDiscovery,
    removeNote,
    removeLink,
  } = useStashCache();

  const activeFilter = (searchParams.get('type') as FilterType) || 'all';
  const [searchQuery, setSearchQuery] = useState('');

  const setFilter = (type: FilterType) => {
    if (type === 'all') {
      router.push('/library');
    } else {
      router.push(`/library?type=${type}`);
    }
  };

  // Combine and sort all items by date
  const allItems: StashItem[] = useMemo(() => [
    ...discoveries.map((d) => ({ kind: 'discovery' as const, data: d })),
    ...notes.map((n) => ({ kind: 'note' as const, data: n })),
    ...links.map((l) => ({ kind: 'link' as const, data: l })),
  ].sort((a, b) =>
    new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime()
  ), [discoveries, notes, links]);

  // Search across all text fields of an item
  const matchesSearch = (item: StashItem, query: string): boolean => {
    const q = query.toLowerCase();
    if (item.kind === 'discovery') {
      const d = item.data;
      return [d.name, d.description, d.notes, d.link]
        .filter(Boolean)
        .some((s) => s!.toLowerCase().includes(q));
    }
    if (item.kind === 'note') {
      const n = item.data;
      return [n.transcription, n.notes]
        .filter(Boolean)
        .some((s) => s!.toLowerCase().includes(q));
    }
    if (item.kind === 'link') {
      const l = item.data;
      return [l.name, l.description, l.url, l.notes, l.platform, ...(l.tags || [])]
        .filter(Boolean)
        .some((s) => s!.toLowerCase().includes(q));
    }
    return false;
  };

  const filteredItems = useMemo(() => {
    let items = activeFilter === 'all'
      ? allItems
      : activeFilter === 'notes'
      ? allItems.filter((item) => item.kind === 'note')
      : activeFilter === 'links'
      ? allItems.filter((item) => item.kind === 'link')
      : allItems.filter((item) => item.kind === 'discovery' && item.data.type === activeFilter);

    if (searchQuery.trim()) {
      items = items.filter((item) => matchesSearch(item, searchQuery.trim()));
    }

    return items;
  }, [allItems, activeFilter, searchQuery]);

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

  const handleDeleteLink = (id: string) => {
    removeLink(id);
  };

  const handleArchiveLink = (id: string) => {
    removeLink(id);
  };

  const totalCount = discoveries.length + notes.length + links.length;

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

      {/* Search */}
      <div className="relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search your stash..."
          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
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
        {links.length > 0 && (
          <button
            onClick={() => setFilter('links')}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeFilter === 'links'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🔗 Links ({links.length})
          </button>
        )}
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
        <SkeletonGrid count={6} />
      ) : filteredItems.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          {searchQuery.trim() ? (
            <>
              <p className="text-gray-500">No results for &ldquo;{searchQuery}&rdquo;</p>
              <p className="mt-1 text-sm text-gray-400">
                Try a different search term or clear the filter.
              </p>
            </>
          ) : (
            <>
              <p className="text-lg text-gray-500">Nothing here yet</p>
              <p className="mt-1 text-sm text-gray-400">
                Capture screenshots, record notes, or save links to get started.
              </p>
              <a
                href="/"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
              >
                Start capturing
              </a>
            </>
          )}
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
            ) : item.kind === 'link' ? (
              <LinkCard
                key={`link-${item.data.id}`}
                link={item.data}
                onDelete={handleDeleteLink}
                onArchive={handleArchiveLink}
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
