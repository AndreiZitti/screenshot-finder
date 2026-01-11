# z-stash Mobile & PWA Improvements

## Overview

Improve z-stash for mobile use and add PWA capabilities for offline capture. The app's feature set is complete — this focuses on polish and accessibility.

## Goals

1. Fix mobile layout issues (things don't fit, buttons hard to tap)
2. Make app installable as PWA (home screen icon, standalone mode)
3. Enable offline capture (save to local storage, analyze when back online)

## Non-Goals

- Push notifications
- New features beyond offline support
- Complete mobile-first redesign

## Mobile Layout Fixes

### Problem

Current layout assumes desktop width. On mobile:
- Header nav items crowd together
- Drop zone is too large, pushes content off screen
- Cards don't stack well
- Buttons are small tap targets

### Solution

**Header** — Collapse to bottom navigation bar on mobile (more thumb-friendly).

**Capture page**:
- Smaller drop zone (less padding, shorter height)
- Voice recorder button more prominent
- Category selector becomes full-width dropdown

**Cards (Discovery/Note)**:
- Full-width single column on mobile
- Larger action buttons (44px minimum tap target)
- Metadata collapses into expandable section

**Filter tabs** (Library page):
- Horizontally scrollable pill bar instead of wrapping

### Breakpoint Strategy

- `< 640px` (mobile): Single column, bottom nav, compact elements
- `≥ 640px` (tablet+): Current layout with minor tweaks

### CSS Approach

Use Tailwind's responsive prefixes (`sm:`, `md:`) on existing components rather than creating separate mobile components.

## PWA Setup

### Manifest

File: `public/manifest.json`

```json
{
  "name": "z-stash",
  "short_name": "z-stash",
  "description": "Capture inbox for knowledge and ideas",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#111827",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Service Worker

Using `next-pwa` or Serwist:
- Cache static assets (JS, CSS, fonts)
- Cache API responses with network-first strategy
- Precache main pages (/, /library, /notes, /archive)

### Install Prompt

- Small banner at bottom: "Add to home screen for quick access"
- Dismissable, remembers preference in localStorage
- Only shows on mobile after 2+ visits

## Offline Capture

### Storage

IndexedDB via `idb-keyval` or raw IndexedDB API.

### Schema

```typescript
interface PendingCapture {
  id: string;
  type: 'image' | 'voice';
  blob: Blob;
  selectedType?: DiscoveryType;  // For images
  transcription?: string;        // For voice (null until synced)
  createdAt: string;
  status: 'pending' | 'processing' | 'failed';
}
```

### Capture Flow (Offline)

1. User drops image or records voice
2. Detect offline (`navigator.onLine` + events)
3. Save blob to IndexedDB with `status: 'pending'`
4. Show confirmation: "Saved offline. Will analyze when connected."
5. Item appears in "Pending" section on Capture page

### Sync Flow (Back Online)

1. Detect `online` event
2. Process queue one by one
3. On success: remove from IndexedDB, item appears in Discoveries/Notes
4. On failure: mark as `failed`, require manual retry

### UI Indicators

- Badge on Capture nav: "2 pending"
- Pending section shows thumbnails/transcriptions waiting to sync
- Failed items show "Retry" button

### Limitations

Voice transcription requires network (Whisper API). Offline voice notes save the audio blob and transcribe on sync.

## Implementation Order

### Phase 1: Mobile Layout

1. Add bottom navigation bar component (mobile only)
2. Make Header responsive (hide nav links on mobile)
3. Fix CaptureZone — smaller drop zone, stacked layout
4. Fix cards — full width, larger tap targets
5. Fix filter tabs — horizontal scroll on mobile

### Phase 2: PWA Basics

6. Create app icons (192px, 512px)
7. Add `manifest.json`
8. Set up service worker with `next-pwa` or Serwist
9. Add meta tags for iOS/Android
10. Optional: Add install prompt banner

### Phase 3: Offline Capture

11. Set up IndexedDB storage (`lib/offlineStorage.ts`)
12. Create `useOfflineQueue` hook
13. Add offline detection to CaptureZone
14. Create PendingCaptures component
15. Implement sync-on-reconnect logic
16. Add pending badge to navigation

### Phase 4: Polish

17. Test on actual mobile devices
18. Add loading/sync animations
19. Handle edge cases (large files, storage limits)

## Tech Choices

| Component | Technology |
|-----------|------------|
| PWA | next-pwa or Serwist |
| Offline Storage | IndexedDB (idb-keyval) |
| Responsive | Tailwind breakpoints |
| Icons | Generated from SVG source |

## Open Questions

None — design validated with user.
