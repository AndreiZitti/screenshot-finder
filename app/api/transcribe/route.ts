import { NextRequest, NextResponse } from 'next/server';
import { transcribe } from '@/lib/transcribe';
import { createClient } from '@/lib/supabase/server';
import { resolveGroqKey, resolveGeminiKey } from '@/lib/env';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Resolve Groq API key: user settings > header (guest) > env var
    let groqKey: string | null = null;
    let geminiKey: string | null = null;

    if (user) {
      groqKey = await resolveGroqKey(user.id);
      geminiKey = await resolveGeminiKey(user.id);
    }

    if (!groqKey) {
      const headerKey = request.headers.get('x-groq-api-key');
      if (headerKey) {
        groqKey = headerKey;
      }
    }

    if (!geminiKey) {
      const headerKey = request.headers.get('x-gemini-api-key');
      if (headerKey) {
        geminiKey = headerKey;
      }
    }

    if (!groqKey) {
      groqKey = process.env.GROQ_API_KEY || null;
    }

    if (!geminiKey) {
      geminiKey = process.env.GEMINI_API_KEY || null;
    }

    // Need at least one key for transcription (Groq preferred, Gemini as fallback)
    if (!groqKey && !geminiKey) {
      return NextResponse.json(
        { error: 'API key required for transcription (Groq or Gemini)', code: 'NO_API_KEY' },
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

    const text = await transcribe(buffer, mimeType, {
      groqApiKey: groqKey || undefined,
      geminiApiKey: geminiKey || undefined,
    });

    return NextResponse.json({ text });
  } catch (error) {
    console.error('Transcribe error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}
