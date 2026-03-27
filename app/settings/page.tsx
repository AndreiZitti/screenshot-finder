'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useApiKeys } from '@/hooks/useApiKeys';
import { useNotionConnections } from '@/hooks/useNotionConnections';
import { useToast } from '@/contexts/ToastContext';
import ConfirmDialog from '@/components/ConfirmDialog';
import type { NotionConnectionInput } from '@/types/notion';
import { createClient } from '@/lib/supabase/client';

function MaskedKey({ value }: { value: string }) {
  if (!value) return <span className="text-gray-400">Not set</span>;
  const last4 = value.slice(-4);
  return <span className="font-mono text-sm text-gray-600">{'*'.repeat(8)}{last4}</span>;
}

function ApiKeyField({
  label,
  value,
  onSave,
}: {
  label: string;
  value: string;
  onSave: (key: string) => Promise<void>;
}) {
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(inputValue.trim());
      setIsEditing(false);
      setInputValue('');
      showToast(`${label} saved`, 'success');
    } catch {
      showToast(`Failed to save ${label}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    setIsSaving(true);
    try {
      await onSave('');
      showToast(`${label} cleared`, 'success');
    } catch {
      showToast(`Failed to clear ${label}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {isEditing ? (
          <div className="mt-2 flex items-center gap-2">
            <input
              type="password"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Paste your API key"
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-gray-400 focus:outline-none"
              autoFocus
            />
            <button
              onClick={handleSave}
              disabled={!inputValue.trim() || isSaving}
              className="shrink-0 rounded bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => { setIsEditing(false); setInputValue(''); }}
              className="shrink-0 text-xs text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        ) : (
          <MaskedKey value={value} />
        )}
      </div>
      {!isEditing && (
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="rounded px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
          >
            {value ? 'Change' : 'Set'}
          </button>
          {value && (
            <button
              onClick={handleClear}
              disabled={isSaving}
              className="rounded px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function NotionConnectionForm({
  onSubmit,
  onCancel,
  isSaving,
}: {
  onSubmit: (input: NotionConnectionInput) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [name, setName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [pageId, setPageId] = useState('');

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Connection name (e.g. Work Notes)"
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
        autoFocus
      />
      <input
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="Notion API key"
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
      />
      <input
        value={pageId}
        onChange={(e) => setPageId(e.target.value)}
        placeholder="Notion page ID"
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
      />
      <div className="flex gap-2">
        <button
          onClick={() => onSubmit({ name, api_key: apiKey, page_id: pageId })}
          disabled={!name.trim() || !apiKey.trim() || !pageId.trim() || isSaving}
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Add connection'}
        </button>
        <button onClick={onCancel} className="rounded px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, isGuest } = useAuth();
  const { groqApiKey, geminiApiKey, saveGroqApiKey, saveGeminiApiKey, isLoading: keysLoading } = useApiKeys();
  const {
    connections,
    isLoading: notionLoading,
    isSaving,
    addConnection,
    deleteConnection,
    setDefault,
  } = useNotionConnections();
  const { showToast } = useToast();

  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const handleAddConnection = async (input: NotionConnectionInput) => {
    const result = await addConnection(input);
    if (result.success) {
      setShowAddForm(false);
      showToast('Connection added', 'success');
    } else {
      showToast(result.error || 'Failed to add connection');
    }
  };

  const handleDeleteConnection = async () => {
    if (!deleteTarget) return;
    const result = await deleteConnection(deleteTarget.id);
    if (result.success) {
      showToast('Connection removed', 'success');
    } else {
      showToast(result.error || 'Failed to delete');
    }
    setDeleteTarget(null);
  };

  const handleSetDefault = async (id: string) => {
    const result = await setDefault(id);
    if (result.success) {
      showToast('Default updated', 'success');
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
      </div>

      {/* Account */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Account</h2>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {isGuest ? 'Guest mode' : user?.email}
              </p>
              <p className="text-xs text-gray-400">
                {isGuest ? 'Data stored locally only' : 'Synced to cloud'}
              </p>
            </div>
            {!isGuest && (
              <button
                onClick={handleSignOut}
                className="rounded px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
              >
                Sign out
              </button>
            )}
          </div>
        </div>
      </section>

      {/* API Keys */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">API Keys</h2>
        {keysLoading ? (
          <div className="space-y-3">
            <div className="h-16 animate-pulse rounded-lg border border-gray-200 bg-gray-50" />
            <div className="h-16 animate-pulse rounded-lg border border-gray-200 bg-gray-50" />
          </div>
        ) : (
          <div className="space-y-3">
            <ApiKeyField label="Gemini API Key" value={geminiApiKey} onSave={saveGeminiApiKey} />
            <ApiKeyField label="Groq API Key" value={groqApiKey} onSave={saveGroqApiKey} />
          </div>
        )}
        <p className="mt-2 text-xs text-gray-400">
          Keys are used for image analysis and voice transcription. If not set, the app falls back to shared keys.
        </p>
      </section>

      {/* Notion Connections */}
      {!isGuest && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Notion Connections</h2>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="rounded px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
              >
                + Add
              </button>
            )}
          </div>

          {showAddForm && (
            <div className="mb-3">
              <NotionConnectionForm
                onSubmit={handleAddConnection}
                onCancel={() => setShowAddForm(false)}
                isSaving={isSaving}
              />
            </div>
          )}

          {notionLoading ? (
            <div className="space-y-3">
              <div className="h-16 animate-pulse rounded-lg border border-gray-200 bg-gray-50" />
            </div>
          ) : connections.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
              <p className="text-sm text-gray-500">No Notion connections yet</p>
              <p className="mt-1 text-xs text-gray-400">Add one to send items to Notion</p>
            </div>
          ) : (
            <div className="space-y-2">
              {connections.map((conn) => (
                <div
                  key={conn.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-gray-900">{conn.name}</p>
                      {conn.is_default && (
                        <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                          DEFAULT
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-gray-400">
                      {conn.page_name || conn.page_id}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!conn.is_default && (
                      <button
                        onClick={() => handleSetDefault(conn.id)}
                        className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                        title="Set as default"
                      >
                        Set default
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteTarget({ id: conn.id, name: conn.name })}
                      className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                      title="Remove connection"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove connection"
        message={`Remove "${deleteTarget?.name}"? You can add it back later.`}
        confirmLabel="Remove"
        onConfirm={handleDeleteConnection}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
