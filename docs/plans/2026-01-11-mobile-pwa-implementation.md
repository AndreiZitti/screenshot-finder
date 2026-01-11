# Mobile & PWA Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make z-stash mobile-friendly and installable as a PWA with offline capture support.

**Architecture:** Responsive-first approach using Tailwind breakpoints. Bottom navigation on mobile replaces header links. IndexedDB stores pending captures for offline sync.

**Tech Stack:** Next.js, Tailwind CSS, next-pwa/Serwist, idb-keyval (IndexedDB), MediaRecorder API

---

## Phase 1: Mobile Layout

### Task 1: Create BottomNav Component

**Files:**
- Create: `components/BottomNav.tsx`

**Step 1: Create the component**

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Capture', icon: 'capture' },
  { href: '/library', label: 'Discoveries', icon: 'library' },
  { href: '/notes', label: 'Notes', icon: 'notes' },
  { href: '/archive', label: 'Archive', icon: 'archive' },
];

const Icons = {
  capture: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  library: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  notes: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  archive: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
  ),
};

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white sm:hidden">
      <div className="flex justify-around">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === '/' 
            ? pathname === '/' 
            : pathname.startsWith(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                isActive
                  ? 'text-gray-900'
                  : 'text-gray-500'
              }`}
            >
              {Icons[item.icon as keyof typeof Icons]}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

**Step 2: Verify file created**

Run: `ls -la components/BottomNav.tsx`
Expected: File exists

**Step 3: Commit**

```bash
git add components/BottomNav.tsx
git commit -m "feat: add BottomNav component for mobile"
```

---

### Task 2: Update Layout to Include BottomNav

**Files:**
- Modify: `app/layout.tsx`

**Step 1: Import and add BottomNav**

Add import at top:
```tsx
import BottomNav from '@/components/BottomNav';
```

Add BottomNav after `{children}` and add bottom padding to main content:

Change:
```tsx
<main className="mx-auto max-w-5xl px-4 py-8">
  {children}
</main>
```

To:
```tsx
<main className="mx-auto max-w-5xl px-4 py-8 pb-24 sm:pb-8">
  {children}
</main>
<BottomNav />
```

**Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: integrate BottomNav in layout with bottom padding"
```

---

### Task 3: Make Header Hide Nav Links on Mobile

**Files:**
- Modify: `components/Header.tsx`

**Step 1: Hide nav links on mobile, keep logo and user menu**

Change the nav links container from:
```tsx
<div className="flex items-center gap-6">
  <Link
    href="/"
```

To:
```tsx
<div className="hidden items-center gap-6 sm:flex">
  <Link
    href="/"
```

Also update the outer flex container to keep UserMenu visible:
Change:
```tsx
<div className="flex items-center gap-6">
```

To add a wrapper that separates nav links from UserMenu. Replace the entire `<div className="flex items-center gap-6">` section with:

```tsx
<div className="flex items-center gap-4">
  <div className="hidden items-center gap-6 sm:flex">
    <Link
      href="/"
      className={`text-sm font-medium transition-colors ${
        pathname === '/'
          ? 'text-gray-900'
          : 'text-gray-500 hover:text-gray-900'
      }`}
    >
      Capture
    </Link>
    <Link
      href="/library"
      className={`text-sm font-medium transition-colors ${
        pathname === '/library' || pathname.startsWith('/library')
          ? 'text-gray-900'
          : 'text-gray-500 hover:text-gray-900'
      }`}
    >
      Discoveries
    </Link>
    <Link
      href="/notes"
      className={`text-sm font-medium transition-colors ${
        pathname === '/notes' || pathname.startsWith('/notes')
          ? 'text-gray-900'
          : 'text-gray-500 hover:text-gray-900'
      }`}
    >
      Notes
    </Link>
    <Link
      href="/archive"
      className={`text-sm font-medium transition-colors ${
        pathname === '/archive' || pathname.startsWith('/archive')
          ? 'text-gray-900'
          : 'text-gray-500 hover:text-gray-900'
      }`}
    >
      Archive
    </Link>
  </div>
  <UserMenu />
</div>
```

**Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add components/Header.tsx
git commit -m "feat: hide header nav links on mobile, keep UserMenu"
```

---

### Task 4: Make CaptureZone Responsive

**Files:**
- Modify: `components/CaptureZone.tsx`

**Step 1: Reduce drop zone padding on mobile**

Find the drop zone div:
```tsx
className={`relative rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
```

Change to:
```tsx
className={`relative rounded-lg border-2 border-dashed p-6 sm:p-12 text-center transition-colors ${
```

**Step 2: Make results grid single column on mobile**

Find:
```tsx
<div className="grid gap-4 sm:grid-cols-2">
```

This is already correct (single column on mobile).

**Step 3: Make image preview thumbnails smaller on mobile**

Find:
```tsx
<img
  src={URL.createObjectURL(file)}
  alt={`Preview ${index + 1}`}
  className="h-24 w-24 rounded-lg object-cover"
/>
```

Change to:
```tsx
<img
  src={URL.createObjectURL(file)}
  alt={`Preview ${index + 1}`}
  className="h-16 w-16 sm:h-24 sm:w-24 rounded-lg object-cover"
/>
```

**Step 4: Make action buttons larger on mobile**

Find the Analyze button:
```tsx
className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
```

Change to:
```tsx
className="rounded-lg bg-gray-900 px-6 py-3 sm:py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
```

Do the same for Cancel button:
```tsx
className="rounded-lg px-6 py-3 sm:py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
```

**Step 5: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 6: Commit**

```bash
git add components/CaptureZone.tsx
git commit -m "feat: make CaptureZone responsive with smaller drop zone on mobile"
```

---

### Task 5: Make VoiceRecorder Buttons Larger on Mobile

**Files:**
- Modify: `components/VoiceRecorder.tsx`

**Step 1: Increase tap target for record button**

Find:
```tsx
className="flex items-center gap-2 rounded-full bg-gray-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
```

Change to:
```tsx
className="flex items-center gap-2 rounded-full bg-gray-900 px-6 py-4 sm:py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
```

**Step 2: Same for stop recording button**

Find:
```tsx
className="flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-red-700"
```

Change to:
```tsx
className="flex items-center gap-2 rounded-full bg-red-600 px-6 py-4 sm:py-3 text-sm font-medium text-white transition-colors hover:bg-red-700"
```

**Step 3: Make preview container full width on mobile**

Find:
```tsx
<div className="flex flex-col items-center gap-4 rounded-lg border border-gray-200 bg-white p-4">
```

Change to:
```tsx
<div className="flex w-full flex-col items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 sm:w-auto">
```

**Step 4: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add components/VoiceRecorder.tsx
git commit -m "feat: increase VoiceRecorder button tap targets on mobile"
```

---

### Task 6: Make TranscriptionPreview Full Width on Mobile

**Files:**
- Modify: `components/TranscriptionPreview.tsx`

**Step 1: Make container responsive**

Find:
```tsx
<div className="w-full max-w-lg rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
```

Change to:
```tsx
<div className="w-full max-w-lg rounded-lg border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
```

**Step 2: Make buttons larger on mobile**

Find the "Save as Note" button:
```tsx
className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
```

Change to:
```tsx
className="flex-1 rounded-lg bg-gray-100 px-4 py-3 sm:py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
```

Same for "Research This":
```tsx
className="flex-1 rounded-lg bg-gray-900 px-4 py-3 sm:py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
```

**Step 3: Make category buttons larger**

Find:
```tsx
className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
```

Change to:
```tsx
className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-3 sm:py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
```

**Step 4: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add components/TranscriptionPreview.tsx
git commit -m "feat: make TranscriptionPreview responsive with larger buttons"
```

---

### Task 7: Make DiscoveryCard Responsive

**Files:**
- Modify: `components/DiscoveryCard.tsx`

**Step 1: Make action buttons larger on mobile**

Find the archive button:
```tsx
className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
```

Change to:
```tsx
className="shrink-0 rounded p-2 sm:p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
```

Same for delete button:
```tsx
className="shrink-0 rounded p-2 sm:p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
```

**Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add components/DiscoveryCard.tsx
git commit -m "feat: increase DiscoveryCard action button tap targets"
```

---

### Task 8: Make NoteCard Responsive

**Files:**
- Modify: `components/NoteCard.tsx`

**Step 1: Make action buttons larger on mobile**

Find archive button:
```tsx
className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
```

Change to:
```tsx
className="rounded p-2 sm:p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
```

Same for delete button:
```tsx
className="rounded p-2 sm:p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
```

**Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add components/NoteCard.tsx
git commit -m "feat: increase NoteCard action button tap targets"
```

---

### Task 9: Make Library Filter Tabs Scrollable on Mobile

**Files:**
- Modify: `app/library/page.tsx`

**Step 1: Make filter container horizontally scrollable**

Find:
```tsx
<div className="flex flex-wrap justify-center gap-2">
```

Change to:
```tsx
<div className="flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:justify-center sm:overflow-x-visible sm:pb-0">
```

**Step 2: Prevent buttons from shrinking**

Find each filter button class and add `shrink-0`:
```tsx
className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
```

Apply to both the "All" button and the mapped type buttons.

**Step 3: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add app/library/page.tsx
git commit -m "feat: make library filter tabs horizontally scrollable on mobile"
```

---

### Task 10: Make Archive Tabs Scrollable on Mobile

**Files:**
- Modify: `app/archive/page.tsx`

**Step 1: Make tab container scrollable on mobile**

Find:
```tsx
<div className="flex justify-center gap-2">
```

Change to:
```tsx
<div className="flex gap-2 overflow-x-auto pb-2 sm:justify-center sm:overflow-x-visible sm:pb-0">
```

**Step 2: Add shrink-0 to buttons**

Find:
```tsx
className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
```

Change to:
```tsx
className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
```

Apply to both tab buttons.

**Step 3: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add app/archive/page.tsx
git commit -m "feat: make archive tabs scrollable on mobile"
```

---

## Phase 1 Complete Checkpoint

At this point, test on a mobile device or Chrome DevTools mobile view:
- Bottom nav appears and works
- Header shows only logo and user menu
- Drop zone is smaller, buttons are tappable
- Cards display well in single column
- Filter tabs scroll horizontally

---

## Phase 2: PWA Basics

### Task 11: Create PWA Icons

**Files:**
- Create: `public/icons/icon-192.png`
- Create: `public/icons/icon-512.png`

**Step 1: Create icons directory**

```bash
mkdir -p public/icons
```

**Step 2: Create a simple SVG icon and convert**

Create `public/icons/icon.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="64" fill="#111827"/>
  <text x="256" y="320" font-family="system-ui, sans-serif" font-size="240" font-weight="bold" fill="white" text-anchor="middle">Z</text>
</svg>
```

**Step 3: Generate PNGs using an online tool or ImageMagick**

If ImageMagick is available:
```bash
convert -background none -size 192x192 public/icons/icon.svg public/icons/icon-192.png
convert -background none -size 512x512 public/icons/icon.svg public/icons/icon-512.png
```

Or use https://realfavicongenerator.net/ to generate from SVG.

**Step 4: Commit**

```bash
git add public/icons/
git commit -m "feat: add PWA icons"
```

---

### Task 12: Create Web App Manifest

**Files:**
- Create: `public/manifest.json`

**Step 1: Create manifest file**

```json
{
  "name": "z-stash",
  "short_name": "z-stash",
  "description": "Capture inbox for knowledge and ideas",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#111827",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

**Step 2: Commit**

```bash
git add public/manifest.json
git commit -m "feat: add web app manifest"
```

---

### Task 13: Add PWA Meta Tags to Layout

**Files:**
- Modify: `app/layout.tsx`

**Step 1: Update metadata export**

Find the metadata export and update it:
```tsx
export const metadata: Metadata = {
  title: 'z-stash',
  description: 'Capture inbox for knowledge and ideas',
  manifest: '/manifest.json',
  themeColor: '#111827',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'z-stash',
  },
  formatDetection: {
    telephone: false,
  },
};
```

**Step 2: Add viewport export for PWA**

Add after metadata:
```tsx
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#111827',
};
```

**Step 3: Import Viewport type**

Add to imports:
```tsx
import type { Metadata, Viewport } from 'next';
```

**Step 4: Add apple-touch-icon link in head**

In the html head section, add:
```tsx
<link rel="apple-touch-icon" href="/icons/icon-192.png" />
```

**Step 5: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 6: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: add PWA meta tags and manifest link"
```

---

### Task 14: Install and Configure next-pwa

**Files:**
- Modify: `package.json`
- Modify: `next.config.js`

**Step 1: Install next-pwa**

```bash
npm install next-pwa
```

**Step 2: Update next.config.js**

```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {};

module.exports = withPWA(nextConfig);
```

**Step 3: Add generated files to .gitignore**

Add to `.gitignore`:
```
# PWA
public/sw.js
public/workbox-*.js
public/sw.js.map
public/workbox-*.js.map
```

**Step 4: Build to generate service worker**

```bash
npm run build
```

**Step 5: Commit**

```bash
git add package.json package-lock.json next.config.js .gitignore
git commit -m "feat: configure next-pwa for service worker generation"
```

---

## Phase 2 Complete Checkpoint

Test PWA functionality:
- Open Chrome DevTools > Application > Manifest - should show app info
- Application > Service Workers - should show registered worker
- On mobile Chrome, "Add to Home Screen" option should appear
- App launches in standalone mode from home screen

---

## Phase 3: Offline Capture

### Task 15: Install idb-keyval for IndexedDB

**Files:**
- Modify: `package.json`

**Step 1: Install idb-keyval**

```bash
npm install idb-keyval
```

**Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install idb-keyval for offline storage"
```

---

### Task 16: Create Offline Storage Module

**Files:**
- Create: `lib/offlineStorage.ts`

**Step 1: Create the storage module**

```typescript
import { get, set, del, keys } from 'idb-keyval';

export interface PendingCapture {
  id: string;
  type: 'image' | 'voice';
  blob: Blob;
  selectedType?: string;
  createdAt: string;
  status: 'pending' | 'processing' | 'failed';
}

const STORAGE_KEY_PREFIX = 'pending-capture-';

export async function savePendingCapture(capture: PendingCapture): Promise<void> {
  await set(`${STORAGE_KEY_PREFIX}${capture.id}`, capture);
}

export async function getPendingCapture(id: string): Promise<PendingCapture | undefined> {
  return get(`${STORAGE_KEY_PREFIX}${id}`);
}

export async function deletePendingCapture(id: string): Promise<void> {
  await del(`${STORAGE_KEY_PREFIX}${id}`);
}

export async function getAllPendingCaptures(): Promise<PendingCapture[]> {
  const allKeys = await keys();
  const pendingKeys = allKeys.filter(
    (key) => typeof key === 'string' && key.startsWith(STORAGE_KEY_PREFIX)
  );

  const captures: PendingCapture[] = [];
  for (const key of pendingKeys) {
    const capture = await get(key);
    if (capture) {
      captures.push(capture as PendingCapture);
    }
  }

  return captures.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function updateCaptureStatus(
  id: string,
  status: PendingCapture['status']
): Promise<void> {
  const capture = await getPendingCapture(id);
  if (capture) {
    capture.status = status;
    await savePendingCapture(capture);
  }
}

export async function getPendingCount(): Promise<number> {
  const allKeys = await keys();
  return allKeys.filter(
    (key) => typeof key === 'string' && key.startsWith(STORAGE_KEY_PREFIX)
  ).length;
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add lib/offlineStorage.ts
git commit -m "feat: add offline storage module for pending captures"
```

---

### Task 17: Create useOfflineQueue Hook

**Files:**
- Create: `hooks/useOfflineQueue.ts`

**Step 1: Create the hook**

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  PendingCapture,
  getAllPendingCaptures,
  savePendingCapture,
  deletePendingCapture,
  updateCaptureStatus,
  getPendingCount,
} from '@/lib/offlineStorage';

export function useOfflineQueue() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCaptures, setPendingCaptures] = useState<PendingCapture[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Track online status
  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load pending captures
  const loadPending = useCallback(async () => {
    const captures = await getAllPendingCaptures();
    setPendingCaptures(captures);
    setPendingCount(captures.length);
  }, []);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  // Add a new pending capture
  const addPendingCapture = useCallback(
    async (type: 'image' | 'voice', blob: Blob, selectedType?: string) => {
      const capture: PendingCapture = {
        id: crypto.randomUUID(),
        type,
        blob,
        selectedType,
        createdAt: new Date().toISOString(),
        status: 'pending',
      };

      await savePendingCapture(capture);
      await loadPending();
      return capture.id;
    },
    [loadPending]
  );

  // Remove a pending capture
  const removePendingCapture = useCallback(
    async (id: string) => {
      await deletePendingCapture(id);
      await loadPending();
    },
    [loadPending]
  );

  // Retry a failed capture
  const retryCapture = useCallback(
    async (id: string) => {
      await updateCaptureStatus(id, 'pending');
      await loadPending();
    },
    [loadPending]
  );

  // Sync a single capture
  const syncCapture = useCallback(
    async (capture: PendingCapture): Promise<boolean> => {
      try {
        await updateCaptureStatus(capture.id, 'processing');

        if (capture.type === 'image') {
          const formData = new FormData();
          formData.append('images', capture.blob, 'offline-capture.jpg');
          formData.append('type', capture.selectedType || 'other');

          const response = await fetch('/api/analyze', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) throw new Error('Analysis failed');
        } else {
          // Voice capture - transcribe first
          const formData = new FormData();
          formData.append('audio', capture.blob, 'recording.webm');

          const transcribeResponse = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });

          if (!transcribeResponse.ok) throw new Error('Transcription failed');

          const { transcription } = await transcribeResponse.json();

          // Save as note
          const noteResponse = await fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcription }),
          });

          if (!noteResponse.ok) throw new Error('Failed to save note');
        }

        await deletePendingCapture(capture.id);
        return true;
      } catch (error) {
        console.error('Sync failed:', error);
        await updateCaptureStatus(capture.id, 'failed');
        return false;
      }
    },
    []
  );

  // Sync all pending captures
  const syncAll = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    const captures = await getAllPendingCaptures();
    const pendingOnly = captures.filter((c) => c.status === 'pending');

    for (const capture of pendingOnly) {
      await syncCapture(capture);
    }

    await loadPending();
    setIsSyncing(false);
  }, [isOnline, isSyncing, syncCapture, loadPending]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      syncAll();
    }
  }, [isOnline]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    isOnline,
    pendingCaptures,
    pendingCount,
    isSyncing,
    addPendingCapture,
    removePendingCapture,
    retryCapture,
    syncAll,
    refresh: loadPending,
  };
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add hooks/useOfflineQueue.ts
git commit -m "feat: add useOfflineQueue hook for offline capture management"
```

---

### Task 18: Create PendingCaptures Component

**Files:**
- Create: `components/PendingCaptures.tsx`

**Step 1: Create the component**

```tsx
'use client';

import { PendingCapture } from '@/lib/offlineStorage';

interface PendingCapturesProps {
  captures: PendingCapture[];
  isSyncing: boolean;
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function PendingCaptures({
  captures,
  isSyncing,
  onRetry,
  onDelete,
}: PendingCapturesProps) {
  if (captures.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-medium text-amber-900">
          Pending ({captures.length})
        </h3>
        {isSyncing && (
          <span className="flex items-center gap-2 text-sm text-amber-700">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-300 border-t-amber-700" />
            Syncing...
          </span>
        )}
      </div>

      <div className="space-y-2">
        {captures.map((capture) => (
          <div
            key={capture.id}
            className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm"
          >
            <div className="flex items-center gap-3">
              {capture.type === 'image' ? (
                <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100 text-xl">
                  📸
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100 text-xl">
                  🎤
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {capture.type === 'image' ? 'Screenshot' : 'Voice note'}
                </p>
                <p className="text-xs text-gray-500">
                  {capture.status === 'failed' ? (
                    <span className="text-red-600">Failed to sync</span>
                  ) : capture.status === 'processing' ? (
                    'Processing...'
                  ) : (
                    'Waiting to sync'
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {capture.status === 'failed' && (
                <button
                  onClick={() => onRetry(capture.id)}
                  className="rounded px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-100"
                >
                  Retry
                </button>
              )}
              <button
                onClick={() => onDelete(capture.id)}
                className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-500"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add components/PendingCaptures.tsx
git commit -m "feat: add PendingCaptures component to display offline queue"
```

---

### Task 19: Integrate Offline Queue into CaptureZone

**Files:**
- Modify: `components/CaptureZone.tsx`

**Step 1: Import hook and component**

Add imports:
```tsx
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import PendingCaptures from './PendingCaptures';
```

**Step 2: Add hook usage at top of component**

After existing useState calls:
```tsx
const {
  isOnline,
  pendingCaptures,
  isSyncing,
  addPendingCapture,
  removePendingCapture,
  retryCapture,
} = useOfflineQueue();
```

**Step 3: Modify analyzeImages to handle offline**

Replace the analyzeImages function:
```tsx
const analyzeImages = async () => {
  // If offline, save to queue
  if (!isOnline) {
    for (const file of previewImages) {
      await addPendingCapture('image', file, selectedType);
    }
    setPreviewImages([]);
    setMode('idle');
    return;
  }

  setIsProcessing(true);
  setError(null);

  const formData = new FormData();
  previewImages.forEach((file) => {
    formData.append('images', file);
  });
  formData.append('type', selectedType);

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to analyze images');
    }

    setResults((prev) => [...data.results, ...prev]);
    setPreviewImages([]);
    setMode('idle');
  } catch (err) {
    setError(err instanceof Error ? err.message : 'An error occurred');
  } finally {
    setIsProcessing(false);
  }
};
```

**Step 4: Add PendingCaptures to render**

Add before the Results section:
```tsx
{/* Pending Captures */}
<PendingCaptures
  captures={pendingCaptures}
  isSyncing={isSyncing}
  onRetry={retryCapture}
  onDelete={removePendingCapture}
/>
```

**Step 5: Add offline indicator**

Add at top of the component's return, inside the outer div:
```tsx
{!isOnline && (
  <div className="rounded-lg bg-amber-100 px-4 py-2 text-center text-sm text-amber-800">
    You're offline. Captures will sync when connected.
  </div>
)}
```

**Step 6: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 7: Commit**

```bash
git add components/CaptureZone.tsx
git commit -m "feat: integrate offline queue into CaptureZone"
```

---

### Task 20: Add Pending Badge to BottomNav

**Files:**
- Modify: `components/BottomNav.tsx`

**Step 1: Import hook**

```tsx
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
```

**Step 2: Add hook usage**

Inside component:
```tsx
const { pendingCount } = useOfflineQueue();
```

**Step 3: Add badge to Capture icon**

Find the Capture nav item and add a badge:
```tsx
<Link
  key={item.href}
  href={item.href}
  className={`relative flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
    isActive
      ? 'text-gray-900'
      : 'text-gray-500'
  }`}
>
  {Icons[item.icon as keyof typeof Icons]}
  <span>{item.label}</span>
  {item.icon === 'capture' && pendingCount > 0 && (
    <span className="absolute right-1/4 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
      {pendingCount > 9 ? '9+' : pendingCount}
    </span>
  )}
</Link>
```

**Step 4: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add components/BottomNav.tsx
git commit -m "feat: add pending count badge to BottomNav"
```

---

## Phase 3 Complete Checkpoint

Test offline functionality:
- Go offline (Chrome DevTools > Network > Offline)
- Drop an image or record voice
- Should see "Saved offline" confirmation
- Pending section shows the capture
- Badge appears on Capture nav
- Go back online
- Should auto-sync and items appear in Discoveries/Notes

---

## Phase 4: Polish (Optional)

### Task 21: Test on Real Mobile Device

Manual testing checklist:
- [ ] App installs to home screen
- [ ] Launches in standalone mode
- [ ] Bottom nav is thumb-friendly
- [ ] Buttons are easy to tap
- [ ] Voice recording works
- [ ] Image upload works from camera roll
- [ ] Offline mode saves captures
- [ ] Sync works on reconnect

### Task 22: Final Commit

```bash
git add -A
git commit -m "feat: complete mobile & PWA improvements"
```

---

## Summary

This plan delivers:
1. **Mobile layout** - Bottom nav, responsive components, larger tap targets
2. **PWA** - Installable, cached assets, standalone mode
3. **Offline capture** - Save to IndexedDB, sync when online, visual queue

Each phase is independently useful and can be shipped separately.
