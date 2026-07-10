import { NextRequest, NextResponse } from 'next/server';
import { createClientFromRequest } from '@/lib/supabase/api-client';
import {
  deleteStashItem,
  getStashItem,
  normalizeKind,
  sendStashItemToNotion,
} from '@/lib/control-stash';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ kind: string; id: string }> },
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
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const connectionId = typeof body.connectionId === 'string' ? body.connectionId : undefined;
    const shouldDelete = body.deleteAfterSend === true || body.mode === 'move';

    const item = await getStashItem(supabase, kind, id);
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const notionResult = await sendStashItemToNotion(supabase, item, { connectionId });
    if (!notionResult.success) {
      return NextResponse.json(
        { error: notionResult.error || 'Failed to send item to Notion' },
        { status: 500 },
      );
    }

    if (shouldDelete) {
      await deleteStashItem(supabase, kind, id);
    }

    return NextResponse.json({
      success: true,
      sentToNotion: true,
      deleted: shouldDelete,
      item,
    });
  } catch (error) {
    console.error('Control stash Notion send error:', error);
    return NextResponse.json({ error: 'Failed to send stash item to Notion' }, { status: 500 });
  }
}
