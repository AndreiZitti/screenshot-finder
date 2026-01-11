'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Discovery, DiscoveryType, DISCOVERY_TYPE_LABELS } from '@/types/discovery';
import { Note } from '@/types/note';
import DiscoveryCard from '@/components/DiscoveryCard';
import NoteCard from '@/components/NoteCard';

type TabType = 'discoveries' | 'notes';

const TYPE_ICONS: Record<DiscoveryType, string> = {
  series: '📺',
  api_library: '📦',
  ai_tip: '🤖',
  gadget: '🔌',
  other: '📌',
};

function ArchiveContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const activeTab = (searchParams.get('tab') as TabType) || 'discoveries';

  useEffect(() => {
    async function fetchArchived() {
      try {
        const [discoveriesRes, notesRes] = await Promise.all([
          fetch('/api/discoveries?archived=true'),
          fetch('/api/notes?archived=true'),
        ]);

        const [discoveriesData, notesData] = await Promise.all([
          discoveriesRes.json(),
          notesRes.json(),
        ]);

        setDiscoveries(discoveriesData.discoveries || []);
        setNotes(notesData.notes || []);
      } catch (error) {
        console.error('Error fetching archived items:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchArchived();
  }, []);

  const setTab = (tab: TabType) => {
    router.push(`/archive?tab=${tab}`);
  };

  const handleDiscoveryDelete = (id: string) => {
    setDiscoveries((prev) => prev.filter((d) => d.id !== id));
  };

  const handleDiscoveryRestore = (id: string) => {
    setDiscoveries((prev) => prev.filter((d) => d.id !== id));
  };

  const handleNoteDelete = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const handleNoteRestore = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Archive</h1>
        <p className="mt-2 text-gray-600">
          Items you&apos;ve processed or completed
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setTab('discoveries')}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'discoveries'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Discoveries ({discoveries.length})
        </button>
        <button
          onClick={() => setTab('notes')}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'notes'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Notes ({notes.length})
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      ) : activeTab === 'discoveries' ? (
        discoveries.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
            <p className="text-gray-500">No archived discoveries.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {discoveries.map((discovery) => (
              <DiscoveryCard
                key={discovery.id}
                discovery={discovery}
                onDelete={handleDiscoveryDelete}
                onArchive={handleDiscoveryRestore}
              />
            ))}
          </div>
        )
      ) : notes.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">No archived notes.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onDelete={handleNoteDelete}
              onArchive={handleNoteRestore}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Archive() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
      </div>
    }>
      <ArchiveContent />
    </Suspense>
  );
}
