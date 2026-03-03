'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Discovery, DiscoveryType, DISCOVERY_TYPES } from '@/types/discovery';
import DiscoveryCard from './DiscoveryCard';
import VoiceRecorder from './VoiceRecorder';
import TranscriptionPreview from './TranscriptionPreview';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import PendingCaptures from './PendingCaptures';

const TYPE_ICONS: Record<DiscoveryType, string> = {
  series: '📺',
  api_library: '📦',
  ai_tip: '🤖',
  gadget: '🔌',
  other: '📌',
};

type CaptureMode = 'idle' | 'image-preview' | 'transcription-preview';

export default function CaptureZone() {
  const router = useRouter();
  const [mode, setMode] = useState<CaptureMode>('idle');
  const [selectedType, setSelectedType] = useState<DiscoveryType>('series');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<Discovery[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Type selector popup state
  const [showTypePopup, setShowTypePopup] = useState(false);
  const [customHint, setCustomHint] = useState('');

  // Image preview state
  const [previewImages, setPreviewImages] = useState<File[]>([]);

  // Transcription state
  const [transcription, setTranscription] = useState<string | null>(null);

  const {
    isOnline,
    pendingCaptures,
    isSyncing,
    addPendingCapture,
    removePendingCapture,
    retryCapture,
  } = useOfflineQueue();

  // Handle image files
  const handleFiles = useCallback((files: FileList) => {
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      setPreviewImages(imageFiles);
      setMode('image-preview');
      setShowTypePopup(true); // Auto-open popup
      setError(null);
    }
  }, []);

  // Analyze images
  const analyzeImages = async () => {
    // If offline, save to queue
    if (!isOnline) {
      for (const file of previewImages) {
        await addPendingCapture('image', file, selectedType);
      }
      setPreviewImages([]);
      setMode('idle');
      return;
    }

    setIsProcessing(true);
    setError(null);

    const formData = new FormData();
    previewImages.forEach((file) => {
      formData.append('images', file);
    });
    formData.append('type', selectedType);
    if (customHint) {
      formData.append('hint', customHint);
    }

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
      setPreviewImages([]);
      setMode('idle');
      setCustomHint('');
      // Navigate to library to see results
      if (data.results.length > 0) {
        router.push('/library');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle transcription from voice recorder
  const handleTranscription = (text: string) => {
    setTranscription(text);
    setMode('transcription-preview');
  };

  // Save transcription as note
  const saveAsNote = async () => {
    if (!transcription) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcription }),
      });

      if (!response.ok) {
        throw new Error('Failed to save note');
      }

      setTranscription(null);
      setMode('idle');
      // Could show a success toast here
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save note');
    } finally {
      setIsProcessing(false);
    }
  };

  // Research transcription (use Gemini to look it up)
  const researchTranscription = async (type: DiscoveryType) => {
    if (!transcription) return;

    setIsProcessing(true);
    try {
      // For now, we'll create a discovery directly with the transcription as the name
      // In a full implementation, you'd extract the key term from the transcription
      const response = await fetch('/api/analyze-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcription, type }),
      });

      if (!response.ok) {
        // Fallback: save as note if text analysis isn't implemented
        await saveAsNote();
        return;
      }

      const data = await response.json();
      if (data.result) {
        setResults((prev) => [data.result, ...prev]);
      }
      setTranscription(null);
      setMode('idle');
    } catch (err) {
      // Fallback to saving as note
      await saveAsNote();
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelTranscription = () => {
    setTranscription(null);
    setMode('idle');
  };

  const cancelImagePreview = () => {
    setPreviewImages([]);
    setMode('idle');
  };

  const removeImage = (index: number) => {
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
    if (previewImages.length === 1) {
      setMode('idle');
    }
  };

  // Drag handlers
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
      {!isOnline && (
        <div className="rounded-lg bg-amber-100 px-4 py-2 text-center text-sm text-amber-800">
          You're offline. Captures will sync when connected.
        </div>
      )}

      {/* Main Capture Area */}
      {mode === 'idle' && (
        <>
          {/* Image Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative rounded-lg border-2 border-dashed p-6 sm:p-12 text-center transition-colors ${
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
            />

            <div className="space-y-2">
              <div className="text-4xl">📸</div>
              <p className="text-lg font-medium text-gray-900">
                Drop screenshots here
              </p>
              <p className="text-sm text-gray-500">
                or click to select files
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-sm text-gray-500">or</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* Voice Recorder */}
          <VoiceRecorder onTranscription={handleTranscription} />
        </>
      )}

      {/* Type Selector Popup - shown over everything */}
      {showTypePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-semibold text-gray-900">What are you looking for?</h3>
            
            {/* Image Preview in Popup */}
            <div className="mb-4 flex justify-center gap-2">
              {previewImages.slice(0, 3).map((file, index) => (
                <img
                  key={index}
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${index + 1}`}
                  className="h-16 w-16 rounded-lg object-cover"
                />
              ))}
              {previewImages.length > 3 && (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100 text-sm text-gray-500">
                  +{previewImages.length - 3}
                </div>
              )}
            </div>

            {/* Type Buttons */}
            <div className="mb-4 grid grid-cols-2 gap-2">
              {DISCOVERY_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value)}
                  className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    selectedType === type.value
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-lg">{TYPE_ICONS[type.value]}</span>
                  <span>{type.label}</span>
                </button>
              ))}
            </div>

            {/* Custom Hint Input */}
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Add a hint (optional)
              </label>
              <input
                type="text"
                value={customHint}
                onChange={(e) => setCustomHint(e.target.value)}
                placeholder="e.g., 'anime from 2023' or 'React library'"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowTypePopup(false);
                  setPreviewImages([]);
                  setMode('idle');
                  setCustomHint('');
                }}
                className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowTypePopup(false);
                  analyzeImages();
                }}
                className="flex-1 rounded-lg bg-gray-900 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
              >
                Analyze
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Mode - Loading state after popup closes */}
      {mode === 'image-preview' && !showTypePopup && isProcessing && (
        <div className="flex flex-col items-center justify-center py-12">
          <svg className="h-12 w-12 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="mt-4 text-sm text-gray-500">Analyzing your image...</p>
        </div>
      )}

      {/* Transcription Preview Mode */}
      {mode === 'transcription-preview' && transcription && (
        <div className="flex justify-center">
          <TranscriptionPreview
            transcription={transcription}
            onSaveAsNote={saveAsNote}
            onResearch={researchTranscription}
            onCancel={cancelTranscription}
            isProcessing={isProcessing}
          />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Pending Captures */}
      <PendingCaptures
        captures={pendingCaptures}
        isSyncing={isSyncing}
        onRetry={retryCapture}
        onDelete={removePendingCapture}
      />

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Results ({results.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {results.map((discovery) => (
              <DiscoveryCard key={discovery.id} discovery={discovery} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
