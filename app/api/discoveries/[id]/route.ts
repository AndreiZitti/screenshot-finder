import { NextRequest, NextResponse } from 'next/server';
import { createClientFromRequest } from '@/lib/supabase/api-client';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { supabase, user } = await createClientFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { data: existing } = await supabase
      .from('discoveries')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Discovery not found' }, { status: 404 });
    }

    const { error } = await supabase.from('discoveries').delete().eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json({ error: 'Failed to delete discovery' }, { status: 500 });
    }

    const { data: stillExists } = await supabase
      .from('discoveries')
      .select('id')
      .eq('id', id)
      .single();

    if (stillExists) {
      console.error('Delete failed - item still exists (likely RLS blocking)');
      return NextResponse.json(
        { error: 'Delete blocked - check database permissions' },
        { status: 403 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete discovery' }, { status: 500 });
  }
}
