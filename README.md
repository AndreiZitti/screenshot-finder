<div align="center">

![header](https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12&height=120&section=header&animation=fadeIn)

# z-stash

_Capture knowledge and ideas from screenshots and voice notes_

![Next.js](https://img.shields.io/badge/Next.js-black?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-38bdf8?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3fcf8e?logo=supabase&logoColor=white)

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

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16, React 19 |
| Styling | Tailwind CSS |
| Database | Supabase |
| Image Analysis | Groq (Llama 4 Scout) |
| Transcription | Groq (Whisper Large v3 Turbo) |
| Web Search | Gemini 2.5 Flash + Grounding |

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
GROQ_API_KEY=
GEMINI_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

---

<div align="center">

## More Projects

Check out the full collection at **[zitti.ro](https://zitti.ro)**

Don't want to self-host? [Contact me](https://zitti.ro) — happy to set you up with an account.

![footer](https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12&height=80&section=footer)

</div>
