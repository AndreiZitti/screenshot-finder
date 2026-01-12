# CLAUDE.md

This file provides context for AI assistants working on this codebase.

## Project Overview

**z-stash** is a PWA for capturing knowledge from screenshots and voice notes. It uses AI to analyze content, enrich it with web search, and save structured discoveries to a library.

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL + Auth + RLS)
- **AI Services:**
  - Groq (Llama 4 Scout for image analysis, Whisper for transcription)
  - Google Gemini 2.5 Flash (web search with grounding)
- **Integrations:** Notion API

## Project Structure

```
app/                    # Next.js App Router pages
  api/                  # API routes
    analyze/            # Image analysis endpoint
    transcribe/         # Voice transcription endpoint
    discoveries/        # CRUD for discoveries
    notes/              # CRUD for notes
    notion/             # Notion integration endpoint
  settings/             # User settings page
  library/              # Discoveries list
  notes/                # Notes list
  archive/              # Archived items

components/             # React components
  CaptureZone.tsx       # Main capture UI (screenshot/voice)
  DiscoveryCard.tsx     # Discovery display card
  NoteCard.tsx          # Note display card
  BottomNav.tsx         # Mobile navigation
  Header.tsx            # Top header with user menu

hooks/                  # Custom React hooks
  useOfflineQueue.ts    # Offline capture queue management
  useNotionSettings.ts  # Notion credentials (localStorage + Supabase)
  useSendToNotion.ts    # Send items to Notion

lib/                    # Utilities and services
  notion.ts             # Notion API client wrapper
  groq.ts               # Groq API client
  gemini.ts             # Gemini API client
  supabase.ts           # Supabase client
  supabase/             # Supabase SSR clients
  offlineStorage.ts     # IndexedDB for offline queue

types/                  # TypeScript types
  discovery.ts          # Discovery type definitions
  note.ts               # Note type definitions

supabase/migrations/    # Database migrations
```

## Key Patterns

### Data Flow
1. User captures screenshot or records voice
2. Content sent to `/api/analyze` or `/api/transcribe`
3. AI processes and enriches with web search
4. Result saved to Supabase
5. Optional: User sends to Notion via card button

### Authentication
- Supabase Auth with RLS policies
- Server components use `lib/supabase/server.ts`
- Client components use `lib/supabase/client.ts`

### Offline Support
- Captures queued in IndexedDB when offline
- `useOfflineQueue` hook manages the queue
- Pending count shown as badge on Capture nav item

### Notion Integration
- Per-user credentials stored in `user_settings` table + localStorage
- Env vars (`NOTION_API_KEY`, `NOTION_PAGE_ID`) as owner fallback
- User credentials take priority over env vars

## Database Schema

### discoveries
- `id`, `type`, `name`, `description`, `link`, `metadata`, `image_url`
- `created_at`, `archived_at`, `user_id`

### notes
- `id`, `transcription`, `created_at`, `archived_at`, `user_id`

### user_settings
- `user_id`, `notion_api_key`, `notion_page_id`, `updated_at`

## Common Tasks

### Adding a new discovery type
1. Add to `DiscoveryType` union in `types/discovery.ts`
2. Add label in `DISCOVERY_TYPES` and `DISCOVERY_TYPE_LABELS`
3. Add color in `TYPE_COLORS` in `DiscoveryCard.tsx`
4. Update AI prompt in `lib/gemini.ts` if needed

### Adding a new integration
1. Create client wrapper in `lib/`
2. Create API route in `app/api/`
3. Create settings hook in `hooks/`
4. Add UI to Settings page
5. Add button to card components

### Running locally
```bash
npm install
cp .env.example .env.local  # Fill in API keys
npm run dev
```

### Building
```bash
npm run build
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Yes | Groq API for image analysis and transcription |
| `GEMINI_API_KEY` | Yes | Google AI for web search enrichment |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `NOTION_API_KEY` | No | Default Notion integration token |
| `NOTION_PAGE_ID` | No | Default Notion page ID |

## Notes

- Mobile-first design with bottom navigation
- iOS safe area support via `env(safe-area-inset-bottom)`
- PWA manifest at `public/manifest.json`
- No test suite currently configured
