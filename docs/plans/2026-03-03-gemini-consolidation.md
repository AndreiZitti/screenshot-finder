# Gemini Consolidation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Consolidate vision processing to Gemini, merge settings/connections pages, and add transcription fallback.

**Architecture:** Single Gemini call handles image analysis + web search. Transcription uses Groq if available, falls back to Gemini. One unified Connections page replaces duplicate settings page.

**Tech Stack:** Next.js 16, TypeScript, Google Generative AI SDK, Groq SDK, Supabase

---

### Task 1: Update Gemini Client with Combined Vision + Search

**Files:**
- Modify: `lib/gemini.ts`

**Step 1: Add the new `analyzeImage` function**

Add this function to `lib/gemini.ts`:

```typescript
export async function analyzeImage(
  imageBase64: string,
  mimeType: string,
  type: DiscoveryType
): Promise<{ name: string } & DiscoveryInfo> {
  const model = getSearchModel();

  const prompt = `You are analyzing a screenshot. ${TYPE_PROMPTS[type]}

First, identify what this is. Then search the web to find detailed information about it.

${TYPE_SEARCH_PROMPTS[type]}

IMPORTANT: You MUST search the web to find accurate, up-to-date information.

Respond with ONLY a JSON object in this exact format, no other text:
{"name": "exact name identified", "description": "2-3 sentence description", "link": "official or most relevant URL", "metadata": {...}}

If you cannot identify the subject, respond with: {"name": "Unknown", "description": "", "link": "", "metadata": {}}`;

  const result = await model.generateContent([
    { text: prompt },
    {
      inlineData: {
        mimeType,
        data: imageBase64,
      },
    },
  ]);

  const text = result.response.text();

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
  } catch {
    return {
      name: 'Unknown',
      description: 'Unable to analyze image',
      link: '',
      metadata: {},
    };
  }
}
```

**Step 2: Add TYPE_PROMPTS constant (copy from old groq.ts)**

Add near the top of the file:

```typescript
const TYPE_PROMPTS: Record<DiscoveryType, string> = {
  series: 'Identify the TV show, movie, or anime title shown',
  api_library: 'Identify any programming library, API, SDK, or framework mentioned',
  ai_tip: 'Identify the AI technique, prompt pattern, tool, or workflow shown',
  gadget: 'Identify the tech product, device, or hardware shown',
  other: 'Identify the main subject, product, or concept shown',
};
```

**Step 3: Verify file has no TypeScript errors**

Run: `npx tsc --noEmit lib/gemini.ts`
Expected: No errors

**Step 4: Commit**

```bash
git add lib/gemini.ts
git commit -m "feat: add analyzeImage function combining vision + search"
```

---

### Task 2: Update Analyze API Route

**Files:**
- Modify: `app/api/analyze/route.ts`

**Step 1: Update imports and replace Groq calls with Gemini**

Replace the entire file with:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { analyzeImage } from '@/lib/gemini';
import { createClient } from '@/lib/supabase/server';
import { Discovery, DiscoveryType } from '@/types/discovery';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const images = formData.getAll('images') as File[];
    const type = (formData.get('type') as DiscoveryType) || 'series';

    if (images.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      );
    }

    // Limit file sizes (max 10MB per image)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    for (const image of images) {
      if (image.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `Image ${image.name} exceeds 10MB limit` },
          { status: 400 }
        );
      }
    }

    const results: Discovery[] = [];

    for (const image of images) {
      const buffer = await image.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const mimeType = image.type || 'image/jpeg';

      // Combined vision + search call
      const info = await analyzeImage(base64, mimeType, type);

      if (info.name === 'Unknown') {
        continue;
      }

      // Save to Supabase with user_id
      const { data, error } = await supabase
        .from('discoveries')
        .insert({
          user_id: user.id,
          type,
          name: info.name,
          description: info.description,
          link: info.link,
          metadata: info.metadata,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        continue;
      }

      results.push(data);
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Analyze error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze images' },
      { status: 500 }
    );
  }
}
```

**Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add app/api/analyze/route.ts
git commit -m "feat: use Gemini for combined vision + search, fix MIME type bug"
```

---

### Task 3: Create Unified Transcription Module

**Files:**
- Create: `lib/transcribe.ts`

**Step 1: Create the transcription module with fallback**

```typescript
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

let groqClient: Groq | null = null;

function getGroqClient(): Groq | null {
  if (!process.env.GROQ_API_KEY) {
    return null;
  }
  if (!groqClient) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return groqClient;
}

async function transcribeWithGroq(audioBuffer: Buffer, mimeType: string): Promise<string> {
  const groq = getGroqClient();
  if (!groq) {
    throw new Error('Groq client not available');
  }

  // Create a File-like object for Groq
  const file = new File([audioBuffer], 'audio.webm', { type: mimeType });

  const response = await groq.audio.transcriptions.create({
    file,
    model: 'whisper-large-v3',
    language: 'en',
  });

  return response.text;
}

async function transcribeWithGemini(audioBuffer: Buffer, mimeType: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const base64Audio = audioBuffer.toString('base64');

  const result = await model.generateContent([
    { text: 'Transcribe this audio. Return only the transcribed text, nothing else.' },
    {
      inlineData: {
        mimeType,
        data: base64Audio,
      },
    },
  ]);

  return result.response.text().trim();
}

export async function transcribe(audioBuffer: Buffer, mimeType: string): Promise<string> {
  const groq = getGroqClient();

  if (groq) {
    try {
      console.log('Using Groq Whisper for transcription');
      return await transcribeWithGroq(audioBuffer, mimeType);
    } catch (error) {
      console.error('Groq transcription failed, falling back to Gemini:', error);
    }
  }

  console.log('Using Gemini for transcription');
  return await transcribeWithGemini(audioBuffer, mimeType);
}
```

**Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit lib/transcribe.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add lib/transcribe.ts
git commit -m "feat: add unified transcription with Groq/Gemini fallback"
```

---

### Task 4: Update Transcribe API Route

**Files:**
- Modify: `app/api/transcribe/route.ts`

**Step 1: Read current file**

Check current implementation to understand the structure.

**Step 2: Update to use new transcription module**

Replace transcription logic to use `transcribe()` from `lib/transcribe.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { transcribe } from '@/lib/transcribe';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const audio = formData.get('audio') as File;

    if (!audio) {
      return NextResponse.json(
        { error: 'No audio provided' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await audio.arrayBuffer());
    const mimeType = audio.type || 'audio/webm';

    const text = await transcribe(buffer, mimeType);

    return NextResponse.json({ text });
  } catch (error) {
    console.error('Transcribe error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}
```

**Step 3: Verify no TypeScript errors**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add app/api/transcribe/route.ts
git commit -m "feat: use unified transcription module in API route"
```

---

### Task 5: Merge Settings Features into Connections Page

**Files:**
- Modify: `app/connections/page.tsx`
- Modify: `hooks/useNotionConnections.ts` (if needed)

**Step 1: Check if `setDefault` is exported from hook**

Read `hooks/useNotionConnections.ts` to verify `setDefault` function exists and is exported.

**Step 2: Add "Set as Default" to ConnectionCard in connections page**

Update the `ConnectionCard` component in `app/connections/page.tsx` to include:
- `is_default` badge display
- "Set as Default" button (checkmark icon)
- Call to `setDefault(connection.id)` on click

Add to the card's button group (before edit button):

```typescript
{!connection.is_default && (
  <button
    onClick={() => onSetDefault()}
    className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-green-600"
    title="Set as default"
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  </button>
)}
```

Add default badge to card display:

```typescript
{connection.is_default && (
  <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
    Default
  </span>
)}
```

**Step 3: Update ConnectionCard props**

Add `onSetDefault` prop and wire it through from parent.

**Step 4: Verify no TypeScript errors**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add app/connections/page.tsx hooks/useNotionConnections.ts
git commit -m "feat: add Set as Default to connections page"
```

---

### Task 6: Delete Old Files

**Files:**
- Delete: `app/settings/page.tsx`
- Delete: `lib/groq.ts`

**Step 1: Delete settings page**

```bash
rm -rf app/settings
```

**Step 2: Delete groq.ts (vision code no longer needed)**

```bash
rm lib/groq.ts
```

**Step 3: Check for any remaining imports of deleted files**

Run: `grep -r "from '@/lib/groq'" --include="*.ts" --include="*.tsx" .`
Run: `grep -r "from '@/app/settings'" --include="*.ts" --include="*.tsx" .`

Expected: No matches (or fix any found)

**Step 4: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove deprecated groq.ts and settings page"
```

---

### Task 7: Final Verification

**Step 1: Full build check**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 2: Start dev server and manual test**

Run: `npm run dev`

Test checklist:
- [ ] Upload JPEG image → analyzes correctly
- [ ] Upload PNG image → analyzes correctly (bug fix verified)
- [ ] Record voice note → transcribes
- [ ] Connections page loads
- [ ] Add new Notion connection works
- [ ] Set as Default appears and works
- [ ] Delete connection works

**Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address issues from testing"
```

---

## Summary

| Task | Description |
|------|-------------|
| 1 | Add `analyzeImage()` to gemini.ts |
| 2 | Update analyze API route |
| 3 | Create unified transcription module |
| 4 | Update transcribe API route |
| 5 | Add Set as Default to connections |
| 6 | Delete old files |
| 7 | Final verification |
