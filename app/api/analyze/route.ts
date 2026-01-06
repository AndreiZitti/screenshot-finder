import { NextRequest, NextResponse } from 'next/server';
import { extractName } from '@/lib/groq';
import { getDiscoveryInfo } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';
import { Discovery, DiscoveryType } from '@/types/discovery';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const images = formData.getAll('images') as File[];
    const type = (formData.get('type') as DiscoveryType) || 'series';

    if (images.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      );
    }

    const results: Discovery[] = [];

    for (const image of images) {
      const buffer = await image.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');

      // Extract name from image using Groq
      const name = await extractName(base64, type);

      if (name === 'Unknown') {
        continue;
      }

      // Get detailed info using Gemini with web search
      const info = await getDiscoveryInfo(name, type);

      // Save to Supabase
      const { data, error } = await supabase
        .from('discoveries')
        .insert({
          type,
          name,
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
