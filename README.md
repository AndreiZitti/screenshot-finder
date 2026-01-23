<div align="center">

![header](https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12&height=120&section=header&animation=fadeIn)

# z-stash

![Next.js](https://img.shields.io/badge/Next.js-black?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-38bdf8?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3fcf8e?logo=supabase&logoColor=white)

</div>

## The Problem

I always screenshot things I find online—a TV show someone recommended, a cool library on GitHub, a gadget I want to look up later. I take voice notes too, thinking "I'll come back to this." But then life happens, I get busy, and those screenshots just pile up in my camera roll, forgotten.

## The Solution

I built z-stash to make capturing and organizing these discoveries effortless:

1. **Upload a screenshot** → AI identifies what it is and researches the basics
2. **Record a voice note** → Gets transcribed and saved instantly
3. **Everything lands in your Stash** → Organized by type (series, libraries, gadgets, etc.)
4. **Send to Notion** → One tap to export to your daily driver

No more "I'll look it up later" that never happens.

## For Users

If you have an account from me, you just need to connect your own Notion page in the Connections tab. Everything else is handled.

## Self-Hosting

You'll need API keys for the AI services and a Supabase project:

```env
# Supabase (database + auth)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# AI Services
GROQ_API_KEY=your-groq-key          # Image analysis + transcription
GEMINI_API_KEY=your-gemini-key      # Web search enrichment

# Optional: Default Notion (users can add their own)
NOTION_API_KEY=your-notion-key
NOTION_PAGE_ID=your-page-id
```

Then:

```bash
git clone https://github.com/AZitti/z-stash.git
cd z-stash
npm install
npm run dev
```

Run the migrations in `supabase/migrations/` for the database schema.

## PWA & Offline

z-stash is a Progressive Web App. On mobile, go to your browser menu → "Add to Home Screen" and it acts like a native app.

**Offline processing**: If you capture something while offline, it gets queued locally and syncs automatically when you're back online. Your stash is also cached locally so you can browse it without connection.

---

<div align="center">

More projects at **[zitti.ro](https://zitti.ro)**

![footer](https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12&height=80&section=footer)

</div>
