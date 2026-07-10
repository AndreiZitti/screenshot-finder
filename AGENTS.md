# AGENTS.md

## Project overview

z-stash is a mobile-first PWA for turning screenshots, links, and voice notes into an AI-enriched personal knowledge stash.

## Stack

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS
- Supabase Auth and PostgreSQL with RLS in the `stash` schema
- Gemini for image analysis, link enrichment, and transcription
- IndexedDB for local-first data and offline queues
- Notion API for optional export

## Main areas

- `app/` — Capture, Stash, Settings, Login, and API routes
- `components/` — capture controls, cards, navigation, dialogs, and PWA registration
- `contexts/` — auth-adjacent shared UI state and Notion connection state
- `hooks/` — recording, offline queue, API keys, sync cache, and Notion actions
- `lib/db/` — IndexedDB DAL and Supabase synchronization
- `lib/supabase/` — browser, server, proxy, and API clients
- `supabase/migrations/` — ordered schema migrations
- `docs/` — API, deployment, screenshots, and historical plans

## Data model

- `discoveries` — AI discoveries and voice notes (`type = 'note'`)
- `links` — saved and enriched URLs
- `user_settings` — per-user Gemini key
- `notion_connections` — named Notion destinations

Legacy standalone notes are migrated into discoveries by `20260710_consolidate_notes.sql`.

## Development

```bash
nvm use
npm ci
npm run dev
```

Before handing off a change, run:

```bash
npm run check
```

Keep changes mobile-first, preserve the local-first sync model, do not bypass RLS or the production allowlist, and never commit credentials or personal capture data.
