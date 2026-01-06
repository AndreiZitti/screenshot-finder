'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Discovery, DiscoveryType, DISCOVERY_TYPES, DISCOVERY_TYPE_LABELS } from '@/types/discovery';
import DiscoveryCard from '@/components/DiscoveryCard';

const TYPE_ICONS: Record<DiscoveryType, string> = {
  series: '📺',
  api_library: '📦',
  ai_tip: '🤖',
  gadget: '🔌',
  other: '📌',
};

function LibraryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const activeFilter = (searchParams.get('type') as DiscoveryType | 'all') || 'all';

  useEffect(() => {
    async function fetchDiscoveries() {
      try {
        const response = await fetch('/api/discoveries');
        const data = await response.json();
        setDiscoveries(data.discoveries || []);
      } catch (error) {
        console.error('Error fetching discoveries:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDiscoveries();
  }, []);

  const setFilter = (type: DiscoveryType | 'all') => {
    if (type === 'all') {
      router.push('/library');
    } else {
      router.push(`/library?type=${type}`);
    }
  };

  const filteredDiscoveries = activeFilter === 'all'
    ? discoveries
    : discoveries.filter((d) => d.type === activeFilter);

  const handleDelete = (id: string) => {
    setDiscoveries((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Your Library</h1>
        <p className="mt-2 text-gray-600">
          All your discoveries in one place
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap justify-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            activeFilter === 'all'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({discoveries.length})
        </button>
        {DISCOVERY_TYPES.map((type) => {
          const count = discoveries.filter((d) => d.type === type.value).length;
          return (
            <button
              key={type.value}
              onClick={() => setFilter(type.value)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeFilter === type.value
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {TYPE_ICONS[type.value]} {DISCOVERY_TYPE_LABELS[type.value]} ({count})
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      ) : filteredDiscoveries.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">No discoveries found.</p>
          <p className="mt-1 text-sm text-gray-400">
            Upload some screenshots to get started!
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDiscoveries.map((discovery) => (
            <DiscoveryCard
              key={discovery.id}
              discovery={discovery}
              onDelete={handleDelete}
            />
          ))}
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
