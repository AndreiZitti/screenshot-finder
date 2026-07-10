import { NextRequest, NextResponse } from 'next/server';
import { transcribe } from '@/lib/transcribe';
import { createClientFromRequest } from '@/lib/supabase/api-client';
import { isAccessControlEnforced } from '@/lib/auth/access-control';
import { resolveGeminiKey } from '@/lib/env';

export async function POST(request: NextRequest) {
  try {
    const { user } = await createClientFromRequest(request);

    let geminiKey: string | null = null;

    const headerGeminiKey = request.headers.get('x-gemini-api-key');

    if (user) {
      geminiKey = (await resolveGeminiKey(user.id)) || headerGeminiKey;
    } else {
      if (isAccessControlEnforced()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      geminiKey = headerGeminiKey;
    }

    if (!geminiKey) {
      return NextResponse.json(
        {
          error:
            'No API key available. Set your Gemini key in Settings or pass via x-gemini-api-key header.',
          code: 'NO_API_KEY',
        },
        { status: 401 },
      );
    }

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Audio upload must use multipart/form-data' },
        { status: 400 },
      );
    }

    const formData = await request.formData();
    const audio = formData.get('audio') as File;

    if (!audio) {
      return NextResponse.json({ error: 'No audio provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await audio.arrayBuffer());
    const mimeType = audio.type || 'audio/webm';

    const text = await transcribe(buffer, mimeType, {
      geminiApiKey: geminiKey || undefined,
    });

    return NextResponse.json({ transcription: text, text });
  } catch (error) {
    console.error('Transcribe error:', error);
    return NextResponse.json({ error: 'Failed to transcribe audio' }, { status: 500 });
  }
}
