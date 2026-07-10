'use client';

import { useState, useCallback, useEffect } from 'react';
import { Discovery, DiscoveryType, DISCOVERY_TYPES } from '@/types/discovery';
import DiscoveryCard from './DiscoveryCard';
import VoiceRecorder from './VoiceRecorder';
import TranscriptionPreview from './TranscriptionPreview';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import PendingCaptures from './PendingCaptures';
import ImageParticleLoader from './ImageParticleLoader';
import { createDiscovery } from '@/lib/db/discoveries-dal';
import { createLink } from '@/lib/db/links-dal';
import { autoSync } from '@/lib/db/sync-service';
import { useApiKeys } from '@/hooks/useApiKeys';

const TYPE_ICONS: Record<DiscoveryType, string> = {
  series: '📺',
  api_library: '📦',
  ai_tip: '🤖',
  gadget: '🔌',
  note: '🎙️',
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState('');

  // Type selector popup state
  const [showTypePopup, setShowTypePopup] = useState(false);
  const [customHint, setCustomHint] = useState('');

  // Image preview state
  const [previewImages, setPreviewImages] = useState<File[]>([]);

  // Transcription state
  const [transcription, setTranscription] = useState<string | null>(null);

  // Link input state
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState(false);
  const { geminiApiKey } = useApiKeys();

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
    const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      setPreviewImages(imageFiles);
      setMode('image-preview');
      setShowTypePopup(true); // Auto-open popup
      setError(null);
      setSuccessMessage(null);
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
      setSuccessMessage('Saved to pending captures. It will upload when you are back online.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccessMessage(null);
    setAnalysisStatus('Preparing image...');

    const formData = new FormData();
    previewImages.forEach((file) => {
      formData.append('images', file);
    });
    formData.append('type', selectedType);
    if (customHint) {
      formData.append('hint', customHint);
    }

    try {
      const headers = geminiApiKey ? { 'x-gemini-api-key': geminiApiKey } : undefined;
      setAnalysisStatus('Reading screenshot...');
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze images');
      }

      if (!data.results || data.results.length === 0) {
        throw new Error(
          'Could not identify anything in that image. Try adding a hint or choose a different type.',
        );
      }

      setAnalysisStatus('Saving to stash...');

      // Save results to local DB
      for (const result of data.results) {
        await createDiscovery({
          type: result.type,
          name: result.name,
          description: result.description,
          link: result.link,
          metadata: result.metadata,
          image_url: result.image_url,
          notes: null,
        });
      }
      setResults((prev) => [...data.results, ...prev]);
      setPreviewImages([]);
      setMode('idle');
      setCustomHint('');
      setSuccessMessage(
        data.results.length === 1
          ? 'Saved 1 item to your stash.'
          : `Saved ${data.results.length} items to your stash.`,
      );
      autoSync();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
      setAnalysisStatus('');
    }
  };

  // Handle transcription from voice recorder
  const handleTranscription = (text: string) => {
    setError(null);
    setSuccessMessage(null);
    setTranscription(text);
    setMode('transcription-preview');
  };

  // Save transcription as a note-type discovery (local-first)
  const saveAsNote = async () => {
    if (!transcription) return;

    setIsProcessing(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const name = transcription.length > 60 ? transcription.slice(0, 57) + '...' : transcription;
      await createDiscovery({
        type: 'note',
        name,
        description: transcription,
        link: null,
        metadata: null,
        image_url: null,
        notes: null,
      });
      setTranscription(null);
      setMode('idle');
      setSuccessMessage('Voice note saved to your stash.');
      autoSync();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save note');
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

  // Link input handlers
  const normalizeUrl = (input: string): string => {
    const trimmed = input.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  const isValidUrl = (input: string): boolean => {
    try {
      new URL(input);
      return true;
    } catch {
      return false;
    }
  };

  const submitLink = async (rawUrl?: string) => {
    const url = normalizeUrl(rawUrl || linkUrl);
    if (!isValidUrl(url)) {
      setLinkError('Please enter a valid URL');
      return;
    }

    setLinkLoading(true);
    setLinkError(null);
    setLinkSuccess(false);
    setSuccessMessage(null);

    try {
      // Fetch OG preview
      const previewResponse = await fetch('/api/links/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const previewData = await previewResponse.json();
      if (!previewResponse.ok) {
        throw new Error(previewData.error || 'Failed to preview link');
      }

      const name = previewData.title || previewData.name || url;
      const platform = previewData.platform || 'other';
      const thumbnail = previewData.thumbnail || null;

      // Kick off AI enrichment in parallel (fire-and-forget for speed)
      const enrichPromise = fetch('/api/links/enrich', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(geminiApiKey ? { 'x-gemini-api-key': geminiApiKey } : {}),
        },
        body: JSON.stringify({ url, name, platform }),
      })
        .then((res) => res.json())
        .catch(() => ({ description: null, suggestedTags: [] }));

      // Save link immediately with OG data
      const savedLink = await createLink({
        url,
        name,
        description: null,
        platform,
        thumbnail,
        tags: [],
        notes: null,
      });

      // Show success immediately
      setLinkUrl('');
      setLinkSuccess(true);
      autoSync();

      // When enrichment comes back, update the saved link
      enrichPromise.then(
        async (enrichData: { description: string | null; suggestedTags: string[] }) => {
          if (
            enrichData.description ||
            (enrichData.suggestedTags && enrichData.suggestedTags.length > 0)
          ) {
            const { updateLink } = await import('@/lib/db/links-dal');
            await updateLink(savedLink.id, {
              description: enrichData.description || null,
              tags: enrichData.suggestedTags || [],
            });
            autoSync();
          }
        },
      );

      // Auto-hide success message after 2 seconds
      setTimeout(() => setLinkSuccess(false), 2000);
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : 'Failed to save link');
    } finally {
      setLinkLoading(false);
    }
  };

  const handleLinkKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitLink();
    }
  };

  const handleLinkPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').trim();
    if (pasted.startsWith('http://') || pasted.startsWith('https://')) {
      e.preventDefault();
      setLinkUrl(pasted);
      submitLink(pasted);
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
    [handleFiles],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles],
  );

  return (
    <div className="space-y-6">
      {!isOnline && (
        <div className="rounded-lg bg-amber-100 px-4 py-2 text-center text-sm text-amber-800">
          You&rsquo;re offline. Captures will sync when connected.
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
              isDragging ? 'border-gray-900 bg-gray-50' : 'border-gray-300 hover:border-gray-400'
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
              <p className="text-lg font-medium text-gray-900">Drop screenshots here</p>
              <p className="text-sm text-gray-500">or click to select files</p>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-sm text-gray-500">or</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* Link Input Section */}
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-4 sm:p-6">
            <div className="space-y-3">
              {/* Link Input */}
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-200 text-gray-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={handleLinkKeyDown}
                  onPaste={handleLinkPaste}
                  placeholder="Paste a link"
                  disabled={linkLoading}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 disabled:opacity-50"
                />
                <button
                  onClick={() => submitLink()}
                  disabled={!linkUrl.trim() || linkLoading}
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-gray-900 text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Save link"
                >
                  {linkLoading ? (
                    <svg
                      className="h-4 w-4 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Link Error */}
              {linkError && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  {linkError}
                </div>
              )}

              {/* Link Success Toast */}
              {linkSuccess && (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 animate-in fade-in duration-200">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  Link saved. Enriching in the background...
                </div>
              )}
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
          <div
            className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-semibold text-gray-900">What are you looking for?</h3>

            {/* Image Preview in Popup */}
            <div className="mb-4 flex justify-center gap-2">
              {previewImages.slice(0, 3).map((file, index) => (
                <FileThumbnail
                  key={index}
                  file={file}
                  label={`Preview ${index + 1}`}
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
                disabled={previewImages.length === 0 || isProcessing}
                className="flex-1 rounded-lg bg-gray-900 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isProcessing ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Mode - Particle animation while processing */}
      {mode === 'image-preview' && !showTypePopup && isProcessing && previewImages[0] && (
        <ImageParticleLoader
          imageFile={previewImages[0]}
          isAnalyzing={isProcessing}
          status={analysisStatus}
        />
      )}

      {mode === 'image-preview' && !showTypePopup && !isProcessing && previewImages.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex -space-x-2">
              {previewImages.slice(0, 3).map((file, index) => (
                <FileThumbnail
                  key={`${file.name}-${index}`}
                  file={file}
                  label={`Selected screenshot ${index + 1}`}
                  className="h-12 w-12 rounded-lg border-2 border-white object-cover"
                />
              ))}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {previewImages.length === 1
                  ? 'Screenshot ready'
                  : `${previewImages.length} screenshots ready`}
              </p>
              <p className="text-xs text-gray-500">Add a hint or retry analysis when ready.</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setShowTypePopup(true)}
              className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Edit
            </button>
            <button
              onClick={analyzeImages}
              className="rounded-lg bg-gray-900 px-3 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              Retry
            </button>
            <button
              onClick={cancelImagePreview}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100"
            >
              Clear
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
            onCancel={cancelTranscription}
            isProcessing={isProcessing}
          />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          <div className="font-medium">Something went wrong</div>
          <div className="mt-1">{error}</div>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-green-100 bg-green-50 p-4 text-sm text-green-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
          {successMessage}
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
          <h2 className="text-lg font-semibold text-gray-900">Results ({results.length})</h2>
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

function FileThumbnail({
  file,
  label,
  className,
}: {
  file: File;
  label: string;
  className: string;
}) {
  const [url, setUrl] = useState('');

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return (
    <div
      role="img"
      aria-label={label}
      className={`${className} bg-gray-100 bg-cover bg-center`}
      style={url ? { backgroundImage: `url(${url})` } : undefined}
    />
  );
}
