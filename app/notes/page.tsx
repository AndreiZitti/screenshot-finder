'use client';

import { useState, useEffect } from 'react';
import { Note } from '@/types/note';
import NoteCard from '@/components/NoteCard';
import { SkeletonList } from '@/components/SkeletonCard';

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchNotes() {
      try {
        const response = await fetch('/api/notes');
        const data = await response.json();
        setNotes(data.notes || []);
      } catch (error) {
        console.error('Error fetching notes:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchNotes();
  }, []);

  const handleDelete = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const handleArchive = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Notes</h1>
        <p className="mt-2 text-gray-600">
          Quick thoughts and voice captures
        </p>
      </div>

      {isLoading ? (
        <SkeletonList count={4} />
      ) : notes.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-lg text-gray-500">No voice notes yet</p>
          <p className="mt-1 text-sm text-gray-400">
            Record a voice note to get started.
          </p>
          <a
            href="/"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            Record a note
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onDelete={handleDelete}
              onArchive={handleArchive}
            />
          ))}
        </div>
      )}
    </div>
  );
}
