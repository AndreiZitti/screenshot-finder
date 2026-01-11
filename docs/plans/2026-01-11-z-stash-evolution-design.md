# z-stash: Knowledge Capture Evolution

## Overview

Evolve Series Finder into **z-stash** — a capture inbox for knowledge and ideas from screenshots and voice notes.

## Core Concept

Two input methods:
- **Screenshots** — snap what you see, AI identifies and researches it
- **Voice notes** — speak your thought, decide if it's a raw note or something to research

Two content types:
- **Discoveries** — researched items with AI-enriched metadata
- **Notes** — raw transcriptions, minimal structure

Lifecycle: **Capture → Triage → Library → Archive**

The app is an inbox, not a destination. Things flow through and get archived when processed.

## User Flows

### Image Upload Flow

```
[Drop/select images] → [Preview thumbnails] → [Select category] → [Click "Analyze"]
        ↓
[Groq extracts names] → [Gemini enriches with web search] → [Saved to Discoveries]
        ↓
[Results shown with cards]
```

### Voice Note Flow

```
[Tap record] → [Speak] → [Tap stop] → [See transcription preview]
        ↓
[Choose path]
   ├── "Save as Note" → [Saved to Notes, done]
   └── "Research this" → [Select category] → [Gemini enriches] → [Saved to Discoveries]
```

### Archive Flow

```
[Swipe/click archive on any item] → [Item moves to Archive section]
```

No prompts, no tracking. One action, done.

## Information Architecture

### Navigation

```
[Capture]     [Discoveries]     [Notes]     [Archive]
```

**Capture** — Upload/record zone. Where everything enters.

**Discoveries** — Researched items with filter tabs:
- All | Series | APIs | AI Tips | Gadgets | Other

**Notes** — Raw voice transcriptions. Minimal list:
- Transcription snippet, timestamp
- Actions: expand, archive, delete

**Archive** — All archived items with sub-tabs for Discoveries/Notes.

### URL Structure

```
/                        → Capture
/discoveries             → Discoveries list
/discoveries?type=series → Filtered
/notes                   → Notes list
/archive                 → Archived items
```

## Data Model

### Schema Changes

```sql
-- Add to existing discoveries table
ALTER TABLE discoveries ADD COLUMN archived_at TIMESTAMPTZ;

-- New notes table
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  transcription TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX idx_notes_archived ON notes(archived_at) WHERE archived_at IS NOT NULL;
CREATE INDEX idx_discoveries_archived ON discoveries(archived_at) WHERE archived_at IS NOT NULL;
```

### TypeScript Types

```typescript
interface Discovery {
  id: string;
  type: DiscoveryType;
  name: string;
  description: string | null;
  link: string | null;
  metadata: Record<string, string | null> | null;
  image_url: string | null;
  created_at: string;
  archived_at: string | null;  // NEW
}

interface Note {
  id: string;
  transcription: string;
  created_at: string;
  archived_at: string | null;
}
```

## Technical Implementation

### New API Routes

```
POST   /api/transcribe        → Upload audio, return transcription
POST   /api/notes             → Save a raw note
GET    /api/notes             → List notes (?archived=true)
DELETE /api/notes/[id]        → Delete a note
PATCH  /api/notes/[id]        → Archive/unarchive

PATCH  /api/discoveries/[id]  → Archive/unarchive (extend existing)
```

### Transcription Service

```typescript
// lib/whisper.ts
// Groq Whisper Turbo - $0.04/hour, 216x real-time

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const groq = getGroqClient();
  const transcription = await groq.audio.transcriptions.create({
    file: audioBlob,
    model: 'whisper-large-v3-turbo',
  });
  return transcription.text;
}
```

### Audio Recording

Browser MediaRecorder API — no external dependencies. Records webm/opus format.

## UI Components

### New Components

**VoiceRecorder** — Record button with states (idle, recording, transcribing)

**TranscriptionPreview** — Shows transcription with action buttons:
- "Save as Note" — direct save
- "Research This" — expands to category picker

**ImagePreview** — Staged upload:
- Thumbnail previews with remove button
- Category dropdown
- Explicit "Analyze" submit button

**NoteCard** — Minimal note display:
- Transcription snippet
- Timestamp
- Archive/delete actions

### Modified Components

- **UploadZone** — Refactor for staged flow
- **DiscoveryCard** — Add archive button
- **Header** — Update nav for new sections

## Implementation Order

### Phase 1: Foundation
1. Rename project to z-stash
2. Add `archived_at` to discoveries table
3. Create `notes` table
4. Add archive/unarchive API endpoints

### Phase 2: Archive Flow
5. Add archive button to DiscoveryCard
6. Create Archive page
7. Filter archived from Discoveries page

### Phase 3: Notes
8. Create Note types and API routes
9. Create NoteCard component
10. Create Notes page

### Phase 4: Voice Recording
11. Create `useVoiceRecorder` hook
12. Create `lib/whisper.ts`
13. Create `/api/transcribe` endpoint
14. Create VoiceRecorder component
15. Create TranscriptionPreview component

### Phase 5: Staged Upload
16. Refactor UploadZone for staged flow

### Phase 6: Navigation
17. Update Header with new nav
18. Add routing for new pages

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 16, React 19 |
| Styling | Tailwind CSS |
| Database | Supabase |
| Image Analysis | Groq (Llama 4 Scout) |
| Transcription | Groq (Whisper Large v3 Turbo) |
| Web Search | Gemini 2.5 Flash + Grounding |

## Discovery Types (unchanged)

- `series` — TV shows, movies, anime
- `api_library` — Programming libraries, APIs, SDKs
- `ai_tip` — AI prompts, techniques, workflows
- `gadget` — Hardware, devices, products
- `other` — Catch-all
