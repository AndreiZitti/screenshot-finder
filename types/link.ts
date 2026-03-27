export type LinkPlatform = 'youtube' | 'tiktok' | 'instagram' | 'reddit' | 'x' | 'other';

export interface Link {
  id: string;
  user_id?: string;
  url: string;
  name: string;
  description: string | null;
  platform: LinkPlatform;
  thumbnail: string | null;
  tags: string[];
  notes: string | null;
  created_at: string;
  archived_at: string | null;
}

export const PLATFORM_LABELS: Record<LinkPlatform, string> = {
  youtube: 'YouTube',
  tiktok: 'TikTok',
  instagram: 'Instagram',
  reddit: 'Reddit',
  x: 'X',
  other: 'Other',
};
