<div align="center">

![header](https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12&height=120&section=header&animation=fadeIn)

# z-stash

_Capture knowledge and ideas from screenshots and voice notes_

![Next.js](https://img.shields.io/badge/Next.js-black?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-38bdf8?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3fcf8e?logo=supabase&logoColor=white)
![Notion](https://img.shields.io/badge/Notion-000000?logo=notion&logoColor=white)

</div>

## How it works

```
[Screenshot/Voice Note] → [AI Analysis] → [Web Search Enrichment] → [Save to Library]
```

**Input methods:**
- **Screenshots** — AI identifies what you're looking at and researches it
- **Voice notes** — Transcribe and save as a note, or research what you mentioned

**Discovery types:**
- **Series / Media** — TV shows, movies, anime
- **API / Library** — Programming libraries, SDKs, frameworks
- **AI Tips** — Prompts, techniques, workflows
- **Tech Gadgets** — Devices, hardware, products

## Features

- **PWA Support** — Install on mobile, works offline with queued captures
- **Notion Integration** — Send discoveries and notes to a Notion page
- **Archive** — Move processed items out of your main library
- **iOS Optimized** — Safe area support for notched iPhones

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16, React 19 |
| Styling | Tailwind CSS |
| Database | Supabase |
| Image Analysis | Groq (Llama 4 Scout) |
| Transcription | Groq (Whisper Large v3 Turbo) |
| Web Search | Gemini 2.5 Flash + Grounding |
| Export | Notion API |

## Getting Started

```bash
git clone https://github.com/AndreiZitti/z-stash.git
cd z-stash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000

## Environment Variables

```env
# Required
GROQ_API_KEY=
GEMINI_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Optional - Notion Integration (per-user settings also available)
NOTION_API_KEY=
NOTION_PAGE_ID=
```

## Notion Setup

1. Create an integration at [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Share your target page with the integration
3. Either:
   - Add credentials to `.env.local` (owner default), or
   - Configure per-user in Settings page

## Database Setup

Run the migrations in `supabase/migrations/` or execute them in the Supabase SQL editor.

---

<div align="center">

## More Projects

Check out the full collection at **[zitti.ro](https://zitti.ro)**

Don't want to self-host? [Contact me](https://zitti.ro) — happy to set you up with an account.

![footer](https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12&height=80&section=footer)

</div>
