'use client';

import { useState, useCallback } from 'react';
import { Series } from '@/types/series';
import SeriesCard from './SeriesCard';

export default function UploadZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Series[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(async (files: FileList) => {
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append('images', file);
    });

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze images');
      }

      setResults((prev) => [...data.results, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles]
  );

  return (
    <div className="space-y-6">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
          isDragging
            ? 'border-gray-900 bg-gray-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleInputChange}
          className="absolute inset-0 cursor-pointer opacity-0"
          disabled={isLoading}
        />

        <div className="space-y-2">
          <div className="text-4xl">📺</div>
          <p className="text-lg font-medium text-gray-900">
            {isLoading ? 'Analyzing...' : 'Drop screenshots here'}
          </p>
          <p className="text-sm text-gray-500">
            or click to select files
          </p>
        </div>

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/80">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Results ({results.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {results.map((series) => (
              <SeriesCard key={series.id} series={series} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
