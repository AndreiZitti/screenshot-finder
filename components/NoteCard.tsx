'use client';

import { useState } from 'react';
import { Note } from '@/types/note';
import { updateNote } from '@/lib/db/notes-dal';
import NotionSendButton from './NotionSendButton';

interface NoteCardProps {
  note: Note;
  onDelete?: (id: string) => void;
  onArchive?: (id: string) => void;
}

export default function NoteCard({ note, onDelete, onArchive }: NoteCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(note.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [savedNotes, setSavedNotes] = useState(note.notes || '');

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      const value = notesValue.trim() || null;
      await updateNote(note.id, { notes: value });
      setSavedNotes(value || '');
      setIsEditingNotes(false);
    } catch (error) {
      console.error('Failed to save notes:', error);
      alert('Failed to save notes');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: !note.archived_at }),
      });

      if (response.ok) {
        onArchive?.(note.id);
      } else {
        alert('Failed to archive');
      }
    } catch (error) {
      console.error('Archive error:', error);
      alert('Failed to archive');
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this note?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onDelete?.(note.id);
      } else {
        alert('Failed to delete');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffHours < 1) {
      const mins = Math.floor(diffMs / (1000 * 60));
      return `${mins} min${mins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      const hours = Math.floor(diffHours);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      const days = Math.floor(diffDays);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const truncatedText = note.transcription.length > 150 && !isExpanded
    ? note.transcription.slice(0, 150) + '...'
    : note.transcription;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p
            className={`text-gray-900 ${isExpanded ? '' : 'line-clamp-3'} cursor-pointer`}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {truncatedText}
          </p>
          {note.transcription.length > 150 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-1 text-sm text-gray-500 hover:text-gray-700"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
          <p className="mt-2 text-xs text-gray-400">
            {formatDate(note.created_at)}
          </p>

          {/* Notes display */}
          {savedNotes && !isEditingNotes && (
            <p className="mt-2 text-sm italic text-gray-500 border-l-2 border-gray-200 pl-2">
              {savedNotes}
            </p>
          )}

          {/* Notes editor */}
          {isEditingNotes && (
            <div className="mt-2">
              <textarea
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                placeholder="Add a note..."
                rows={2}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-700 placeholder-gray-400 focus:border-gray-400 focus:outline-none"
              />
              <div className="mt-1 flex items-center gap-2">
                <button
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                  className="rounded bg-gray-800 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
                >
                  {isSavingNotes ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setIsEditingNotes(false)}
                  className="rounded px-3 py-1 text-xs text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleArchive}
            disabled={isArchiving}
            className="rounded p-2 sm:p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
            title={note.archived_at ? 'Restore from archive' : 'Archive'}
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
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
              />
            </svg>
          </button>
          <NotionSendButton
            type="note"
            transcription={note.transcription}
          />
          <button
            onClick={() => {
              setIsEditingNotes(!isEditingNotes);
              if (!isEditingNotes) setNotesValue(savedNotes);
            }}
            className="rounded p-2 sm:p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="Add/edit notes"
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
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded p-2 sm:p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
            title="Delete"
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
      </div>
    </div>
  );
}
