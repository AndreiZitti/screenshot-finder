'use client';

import { useState, useEffect } from 'react';
import { Note } from '@/types/note';
import NoteCard from '@/components/NoteCard';

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
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      ) : notes.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">No notes yet.</p>
          <p className="mt-1 text-sm text-gray-400">
            Record a voice note to get started!
          </p>
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
