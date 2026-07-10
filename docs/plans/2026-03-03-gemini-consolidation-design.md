# Gemini Consolidation & Connections Merge

**Date:** 2026-03-03
**Status:** Approved

## Summary

Consolidate vision processing from Groq to Gemini, merge duplicate settings/connections pages, and fix the image MIME type bug.

## Goals

1. Single Gemini call for image analysis + web search (was: Groq → Gemini)
2. Transcription fallback: Groq Whisper if available, else Gemini
3. Merge `/settings` into `/connections` (delete duplicate page)
4. Fix MIME type bug (was hardcoded as `image/jpeg`)

## Architecture

### Before

```
Image Upload → Groq (extract name) → Gemini (web search) → Supabase
Voice Note  → Groq Whisper → Supabase

/settings    → Notion connections (with default)
/connections → Notion connections (without default)
```

### After

```
Image Upload → Gemini (analyze + web search in one call) → Supabase
Voice Note  → Groq Whisper (if key set) OR Gemini → Supabase

/connections → All integrations (Notion with default)
/settings    → DELETED
```

## File Changes

| Action | File                            | Description                                     |
| ------ | ------------------------------- | ----------------------------------------------- |
| Delete | `app/settings/page.tsx`         | Merge into connections                          |
| Delete | `lib/groq.ts`                   | Vision removed, whisper moves to transcribe.ts  |
| Create | `lib/transcribe.ts`             | Unified transcription with Groq/Gemini fallback |
| Modify | `lib/gemini.ts`                 | Add `analyzeImage()` combining vision + search  |
| Modify | `app/api/analyze/route.ts`      | Use new Gemini function, pass MIME type         |
| Modify | `app/api/transcribe/route.ts`   | Use unified transcription                       |
| Modify | `app/connections/page.tsx`      | Add "Set as Default" feature                    |
| Modify | `hooks/useNotionConnections.ts` | Ensure `setDefault()` is exported               |

## API Design

### `analyzeImage(imageBase64, mimeType, type)`

Single Gemini call that:

1. Analyzes image to identify subject
2. Uses web search grounding to find details
3. Returns `{ name, description, link, metadata }`

### `transcribe(audioBlob)`

```
if (GROQ_API_KEY)
  → Groq Whisper (164x realtime speed)
else
  → Gemini audio transcription
```

Returns `{ text: string }`

## Environment Variables

| Variable         | Required | Description                            |
| ---------------- | -------- | -------------------------------------- |
| `GEMINI_API_KEY` | Yes      | Vision, search, fallback transcription |
| `GROQ_API_KEY`   | No       | Fast transcription (optional)          |

## Testing Checklist

- [ ] Image upload (JPEG) analyzes correctly
- [ ] Image upload (PNG) works (bug fix verified)
- [ ] Voice note with Groq key uses Groq
- [ ] Voice note without Groq key uses Gemini
- [ ] Connections: add, edit, delete, set default
- [ ] Send to Notion uses default connection
- [ ] `npm run build` passes
- [ ] No dead code references

## Cost Impact

~$0.03/month for 100 images + 100 voice notes (negligible change)
