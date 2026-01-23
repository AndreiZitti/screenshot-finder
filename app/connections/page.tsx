'use client';

import { useState } from 'react';
import { useNotionConnections } from '@/hooks/useNotionConnections';
import type { NotionConnection } from '@/types/notion';

export default function ConnectionsPage() {
  const {
    connections,
    isLoading,
    isSaving,
    addConnection,
    updateConnection,
    deleteConnection,
    setDefault,
  } = useNotionConnections();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Connections</h1>
        {!isAdding && connections.length > 0 && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add
          </button>
        )}
      </div>

      {/* Notion Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-xl">
            📝
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Notion</h2>
            <p className="text-sm text-gray-500">Send discoveries and notes to Notion pages</p>
          </div>
        </div>

        {connections.length === 0 && !isAdding ? (
          <div className="text-center py-6 border-t border-gray-100">
            <p className="text-gray-500 mb-4">No Notion pages connected</p>
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Connect Notion Page
            </button>
          </div>
        ) : (
          <div className="space-y-2 border-t border-gray-100 pt-4">
            {connections.map((connection) => (
              <ConnectionCard
                key={connection.id}
                connection={connection}
                isEditing={editingId === connection.id}
                onEdit={() => setEditingId(connection.id)}
                onCancelEdit={() => setEditingId(null)}
                onUpdate={async (data) => {
                  await updateConnection(connection.id, data);
                  setEditingId(null);
                }}
                onDelete={() => deleteConnection(connection.id)}
                onSetDefault={() => setDefault(connection.id)}
                isSaving={isSaving}
              />
            ))}
          </div>
        )}

        {isAdding && (
          <AddConnectionForm
            onAdd={async (data) => {
              await addConnection(data);
              setIsAdding(false);
            }}
            onCancel={() => setIsAdding(false)}
            isSaving={isSaving}
            isFirst={connections.length === 0}
          />
        )}
      </div>

      {/* Future connections placeholder */}
      <div className="rounded-lg border border-dashed border-gray-300 p-5 text-center">
        <p className="text-sm text-gray-400">More integrations coming soon...</p>
      </div>
    </div>
  );
}

function ConnectionCard({
  connection,
  isEditing,
  onEdit,
  onCancelEdit,
  onUpdate,
  onDelete,
  onSetDefault,
  isSaving,
}: {
  connection: NotionConnection;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: (data: { name?: string; api_key?: string; page_id?: string }) => Promise<void>;
  onDelete: () => void;
  onSetDefault: () => void;
  isSaving: boolean;
}) {
  const [name, setName] = useState(connection.name);
  const [apiKey, setApiKey] = useState(connection.api_key);
  const [pageId, setPageId] = useState(connection.page_id);
  const [showApiKey, setShowApiKey] = useState(false);

  if (isEditing) {
    return (
      <div className="rounded-lg border border-gray-300 bg-gray-50 p-4 space-y-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          placeholder="Connection name"
        />
        <div className="relative">
          <input
            type={showApiKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm"
            placeholder="API Token"
          />
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
          >
            {showApiKey ? 'hide' : 'show'}
          </button>
        </div>
        <input
          type="text"
          value={pageId}
          onChange={(e) => setPageId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          placeholder="Page URL"
        />
        <div className="flex gap-2">
          <button
            onClick={() => onUpdate({ name, api_key: apiKey, page_id: pageId })}
            disabled={isSaving || !name || !apiKey || !pageId}
            className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            Save
          </button>
          <button
            onClick={onCancelEdit}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900 truncate">{connection.name}</p>
            {connection.is_default && (
              <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                default
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 truncate">
            {connection.page_name || `${connection.page_id.slice(0, 12)}...`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {!connection.is_default && (
          <button onClick={onSetDefault} className="rounded p-1.5 text-gray-400 hover:bg-gray-100" title="Set as default">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        )}
        <button onClick={onEdit} className="rounded p-1.5 text-gray-400 hover:bg-gray-100" title="Edit">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={() => confirm(`Delete "${connection.name}"?`) && onDelete()}
          className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
          title="Delete"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function AddConnectionForm({
  onAdd,
  onCancel,
  isSaving,
  isFirst,
}: {
  onAdd: (data: { name: string; api_key: string; page_id: string; page_name?: string }) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
  isFirst: boolean;
}) {
  const [name, setName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [pageId, setPageId] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [pageName, setPageName] = useState<string | undefined>();

  const handleTest = async () => {
    if (!apiKey || !pageId) return;
    setTestStatus('testing');
    try {
      const response = await fetch('/api/notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', credentials: { apiKey, pageId } }),
      });
      const result = await response.json();
      if (result.success) {
        setTestStatus('success');
        setTestMessage(`Connected to "${result.pageName}"`);
        setPageName(result.pageName);
        if (!name) setName(result.pageName);
      } else {
        setTestStatus('error');
        setTestMessage(result.error || 'Connection failed');
      }
    } catch {
      setTestStatus('error');
      setTestMessage('Failed to test');
    }
  };

  return (
    <div className={`rounded-lg border border-gray-300 bg-gray-50 p-4 space-y-3 ${isFirst ? 'mt-4 border-t' : 'mt-3'}`}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        placeholder="Name (e.g., Work Notes)"
      />
      <div className="relative">
        <input
          type={showApiKey ? 'text' : 'password'}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-12 text-sm"
          placeholder="API Token (secret_...)"
        />
        <button
          type="button"
          onClick={() => setShowApiKey(!showApiKey)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs"
        >
          {showApiKey ? 'hide' : 'show'}
        </button>
      </div>
      <input
        type="text"
        value={pageId}
        onChange={(e) => setPageId(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        placeholder="Page URL (https://notion.so/...)"
      />
      
      {testStatus !== 'idle' && (
        <div className={`rounded-lg px-3 py-2 text-sm ${
          testStatus === 'testing' ? 'bg-gray-100 text-gray-600' :
          testStatus === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {testStatus === 'testing' ? 'Testing...' : testMessage}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleTest}
          disabled={!apiKey || !pageId || testStatus === 'testing'}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50"
        >
          Test
        </button>
        <button
          onClick={() => onAdd({ name, api_key: apiKey, page_id: pageId, page_name: pageName })}
          disabled={isSaving || !name || !apiKey || !pageId}
          className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {isSaving ? 'Adding...' : 'Add'}
        </button>
        <button onClick={onCancel} className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100">
          Cancel
        </button>
      </div>
    </div>
  );
}
