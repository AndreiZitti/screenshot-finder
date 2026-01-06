import { NextRequest, NextResponse } from 'next/server';
import { extractSeriesName } from '@/lib/groq';
import { getSeriesInfo } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';
import { Series } from '@/types/series';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const images = formData.getAll('images') as File[];

    if (images.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      );
    }

    const results: Series[] = [];

    for (const image of images) {
      const buffer = await image.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');

      // Extract series name from image using Groq
      const seriesName = await extractSeriesName(base64);

      if (seriesName === 'Unknown') {
        continue;
      }

      // Get detailed info using Gemini with grounding
      const info = await getSeriesInfo(seriesName);

      // Save to Supabase
      const { data, error } = await supabase
        .from('series')
        .insert({
          name: seriesName,
          synopsis: info.synopsis,
          rating: info.rating,
          seasons: info.seasons,
          genre: info.genre,
          where_to_watch: info.where_to_watch,
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
