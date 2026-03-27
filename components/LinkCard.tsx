'use client';

import { useState } from 'react';
import { Link, LinkPlatform, PLATFORM_LABELS } from '@/types/link';
import { updateLink } from '@/lib/db/links-dal';
import { useToast } from '@/contexts/ToastContext';
import ConfirmDialog from './ConfirmDialog';
import NotionSendButton from './NotionSendButton';

interface LinkCardProps {
  link: Link;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const PLATFORM_COLORS: Record<LinkPlatform, string> = {
  youtube: 'bg-red-100 text-red-700',
  tiktok: 'bg-gray-100 text-gray-700',
  instagram: 'bg-purple-100 text-purple-700',
  reddit: 'bg-orange-100 text-orange-700',
  x: 'bg-gray-100 text-gray-700',
  other: 'bg-blue-100 text-blue-700',
};

function extractHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export default function LinkCard({ link, onArchive, onDelete }: LinkCardProps) {
  const { showToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(link.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [savedNotes, setSavedNotes] = useState(link.notes || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      const value = notesValue.trim() || null;
      await updateLink(link.id, { notes: value });
      setSavedNotes(value || '');
      setIsEditingNotes(false);
    } catch (error) {
      console.error('Failed to save notes:', error);
      showToast('Failed to save notes');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      const response = await fetch(`/api/links/${link.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: !link.archived_at }),
      });

      if (response.ok) {
        onArchive?.(link.id);
      } else {
        showToast('Failed to archive');
      }
    } catch (error) {
      console.error('Archive error:', error);
      showToast('Failed to archive');
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/links/${link.id}`, {
        method: 'DELETE',
      });

      if (response.ok || response.status === 404) {
        onDelete?.(link.id);
      } else {
        showToast('Failed to delete');
      }
    } catch (error) {
      console.error('Delete error:', error);
      showToast('Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
        {/* Thumbnail */}
        {link.thumbnail && (
          <div className="aspect-video w-full overflow-hidden">
            <img
              src={link.thumbnail}
              alt={link.name}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="p-5">
          {/* Header with platform badge and action buttons */}
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PLATFORM_COLORS[link.platform]}`}>
                {PLATFORM_LABELS[link.platform]}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleArchive}
                disabled={isArchiving}
                className="shrink-0 rounded p-2 sm:p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                title={link.archived_at ? 'Restore from archive' : 'Archive'}
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
                type="link"
                name={link.name}
                link={link.url}
                platform={link.platform}
                tags={link.tags}
              />
              <button
                onClick={() => {
                  setIsEditingNotes(!isEditingNotes);
                  if (!isEditingNotes) setNotesValue(savedNotes);
                }}
                className="shrink-0 rounded p-2 sm:p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
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
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                className="shrink-0 rounded p-2 sm:p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                title="Delete from library"
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

          {/* Title */}
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            {link.name}
          </h3>

          {/* URL domain */}
          <p className="mb-2 text-xs text-gray-400">
            {extractHostname(link.url)}
          </p>

          {/* Tags */}
          {link.tags && link.tags.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {link.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Notes display */}
          {savedNotes && !isEditingNotes && (
            <p className="mb-3 text-sm italic text-gray-500 border-l-2 border-gray-200 pl-2">
              {savedNotes}
            </p>
          )}

          {/* Notes editor */}
          {isEditingNotes && (
            <div className="mb-3">
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

          {/* Open link button */}
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            Open link
          </a>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete link"
        message={`Delete "${link.name}" from your library?`}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
