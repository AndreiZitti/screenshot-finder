import { sendToNotion, type NotionCredentials } from '@/lib/notion';
import type { createClientFromRequest } from '@/lib/supabase/api-client';
import type { Discovery } from '@/types/discovery';
import type { Link } from '@/types/link';

export type StashKind = 'discoveries' | 'links' | 'notes';
export type StashItem = { kind: 'discovery'; data: Discovery } | { kind: 'link'; data: Link };

type ArchivedFilter = 'active' | 'include' | 'only';
type RequestSupabaseClient = Awaited<ReturnType<typeof createClientFromRequest>>['supabase'];

const KIND_TO_TABLE: Record<StashKind, 'discoveries' | 'links'> = {
  discoveries: 'discoveries',
  links: 'links',
  notes: 'discoveries',
};

export function normalizeKind(kind: string | null): StashKind | null | undefined {
  if (!kind || kind === 'all') return null;
  if (kind === 'discovery') return 'discoveries';
  if (kind === 'link') return 'links';
  if (kind === 'note') return 'notes';
  if (kind === 'discoveries' || kind === 'links' || kind === 'notes') return kind;
  return undefined;
}

export function toItem(kind: StashKind, data: Discovery | Link): StashItem {
  if (kind === 'discoveries' || kind === 'notes') {
    return { kind: 'discovery', data: data as Discovery };
  }
  if (kind === 'links') return { kind: 'link', data: data as Link };
  return { kind: 'discovery', data: data as Discovery };
}

function applyArchivedFilter<T>(query: T, archived: ArchivedFilter): T {
  const filterable = query as T & {
    is: (column: string, value: null) => T;
    not: (column: string, operator: string, value: null) => T;
  };

  if (archived === 'only') return filterable.not('archived_at', 'is', null);
  if (archived === 'active') return filterable.is('archived_at', null);
  return query;
}

function applySearch<T>(kind: StashKind, query: T, search: string | null): T {
  if (!search) return query;
  const escaped = search.replaceAll('%', '\\%').replaceAll(',', '\\,');
  const pattern = `%${escaped}%`;
  const searchable = query as T & { or: (filters: string) => T };

  if (kind === 'discoveries' || kind === 'notes') {
    return searchable.or(
      `name.ilike.${pattern},description.ilike.${pattern},link.ilike.${pattern},notes.ilike.${pattern}`,
    );
  }

  if (kind === 'links') {
    return searchable.or(
      `name.ilike.${pattern},description.ilike.${pattern},url.ilike.${pattern},platform.ilike.${pattern},notes.ilike.${pattern}`,
    );
  }
  return query;
}

export async function listStashItems(
  supabase: RequestSupabaseClient,
  options: {
    kind: StashKind | null;
    search: string | null;
    archived: ArchivedFilter;
    limit: number;
    offset: number;
  },
): Promise<{ items: StashItem[]; counts: Record<StashKind, number> }> {
  const kinds: StashKind[] = options.kind ? [options.kind] : ['discoveries', 'links', 'notes'];

  const results = await Promise.all(
    kinds.map(async (kind) => {
      let query = supabase
        .from(KIND_TO_TABLE[kind])
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(options.offset, options.offset + options.limit - 1);

      if (kind === 'notes') {
        query = query.eq('type', 'note');
      } else if (kind === 'discoveries') {
        query = query.neq('type', 'note');
      }

      query = applyArchivedFilter(query, options.archived);
      query = applySearch(kind, query, options.search);

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        kind,
        count: count || 0,
        items: (data || []).map((record) => toItem(kind, record as Discovery | Link)),
      };
    }),
  );

  const counts: Record<StashKind, number> = {
    discoveries: 0,
    links: 0,
    notes: 0,
  };

  const items = results.flatMap((result) => {
    counts[result.kind] = result.count;
    return result.items;
  });

  items.sort((a, b) => {
    const aDate = a.data.created_at || '';
    const bDate = b.data.created_at || '';
    return bDate.localeCompare(aDate);
  });

  return { items, counts };
}

export async function getStashItem(
  supabase: RequestSupabaseClient,
  kind: StashKind,
  id: string,
): Promise<StashItem | null> {
  let query = supabase.from(KIND_TO_TABLE[kind]).select('*').eq('id', id);

  if (kind === 'notes') {
    query = query.eq('type', 'note');
  }

  const { data, error } = await query.single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data ? toItem(kind, data as Discovery | Link) : null;
}

export async function deleteStashItem(
  supabase: RequestSupabaseClient,
  kind: StashKind,
  id: string,
): Promise<void> {
  const { error } = await supabase.from(KIND_TO_TABLE[kind]).delete().eq('id', id);

  if (error) throw error;
}

async function resolveNotionCredentials(
  supabase: RequestSupabaseClient,
  connectionId?: string,
): Promise<NotionCredentials | null> {
  let query = supabase.from('notion_connections').select('api_key,page_id').limit(1);

  if (connectionId) {
    query = query.eq('id', connectionId);
  } else {
    query = query
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true });
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;

  if (data?.api_key && data?.page_id) {
    return { apiKey: data.api_key, pageId: data.page_id };
  }

  if (process.env.NOTION_API_KEY && process.env.NOTION_PAGE_ID) {
    return {
      apiKey: process.env.NOTION_API_KEY,
      pageId: process.env.NOTION_PAGE_ID,
    };
  }

  return null;
}

export async function sendStashItemToNotion(
  supabase: RequestSupabaseClient,
  item: StashItem,
  options?: { connectionId?: string },
): Promise<{ success: boolean; error?: string }> {
  const credentials = await resolveNotionCredentials(supabase, options?.connectionId);
  if (!credentials) {
    return { success: false, error: 'No Notion connection configured' };
  }

  if (item.kind === 'discovery') {
    if (item.data.type === 'note') {
      return sendToNotion({
        credentials,
        type: 'note',
        transcription: item.data.description || item.data.name,
      });
    }

    return sendToNotion({
      credentials,
      type: 'discovery',
      name: item.data.name,
      description: item.data.description || undefined,
      link: item.data.link || undefined,
    });
  }

  return sendToNotion({
    credentials,
    type: 'link',
    name: item.data.name,
    description: item.data.description || undefined,
    link: item.data.url,
    platform: item.data.platform,
    tags: item.data.tags,
  });
}
