import { describe, expect, it } from 'vitest';
import { normalizeKind, toItem } from './control-stash';
import type { Discovery } from '@/types/discovery';
import type { Link } from '@/types/link';

const noteDiscovery: Discovery = {
  id: 'note-1',
  type: 'note',
  name: 'Remember this',
  description: 'Remember this for later',
  link: null,
  metadata: null,
  image_url: null,
  notes: null,
  created_at: '2026-07-10T12:00:00.000Z',
  archived_at: null,
};

const savedLink: Link = {
  id: 'link-1',
  url: 'https://example.com',
  name: 'Example',
  description: null,
  platform: 'other',
  thumbnail: null,
  tags: [],
  notes: null,
  created_at: '2026-07-10T12:00:00.000Z',
  archived_at: null,
};

describe('stash kind compatibility', () => {
  it('normalizes singular and plural kinds', () => {
    expect(normalizeKind(null)).toBeNull();
    expect(normalizeKind('all')).toBeNull();
    expect(normalizeKind('discovery')).toBe('discoveries');
    expect(normalizeKind('link')).toBe('links');
    expect(normalizeKind('note')).toBe('notes');
    expect(normalizeKind('unknown')).toBeUndefined();
  });

  it('represents legacy notes as note-type discoveries', () => {
    expect(toItem('notes', noteDiscovery)).toEqual({
      kind: 'discovery',
      data: noteDiscovery,
    });
  });

  it('keeps saved links as link items', () => {
    expect(toItem('links', savedLink)).toEqual({
      kind: 'link',
      data: savedLink,
    });
  });
});
