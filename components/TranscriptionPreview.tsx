'use client';

import { useState } from 'react';
import { DiscoveryType, DISCOVERY_TYPES } from '@/types/discovery';

const TYPE_ICONS: Record<DiscoveryType, string> = {
  series: '📺',
  api_library: '📦',
  ai_tip: '🤖',
  gadget: '🔌',
  other: '📌',
};

interface TranscriptionPreviewProps {
  transcription: string;
  onSaveAsNote: () => void;
  onResearch: (type: DiscoveryType) => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export default function TranscriptionPreview({
  transcription,
  onSaveAsNote,
  onResearch,
  onCancel,
  isProcessing,
}: TranscriptionPreviewProps) {
  const [showCategories, setShowCategories] = useState(false);

  return (
    <div className="w-full max-w-lg rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <p className="mb-4 text-gray-900">{transcription}</p>

      {isProcessing ? (
        <div className="flex items-center justify-center gap-2 py-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          <span className="text-sm text-gray-600">Processing...</span>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {!showCategories ? (
            <div className="flex gap-2">
              <button
                onClick={onSaveAsNote}
                className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
              >
                Save as Note
              </button>
              <button
                onClick={() => setShowCategories(true)}
                className="flex-1 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
              >
                Research This
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">What type of thing is this?</p>
              <div className="grid grid-cols-2 gap-2">
                {DISCOVERY_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => onResearch(type.value)}
                    className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <span>{TYPE_ICONS[type.value]}</span>
                    {type.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowCategories(false)}
                className="w-full text-sm text-gray-500 hover:text-gray-700"
              >
                Back
              </button>
            </div>
          )}

          <button
            onClick={onCancel}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
