import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('discoveries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch discoveries' },
        { status: 500 }
      );
    }

    return NextResponse.json({ discoveries: data || [] });
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discoveries' },
      { status: 500 }
    );
  }
}
