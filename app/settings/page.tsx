'use client';

import { useState, useEffect } from 'react';
import { useNotionSettings } from '@/hooks/useNotionSettings';

export default function SettingsPage() {
  const { settings, isLoading, isSaving, saveSettings, clearSettings, hasSettings } = useNotionSettings();
  const [apiKey, setApiKey] = useState('');
  const [pageUrl, setPageUrl] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [connectedPageName, setConnectedPageName] = useState<string | null>(null);

  // Initialize form with existing settings and test connection to get page name
  useEffect(() => {
    if (settings) {
      setApiKey(settings.apiKey);
      setPageUrl(settings.pageId);
      // Fetch the page name for display
      fetchPageName(settings);
    }
  }, [settings]);

  const fetchPageName = async (creds: { apiKey: string; pageId: string }) => {
    try {
      const response = await fetch('/api/notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test',
          credentials: creds,
        }),
      });
      const result = await response.json();
      if (result.success && result.pageName) {
        setConnectedPageName(result.pageName);
      }
    } catch {
      // Silently fail - just won't show page name
    }
  };

  const handleTest = async () => {
    if (!apiKey || !pageUrl) {
      setTestStatus('error');
      setTestMessage('Please enter both API key and page URL');
      return;
    }

    setTestStatus('testing');
    try {
      const response = await fetch('/api/notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test',
          credentials: { apiKey, pageId: pageUrl },
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setTestStatus('success');
        setTestMessage(`Connected to "${result.pageName}"`);
      } else {
        setTestStatus('error');
        setTestMessage(result.error || 'Connection failed');
      }
    } catch {
      setTestStatus('error');
      setTestMessage('Failed to test connection');
    }
  };

  const handleSave = async () => {
    if (!apiKey || !pageUrl) return;
    
    const result = await saveSettings({ apiKey, pageId: pageUrl });
    if (result.success) {
      setTestStatus('success');
      setTestMessage('Settings saved!');
      setIsEditing(false);
      // Refresh page name
      fetchPageName({ apiKey, pageId: pageUrl });
    }
  };

  const handleClear = async () => {
    if (confirm('Clear Notion settings?')) {
      await clearSettings();
      setApiKey('');
      setPageUrl('');
      setTestStatus('idle');
      setTestMessage('');
      setConnectedPageName(null);
      setIsEditing(false);
    }
  };

  const handleStartEditing = () => {
    setIsEditing(true);
    setTestStatus('idle');
    setTestMessage('');
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    if (settings) {
      setApiKey(settings.apiKey);
      setPageUrl(settings.pageId);
    }
    setTestStatus('idle');
    setTestMessage('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  // Show connected state if settings exist and not editing
  if (hasSettings && !isEditing) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Notion Integration</h2>
          
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-green-800">Connected to Notion</p>
                <p className="mt-1 text-sm text-green-700 truncate">
                  {connectedPageName ? `Page: "${connectedPageName}"` : `Page ID: ${settings?.pageId?.slice(0, 8)}...`}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={handleStartEditing}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Change Page
            </button>
            <button
              onClick={handleClear}
              className="rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Notion Integration</h2>
        <p className="mb-6 text-sm text-gray-600">
          {hasSettings ? 'Update your Notion connection:' : 'Connect your Notion account to send discoveries and notes to a specific page.'}
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="mb-1 block text-sm font-medium text-gray-700">
              API Token
            </label>
            <div className="relative">
              <input
                id="apiKey"
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="secret_..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showApiKey ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Create an integration at{' '}
              <a
                href="https://www.notion.so/my-integrations"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 underline"
              >
                notion.so/my-integrations
              </a>
            </p>
          </div>

          <div>
            <label htmlFor="pageUrl" className="mb-1 block text-sm font-medium text-gray-700">
              Page URL
            </label>
            <input
              id="pageUrl"
              type="text"
              value={pageUrl}
              onChange={(e) => setPageUrl(e.target.value)}
              placeholder="https://notion.so/Your-Page-abc123..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Share the page with your integration first
            </p>
          </div>

          {testStatus !== 'idle' && (
            <div
              className={`rounded-lg px-3 py-2 text-sm ${
                testStatus === 'testing'
                  ? 'bg-gray-100 text-gray-600'
                  : testStatus === 'success'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {testStatus === 'testing' ? 'Testing connection...' : testMessage}
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={handleTest}
              disabled={!apiKey || !pageUrl || testStatus === 'testing'}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Test Connection
            </button>
            <button
              onClick={handleSave}
              disabled={!apiKey || !pageUrl || isSaving}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : hasSettings ? 'Update' : 'Save'}
            </button>
            {isEditing && (
              <button
                onClick={handleCancelEditing}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
