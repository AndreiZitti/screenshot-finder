'use client';

import { useState, useRef, useEffect } from 'react';
import { useSendToNotion } from '@/hooks/useSendToNotion';

interface NotionSendButtonProps {
  type: 'discovery' | 'note';
  name?: string;
  description?: string;
  transcription?: string;
  link?: string;
}

export default function NotionSendButton({ type, name, description, transcription, link }: NotionSendButtonProps) {
  const { send, status, connections, isConfigured } = useSendToNotion();
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = async (connectionId?: string) => {
    setShowPicker(false);
    await send({ type, name, description, transcription, link, connectionId });
  };

  const handleClick = () => {
    if (!isConfigured) {
      alert('No Notion connections configured. Go to Settings to add one.');
      return;
    }
    
    // If only one connection, send directly
    if (connections.length === 1) {
      handleSend(connections[0].id);
    } else {
      // Show picker for multiple connections
      setShowPicker(!showPicker);
    }
  };

  return (
    <div className="relative" ref={pickerRef}>
      <button
        onClick={handleClick}
        disabled={status === 'sending'}
        className={`shrink-0 rounded p-2 sm:p-1 transition-colors disabled:opacity-50 ${
          status === 'success'
            ? 'text-green-500'
            : status === 'error'
            ? 'text-red-500 hover:bg-red-50'
            : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
        }`}
        title={isConfigured ? 'Send to Notion' : 'No Notion connection configured'}
      >
        {status === 'sending' ? (
          <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : status === 'success' ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        )}
      </button>

      {/* Connection picker dropdown */}
      {showPicker && connections.length > 1 && (
        <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          <div className="px-3 py-1.5 text-xs font-medium text-gray-500 border-b border-gray-100">
            Send to...
          </div>
          {connections.map((connection) => (
            <button
              key={connection.id}
              onClick={() => handleSend(connection.id)}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
            >
              <span className="truncate flex-1">{connection.name}</span>
              {connection.is_default && (
                <span className="shrink-0 text-xs text-gray-400">default</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
