import { NextRequest, NextResponse } from 'next/server';
import { createClientFromRequest } from '@/lib/supabase/api-client';
import { deleteStashItem, getStashItem, normalizeKind } from '@/lib/control-stash';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ kind: string; id: string }> }
) {
  try {
    const { supabase, user } = await createClientFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { kind: rawKind, id } = await params;
    const kind = normalizeKind(rawKind);
    if (!kind) {
      return NextResponse.json(
        { error: 'Invalid kind. Use discoveries, links, notes, discovery, link, or note.' },
        { status: 400 }
      );
    }

    const item = await getStashItem(supabase, kind, id);
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    await deleteStashItem(supabase, kind, id);

    return NextResponse.json({
      success: true,
      deleted: true,
      item,
    });
  } catch (error) {
    console.error('Control stash delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete stash item' },
      { status: 500 }
    );
  }
}
