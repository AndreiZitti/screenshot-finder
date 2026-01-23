import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ discoveries: [] });
    }

    const searchParams = request.nextUrl.searchParams;
    const archived = searchParams.get('archived');

    let query = supabase
      .from('discoveries')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by archived status
    if (archived === 'true') {
      query = query.not('archived_at', 'is', null);
    } else if (archived === 'false' || archived === null) {
      // Default: show only active (non-archived) items
      query = query.is('archived_at', null);
    }
    // archived === 'all' returns everything

    const { data, error } = await query;

    if (error) {
      console.error('Supabase fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch discoveries' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { discoveries: data || [] },
      {
        headers: {
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discoveries' },
      { status: 500 }
    );
  }
}
