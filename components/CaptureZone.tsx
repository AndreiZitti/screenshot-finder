'use client';

import { useState, useCallback } from 'react';
import { Discovery, DiscoveryType, DISCOVERY_TYPES } from '@/types/discovery';
import DiscoveryCard from './DiscoveryCard';
import VoiceRecorder from './VoiceRecorder';
import TranscriptionPreview from './TranscriptionPreview';

const TYPE_ICONS: Record<DiscoveryType, string> = {
  series: '📺',
  api_library: '📦',
  ai_tip: '🤖',
  gadget: '🔌',
  other: '📌',
};

type CaptureMode = 'idle' | 'image-preview' | 'transcription-preview';

export default function CaptureZone() {
  const [mode, setMode] = useState<CaptureMode>('idle');
  const [selectedType, setSelectedType] = useState<DiscoveryType>('series');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<Discovery[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Image preview state
  const [previewImages, setPreviewImages] = useState<File[]>([]);

  // Transcription state
  const [transcription, setTranscription] = useState<string | null>(null);

  // Handle image files
  const handleFiles = useCallback((files: FileList) => {
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      setPreviewImages(imageFiles);
      setMode('image-preview');
      setError(null);
    }
  }, []);

  // Analyze images
  const analyzeImages = async () => {
    setIsProcessing(true);
    setError(null);

    const formData = new FormData();
    previewImages.forEach((file) => {
      formData.append('images', file);
    });
    formData.append('type', selectedType);

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
      {/* Main Capture Area */}
      {mode === 'idle' && (
        <>
          {/* Image Drop Zone */}
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

      {/* Image Preview Mode */}
      {mode === 'image-preview' && (
        <div className="space-y-4">
          {/* Image Thumbnails */}
          <div className="flex flex-wrap gap-3">
            {previewImages.map((file, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${index + 1}`}
                  className="h-24 w-24 rounded-lg object-cover"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute -right-2 -top-2 rounded-full bg-gray-900 p-1 text-white hover:bg-gray-700"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Type Selector */}
          <div className="flex items-center justify-center gap-3">
            <label htmlFor="type-select" className="text-sm font-medium text-gray-700">
              Looking for:
            </label>
            <select
              id="type-select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as DiscoveryType)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
            >
              {DISCOVERY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {TYPE_ICONS[type.value]} {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-3">
            <button
              onClick={cancelImagePreview}
              disabled={isProcessing}
              className="rounded-lg px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={analyzeImages}
              disabled={isProcessing}
              className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {isProcessing ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
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
