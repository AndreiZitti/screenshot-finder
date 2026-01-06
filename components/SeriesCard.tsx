'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Series } from '@/types/series';

interface SeriesCardProps {
  series: Series;
}

export default function SeriesCard({ series }: SeriesCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete "${series.name}" from your library?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/series/${series.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert('Failed to delete series');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete series');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="p-5">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold text-gray-900">
            {series.name}
          </h3>
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

        {series.synopsis && (
          <p className="mb-3 text-sm text-gray-600 line-clamp-3">
            {series.synopsis}
          </p>
        )}

        <div className="space-y-1.5 text-sm">
          {series.rating && (
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-500">Rating:</span>
              <span className="text-gray-900">{series.rating}</span>
            </div>
          )}

          {series.seasons && (
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-500">Seasons:</span>
              <span className="text-gray-900">{series.seasons}</span>
            </div>
          )}

          {series.genre && (
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-500">Genre:</span>
              <span className="text-gray-900">{series.genre}</span>
            </div>
          )}

          {series.where_to_watch && (
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-500">Watch on:</span>
              <span className="text-gray-900">{series.where_to_watch}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
