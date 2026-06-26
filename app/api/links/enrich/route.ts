import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClientFromRequest } from '@/lib/supabase/api-client';
import { resolveGeminiKey } from '@/lib/env';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, name, platform } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    const { user } = await createClientFromRequest(request);

    let geminiKey: string | null = null;

    if (user) {
      geminiKey = await resolveGeminiKey(user.id);
    } else {
      geminiKey = request.headers.get('x-gemini-api-key');
    }

    if (!geminiKey) {
      return NextResponse.json({ description: null, suggestedTags: [] });
    }

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are analyzing a saved link. Based on the URL and metadata below, provide:
1. A concise 1-2 sentence description of what this link is about.
2. Suggest 2-3 relevant tags from this list: watch-later, recipe, music, funny, tutorial, inspo. You may also suggest new short tags if none of the existing ones fit well.

URL: ${url}
Title: ${name || 'Unknown'}
Platform: ${platform || 'unknown'}

Respond with ONLY a JSON object in this exact format, no other text:
{"description": "1-2 sentence summary", "suggestedTags": ["tag1", "tag2"]}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json({
          description: parsed.description || null,
          suggestedTags: Array.isArray(parsed.suggestedTags) ? parsed.suggestedTags : [],
        });
      }
      return NextResponse.json({ description: null, suggestedTags: [] });
    } catch {
      return NextResponse.json({ description: null, suggestedTags: [] });
    }
  } catch (error) {
    console.error('Link enrich error:', error);
    return NextResponse.json({ description: null, suggestedTags: [] });
  }
}
