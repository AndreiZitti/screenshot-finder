# Multi-Content Type Discovery

## Overview

Evolve the app from series-only to support multiple content types discovered from screenshots: Series/Media, API/Libraries, AI Tips, Tech Gadgets, and Other.

## Content Types

| Type | Description | Example |
|------|-------------|---------|
| `series` | TV shows, movies, anime | Breaking Bad, Supercube |
| `api_library` | Programming libraries, APIs, SDKs | React, Stripe API |
| `ai_tip` | AI prompts, techniques, tools | Chain-of-thought prompting |
| `gadget` | Hardware, devices, accessories | Steam Deck, AirPods |
| `other` | Catch-all for miscellaneous | Books, courses, etc. |

## Database Schema

Single unified `discoveries` table:

```sql
CREATE TABLE discoveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,  -- 'series' | 'api_library' | 'ai_tip' | 'gadget' | 'other'
  name TEXT NOT NULL,
  description TEXT,
  link TEXT,
  metadata JSONB,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_discoveries_type ON discoveries(type);
CREATE INDEX idx_discoveries_created_at ON discoveries(created_at DESC);
```

### Metadata Examples by Type

**Series:**
```json
{ "rating": "8.5/10 IMDb", "seasons": "5", "genre": "Drama", "where_to_watch": "Netflix" }
```

**API/Library:**
```json
{ "stars": "45k", "language": "TypeScript", "install": "npm install react", "docs": "https://react.dev" }
```

**AI Tip:**
```json
{ "category": "Prompting", "source": "Twitter/@user", "tools": ["ChatGPT", "Claude"] }
```

**Gadget:**
```json
{ "price": "$399", "specs": "OLED, 512GB", "buy_at": "Amazon, Best Buy" }
```

## Prompts

### Groq (Image Analysis)

```
You are analyzing a screenshot. The user is looking for: {type}

Identification rules by type:
- series: Identify the TV show, movie, or anime title
- api_library: Identify any programming library, API, SDK, or framework
- ai_tip: Identify the AI technique, prompt pattern, tool, or workflow
- gadget: Identify the tech product, device, or hardware
- other: Identify the main subject/product/concept

Return ONLY the name, nothing else. If unidentifiable, return "Unknown".
```

### Gemini (Web Search)

```
Search the web for "{name}" (content type: {type}).

Find and return information based on type:
- series: synopsis, rating, seasons, genre, streaming platforms
- api_library: description, GitHub stars, language, documentation URL, install command
- ai_tip: description, source/author, category, related tools
- gadget: description, price range, specifications, where to buy
- other: description and any relevant link

Return JSON: { "description": "...", "link": "...", "metadata": {...} }
```

## UI Changes

### Upload Page
- Dropdown selector above upload zone
- Options: Series/Media, API/Library, AI Tips, Tech Gadgets, Other
- Selected type passed to `/api/analyze`

### Library Page
- Filter tabs: All | Series | APIs | AI Tips | Gadgets | Other
- Default: "All" selected
- URL query param for state: `/library?type=series`

### Discovery Card
- Type badge in corner
- Common fields: name, description, link, delete
- Type-specific metadata rendering

## File Changes

| Current | New |
|---------|-----|
| `types/series.ts` | `types/discovery.ts` |
| `components/SeriesCard.tsx` | `components/DiscoveryCard.tsx` |
| `app/api/series/[id]/route.ts` | `app/api/discoveries/[id]/route.ts` |

## Implementation Order

1. Create `discoveries` table in Supabase
2. Create `types/discovery.ts`
3. Update `lib/groq.ts` - accept type parameter
4. Update `lib/gemini.ts` - accept type parameter, return flexible structure
5. Update `/api/analyze` - handle type, save to discoveries
6. Add dropdown to upload page
7. Update library page with filter tabs
8. Create DiscoveryCard component
9. Cleanup old series references

## Migration

Existing series data can be migrated:

```sql
INSERT INTO discoveries (id, type, name, description, link, metadata, created_at)
SELECT
  id,
  'series',
  name,
  synopsis,
  where_to_watch,
  jsonb_build_object('rating', rating, 'seasons', seasons, 'genre', genre, 'where_to_watch', where_to_watch),
  created_at
FROM series;
```
