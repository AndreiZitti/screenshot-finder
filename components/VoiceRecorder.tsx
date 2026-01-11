'use client';

import { useState, useRef } from 'react';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';

interface VoiceRecorderProps {
  onTranscription: (transcription: string) => void;
  disabled?: boolean;
}

export default function VoiceRecorder({ onTranscription, disabled }: VoiceRecorderProps) {
  const { state, audioBlob, duration, error, startRecording, stopRecording, reset } = useVoiceRecorder();
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Create audio URL when blob is ready
  const handleStopAndPreview = () => {
    stopRecording();
  };

  // When audioBlob changes, create URL for playback
  if (audioBlob && !audioUrl && state === 'stopped') {
    setAudioUrl(URL.createObjectURL(audioBlob));
  }

  const handleConfirmAndTranscribe = async () => {
    if (!audioBlob) return;

    setIsTranscribing(true);
    try {
      console.log('Audio blob size:', audioBlob.size, 'bytes');
      console.log('Audio blob type:', audioBlob.type);

      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      console.log('Transcription result:', data.transcription);
      onTranscription(data.transcription);
    } catch (err) {
      console.error('Transcription error:', err);
      alert('Failed to transcribe recording');
    } finally {
      setIsTranscribing(false);
      handleReset();
    }
  };

  const handleReset = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    reset();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Idle state - show record button */}
      {state === 'idle' && !isTranscribing && (
        <button
          onClick={startRecording}
          disabled={disabled}
          className="flex items-center gap-2 rounded-full bg-gray-900 px-6 py-4 sm:py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
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
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
          Record voice note
        </button>
      )}

      {/* Recording state */}
      {state === 'recording' && (
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
            <span className="font-mono text-lg text-gray-900">
              {formatDuration(duration)}
            </span>
          </div>
          <button
            onClick={handleStopAndPreview}
            className="flex items-center gap-2 rounded-full bg-red-600 px-6 py-4 sm:py-3 text-sm font-medium text-white transition-colors hover:bg-red-700"
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
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
              />
            </svg>
            Stop recording
          </button>
        </div>
      )}

      {/* Preview state - playback before transcribing */}
      {state === 'stopped' && audioUrl && !isTranscribing && (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 w-full sm:w-auto">
          <p className="text-sm font-medium text-gray-700">Preview your recording:</p>

          <audio
            ref={audioRef}
            src={audioUrl}
            controls
            className="w-full max-w-xs"
          />

          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Re-record
            </button>
            <button
              onClick={handleConfirmAndTranscribe}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Transcribe
            </button>
          </div>
        </div>
      )}

      {/* Transcribing state */}
      {isTranscribing && (
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          <span className="text-sm text-gray-600">Transcribing...</span>
        </div>
      )}
    </div>
  );
}
