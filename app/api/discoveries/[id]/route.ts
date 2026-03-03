import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Handle archive/unarchive
    if ('archived' in body) {
      const archived_at = body.archived ? new Date().toISOString() : null;

      const { data, error } = await supabase
        .from('discoveries')
        .update({ archived_at })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase archive error:', error);
        return NextResponse.json(
          { error: 'Failed to update discovery' },
          { status: 500 }
        );
      }

      return NextResponse.json({ discovery: data });
    }

    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json(
      { error: 'Failed to update discovery' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // First check if the item exists
    const { data: existing } = await supabase
      .from('discoveries')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: 'Discovery not found' },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from('discoveries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete discovery' },
        { status: 500 }
      );
    }

    // Verify deletion
    const { data: stillExists } = await supabase
      .from('discoveries')
      .select('id')
      .eq('id', id)
      .single();

    if (stillExists) {
      console.error('Delete failed - item still exists (likely RLS blocking)');
      return NextResponse.json(
        { error: 'Delete blocked - check database permissions' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete discovery' },
      { status: 500 }
    );
  }
}
