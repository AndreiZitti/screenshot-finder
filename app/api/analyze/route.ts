import { NextRequest, NextResponse } from 'next/server';
import { analyzeImage } from '@/lib/gemini';
import { createClientFromRequest } from '@/lib/supabase/api-client';
import { resolveGeminiKey } from '@/lib/env';
import { Discovery, DiscoveryType } from '@/types/discovery';

export async function POST(request: NextRequest) {
  try {
    const { user } = await createClientFromRequest(request);

    let geminiKey: string | null = null;

    if (user) {
      geminiKey = await resolveGeminiKey(user.id);
    } else {
      geminiKey = request.headers.get('x-gemini-api-key');
    }

    if (!geminiKey) {
      return NextResponse.json(
        { error: 'No API key available. Set your Gemini key in Settings or pass via x-gemini-api-key header.', code: 'NO_API_KEY' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const images = formData.getAll('images') as File[];
    const type = (formData.get('type') as DiscoveryType) || 'series';
    const hint = formData.get('hint') as string | null;

    if (images.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      );
    }

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

      const info = await analyzeImage(base64, mimeType, type, hint || undefined, geminiKey);

      if (info.name === 'Unknown') {
        continue;
      }

      results.push({
        id: crypto.randomUUID(),
        type,
        name: info.name,
        description: info.description,
        link: info.link,
        metadata: info.metadata,
        image_url: null,
        notes: null,
        created_at: new Date().toISOString(),
        archived_at: null,
      });
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
