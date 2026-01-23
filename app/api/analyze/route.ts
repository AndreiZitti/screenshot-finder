import { NextRequest, NextResponse } from 'next/server';
import { extractName } from '@/lib/groq';
import { getDiscoveryInfo } from '@/lib/gemini';
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

      // Extract name from image using Groq
      const name = await extractName(base64, type);

      if (name === 'Unknown') {
        continue;
      }

      // Get detailed info using Gemini with web search
      const info = await getDiscoveryInfo(name, type);

      // Save to Supabase with user_id
      const { data, error } = await supabase
        .from('discoveries')
        .insert({
          user_id: user.id,
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
