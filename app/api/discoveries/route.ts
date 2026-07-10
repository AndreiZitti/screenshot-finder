import { NextRequest, NextResponse } from 'next/server';
import { createClientFromRequest, isExternalRequest } from '@/lib/supabase/api-client';

export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await createClientFromRequest(request);
    if (!user) {
      if (isExternalRequest(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.json({ discoveries: [] });
    }

    const { data, error } = await supabase
      .from('discoveries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch discoveries' }, { status: 500 });
    }

    return NextResponse.json(
      { discoveries: data || [] },
      {
        headers: {
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
        },
      },
    );
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch discoveries' }, { status: 500 });
  }
}
