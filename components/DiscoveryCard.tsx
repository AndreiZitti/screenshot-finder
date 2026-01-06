'use client';

import { useState } from 'react';
import { Discovery, DiscoveryType, DISCOVERY_TYPE_LABELS } from '@/types/discovery';

interface DiscoveryCardProps {
  discovery: Discovery;
  onDelete?: (id: string) => void;
}

const TYPE_COLORS: Record<DiscoveryType, string> = {
  series: 'bg-purple-100 text-purple-700',
  api_library: 'bg-blue-100 text-blue-700',
  ai_tip: 'bg-green-100 text-green-700',
  gadget: 'bg-orange-100 text-orange-700',
  other: 'bg-gray-100 text-gray-700',
};

const METADATA_LABELS: Record<string, string> = {
  // Series
  rating: 'Rating',
  seasons: 'Seasons',
  genre: 'Genre',
  where_to_watch: 'Watch on',
  // API/Library
  stars: 'Stars',
  language: 'Language',
  docs_url: 'Docs',
  install_command: 'Install',
  // AI Tips
  source: 'Source',
  category: 'Category',
  related_tools: 'Tools',
  // Gadgets
  price: 'Price',
  specs: 'Specs',
  where_to_buy: 'Buy at',
};

export default function DiscoveryCard({ discovery, onDelete }: DiscoveryCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete "${discovery.name}" from your library?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/discoveries/${discovery.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onDelete?.(discovery.id);
      } else {
        alert('Failed to delete');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  const metadata = discovery.metadata || {};
  const metadataEntries = Object.entries(metadata).filter(
    ([, value]) => value && value !== 'Unknown'
  );

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="p-5">
        {/* Header with type badge and delete button */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[discovery.type]}`}>
              {DISCOVERY_TYPE_LABELS[discovery.type]}
            </span>
          </div>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="shrink-0 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
            title="Delete from library"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>

        {/* Name */}
        <h3 className="mb-2 text-lg font-semibold text-gray-900">
          {discovery.name}
        </h3>

        {/* Description */}
        {discovery.description && (
          <p className="mb-3 text-sm text-gray-600 line-clamp-3">
            {discovery.description}
          </p>
        )}

        {/* Metadata */}
        {metadataEntries.length > 0 && (
          <div className="space-y-1.5 text-sm">
            {metadataEntries.map(([key, value]) => (
              <div key={key} className="flex items-start gap-2">
                <span className="font-medium text-gray-500">
                  {METADATA_LABELS[key] || key}:
                </span>
                <span className="text-gray-900 break-words">{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Link button */}
        {discovery.link && discovery.link !== 'Unknown' && (
          <a
            href={discovery.link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            Open link
          </a>
        )}
      </div>
    </div>
  );
}
