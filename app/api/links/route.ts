import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ links: [] });
    }

    const searchParams = request.nextUrl.searchParams;
    const archived = searchParams.get('archived');

    let query = supabase
      .from('links')
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
        { error: 'Failed to fetch links' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { links: data || [] },
      {
        headers: {
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch links' },
      { status: 500 }
    );
  }
}

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

    const body = await request.json();
    const { url, name, platform, thumbnail, tags, notes } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('links')
      .insert({
        user_id: user.id,
        url,
        name,
        platform,
        thumbnail,
        tags: tags || [],
        notes,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Failed to create link' },
        { status: 500 }
      );
    }

    return NextResponse.json({ link: data });
  } catch (error) {
    console.error('Create error:', error);
    return NextResponse.json(
      { error: 'Failed to create link' },
      { status: 500 }
    );
  }
}
