'use client';

interface TranscriptionPreviewProps {
  transcription: string;
  onSaveAsNote: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export default function TranscriptionPreview({
  transcription,
  onSaveAsNote,
  onCancel,
  isProcessing,
}: TranscriptionPreviewProps) {
  return (
    <div className="w-full max-w-lg rounded-lg border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
      <p className="mb-4 text-gray-900">{transcription}</p>

      {isProcessing ? (
        <div className="flex items-center justify-center gap-2 py-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          <span className="text-sm text-gray-600">Processing...</span>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <button
            onClick={onSaveAsNote}
            className="min-h-11 w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
          >
            Save voice note
          </button>

          <button onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-700">
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
