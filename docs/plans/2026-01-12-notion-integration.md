# Notion Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add "Send to Notion" button to Discovery and Note cards that appends items as blocks to a user-configured Notion page.

**Architecture:** API route handles Notion block creation. Credentials from env (owner) or localStorage/Supabase (other users). Settings page for configuration.

**Tech Stack:** @notionhq/client, Next.js API routes, Supabase for settings persistence

---

## Task 1: Install Notion SDK

**Step 1: Install dependency**

Run:
```bash
npm install @notionhq/client
```

**Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @notionhq/client dependency"
```

---

## Task 2: Create Notion Library

**Files:**
- Create: `lib/notion.ts`

**Step 1: Create the Notion client wrapper**

Create `lib/notion.ts`:

```typescript
import { Client } from '@notionhq/client';

export interface NotionCredentials {
  apiKey: string;
  pageId: string;
}

export function createNotionClient(apiKey: string): Client {
  return new Client({ auth: apiKey });
}

export function extractPageId(pageUrlOrId: string): string {
  // Handle full URLs like https://notion.so/Page-Name-abc123def456
  // or just the ID
  const match = pageUrlOrId.match(/([a-f0-9]{32}|[a-f0-9-]{36})$/i);
  if (match) {
    return match[1].replace(/-/g, '');
  }
  // Try to extract from URL with dashes
  const urlMatch = pageUrlOrId.match(/([a-f0-9]{8}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{12})/i);
  if (urlMatch) {
    return urlMatch[1].replace(/-/g, '');
  }
  return pageUrlOrId;
}

export interface SendToNotionParams {
  credentials: NotionCredentials;
  type: 'discovery' | 'note';
  name?: string;
  description?: string;
  transcription?: string;
  link?: string;
}

export async function sendToNotion(params: SendToNotionParams): Promise<{ success: boolean; error?: string }> {
  const { credentials, type, name, description, transcription, link } = params;
  
  const client = createNotionClient(credentials.apiKey);
  const pageId = extractPageId(credentials.pageId);
  
  const timestamp = new Date().toLocaleString();
  
  let text: string;
  if (type === 'note') {
    text = `[${timestamp}] Note: ${transcription}`;
  } else {
    text = `[${timestamp}] ${name}`;
    if (description) {
      text += ` - ${description}`;
    }
    if (link) {
      text += ` (${link})`;
    }
  }

  try {
    await client.blocks.children.append({
      block_id: pageId,
      children: [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: { content: text },
              },
            ],
          },
        },
      ],
    });
    return { success: true };
  } catch (error) {
    console.error('Notion API error:', error);
    const message = error instanceof Error ? error.message : 'Failed to send to Notion';
    return { success: false, error: message };
  }
}

export async function testNotionConnection(credentials: NotionCredentials): Promise<{ success: boolean; pageName?: string; error?: string }> {
  const client = createNotionClient(credentials.apiKey);
  const pageId = extractPageId(credentials.pageId);
  
  try {
    const page = await client.pages.retrieve({ page_id: pageId });
    // Extract page title
    let pageName = 'Untitled';
    if ('properties' in page && page.properties.title) {
      const titleProp = page.properties.title;
      if ('title' in titleProp && Array.isArray(titleProp.title) && titleProp.title.length > 0) {
        pageName = titleProp.title[0].plain_text;
      }
    }
    return { success: true, pageName };
  } catch (error) {
    console.error('Notion connection test failed:', error);
    const message = error instanceof Error ? error.message : 'Connection failed';
    return { success: false, error: message };
  }
}
```

**Step 2: Commit**

```bash
git add lib/notion.ts
git commit -m "feat: add Notion client library"
```

---

## Task 3: Create Notion API Route

**Files:**
- Create: `app/api/notion/route.ts`

**Step 1: Create the API route**

Create `app/api/notion/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { sendToNotion, testNotionConnection, NotionCredentials } from '@/lib/notion';

// Get credentials from env or request body
function getCredentials(bodyCredentials?: Partial<NotionCredentials>): NotionCredentials | null {
  // Priority: env variables for owner
  const envApiKey = process.env.NOTION_API_KEY;
  const envPageId = process.env.NOTION_PAGE_ID;
  
  if (envApiKey && envPageId) {
    return { apiKey: envApiKey, pageId: envPageId };
  }
  
  // Fall back to user-provided credentials
  if (bodyCredentials?.apiKey && bodyCredentials?.pageId) {
    return { apiKey: bodyCredentials.apiKey, pageId: bodyCredentials.pageId };
  }
  
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, type, name, description, transcription, link, credentials: bodyCredentials } = body;
    
    const credentials = getCredentials(bodyCredentials);
    
    if (!credentials) {
      return NextResponse.json(
        { error: 'Notion credentials not configured. Please set up in Settings.' },
        { status: 400 }
      );
    }
    
    // Test connection action
    if (action === 'test') {
      const result = await testNotionConnection(credentials);
      return NextResponse.json(result);
    }
    
    // Send to Notion action
    if (!type) {
      return NextResponse.json(
        { error: 'Missing type parameter' },
        { status: 400 }
      );
    }
    
    const result = await sendToNotion({
      credentials,
      type,
      name,
      description,
      transcription,
      link,
    });
    
    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Notion API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Step 2: Commit**

```bash
git add app/api/notion/route.ts
git commit -m "feat: add Notion API route"
```

---

## Task 4: Create useNotionSettings Hook

**Files:**
- Create: `hooks/useNotionSettings.ts`

**Step 1: Create the hook**

Create `hooks/useNotionSettings.ts`:

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface NotionSettings {
  apiKey: string;
  pageId: string;
}

const STORAGE_KEY = 'notion_settings';

export function useNotionSettings() {
  const [settings, setSettings] = useState<NotionSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      // First check localStorage
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
        setIsLoading(false);
        return;
      }

      // Fall back to Supabase
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data } = await supabase
          .from('user_settings')
          .select('notion_api_key, notion_page_id')
          .eq('user_id', user.id)
          .single();
        
        if (data?.notion_api_key && data?.notion_page_id) {
          const loadedSettings = {
            apiKey: data.notion_api_key,
            pageId: data.notion_page_id,
          };
          setSettings(loadedSettings);
          // Cache to localStorage
          localStorage.setItem(STORAGE_KEY, JSON.stringify(loadedSettings));
        }
      }
    } catch (error) {
      console.error('Failed to load Notion settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = useCallback(async (newSettings: NotionSettings) => {
    setIsSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);

      // Also save to Supabase for cross-device sync
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            notion_api_key: newSettings.apiKey,
            notion_page_id: newSettings.pageId,
            updated_at: new Date().toISOString(),
          });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to save Notion settings:', error);
      return { success: false, error: 'Failed to save settings' };
    } finally {
      setIsSaving(false);
    }
  }, []);

  const clearSettings = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEY);
    setSettings(null);
    
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      await supabase
        .from('user_settings')
        .delete()
        .eq('user_id', user.id);
    }
  }, []);

  return {
    settings,
    isLoading,
    isSaving,
    saveSettings,
    clearSettings,
    hasSettings: !!settings,
  };
}
```

**Step 2: Commit**

```bash
git add hooks/useNotionSettings.ts
git commit -m "feat: add useNotionSettings hook"
```

---

## Task 5: Create Supabase Migration

**Files:**
- Create: `supabase/migrations/20260112_add_user_settings.sql`

**Step 1: Create the migration**

Create `supabase/migrations/20260112_add_user_settings.sql`:

```sql
-- Create user_settings table for storing user preferences
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  notion_api_key TEXT,
  notion_page_id TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Users can only access their own settings
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings" ON user_settings
  FOR DELETE USING (auth.uid() = user_id);
```

**Step 2: Commit**

```bash
git add supabase/migrations/20260112_add_user_settings.sql
git commit -m "feat: add user_settings table migration"
```

---

## Task 6: Create Settings Page

**Files:**
- Create: `app/settings/page.tsx`

**Step 1: Create the settings page**

Create `app/settings/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useNotionSettings } from '@/hooks/useNotionSettings';

export default function SettingsPage() {
  const { settings, isLoading, isSaving, saveSettings, clearSettings, hasSettings } = useNotionSettings();
  const [apiKey, setApiKey] = useState('');
  const [pageUrl, setPageUrl] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  // Initialize form with existing settings
  useState(() => {
    if (settings) {
      setApiKey(settings.apiKey);
      setPageUrl(settings.pageId);
    }
  });

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
    }
  };

  const handleClear = async () => {
    if (confirm('Clear Notion settings?')) {
      await clearSettings();
      setApiKey('');
      setPageUrl('');
      setTestStatus('idle');
      setTestMessage('');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Notion Integration</h2>
        <p className="mb-6 text-sm text-gray-600">
          Connect your Notion account to send discoveries and notes to a specific page.
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

          <div className="flex gap-3 pt-2">
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
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            {hasSettings && (
              <button
                onClick={handleClear}
                className="rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/settings/page.tsx
git commit -m "feat: add Settings page with Notion configuration"
```

---

## Task 7: Add Settings to Navigation

**Files:**
- Modify: `components/BottomNav.tsx`

**Step 1: Add settings nav item**

In `components/BottomNav.tsx`, add to NAV_ITEMS array:

```typescript
const NAV_ITEMS = [
  { href: '/', label: 'Capture', icon: 'capture' },
  { href: '/library', label: 'Discoveries', icon: 'library' },
  { href: '/notes', label: 'Notes', icon: 'notes' },
  { href: '/archive', label: 'Archive', icon: 'archive' },
  { href: '/settings', label: 'Settings', icon: 'settings' },
];
```

Add settings icon to Icons object:

```typescript
  settings: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
```

**Step 2: Commit**

```bash
git add components/BottomNav.tsx
git commit -m "feat: add Settings to bottom navigation"
```

---

## Task 8: Create useSendToNotion Hook

**Files:**
- Create: `hooks/useSendToNotion.ts`

**Step 1: Create the hook**

Create `hooks/useSendToNotion.ts`:

```typescript
'use client';

import { useState, useCallback } from 'react';
import { useNotionSettings } from './useNotionSettings';

type SendStatus = 'idle' | 'sending' | 'success' | 'error';

interface SendToNotionOptions {
  type: 'discovery' | 'note';
  name?: string;
  description?: string;
  transcription?: string;
  link?: string;
}

export function useSendToNotion() {
  const { settings } = useNotionSettings();
  const [status, setStatus] = useState<SendStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(async (options: SendToNotionOptions) => {
    setStatus('sending');
    setError(null);

    try {
      const response = await fetch('/api/notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...options,
          credentials: settings,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setStatus('success');
        // Reset to idle after 2 seconds
        setTimeout(() => setStatus('idle'), 2000);
        return { success: true };
      } else {
        setStatus('error');
        setError(result.error || 'Failed to send to Notion');
        return { success: false, error: result.error };
      }
    } catch (err) {
      setStatus('error');
      const message = err instanceof Error ? err.message : 'Failed to send to Notion';
      setError(message);
      return { success: false, error: message };
    }
  }, [settings]);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
  }, []);

  return {
    send,
    status,
    error,
    reset,
    isConfigured: !!settings || !!(process.env.NEXT_PUBLIC_NOTION_CONFIGURED === 'true'),
  };
}
```

**Step 2: Commit**

```bash
git add hooks/useSendToNotion.ts
git commit -m "feat: add useSendToNotion hook"
```

---

## Task 9: Add Notion Button to DiscoveryCard

**Files:**
- Modify: `components/DiscoveryCard.tsx`

**Step 1: Import hook and add button state**

At the top of `components/DiscoveryCard.tsx`, add import:

```typescript
import { useSendToNotion } from '@/hooks/useSendToNotion';
```

**Step 2: Add hook and handler inside component**

Inside the component function, after existing state:

```typescript
const { send: sendToNotion, status: notionStatus } = useSendToNotion();

const handleSendToNotion = async () => {
  await sendToNotion({
    type: 'discovery',
    name: discovery.name,
    description: discovery.description || undefined,
    link: discovery.link || undefined,
  });
};
```

**Step 3: Add Notion button to the button group**

In the button group div (after archive button, before delete button), add:

```tsx
<button
  onClick={handleSendToNotion}
  disabled={notionStatus === 'sending'}
  className={`shrink-0 rounded p-2 sm:p-1 transition-colors disabled:opacity-50 ${
    notionStatus === 'success'
      ? 'text-green-500'
      : notionStatus === 'error'
      ? 'text-red-500 hover:bg-red-50'
      : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
  }`}
  title="Send to Notion"
>
  {notionStatus === 'sending' ? (
    <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  ) : notionStatus === 'success' ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  )}
</button>
```

**Step 4: Commit**

```bash
git add components/DiscoveryCard.tsx
git commit -m "feat: add Send to Notion button to DiscoveryCard"
```

---

## Task 10: Add Notion Button to NoteCard

**Files:**
- Modify: `components/NoteCard.tsx`

**Step 1: Import hook**

At the top of `components/NoteCard.tsx`, add import:

```typescript
import { useSendToNotion } from '@/hooks/useSendToNotion';
```

**Step 2: Add hook and handler inside component**

Inside the component function, after existing state:

```typescript
const { send: sendToNotion, status: notionStatus } = useSendToNotion();

const handleSendToNotion = async () => {
  await sendToNotion({
    type: 'note',
    transcription: note.transcription,
  });
};
```

**Step 3: Add Notion button to the button group**

In the button group div (after archive button, before delete button), add the same button JSX from Task 9 Step 3.

**Step 4: Commit**

```bash
git add components/NoteCard.tsx
git commit -m "feat: add Send to Notion button to NoteCard"
```

---

## Task 11: Add Environment Variable Documentation

**Files:**
- Modify: `.env.local` (add comments)

**Step 1: Document new env vars**

Add to `.env.local` (or create `.env.example`):

```bash
# Notion Integration (optional - for owner's default credentials)
# NOTION_API_KEY=secret_xxx
# NOTION_PAGE_ID=abc123def456
```

**Step 2: Commit**

```bash
git add .env.example 2>/dev/null || true
git commit -m "docs: add Notion environment variables" --allow-empty
```

---

## Task 12: Test and Verify

**Step 1: Build the application**

Run:
```bash
npm run build
```

Expected: Build succeeds with no errors.

**Step 2: Start dev server and test**

Run:
```bash
npm run dev
```

Manual test:
1. Go to /settings
2. Enter Notion API key and page URL
3. Click "Test Connection"
4. Click "Save"
5. Go to /library or /notes
6. Click Notion button on a card
7. Verify block appears in Notion page

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete Notion integration implementation"
```
