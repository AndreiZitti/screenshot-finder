'use client';

import { PendingCapture } from '@/lib/offlineStorage';

interface PendingCapturesProps {
  captures: PendingCapture[];
  isSyncing: boolean;
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function PendingCaptures({
  captures,
  isSyncing,
  onRetry,
  onDelete,
}: PendingCapturesProps) {
  if (captures.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-medium text-amber-900">
          Pending ({captures.length})
        </h3>
        {isSyncing && (
          <span className="flex items-center gap-2 text-sm text-amber-700">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-300 border-t-amber-700" />
            Syncing...
          </span>
        )}
      </div>

      <div className="space-y-2">
        {captures.map((capture) => (
          <div
            key={capture.id}
            className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm"
          >
            <div className="flex items-center gap-3">
              {capture.type === 'image' ? (
                <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100 text-xl">
                  📸
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100 text-xl">
                  🎤
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {capture.type === 'image' ? 'Screenshot' : 'Voice note'}
                </p>
                <p className="text-xs text-gray-500">
                  {capture.status === 'failed' ? (
                    <span className="text-red-600">Failed to sync</span>
                  ) : capture.status === 'processing' ? (
                    'Processing...'
                  ) : (
                    'Waiting to sync'
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {capture.status === 'failed' && (
                <button
                  onClick={() => onRetry(capture.id)}
                  className="rounded px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-100"
                >
                  Retry
                </button>
              )}
              <button
                onClick={() => onDelete(capture.id)}
                className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-500"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
