import { NextRequest, NextResponse } from 'next/server';
import { createClientFromRequest } from '@/lib/supabase/api-client';
import { listStashItems, normalizeKind } from '@/lib/control-stash';

function parseBoundedInt(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value || '', 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await createClientFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const kind = normalizeKind(searchParams.get('kind'));
    if (kind === undefined) {
      return NextResponse.json(
        { error: 'Invalid kind. Use all, discoveries, links, notes, discovery, link, or note.' },
        { status: 400 }
      );
    }

    const archivedParam = searchParams.get('archived');
    const archived = archivedParam === 'include' || archivedParam === 'only'
      ? archivedParam
      : 'active';

    const limit = parseBoundedInt(searchParams.get('limit'), 100, 1, 500);
    const offset = parseBoundedInt(searchParams.get('offset'), 0, 0, 100000);
    const search = searchParams.get('q')?.trim() || null;

    const result = await listStashItems(supabase, {
      kind,
      search,
      archived,
      limit,
      offset,
    });

    return NextResponse.json({
      items: result.items,
      counts: result.counts,
      query: {
        kind: kind || 'all',
        q: search,
        archived,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Control stash list error:', error);
    return NextResponse.json(
      { error: 'Failed to list stash items' },
      { status: 500 }
    );
  }
}
