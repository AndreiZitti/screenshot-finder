import { NextRequest, NextResponse } from 'next/server';
import { transcribe } from '@/lib/transcribe';
import { createClientFromRequest } from '@/lib/supabase/api-client';
import { resolveGroqKey, resolveGeminiKey } from '@/lib/env';

export async function POST(request: NextRequest) {
  try {
    const { user } = await createClientFromRequest(request);

    let groqKey: string | null = null;
    let geminiKey: string | null = null;

    if (user) {
      groqKey = await resolveGroqKey(user.id);
      geminiKey = await resolveGeminiKey(user.id);
    } else {
      groqKey = request.headers.get('x-groq-api-key');
      geminiKey = request.headers.get('x-gemini-api-key');
    }

    if (!groqKey && !geminiKey) {
      return NextResponse.json(
        { error: 'No API key available. Set your Groq or Gemini key in Settings or pass via x-groq-api-key / x-gemini-api-key header.', code: 'NO_API_KEY' },
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
